import os
import logging
from typing import List, Dict, Optional
from pinecone import Pinecone, Index
from sentence_transformers import SentenceTransformer
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGModule:
    def __init__(self):
        self.initialized = False
        self.index: Optional[Index] = None
        self.embeddings_model = None
        self.pc = None
        self.initialization_error = None
    
    def initialize(self, api_key: str = None, environment: str = None):
        """Initialize the RAG module with Pinecone and SentenceTransformers embeddings."""
        try:
            logger.info("Starting RAG module initialization...")
            
            # Use provided keys or get from environment
            api_key = api_key or os.environ.get("PINECONE_API_KEY")
            environment = environment or os.environ.get("PINECONE_ENVIRONMENT", "gcp-starter")
            
            if not api_key:
                raise ValueError("PINECONE_API_KEY not provided or found in environment")
            
            logger.info("Initializing Pinecone client...")
            # Initialize Pinecone with better error handling
            self.pc = Pinecone(api_key=api_key)
            
            logger.info("Loading SentenceTransformers model...")
            # Initialize embeddings model using sentence-transformers
            # Using all-mpnet-base-v2 model that produces 768-dimensional embeddings (high quality)
            try:
                self.embeddings_model = SentenceTransformer('all-mpnet-base-v2')
                logger.info("SentenceTransformers model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load SentenceTransformers model: {e}")
                raise
            
            # Connect to the existing index
            logger.info("Connecting to Pinecone index...")
            self.index = self._connect_to_index("internal-knowledge-base")
            
            self.initialized = True
            self.initialization_error = None
            logger.info("RAG module initialized successfully with SentenceTransformers embeddings")
            
        except Exception as e:
            self.initialization_error = str(e)
            logger.error(f"Error initializing RAG module: {e}")
            self.initialized = False
            # Don't raise the exception, just log it and mark as not initialized
    
    def _connect_to_index(self, index_name: str, max_retries: int = 3) -> Index:
        """Connect to an existing Pinecone index with retry logic."""
        for attempt in range(max_retries):
            try:
                logger.info(f"Attempting to connect to index '{index_name}' (attempt {attempt + 1}/{max_retries})")
                
                # List existing indexes to verify the index exists
                try:
                    indexes_info = self.pc.list_indexes()
                    existing_indexes = [index.name for index in indexes_info]
                    logger.info(f"Found existing indexes: {existing_indexes}")
                    
                    if index_name not in existing_indexes:
                        raise Exception(f"Index '{index_name}' does not exist. Available indexes: {existing_indexes}")
                        
                except Exception as e:
                    logger.warning(f"Could not list indexes: {e}")
                
                # Get the index
                index = self.pc.Index(index_name)
                
                # Test the connection
                try:
                    stats = index.describe_index_stats()
                    logger.info(f"Index connection successful. Stats: {stats}")
                    return index
                except Exception as e:
                    logger.warning(f"Index connection test failed: {e}")
                    if attempt < max_retries - 1:
                        continue
                    raise
                    
            except Exception as e:
                logger.error(f"Attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.info(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"All {max_retries} attempts failed")
                    raise
        
        raise Exception("Failed to connect to index after all retries")
    
    def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a text using SentenceTransformers."""
        if not self.embeddings_model:
            raise RuntimeError("Embeddings model not initialized")
        
        try:
            embedding = self.embeddings_model.encode(text, convert_to_tensor=False)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise
    
    def query_rag_system(self, query: str, top_k: int = 3) -> List[Dict]:
        """Query the RAG system and return top relevant documents."""
        if not self.initialized:
            logger.warning("RAG module not initialized, returning empty results")
            if self.initialization_error:
                logger.warning(f"Initialization error: {self.initialization_error}")
            return []
        
        if not query or not query.strip():
            logger.warning("Empty query provided")
            return []
        
        try:
            logger.info(f"Querying RAG system for: {query}")
            
            # Generate embedding for the query
            query_embedding = self._generate_embedding(query)
            
            # Perform similarity search
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True  # Ensure metadata is returned
            )
            
            citations = []
            for match in results.matches:
                metadata = match.metadata or {}
                citations.append({
                    "title": metadata.get("title", "N/A"),
                    "excerpt": metadata.get("excerpt", "No excerpt available."),
                    "source_url": metadata.get("source_url", "N/A"),
                    "standard": metadata.get("standard", "unknown"),
                    "article_number": metadata.get("article_number", "N/A"),
                    "document_type": metadata.get("document_type", "general"),
                    "score": match.score  # Include score for debugging/analysis
                })
            
            logger.info(f"Retrieved {len(citations)} citations for query: {query}")
            return citations
            
        except Exception as e:
            logger.error(f"Error querying RAG system: {e}")
            return []  # Return empty list on error
    
    def process_query(self, query: str) -> List[Dict]:
        """Process a query using RAG functionality."""
        return self.query_rag_system(query)
    
    def get_index_stats(self) -> Dict:
        """Get index statistics for monitoring."""
        if not self.initialized or not self.index:
            return {"error": "RAG module not initialized or index not available"}
        
        try:
            stats = self.index.describe_index_stats()
            return {
                "total_vector_count": stats.total_vector_count,
                "dimension": stats.dimension,
                "index_fullness": stats.index_fullness,
                "namespaces": stats.namespaces
            }
        except Exception as e:
            logger.error(f"Error getting index stats: {e}")
            return {"error": str(e)}
    
    def get_status(self) -> Dict:
        """Get detailed status information for debugging."""
        status = {
            "initialized": self.initialized,
            "has_embeddings_model": self.embeddings_model is not None,
            "has_index": self.index is not None,
            "has_pinecone_client": self.pc is not None,
            "initialization_error": self.initialization_error
        }
        
        # Add index stats if available
        if self.initialized and self.index:
            try:
                index_stats = self.get_index_stats()
                status["index_stats"] = index_stats
            except Exception as e:
                status["index_stats_error"] = str(e)
        
        return status 