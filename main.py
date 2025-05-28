import uvicorn
from app.config import config
from app.api import app

if __name__ == "__main__":
    # Setup logging
    config.setup_logging()
    
    # Validate configuration
    is_valid, errors = config.validate_config()
    if not is_valid:
        print("Configuration errors:")
        for error in errors:
            print(f"  - {error}")
        print("\nPlease set the required environment variables and try again.")
        print("You can create a .env file in the root directory with the following variables:")
        print("PINECONE_API_KEY=your_key_here")
        print("PERPLEXITY_API_KEY=your_key_here")
        exit(1)
    
    # Run the application
    uvicorn.run(
        "app.api:app",
        host=config.API_HOST,
        port=config.API_PORT,
        reload=config.DEBUG,
        log_level=config.LOG_LEVEL.lower()
    ) 