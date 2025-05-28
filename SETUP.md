# Team Setup Guide - Regulatory Compliance Assistant

This guide will help your teammates set up and run the Regulatory Compliance Assistant on their local machines.

## 🎯 Prerequisites

Before starting, ensure you have the following installed:

### Required Software
- **Python 3.11 or higher** ([Download here](https://www.python.org/downloads/))
- **Node.js 18 or higher** ([Download here](https://nodejs.org/))
- **npm** (comes with Node.js) or **yarn**
- **Git** ([Download here](https://git-scm.com/downloads))

### Required API Keys
You'll need to obtain API keys from:
1. **Pinecone** - Vector database for AI search ([Sign up](https://www.pinecone.io/))
2. **Perplexity** - AI API for document analysis ([Sign up](https://www.perplexity.ai/))

## 🚀 Quick Setup

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd regulatory-compliance-assistant
```

### Step 2: Set Up Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your actual API keys
# Use your preferred text editor (nano, vim, VSCode, etc.)
nano .env
```

**Important**: Replace the placeholder values in `.env` with your actual API keys:
- `PINECONE_API_KEY=your_actual_pinecone_api_key`
- `PERPLEXITY_API_KEY=your_actual_perplexity_api_key`

### Step 3: Install Dependencies
```bash
# Install all dependencies (both frontend and backend)
npm run setup
```

### Step 4: Start the Application
```bash
# Start both frontend and backend
npm run dev        # Frontend (in one terminal)
npm run backend    # Backend (in another terminal)
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔧 Detailed Setup Instructions

### Backend Setup

1. **Create Python Virtual Environment** (Recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install Python Dependencies**:
```bash
pip install -r requirements.txt
```

3. **Test Backend**:
```bash
python main.py
```

### Frontend Setup

1. **Navigate to Frontend Directory**:
```bash
cd frontend
```

2. **Install Node Dependencies**:
```bash
npm install
```

3. **Start Development Server**:
```bash
npm run dev
```

## 🌍 Environment Variables Explained

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PINECONE_API_KEY` | ✅ Yes | API key for vector database | `12345678-abcd-1234-efgh-123456789abc` |
| `PERPLEXITY_API_KEY` | ✅ Yes | API key for AI document analysis | `pplx-1234567890abcdef` |
| `API_HOST` | ❌ No | Backend host address | `0.0.0.0` (default) |
| `API_PORT` | ❌ No | Backend port number | `8000` (default) |
| `DEBUG` | ❌ No | Enable debug mode | `true` (default) |
| `LOG_LEVEL` | ❌ No | Logging verbosity | `INFO` (default) |

## 🛠 Development Workflow

### Running in Development Mode
```bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend  
npm run dev
```

### Building for Production
```bash
# Build frontend for production
npm run build

# Preview production build
npm run preview
```

### Running Tests
```bash
# Frontend tests
cd frontend && npm run test

# Backend tests
python -m pytest
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "PINECONE_API_KEY is required" Error
**Solution**: Make sure you've copied `.env.example` to `.env` and filled in your actual API keys.

#### 2. Python Module Not Found
**Solution**: Activate your virtual environment and reinstall dependencies:
```bash
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

#### 3. Node Dependencies Issues
**Solution**: Clear npm cache and reinstall:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### 4. Port Already in Use
**Solution**: The app will automatically find available ports. If you need specific ports:
```bash
# Change port in .env file
API_PORT=8001  # For backend

# Frontend will auto-assign (5173, 5174, etc.)
```

#### 5. API Connection Issues
**Solution**: Check that both frontend and backend are running and verify the API endpoints in browser:
- Backend health: http://localhost:8000/health
- API docs: http://localhost:8000/docs

### Getting Help

If you encounter issues:
1. Check this troubleshooting section
2. Look at the logs in the terminal
3. Check the browser developer console (F12)
4. Ask in the team chat/Slack

## 📁 Project Structure Overview

```
regulatory-compliance-assistant/
├── frontend/           # React application
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   └── package.json   # Frontend dependencies
├── app/               # FastAPI backend
├── requirements.txt   # Python dependencies  
├── main.py           # Backend entry point
├── .env.example      # Environment template
└── package.json      # Root scripts
```

## ⚡ Quick Commands Reference

| Command | Description |
|---------|-------------|
| `npm run setup` | Install all dependencies |
| `npm run dev` | Start frontend development server |
| `npm run backend` | Start backend server |
| `npm run build` | Build frontend for production |
| `pip install -r requirements.txt` | Install Python dependencies |
| `python main.py` | Start backend directly |

## 🎯 Next Steps

After setup:
1. Visit http://localhost:5173 to access the dashboard
2. Try uploading a sample document
3. Test the search functionality  
4. Explore the compliance tools section
5. Toggle between light/dark themes

## 📞 Support

For technical issues or questions:
- Check the main README.md for detailed documentation
- Review API documentation at http://localhost:8000/docs
- Contact the development team

---

**Happy coding! 🚀** 