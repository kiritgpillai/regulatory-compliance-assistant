# Data Ingestion Module

import os
import json
import logging
from typing import List, Dict, Optional, Set
from pathlib import Path
from pinecone import Pinecone, Index, PodSpec, ServerlessSpec
from sentence_transformers import SentenceTransformer
import time
from dotenv import load_dotenv
import re

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataIngestionProcessor:
    def __init__(self, required_attributes: Optional[Set[str]] = None, content_field: str = "content", title_field: str = "title"):

        self.initialized = False
        self.index: Optional[Index] = None
        self.embeddings_model = None
        self.pc = None
        self.initialization_error = None
        self.metadata_folder = "metadata"
        
        # Configuration for document processing
        self.required_attributes = required_attributes or {"content", "title", "standard", "article_number", "url"}
        self.content_field = content_field
        self.title_field = title_field
        
        logger.info(f"DataIngestionProcessor initialized")
        logger.info(f"Required attributes: {self.required_attributes}")
        logger.info(f"Content field: '{self.content_field}', Title field: '{self.title_field}'")
    
    def initialize(self, api_key: str = None, environment: str = None):
        try:
            logger.info("Initializing data ingestion processor...")
            
            # Get API key and environment
            api_key = api_key or os.environ.get("PINECONE_API_KEY")
            environment = environment or os.environ.get("PINECONE_ENVIRONMENT", "gcp-starter")
            
            if not api_key:
                raise ValueError("PINECONE_API_KEY not provided or found in environment")
            
            # Initialize Pinecone client
            logger.info("Connecting to Pinecone...")
            self.pc = Pinecone(api_key=api_key)
            
            # Initialize embeddings model
            logger.info("Loading SentenceTransformers model...")
            self.embeddings_model = SentenceTransformer('all-mpnet-base-v2')
            
            # Initialize Pinecone index
            logger.info("Setting up Pinecone index...")
            self.index = self._setup_pinecone_index(
                index_name="internal-knowledge-base",
                dimension=768,
                metric="cosine",
                environment=environment
            )
            
            self.initialized = True
            self.initialization_error = None
            logger.info("✅ Data ingestion processor initialized successfully!")
            
        except Exception as e:
            self.initialization_error = str(e)
            logger.error(f"❌ Failed to initialize data ingestion processor: {e}")
            self.initialized = False
    
    def _setup_pinecone_index(self, index_name: str, dimension: int, metric: str, environment: str) -> Index:
        try:
            # Check if index exists
            existing_indexes = [index.name for index in self.pc.list_indexes()]
            
            if index_name not in existing_indexes:
                logger.info(f"Creating Pinecone index: {index_name}")
                
                # Try serverless first, fallback to pod-based
                try:
                    self.pc.create_index(
                        name=index_name,
                        dimension=dimension,
                        metric=metric,
                        spec=ServerlessSpec(cloud="aws", region="us-east-1")
                    )
                except Exception:
                    logger.info("Serverless failed, trying pod-based index...")
                    self.pc.create_index(
                        name=index_name,
                        dimension=dimension,
                        metric=metric,
                        spec=PodSpec(environment=environment)
                    )
                
                # Wait for index to be ready
                logger.info("Waiting for index to be ready...")
                self._wait_for_index_ready(index_name)
            else:
                logger.info(f"Using existing index: {index_name}")
            
            # Get index connection
            index = self.pc.Index(index_name)
            
            # Test connection
            stats = index.describe_index_stats()
            logger.info(f"Index ready! Current stats: {stats}")
            
            return index
            
        except Exception as e:
            logger.error(f"Failed to setup Pinecone index: {e}")
            raise
    
    def _wait_for_index_ready(self, index_name: str, timeout: int = 60):
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                index = self.pc.Index(index_name)
                index.describe_index_stats()
                return
            except Exception:
                time.sleep(2)
        raise Exception(f"Index {index_name} not ready within {timeout} seconds")
    
    def read_json_files(self) -> List[Dict]:
        logger.info(f"📁 Reading JSON files from '{self.metadata_folder}' folder...")
        
        metadata_path = Path(self.metadata_folder)
        if not metadata_path.exists():
            logger.error(f"❌ Metadata folder '{self.metadata_folder}' does not exist")
            return []
        
        documents = []
        json_files = list(metadata_path.glob("*.json"))
        
        if not json_files:
            logger.warning(f"⚠️ No JSON files found in '{self.metadata_folder}' folder")
            return []
        
        logger.info(f"Found {len(json_files)} JSON files")
        
        for json_file in json_files:
            try:
                logger.info(f"📄 Loading: {json_file.name}")
                with open(json_file, 'r', encoding='utf-8') as f:
                    file_data = json.load(f)
                
                # Handle both single documents and arrays
                if isinstance(file_data, list):
                    documents.extend(file_data)
                    logger.info(f"  ✅ Loaded {len(file_data)} documents")
                elif isinstance(file_data, dict):
                    documents.append(file_data)
                    logger.info(f"  ✅ Loaded 1 document")
                else:
                    logger.warning(f"  ⚠️ Unexpected data format in {json_file.name}")
                    
            except Exception as e:
                logger.error(f"  ❌ Error loading {json_file.name}: {e}")
                continue
        
        logger.info(f"✅ Total documents loaded: {len(documents)}")
        return documents
    
    def create_embeddings(self, documents: List[Dict]) -> List[Dict]:
        if not self.initialized:
            logger.error("❌ Processor not initialized")
            return []
        
        if not documents:
            logger.warning("⚠️ No documents to process")
            return []
        
        logger.info(f" Creating embeddings for {len(documents)} documents...")
        
        embedded_documents = []
        success_count = 0
        error_count = 0
        
        for i, doc in enumerate(documents):
            try:
                # Validate document has required fields
                missing_attrs = [attr for attr in self.required_attributes if attr not in doc]
                if missing_attrs:
                    logger.warning(f"  ⚠️ Document {i+1} missing: {missing_attrs} - skipping")
                    error_count += 1
                    continue
                
                # Extract content and title
                content = str(doc.get(self.content_field, ""))
                title = str(doc.get(self.title_field, "No Title"))
                
                if not content.strip():
                    logger.warning(f"  ⚠️ Document {i+1} has empty content - skipping")
                    error_count += 1
                    continue
                
                # Create full text for embedding
                full_text = f"{title}\n\n{content}"
                
                # Generate embedding
                embedding = self.embeddings_model.encode(full_text, convert_to_tensor=False).tolist()
                
                # Create metadata (include all fields except content to avoid duplication)
                metadata = {
                    "title": title,
                    "excerpt": content[:500] + "..." if len(content) > 500 else content,
                    "content_length": len(content)
                }
                
                # Add all other fields as metadata
                for key, value in doc.items():
                    if key != self.content_field:
                        if isinstance(value, (dict, list)):
                            metadata[key] = json.dumps(value)
                        else:
                            metadata[key] = str(value)
                
                # Generate unique ID
                doc_id = self._generate_id(doc, i)
                
                # Create vector for Pinecone
                vector = {
                    "id": doc_id,
                    "values": embedding,
                    "metadata": metadata
                }
                
                embedded_documents.append(vector)
                success_count += 1
                
                if (i + 1) % 10 == 0:
                    logger.info(f"  📊 Processed {i + 1}/{len(documents)} documents")
                
            except Exception as e:
                logger.error(f"  ❌ Error processing document {i+1}: {e}")
                error_count += 1
                continue
        
        logger.info(f"✅ Embedding complete: {success_count} success, {error_count} errors")
        return embedded_documents
    
    def _generate_id(self, doc: Dict, index: int) -> str:
        # Get standard and title fields
        standard = str(doc.get("standard", "")).strip()
        title = str(doc.get(self.title_field, "")).strip()
        
        # Combine standard and title
        combined_text = standard + title
        
        # Remove all special characters, keep only alphanumeric characters
        clean_id = re.sub(r'[^a-zA-Z0-9]', '', combined_text)
        
        # If the result is empty or too short, create a fallback ID
        if not clean_id or len(clean_id) < 3:
            fallback_text = f"doc{index}standard{standard}title{title}"
            clean_id = re.sub(r'[^a-zA-Z0-9]', '', fallback_text)
        
        return clean_id
    
    def upsert_to_pinecone(self, embedded_documents: List[Dict], batch_size: int = 32) -> bool:
        if not self.initialized:
            logger.error("❌ Processor not initialized")
            return False
        
        if not embedded_documents:
            logger.warning("⚠️ No embedded documents to upsert")
            return False
        
        logger.info(f"📤 Upserting {len(embedded_documents)} documents to Pinecone...")
        
        total_success = 0
        total_errors = 0
        
        # Process in batches
        for i in range(0, len(embedded_documents), batch_size):
            batch = embedded_documents[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(embedded_documents) + batch_size - 1) // batch_size
            
            try:
                logger.info(f"  📦 Upserting batch {batch_num}/{total_batches} ({len(batch)} documents)")
                
                # Upsert to Pinecone
                self.index.upsert(vectors=batch)
                total_success += len(batch)
                
                # Small delay to avoid rate limiting
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"  ❌ Error upserting batch {batch_num}: {e}")
                total_errors += len(batch)
                continue
        
        success = total_errors == 0
        status = "✅" if success else "⚠️"
        logger.info(f"{status} Upsert complete: {total_success} success, {total_errors} errors")
        
        # Get final index stats
        try:
            stats = self.index.describe_index_stats()
            logger.info(f"📊 Final index stats: {stats}")
        except Exception as e:
            logger.warning(f"Could not get final stats: {e}")
        
        return success
    
    def run_ingestion(self) -> bool:
        #Run the complete data ingestion pipeline.
        logger.info("🚀 Starting data ingestion pipeline...")
        
        try:
            # Step 1: Read JSON files
            logger.info("\n📖 Step 1: Reading JSON files...")
            documents = self.read_json_files()
            if not documents:
                logger.error("❌ No documents found, aborting pipeline")
                return False
            
            # Step 2: Create embeddings
            logger.info("\n🧠 Step 2: Creating embeddings...")
            embedded_documents = self.create_embeddings(documents)
            if not embedded_documents:
                logger.error("❌ No documents embedded successfully, aborting pipeline")
                return False
            
            # Step 3: Upsert to Pinecone
            logger.info("\n☁️ Step 3: Upserting to Pinecone...")
            success = self.upsert_to_pinecone(embedded_documents)
            
            if success:
                logger.info("\n🎉 Data ingestion pipeline completed successfully!")
                return True
            else:
                logger.error("\n❌ Data ingestion pipeline completed with errors")
                return False
                
        except Exception as e:
            logger.error(f"\n💥 Fatal error in ingestion pipeline: {e}")
            return False
    
    def get_status(self) -> Dict:
        metadata_path = Path(self.metadata_folder)
        json_files = list(metadata_path.glob("*.json")) if metadata_path.exists() else []
        
        return {
            "initialized": self.initialized,
            "has_embeddings_model": self.embeddings_model is not None,
            "has_index": self.index is not None,
            "has_pinecone_client": self.pc is not None,
            "initialization_error": self.initialization_error,
            "metadata_folder_exists": metadata_path.exists(),
            "json_files_found": len(json_files),
            "json_files": [f.name for f in json_files],
            "config": {
                "required_attributes": list(self.required_attributes),
                "content_field": self.content_field,
                "title_field": self.title_field
            }
        }

def main():
    # Create processor with configuration matching the actual JSON structure
    processor = DataIngestionProcessor(
        required_attributes={"content", "title", "standard", "article_number", "url"},
        content_field="content",
        title_field="title"
    )
    
    try:
        # Initialize
        processor.initialize()
        
        if not processor.initialized:
            logger.error("❌ Failed to initialize processor")
            return
        
        # Run ingestion pipeline
        success = processor.run_ingestion()
        
        if success:
            logger.info("🎊 Data ingestion completed successfully!")
        else:
            logger.error("💔 Data ingestion failed!")
            
    except Exception as e:
        logger.error(f"💥 Error in main: {e}")

if __name__ == "__main__":
    main() 