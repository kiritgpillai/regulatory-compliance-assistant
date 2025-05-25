# Regulatory Compliance Assistant MVP

An AI-powered compliance assistant that combines internal regulatory documents (GDPR/SOX) with external intelligence from Perplexity Sonar to provide comprehensive compliance guidance with actionable next steps.

## 🚀 Features

- **Internal RAG System**: Query internal GDPR and SOX documents using Pinecone vector database
- **External Intelligence**: Real-time compliance insights from Perplexity Sonar API
- **Actionable Hints**: AI-generated next steps and compliance recommendations
- **Streaming API**: Real-time responses via Server-Sent Events (SSE)
- **RESTful API**: Standard JSON endpoints for integration
- **Docker Support**: Containerized deployment ready

## 🏗️ Architecture

```
├── main.py                 # FastAPI application entrypoint
├── app/
│   ├── api.py             # FastAPI routes and endpoints
│   ├── config.py          # Environment configuration
│   ├── rag_module.py      # Internal document RAG system
│   ├── sonar_module.py    # Perplexity Sonar integration
│   ├── hint_module.py     # Contextual hint generation
│   ├── data_ingestion.py  # Document processing pipeline
│   └── test_api.py        # API tests
├── scrapers/
│   ├── gdpr_scraper.py    # GDPR document scraper
│   └── sox_scraper.py     # SOX regulation scraper
├── metadata/
│   ├── gdpr_articles.json # Processed GDPR content
│   └── sox_sections.json  # Processed SOX content
└── requirements.txt       # Python dependencies
```

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.9+
- Pinecone API key
- Perplexity API key

### 1. Environment Setup

Copy the environment template and configure your API keys:

```bash
cp env.template .env
```

Edit `.env` with your API keys:
```env
PINECONE_API_KEY=your_pinecone_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Up Vector Database

Before running the application, you need to create a Pinecone index and ingest the regulatory documents:

```python
# Run the data ingestion script
python -c "from app.data_ingestion import main; main()"
```

### 4. Quick Setup (Recommended)

Run the interactive setup script:
```bash
python setup.py
```

This will:
- Check all dependencies
- Verify environment configuration 
- Set up the vector database with regulatory documents
- Run API tests to verify everything works

### 5. Run the Application

#### Local Development
```bash
python main.py
```

#### Docker Deployment
```bash
docker build -t compliance-assistant .
docker run -p 8000:8000 --env-file .env compliance-assistant
```

The API will be available at `http://localhost:8000`

### 6. Demo the System

Try the interactive demo to see the system in action:
```bash
python demo.py
```

This will run example compliance queries and show you how the system works.

## 📡 API Endpoints

### Health Check
```http
GET /health
```
Returns module status and health information.

### Query Endpoint (REST)
```http
POST /query
Content-Type: application/json

{
  "text": "What are the GDPR requirements for data breach notification?",
  "use_rag": true,
  "use_sonar": true,
  "use_hints": true
}
```

### Chat Endpoint (Streaming SSE)
```http
POST /chat
Content-Type: application/json

{
  "text": "What are the SOX requirements for financial reporting?",
  "use_rag": true,
  "use_sonar": true,
  "use_hints": true
}
```

### Response Format
```json
{
  "query": "Your compliance question",
  "internal_citations": [
    {
      "title": "GDPR Article 33",
      "excerpt": "Notification of a personal data breach to the supervisory authority",
      "source_url": "https://gdpr-info.eu/art-33-gdpr/",
      "standard": "GDPR",
      "article_number": "Article 33"
    }
  ],
  "external_citations": [
    {
      "snippet": "External compliance information",
      "source": "External source URL"
    }
  ],
  "hints": {
    "next_step_hint": "Consider implementing automated breach detection systems..."
  },
  "summary": {
    "internal_count": 3,
    "external_count": 2,
    "total_citations": 5
  }
}
```

## 🧪 Testing

Run the test suite:
```bash
python -m pytest app/test_api.py -v
```

Test the API manually:
```bash
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{"text": "GDPR data processing requirements", "use_rag": true, "use_sonar": true, "use_hints": true}'
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PINECONE_API_KEY` | Yes | - | Pinecone vector database API key |
| `PERPLEXITY_API_KEY` | Yes | - | Perplexity Sonar API key |
| `API_HOST` | No | `0.0.0.0` | API host address |
| `API_PORT` | No | `8000` | API port number |
| `DEBUG` | No | `False` | Enable debug mode |
| `LOG_LEVEL` | No | `INFO` | Logging level |
| `PINECONE_ENVIRONMENT` | No | `gcp-starter` | Pinecone environment |

### Module Configuration
- `ENABLE_RAG`: Enable/disable internal RAG system
- `ENABLE_SONAR`: Enable/disable external Sonar integration  
- `ENABLE_HINTS`: Enable/disable hint generation

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Set `DEBUG=False` and `LOG_LEVEL=WARNING`
2. **CORS**: Configure appropriate CORS origins in `app/api.py`
3. **Rate Limiting**: Consider adding rate limiting for production use
4. **Monitoring**: Set up logging and monitoring for the deployed service

### Docker Deployment
```bash
# Build the image
docker build -t compliance-assistant:latest .

# Run with environment file
docker run -d \
  --name compliance-assistant \
  -p 8000:8000 \
  --env-file .env \
  compliance-assistant:latest
```

## 📚 Data Sources

The system includes scrapers for:
- **GDPR**: EU General Data Protection Regulation articles
- **SOX**: Sarbanes-Oxley Act sections

Scraped data is stored in the `metadata/` directory and automatically ingested into Pinecone.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the terms specified in the LICENSE file.

## 🆘 Troubleshooting

### Common Issues

1. **Pinecone Connection Errors**: Verify your API key and index exists
2. **Module Initialization Failures**: Check the `/debug` endpoint for detailed status
3. **Empty Results**: Ensure documents are properly ingested into Pinecone

### Debug Endpoint
```http
GET /debug
```
Provides detailed module status and configuration information.

