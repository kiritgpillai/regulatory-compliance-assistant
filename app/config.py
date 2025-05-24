import os
import logging
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:

    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Pinecone Configuration
    PINECONE_API_KEY: Optional[str] = os.getenv("PINECONE_API_KEY")
    PINECONE_ENVIRONMENT: str = os.getenv("PINECONE_ENVIRONMENT", "gcp-starter")
    
    # Perplexity Configuration
    PERPLEXITY_API_KEY: Optional[str] = os.getenv("PERPLEXITY_API_KEY")
    
    # Module Configuration
    ENABLE_RAG: bool = os.getenv("ENABLE_RAG", "True").lower() == "true"
    ENABLE_SONAR: bool = os.getenv("ENABLE_SONAR", "True").lower() == "true"
    ENABLE_HINTS: bool = os.getenv("ENABLE_HINTS", "True").lower() == "true"
    
    # Logging Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    @classmethod
    def validate_config(cls) -> tuple[bool, list[str]]:
        errors = []
        
        if not cls.PINECONE_API_KEY:
            errors.append("PINECONE_API_KEY is required")
        
        if not cls.PERPLEXITY_API_KEY:
            errors.append("PERPLEXITY_API_KEY is required")
        
        return len(errors) == 0, errors
    
    @classmethod
    def setup_logging(cls):
        logging.basicConfig(
            level=getattr(logging, cls.LOG_LEVEL.upper(), logging.INFO),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

# Create a singleton instance
config = Config() 