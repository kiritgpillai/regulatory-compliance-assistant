# Main FastAPI application that integrates all modules with orchestration and streaming.

import os
import json
import asyncio
import logging
from typing import List, Dict, Optional
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
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