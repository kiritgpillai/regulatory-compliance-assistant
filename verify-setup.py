#!/usr/bin/env python3
"""
Setup Verification Script for Regulatory Compliance Assistant
Run this script to verify your local setup is correct.
"""

import os
import sys
import subprocess
import platform

def check_python_version():
    """Check if Python version is 3.11 or higher"""
    version = sys.version_info
    if version.major >= 3 and version.minor >= 11:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} - OK")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor}.{version.micro} - Need Python 3.11+")
        return False

def check_node_version():
    """Check if Node.js version is 18 or higher"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version_str = result.stdout.strip().replace('v', '')
            major_version = int(version_str.split('.')[0])
            if major_version >= 18:
                print(f"✅ Node.js {version_str} - OK")
                return True
            else:
                print(f"❌ Node.js {version_str} - Need Node.js 18+")
                return False
    except Exception:
        print("❌ Node.js not found - Please install Node.js 18+")
        return False

def check_npm():
    """Check if npm is available"""
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ npm {result.stdout.strip()} - OK")
            return True
    except Exception:
        print("❌ npm not found")
        return False

def check_env_file():
    """Check if .env file exists"""
    if os.path.exists('.env'):
        print("✅ .env file exists")
        return True
    else:
        print("❌ .env file missing - Copy .env.example to .env")
        return False

def check_env_variables():
    """Check if required environment variables are set"""
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        required_vars = ['PINECONE_API_KEY', 'PERPLEXITY_API_KEY']
        all_good = True
        
        for var in required_vars:
            value = os.getenv(var)
            if value and value != f'your_{var.lower()}_here':
                print(f"✅ {var} is set")
            else:
                print(f"❌ {var} not set or using placeholder value")
                all_good = False
        
        return all_good
    except ImportError:
        print("⚠️  python-dotenv not installed - Run 'pip install -r requirements.txt' first")
        return False

def check_frontend_deps():
    """Check if frontend dependencies are installed"""
    if os.path.exists('frontend/node_modules'):
        print("✅ Frontend dependencies installed")
        return True
    else:
        print("❌ Frontend dependencies missing - Run 'npm run setup'")
        return False

def check_python_deps():
    """Check if Python dependencies are installed"""
    try:
        import fastapi, uvicorn, pinecone, sentence_transformers
        print("✅ Python dependencies installed")
        return True
    except ImportError as e:
        print(f"❌ Python dependencies missing - Run 'pip install -r requirements.txt'")
        return False

def main():
    print("🔍 Verifying Regulatory Compliance Assistant Setup...")
    print("=" * 60)
    
    checks = [
        check_python_version,
        check_node_version,
        check_npm,
        check_env_file,
        check_env_variables,
        check_frontend_deps,
        check_python_deps
    ]
    
    passed = 0
    total = len(checks)
    
    for check in checks:
        if check():
            passed += 1
        print()
    
    print("=" * 60)
    print(f"Setup Verification Complete: {passed}/{total} checks passed")
    
    if passed == total:
        print("🎉 Your setup is ready! You can now run:")
        print("   Terminal 1: npm run backend")
        print("   Terminal 2: npm run dev")
    else:
        print("⚠️  Please fix the issues above before proceeding.")
        print("📖 Check SETUP.md for detailed instructions.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
