# Main FastAPI application that integrates all modules with orchestration and streaming.

import os
import json
import asyncio
import logging
import tempfile
import uuid
import time
from typing import List, Dict, Optional
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel, Field

from .rag_module import RAGModule
from .sonar_module import SonarModule
from .hint_module import HintModule

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Regulatory Compliance Assistant",
    description="Integrates internal RAG with external compliance citations and provides actionable insights.",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize modules globally
rag = RAGModule()
sonar = SonarModule()
hint = HintModule()

# Pydantic models
class Query(BaseModel):
    text: str = Field(..., description="The query text to process")
    use_rag: bool = Field(True, description="Whether to use RAG for internal citations")
    use_sonar: bool = Field(True, description="Whether to use Sonar for external citations")
    use_hints: bool = Field(True, description="Whether to generate hints")
    load_sample_data: bool = Field(False, description="Whether to load sample data (for testing)")

class HealthResponse(BaseModel):
    status: str
    modules: Dict[str, bool]
    version: str

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    size: int
    status: str

class ComplianceAnalysisRequest(BaseModel):
    document_id: str
    regulation: str

class ComplianceAnalysisResponse(BaseModel):
    document_id: str
    regulation: str
    compliant: bool
    score: float
    issues: List[str]
    recommendations: List[str]
    citations: List[Dict]

class SearchRequest(BaseModel):
    query: str = Field(..., description="The search query")
    categories: List[str] = Field(default=[], description="Categories to filter by")
    max_results: int = Field(default=10, description="Maximum number of results to return")

class SearchResult(BaseModel):
    id: str
    title: str
    content: str
    source: str
    category: str
    relevance_score: float
    url: Optional[str] = None
    metadata: Dict = Field(default_factory=dict)

class Document(BaseModel):
    id: str
    filename: str
    size: int
    content_type: str
    uploaded_at: float
    regulations: List[str]
    status: str = "uploaded"

# Global initialization flag
_initialized = False

async def initialize_modules():
    global _initialized
    
    if _initialized:
        return
    
    try:
        logger.info("Initializing modules...")
        
        # Check for required environment variables
        required_env_vars = ["PINECONE_API_KEY", "PERPLEXITY_API_KEY"]
        missing_vars = [var for var in required_env_vars if not os.environ.get(var)]
        
        if missing_vars:
            logger.warning(f"Missing environment variables: {missing_vars}")
            logger.info("Some modules may not function properly without these variables")
        
        # Initialize RAG module
        try:
            rag.initialize()
            logger.info("RAG module initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize RAG module: {e}")
        
        # Initialize Sonar module
        try:
            sonar.initialize()
            logger.info("Sonar module initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Sonar module: {e}")
        
        # Initialize Hint module
        try:
            hint.initialize()
            logger.info("Hint module initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Hint module: {e}")
        
        _initialized = True
        logger.info("All modules initialization completed")
        
    except Exception as e:
        logger.error(f"Error during module initialization: {e}")
        raise

@app.on_event("startup")
async def startup_event():

    await initialize_modules()

@app.get("/health", response_model=HealthResponse)
async def health_check():

    return HealthResponse(
        status="healthy",
        modules={
            "rag": rag.initialized,
            "sonar": sonar.initialized,
            "hint": hint.initialized
        },
        version="1.0.0"
    )

@app.post("/chat")
async def chat_endpoint(query: Query):

    try:
        # Ensure modules are initialized
        if not _initialized:
            await initialize_modules()
        
        user_query = query.text
        if not user_query.strip():
            raise HTTPException(status_code=400, detail="Query text cannot be empty")
        
        logger.info(f"Processing query: {user_query}")
        
        async def event_generator():
            try:
                logger.info("Starting event generator")
                
                # Load sample data if requested (for testing)
                if query.load_sample_data and rag.initialized:
                    try:
                        logger.info("Loading sample data")
                        rag.load_sample_data()
                        yield f"data: {json.dumps({'status': 'Sample data loaded'})}\n\n"
                    except Exception as e:
                        logger.error(f"Error loading sample data: {e}")
                        yield f"data: {json.dumps({'status': 'Error loading sample data', 'error': str(e)})}\n\n"
                
                # Initialize result containers
                internal_citations = []
                external_citations = []
                logger.info("Initialized citation containers")
                
                # Create concurrent tasks for RAG and Sonar
                tasks = []
                
                if query.use_rag and rag.initialized:
                    logger.info("Adding RAG task")
                    tasks.append(("rag", rag.query_rag_system(user_query)))
                
                if query.use_sonar and sonar.initialized:
                    logger.info("Adding Sonar task")
                    tasks.append(("sonar", sonar.analyze_query(user_query)))
                
                logger.info(f"Created {len(tasks)} tasks")
                
                # Execute tasks concurrently
                if tasks:
                    logger.info("Executing tasks concurrently")
                    results = await asyncio.gather(
                        *[task[1] for task in tasks],
                        return_exceptions=True
                    )
                    
                    logger.info(f"Got {len(results)} results")
                    
                    # Process results
                    for i, (task_type, result) in enumerate(zip([task[0] for task in tasks], results)):
                        logger.info(f"Processing result {i} from {task_type}")
                        if isinstance(result, Exception):
                            logger.error(f"Error in {task_type} task: {result}")
                            yield f"data: {json.dumps({'error': f'{task_type} module error', 'details': str(result)})}\n\n"
                        else:
                            if task_type == "rag":
                                logger.info(f"Processing RAG result: {type(result)}")
                                internal_citations = result or []
                                logger.info(f"Internal citations count: {len(internal_citations)}")
                                yield f"data: {json.dumps({'status': 'Internal citations retrieved', 'count': len(internal_citations)})}\n\n"
                            elif task_type == "sonar":
                                logger.info(f"Processing Sonar result: {type(result)}")
                                external_citations = result.get('citations', []) if isinstance(result, dict) else []
                                logger.info(f"External citations count: {len(external_citations)}")
                                yield f"data: {json.dumps({'status': 'External citations retrieved', 'count': len(external_citations)})}\n\n"
                
                logger.info("About to generate hints")
                # Generate next step hint if hints are requested
                next_step_hint = None
                if query.use_hints and hint.initialized:
                    try:
                        logger.info("Calling hint.get_contextual_hints")
                        hint_response = await hint.get_contextual_hints(
                            user_query, 
                            internal_citations, 
                            external_citations
                        )
                        logger.info(f"Got hint response: {type(hint_response)}")
                        next_step_hint = hint_response.get('next_step_hint')
                        yield f"data: {json.dumps({'status': 'Next step hint generated'})}\n\n"
                    except Exception as e:
                        logger.error(f"Error generating hints: {e}")
                        next_step_hint = "Could not generate hints at this time."
                        yield f"data: {json.dumps({'status': 'Error generating hints', 'error': str(e)})}\n\n"
                
                logger.info("Preparing final response")
                # Prepare final response
                final_response = {
                    "query": user_query,
                    "internal_citations": internal_citations,
                    "external_citations": external_citations,
                    "next_step_hint": next_step_hint,
                    "summary": {
                        "internal_count": len(internal_citations),
                        "external_count": len(external_citations),
                        "total_citations": len(internal_citations) + len(external_citations)
                    },
                    "status": "completed"
                }
                
                logger.info("About to yield final response")
                # Stream the final response
                yield f"data: {json.dumps(final_response)}\n\n"
                logger.info("Event generator completed successfully")
                
            except Exception as e:
                logger.error(f"Error in event generator: {e}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                error_response = {
                    "error": "Internal server error",
                    "details": str(e),
                    "status": "error"
                }
                yield f"data: {json.dumps(error_response)}\n\n"
        
        return EventSourceResponse(event_generator())
        
    except HTTPException as e:
        # Re-raise FastAPI HTTPExceptions
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in /chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/query")
async def process_query(query: Query):
    try:
        # Ensure modules are initialized
        if not _initialized:
            await initialize_modules()
        
        user_query = query.text
        if not user_query.strip():
            raise HTTPException(status_code=400, detail="Query text cannot be empty")
        
        logger.info(f"Processing query (non-streaming): {user_query}")
        
        # Load sample data if requested
        if query.load_sample_data and rag.initialized:
            try:
                rag.load_sample_data()
            except Exception as e:
                logger.error(f"Error loading sample data: {e}")
        
        # Initialize result containers
        internal_citations = []
        external_citations = []
        
        # Create concurrent tasks
        tasks = []
        
        if query.use_rag and rag.initialized:
            tasks.append(("rag", rag.query_rag_system(user_query)))
        
        if query.use_sonar and sonar.initialized:
            tasks.append(("sonar", sonar.analyze_query(user_query)))
        
        # Execute tasks concurrently
        if tasks:
            results = await asyncio.gather(
                *[task[1] for task in tasks],
                return_exceptions=True
            )
            
            # Process results
            for i, (task_type, result) in enumerate(zip([task[0] for task in tasks], results)):
                if isinstance(result, Exception):
                    logger.error(f"Error in {task_type} task: {result}")
                else:
                    if task_type == "rag":
                        internal_citations = result or []
                    elif task_type == "sonar":
                        external_citations = result.get('citations', []) if isinstance(result, dict) else []
        
        # Generate hints if requested
        hint_response = {}
        if query.use_hints and hint.initialized:
            try:
                hint_response = await hint.get_contextual_hints(
                    user_query, 
                    internal_citations, 
                    external_citations
                )
            except Exception as e:
                logger.error(f"Error generating hints: {e}")
                hint_response = {"error": str(e)}
        
        # Return complete response
        return {
            "query": user_query,
            "internal_citations": internal_citations,
            "external_citations": external_citations,
            "hints": hint_response,
            "summary": {
                "internal_count": len(internal_citations),
                "external_count": len(external_citations),
                "total_citations": len(internal_citations) + len(external_citations)
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in /query endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {
        "message": "Unified RAG-Sonar Chat API",
        "version": "1.0.0",
        "endpoints": {
            "/chat": "POST - Streaming chat endpoint with SSE",
            "/query": "POST - Non-streaming query endpoint",
            "/health": "GET - Health check endpoint"
        }
    }

# Add GET versions of endpoints as specified in the project requirements
@app.get("/query")
async def get_query(
    text: str,
    use_rag: bool = True,
    use_sonar: bool = True,
    use_hints: bool = True,
    load_sample_data: bool = False
):
    # GET version of the query endpoint for simple URL-based queries.
    query = Query(
        text=text,
        use_rag=use_rag,
        use_sonar=use_sonar,
        use_hints=use_hints,
        load_sample_data=load_sample_data
    )
    return await process_query(query)

@app.get("/chat")
async def get_chat(
    text: str,
    use_rag: bool = True,
    use_sonar: bool = True,
    use_hints: bool = True,
    load_sample_data: bool = False
):
    # GET version of the chat endpoint for simple URL-based streaming.
    query = Query(
        text=text,
        use_rag=use_rag,
        use_sonar=use_sonar,
        use_hints=use_hints,
        load_sample_data=load_sample_data
    )
    return await chat_endpoint(query)

@app.get("/debug")
async def debug_status():
    return {
        "rag_status": rag.get_status() if hasattr(rag, 'get_status') else {"error": "get_status method not available"},
        "sonar_initialized": sonar.initialized,
        "hint_initialized": hint.initialized,
        "environment_vars": {
            "PINECONE_API_KEY": "***" if os.environ.get("PINECONE_API_KEY") else "NOT_SET",
            "PERPLEXITY_API_KEY": "***" if os.environ.get("PERPLEXITY_API_KEY") else "NOT_SET",
            "PINECONE_ENVIRONMENT": os.environ.get("PINECONE_ENVIRONMENT", "gcp-starter")
        }
    }

# Document storage (in production, you'd use a proper database)
uploaded_documents = {}

@app.post("/upload-document", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    regulations: str = Form(...)
):
    """Upload a document for compliance analysis."""
    try:
        # Ensure modules are initialized
        if not _initialized:
            await initialize_modules()
        
        # Validate file type
        allowed_types = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ]
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail="Only PDF and Word documents are supported"
            )
        
        # Validate file size (10MB limit)
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File size cannot exceed 10MB"
            )
        
        # Generate unique document ID
        document_id = str(uuid.uuid4())
        
        # Save file temporarily (in production, use proper file storage)
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, f"{document_id}_{file.filename}")
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Store document metadata
        uploaded_documents[document_id] = {
            "id": document_id,
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(content),
            "file_path": file_path,
            "regulations": json.loads(regulations) if regulations else [],
            "uploaded_at": asyncio.get_event_loop().time(),
            "content": None  # Will be extracted later
        }
        
        logger.info(f"Document uploaded: {file.filename} ({len(content)} bytes)")
        
        return DocumentUploadResponse(
            document_id=document_id,
            filename=file.filename,
            size=len(content),
            status="uploaded"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/analyze-compliance", response_model=ComplianceAnalysisResponse)
async def analyze_compliance(request: ComplianceAnalysisRequest):
    """Analyze a document for compliance with a specific regulation."""
    try:
        # Ensure modules are initialized
        if not _initialized:
            await initialize_modules()
        
        document_id = request.document_id
        regulation = request.regulation
        
        # Check if document exists
        if document_id not in uploaded_documents:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document = uploaded_documents[document_id]
        
        # Extract text content if not already done
        if document["content"] is None:
            try:
                document["content"] = await extract_document_text(document["file_path"], document["content_type"])
            except Exception as e:
                logger.error(f"Error extracting text from document: {e}")
                document["content"] = f"Error extracting text: {str(e)}"
        
        content = document["content"]
        
        # Analyze compliance using RAG and Sonar
        query = f"Analyze this document for {regulation} compliance. Document content: {content[:2000]}..."
        
        issues = []
        recommendations = []
        citations = []
        
        try:
            # Use RAG for internal compliance knowledge
            if rag.initialized:
                internal_results = await rag.query_rag_system(query)
                if internal_results:
                    citations.extend(internal_results)
                    
                    # Extract issues and recommendations from internal results
                    for result in internal_results:
                        result_text = result.get('content', '').lower()
                        if any(word in result_text for word in ['non-compliant', 'violation', 'missing', 'required']):
                            issues.append(result.get('content', '')[:200] + "...")
                        if any(word in result_text for word in ['recommend', 'should', 'must', 'ensure']):
                            recommendations.append(result.get('content', '')[:200] + "...")
            
            # Use Sonar for external compliance information
            if sonar.initialized:
                external_query = f"What are the compliance requirements for {regulation}? What are common violations?"
                external_results = await sonar.analyze_query(external_query)
                if external_results and 'citations' in external_results:
                    external_citations = external_results['citations']
                    citations.extend(external_citations)
                    
                    # Extract additional compliance information
                    for citation in external_citations:
                        citation_text = citation.get('content', '').lower()
                        if any(word in citation_text for word in ['requirement', 'must', 'shall', 'mandatory']):
                            recommendations.append(citation.get('content', '')[:200] + "...")
        
        except Exception as e:
            logger.error(f"Error during compliance analysis: {e}")
            issues.append(f"Analysis error: {str(e)}")
        
        # Calculate compliance score based on issues found
        base_score = 0.8
        issue_penalty = min(len(issues) * 0.1, 0.6)  # Max penalty of 60%
        score = max(base_score - issue_penalty, 0.0)
        
        # Determine if compliant (score > 0.7 and no critical issues)
        compliant = score > 0.7 and len(issues) == 0
        
        # Add default recommendations if none found
        if not recommendations:
            recommendations = [
                f"Review document against {regulation} requirements",
                f"Ensure all mandatory {regulation} clauses are addressed",
                f"Consider consulting with compliance experts for {regulation}"
            ]
        
        logger.info(f"Compliance analysis completed for {regulation}: score={score:.2f}, compliant={compliant}")
        
        return ComplianceAnalysisResponse(
            document_id=document_id,
            regulation=regulation,
            compliant=compliant,
            score=score,
            issues=issues[:5],  # Limit to top 5 issues
            recommendations=recommendations[:5],  # Limit to top 5 recommendations
            citations=[
                {
                    "title": c.get("title", ""),
                    "content": c.get("content", "")[:300] + "...",
                    "source": c.get("source", ""),
                    "url": c.get("url", "")
                } for c in citations[:10]  # Limit to top 10 citations
            ]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing compliance: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

async def extract_document_text(file_path: str, content_type: str) -> str:
    """Extract text content from uploaded document."""
    try:
        if content_type == "application/pdf":
            # For PDF files - would need PyPDF2 or similar
            # For now, return a placeholder
            return f"PDF content extraction not implemented. File: {file_path}"
        
        elif content_type in ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
            # For Word files - would need python-docx or similar
            # For now, return a placeholder
            return f"Word document content extraction not implemented. File: {file_path}"
        
        else:
            # Try to read as plain text
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
                
    except Exception as e:
        logger.error(f"Error extracting text from {file_path}: {e}")
        return f"Error extracting text: {str(e)}"

# Add new endpoints
@app.post("/search")
async def search_regulatory_content(request: SearchRequest):
    """Search through regulatory compliance content."""
    try:
        # Ensure modules are initialized
        if not _initialized:
            await initialize_modules()
        
        query_text = request.query
        if not query_text.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        logger.info(f"Processing search query: {query_text}")
        
        results = []
        
        # Use RAG for internal document search
        if rag.initialized:
            try:
                internal_results = await rag.query_rag_system(query_text)
                if internal_results:
                    for i, result in enumerate(internal_results[:request.max_results]):
                        search_result = SearchResult(
                            id=f"internal_{i}",
                            title=result.get("title", f"Regulatory Document {i+1}"),
                            content=result.get("content", "")[:500] + "...",
                            source=result.get("source", "Internal Knowledge Base"),
                            category=result.get("category", "Regulation"),
                            relevance_score=result.get("score", 0.8),
                            url=result.get("url", ""),
                            metadata=result.get("metadata", {})
                        )
                        results.append(search_result)
            except Exception as e:
                logger.error(f"Error in RAG search: {e}")
        
        # Use Sonar for external regulatory search
        if sonar.initialized and len(results) < request.max_results:
            try:
                remaining_slots = request.max_results - len(results)
                external_query = f"regulatory compliance {query_text}"
                external_results = await sonar.analyze_query(external_query)
                
                if external_results and 'citations' in external_results:
                    external_citations = external_results['citations'][:remaining_slots]
                    for i, citation in enumerate(external_citations):
                        search_result = SearchResult(
                            id=f"external_{i}",
                            title=citation.get("title", f"External Citation {i+1}"),
                            content=citation.get("content", "")[:500] + "...",
                            source=citation.get("source", "External Source"),
                            category="External Regulation",
                            relevance_score=0.7,  # Default score for external results
                            url=citation.get("url", ""),
                            metadata={"external": True}
                        )
                        results.append(search_result)
            except Exception as e:
                logger.error(f"Error in Sonar search: {e}")
        
        # Filter by categories if specified
        if request.categories:
            results = [r for r in results if r.category in request.categories]
        
        # Sort by relevance score
        results.sort(key=lambda x: x.relevance_score, reverse=True)
        
        logger.info(f"Search completed: {len(results)} results found")
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in search endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/documents")
async def get_documents():
    """Get list of all uploaded documents."""
    try:
        documents = []
        for doc_id, doc_data in uploaded_documents.items():
            document = Document(
                id=doc_data["id"],
                filename=doc_data["filename"],
                size=doc_data["size"],
                content_type=doc_data["content_type"],
                uploaded_at=doc_data["uploaded_at"],
                regulations=doc_data["regulations"],
                status=doc_data.get("status", "uploaded")
            )
            documents.append(document)
        
        # Sort by upload time (most recent first)
        documents.sort(key=lambda x: x.uploaded_at, reverse=True)
        
        logger.info(f"Retrieved {len(documents)} documents")
        return documents
        
    except Exception as e:
        logger.error(f"Error retrieving documents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve documents: {str(e)}")

@app.get("/documents/{document_id}")
async def get_document(document_id: str):
    """Get a specific document by ID."""
    try:
        if document_id not in uploaded_documents:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc_data = uploaded_documents[document_id]
        document = Document(
            id=doc_data["id"],
            filename=doc_data["filename"],
            size=doc_data["size"],
            content_type=doc_data["content_type"],
            uploaded_at=doc_data["uploaded_at"],
            regulations=doc_data["regulations"],
            status=doc_data.get("status", "uploaded")
        )
        
        logger.info(f"Retrieved document: {document_id}")
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve document: {str(e)}")

@app.post("/populate-sample-data")
async def populate_sample_data():
    """Populate the system with sample documents for demonstration."""
    try:
        current_time = time.time()
        
        sample_documents = [
            {
                "id": "sample-gdpr-guide",
                "filename": "GDPR_Compliance_Guide.pdf",
                "content_type": "application/pdf",
                "size": 2048576,
                "file_path": "/tmp/sample-gdpr-guide.pdf",
                "regulations": ["GDPR", "Privacy"],
                "uploaded_at": current_time - 86400,  # 1 day ago
                "content": "This document contains comprehensive guidance on GDPR compliance requirements, including data subject rights, privacy by design principles, and breach notification procedures.",
                "status": "analyzed"
            },
            {
                "id": "sample-sox-policy",
                "filename": "SOX_Financial_Controls.docx",
                "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "size": 1024768,
                "file_path": "/tmp/sample-sox-policy.docx",
                "regulations": ["SOX", "Financial"],
                "uploaded_at": current_time - 172800,  # 2 days ago
                "content": "This policy document outlines Sarbanes-Oxley Act compliance procedures for financial reporting, internal controls, and audit requirements.",
                "status": "analyzed"
            },
            {
                "id": "sample-ccpa-assessment",
                "filename": "CCPA_Risk_Assessment.pdf",
                "content_type": "application/pdf",
                "size": 3145728,
                "file_path": "/tmp/sample-ccpa-assessment.pdf",
                "regulations": ["CCPA", "Privacy"],
                "uploaded_at": current_time - 259200,  # 3 days ago
                "content": "Risk assessment document for California Consumer Privacy Act compliance, covering consumer rights, data processing activities, and privacy notices.",
                "status": "pending"
            },
            {
                "id": "sample-hipaa-manual",
                "filename": "HIPAA_Security_Manual.pdf",
                "content_type": "application/pdf",
                "size": 4194304,
                "file_path": "/tmp/sample-hipaa-manual.pdf",
                "regulations": ["HIPAA", "Healthcare"],
                "uploaded_at": current_time - 345600,  # 4 days ago
                "content": "Comprehensive manual covering HIPAA security rule requirements, administrative safeguards, physical safeguards, and technical safeguards for protected health information.",
                "status": "compliant"
            },
            {
                "id": "sample-iso27001-procedure",
                "filename": "ISO27001_Security_Procedures.docx",
                "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "size": 1572864,
                "file_path": "/tmp/sample-iso27001-procedure.docx",
                "regulations": ["ISO27001", "Security"],
                "uploaded_at": current_time - 432000,  # 5 days ago
                "content": "Information security management procedures based on ISO 27001 standard, including risk management, security controls, and continuous improvement processes.",
                "status": "analyzed"
            }
        ]
        
        # Add sample documents to the storage
        for doc in sample_documents:
            uploaded_documents[doc["id"]] = doc
        
        logger.info(f"Added {len(sample_documents)} sample documents")
        
        return {
            "message": f"Successfully populated {len(sample_documents)} sample documents",
            "documents": [{"id": doc["id"], "filename": doc["filename"]} for doc in sample_documents]
        }
        
    except Exception as e:
        logger.error(f"Error populating sample data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to populate sample data: {str(e)}") 