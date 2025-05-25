#Setup script for Regulatory Compliance Assistant

import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    # Check if all required dependencies are installed.
    print("📋 Checking requirements...")
    try:
        import pinecone
        import sentence_transformers
        import fastapi
        import aiohttp
        print("✅ All required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def check_environment():
    # Check if required environment variables are set.
    print("\n🔧 Checking environment configuration...")
    
    required_vars = ["PINECONE_API_KEY", "PERPLEXITY_API_KEY"]
    missing_vars = []
    
    # Check if .env file exists
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ .env file not found")
        print("Please copy env.template to .env and configure your API keys")
        return False
    
    # Load environment variables from .env
    from dotenv import load_dotenv
    load_dotenv()
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {missing_vars}")
        print("Please update your .env file with the required API keys")
        return False
    
    print("✅ Environment configuration is complete")
    return True

def setup_vector_database():
    # Initialize Pinecone index and ingest regulatory documents.
    print("\n🗂️  Setting up vector database...")
    
    try:
        # Import and run data ingestion
        from app.data_ingestion import main as ingest_main
        print("Starting data ingestion process...")
        ingest_main()
        print("✅ Vector database setup complete")
        return True
    except Exception as e:
        print(f"❌ Error setting up vector database: {e}")
        print("You may need to run data ingestion manually:")
        print("python -c 'from app.data_ingestion import main; main()'")
        return False

def test_api():
    # Run basic API tests to verify setup.
    print("\n🧪 Running basic API tests...")
    
    try:
        # Run the test suite
        result = subprocess.run([
            sys.executable, "-m", "pytest", "app/test_api.py", "-v", "--tb=short"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ API tests passed")
            return True
        else:
            print(f"❌ Some tests failed:")
            print(result.stdout)
            print(result.stderr)
            return False
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        return False

def main():
    """Main setup function."""
    print("🚀 Regulatory Compliance Assistant MVP Setup")
    print("=" * 50)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Check environment
    if not check_environment():
        sys.exit(1)
    
    # Setup vector database
    print("\n📊 Would you like to set up the vector database now?")
    setup_db = input("This will ingest GDPR and SOX documents into Pinecone (y/n): ").lower().strip()
    
    if setup_db == 'y':
        if not setup_vector_database():
            print("\n⚠️  Vector database setup failed, but you can continue manually")
    else:
        print("⏭️  Skipping vector database setup")
        print("Remember to run data ingestion before using the system:")
        print("python -c 'from app.data_ingestion import main; main()'")
    
    # Test API
    print("\n🧪 Would you like to run API tests?")
    run_tests = input("This will verify the API is working correctly (y/n): ").lower().strip()
    
    if run_tests == 'y':
        test_api()
    else:
        print("⏭️  Skipping API tests")
    
    print("\n🎉 Setup complete!")
    print("\nNext steps:")
    print("1. Start the API server: python main.py")
    print("2. Visit http://localhost:8000 to see the API documentation")
    print("3. Test the endpoints using the examples in README.md")
    print("\nFor troubleshooting, check the /debug endpoint")

if __name__ == "__main__":
    main() 