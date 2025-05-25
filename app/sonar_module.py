import os
import re
import logging
import asyncio
import aiohttp
import dotenv
from typing import List, Dict, Optional
from tenacity import retry, stop_after_attempt, wait_exponential

# Load environment variables 
dotenv.load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SonarModule:
    def __init__(self):
        self.initialized = False
        self.api_key: Optional[str] = None
        self.api_url = "https://api.perplexity.ai/chat/completions"
    
    def initialize(self, api_key: str = None):
        try:
            # Use provided key or get from environment
            self.api_key = api_key or os.environ.get("PERPLEXITY_API_KEY")
            
            if not self.api_key:
                raise ValueError("PERPLEXITY_API_KEY not provided or found in environment")
            
            self.initialized = True
            logger.info("Sonar module initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing Sonar module: {e}")
            raise
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def _make_api_request(self, payload: dict) -> dict:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.api_url, 
                headers=headers, 
                json=payload, 
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                response.raise_for_status()
                return await response.json()
    
    async def fetch_perplexity_sonar_citations(self, query: str, model: str = "sonar") -> List[Dict]:
        #Fetches compliance citations using the Perplexity Sonar API and normalizes them.
        if not self.initialized:
            raise RuntimeError("Sonar module not initialized")
        
        normalized_citations = []
        
        # Enhance query for compliance-focused search with specific guidance request
        enhanced_query = (
            f"{query}. Provide specific legal guidance, exact citations, and implementation context."
            " The response must include:"
            " 1. The exact title and number of any relevant regulatory articles, sections, or clauses (e.g., GDPR Article 33, SOX Section 302, HIPAA §164.308)."
            " 2. The full text excerpt or summary of the requirement from the regulation."
            " 3. A URL linking to the official regulation or government publication (e.g., gdpr-info.eu, govinfo.gov, ec.europa.eu, ftc.gov, edpb.europa.eu, oag.ca.gov, sec.gov)."
            " 4. Real-world implementation advice (e.g., what organizations typically do to comply)."
            " 5. Notable enforcement actions, penalties, or compliance rulings if available."
            " 6. Clearly indicate which jurisdiction(s) the regulation applies to (e.g., EU, US, global)."
            " 7. If multiple regulations are relevant, list each with its associated guidance."
            " Avoid vague summaries, news articles, or blog posts unless they cite or link to authoritative regulatory documents."
        )

        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an expert compliance and legal research assistant trained in analyzing and citing complex regulatory frameworks. "
                        "Your job is to help compliance teams, auditors, and legal analysts retrieve specific, actionable information about regulatory obligations. "
                        "You must prioritize official sources from government websites and regulatory bodies, such as EU Commission, SEC, FTC, EDPB, U.S. Congress, NIST, or ISO. "
                        "Each answer must include article or section numbers, plain-language interpretation, enforcement history (if available), and practical steps companies have taken to meet compliance."
                        "\n\n"
                        "Always ensure:"
                        "- Every citation is tied to a named law or regulation (e.g., GDPR, SOX, HIPAA, CCPA, PCI DSS)."
                        "- You include only reliable links from government or regulator-hosted sources."
                        "- You mention the applicable jurisdictions (e.g., EU, California, U.S. federal)."
                        "- You clarify what is **required by law**, what is **recommended guidance**, and what is **industry best practice**."
                        "- You structure the output in a way that supports easy parsing and indexing in compliance tools (e.g., RAG pipelines)."
                        "\n\n"
                        "DO NOT answer with speculative advice, general blogs, or unverified interpretations. You must be exact, legally accurate, and citation-focused."
                    )
                },
                {
                    "role": "user",
                    "content": enhanced_query
                }
            ],
            "stream": False
        }

        
        try:
            data = await self._make_api_request(payload)
            
            # Parse Perplexity API response for citations
            if 'choices' in data and data['choices']:
                message = data['choices'][0]['message']
                
                # Check for structured citations in tool_outputs
                if 'tool_outputs' in message:
                    for tool_output in message['tool_outputs']:
                        if 'citations' in tool_output:
                            for citation in tool_output['citations']:
                                title = citation.get('title') or citation.get('name') or "Untitled Citation"
                                url = citation.get('url') or "#"
                                citation_type = self._determine_citation_type(title, url)
                                
                                normalized_citations.append({
                                    "title": title,
                                    "date": citation.get('date'),  # May be None
                                    "url": url,
                                    "type": citation_type
                                })
                
                # Check for sources array
                elif 'sources' in message:
                    for source in message['sources']:
                        title = source.get('title') or "Untitled Citation"
                        url = source.get('url') or "#"
                        citation_type = self._determine_citation_type(title, url)
                        
                        normalized_citations.append({
                            "title": title,
                            "date": source.get('date'),
                            "url": url,
                            "type": citation_type
                        })
                
                # Fallback: extract URLs from content
                elif 'content' in message and "http" in message['content']:
                    urls = re.findall(r'https?://[^\s\]\)]+', message['content'])
                    for url in urls[:5]:  # Limit to first 5 URLs
                        citation_type = self._determine_citation_type("", url)
                        normalized_citations.append({
                            "title": f"Link from Perplexity: {url[:50]}...",
                            "date": None,
                            "url": url,
                            "type": citation_type
                        })
                
                # Additional parsing for citations mentioned in content
                content = message.get('content', '')
                citation_patterns = [
                    r'SEC[- ]?\d+[- ]?\d*',  # SEC regulations
                    r'GDPR[- ]?Article[- ]?\d+',  # GDPR articles
                    r'SOX[- ]?Section[- ]?\d+',  # SOX sections
                    r'Regulation[- ]?[A-Z]+',  # General regulations
                ]
                
                for pattern in citation_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    for match in matches:
                        if not any(match.lower() in cite['title'].lower() for cite in normalized_citations):
                            normalized_citations.append({
                                "title": f"Regulatory Reference: {match}",
                                "date": None,
                                "url": f"https://www.sec.gov/search?query={match.replace(' ', '+')}",
                                "type": "Regulatory Reference"
                            })
            
            logger.info(f"Retrieved {len(normalized_citations)} citations from Perplexity Sonar for query: {query}")
            
        except aiohttp.ClientError as e:
            logger.error(f"Network error during Perplexity Sonar API call: {e}")
        except asyncio.TimeoutError:
            logger.error("Perplexity Sonar API request timed out")
        except Exception as e:
            logger.error(f"Unexpected error during Perplexity Sonar API call: {e}")
        
        return normalized_citations
    
    def _determine_citation_type(self, title: str, url: str) -> str:
        # Determine the type of citation based on title and URL.
        title_lower = title.lower()
        url_lower = url.lower()
        
        if any(keyword in title_lower for keyword in ['sec', 'securities', 'exchange']):
            return "SEC"
        elif any(keyword in title_lower for keyword in ['gdpr', 'general data protection']):
            return "GDPR"
        elif any(keyword in title_lower for keyword in ['sox', 'sarbanes', 'oxley']):
            return "SOX"
        elif any(domain in url_lower for domain in ['sec.gov', 'europa.eu']):
            if 'sec.gov' in url_lower:
                return "SEC"
            elif 'europa.eu' in url_lower:
                return "GDPR"
        elif any(keyword in title_lower for keyword in ['regulation', 'compliance', 'legal']):
            return "Compliance"
        else:
            return "External Citation"
    
    async def analyze_query(self, query: str) -> dict:
        if not self.initialized:
            raise RuntimeError("Sonar module not initialized")
        
        try:
            citations = await self.fetch_perplexity_sonar_citations(query)
            
            analysis = {
                "query": query,
                "citations_found": len(citations),
                "citations": citations,
                "analysis_summary": f"Found {len(citations)} relevant compliance citations",
                "citation_types": list(set(
                    str(cite.get('type', 'Unknown')) if cite.get('type') is not None 
                    else 'Unknown' for cite in citations
                ))
            }
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing query with Sonar: {e}")
            return {
                "query": query,
                "citations_found": 0,
                "citations": [],
                "analysis_summary": "Error occurred during analysis",
                "citation_types": [],
                "error": str(e)
            }
    
    # Synchronous wrapper for backward compatibility
    def analyze_query_sync(self, query: str) -> dict:
        return asyncio.run(self.analyze_query(query)) 