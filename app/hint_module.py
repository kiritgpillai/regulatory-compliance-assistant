import os
import logging
import asyncio
import aiohttp
from typing import List, Dict, Optional
from tenacity import retry, stop_after_attempt, wait_exponential

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HintModule:
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
            logger.info("Hint module initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing Hint module: {e}")
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
                timeout=aiohttp.ClientTimeout(total=20)
            ) as response:
                response.raise_for_status()
                return await response.json()
    
    async def generate_next_step_hint(self, user_query: str, internal_cites: List[Dict], external_cites: List[Dict]) -> str:
        if not self.initialized:
            raise RuntimeError("Hint module not initialized")
        
        try:
            # Build context from citations
            context_text = f"User Query: {user_query}\n\n"
            
            if internal_cites:
                context_text += "Internal Citations:\n"
                for cite in internal_cites[:3]:  # Limit to top 3 for brevity
                    context_text += f"- {cite.get('title', 'N/A')} ({cite.get('source_url', 'N/A')}): {cite.get('excerpt', 'N/A')[:200]}...\n"
                context_text += "\n"
            
            if external_cites:
                context_text += "External Citations:\n"
                for cite in external_cites[:3]:  # Limit to top 3 for brevity
                    context_text += f"- {cite.get('title', 'N/A')} ({cite.get('type', 'N/A')}): {cite.get('url', 'N/A')}\n"
                context_text += "\n"
            
            # Create query-specific prompt
            query_keywords = user_query.lower()
            if "breach" in query_keywords:
                context_focus = "breach notification procedures, timelines, and reporting requirements"
            elif "transfer" in query_keywords or "cross-border" in query_keywords:
                context_focus = "data transfer mechanisms, adequacy decisions, and safeguards"
            elif "sox" in query_keywords and ("reporting" in query_keywords or "control" in query_keywords):
                context_focus = "internal controls implementation, documentation, and testing procedures"
            elif "consent" in query_keywords:
                context_focus = "consent mechanisms, withdrawal procedures, and documentation"
            else:
                context_focus = "implementation requirements and compliance procedures"
            
            prompt_content = (
                f"Query: {user_query}\n\n"
                f"{context_text}"
                f"Focusing specifically on {context_focus}, provide ONE actionable next step (1-2 sentences) "
                f"that addresses the specific query. Be concrete and implementation-focused. "
                f"Examples: 'Draft a breach response plan with 72-hour notification timeline.' or "
                f"'Implement SOC 1 Type II controls for financial reporting systems.'\n\n"
                f"Specific Next Step:"
            )
            
            payload = {
                "model": "sonar",  # Using sonar for hint generation
                "messages": [
                    {
                        "role": "system", 
                        "content": "You are a concise assistant providing actionable next steps for compliance and regulatory queries. Keep responses short and practical."
                    },
                    {
                        "role": "user", 
                        "content": prompt_content
                    }
                ],
                "stream": False,
                "max_tokens": 100  # Keep hints concise
            }
            
            data = await self._make_api_request(payload)
            
            if 'choices' in data and data['choices']:
                hint = data['choices'][0]['message']['content'].strip()
                logger.info(f"Generated next step hint for query: {user_query}")
                return hint
            else:
                return "Review the provided citations and consider consulting relevant documentation for more details."
                
        except Exception as e:
            logger.error(f"Error generating next step hint: {e}")
            return "Could not generate a next step hint at this time. Please review the provided citations."
    
    def get_hints(self, query: str) -> List[str]:
        if not self.initialized:
            raise RuntimeError("Hint module not initialized")
        
        # Basic hints based on query content
        hints = []
        query_lower = query.lower()
        
        if any(keyword in query_lower for keyword in ['gdpr', 'data protection', 'privacy']):
            if 'breach' in query_lower:
                hints.extend([
                    "Implement automated breach detection systems",
                    "Create 72-hour notification templates for supervisory authorities",
                    "Develop breach assessment and documentation procedures"
                ])
            elif 'transfer' in query_lower or 'cross-border' in query_lower:
                hints.extend([
                    "Review adequacy decisions and Standard Contractual Clauses (SCCs)",
                    "Implement Binding Corporate Rules (BCRs) for intra-group transfers",
                    "Conduct Transfer Impact Assessments (TIAs) for third countries"
                ])
            else:
                hints.extend([
                    "Map personal data flows and processing activities (Article 30 records)",
                    "Conduct Data Protection Impact Assessments (DPIAs) for high-risk processing",
                    "Implement privacy by design and by default measures"
                ])
        
        if any(keyword in query_lower for keyword in ['sec', 'securities', 'filing']):
            hints.extend([
                "Review SEC Form 10-K filing requirements",
                "Consider materiality thresholds for disclosure",
                "Consult with legal counsel for securities compliance"
            ])
        
        if any(keyword in query_lower for keyword in ['sox', 'sarbanes', 'internal controls']):
            if 'reporting' in query_lower or 'financial' in query_lower:
                hints.extend([
                    "Implement COSO framework for internal controls design",
                    "Document walkthrough procedures for key business processes",
                    "Establish quarterly management assessment testing protocols"
                ])
            else:
                hints.extend([
                    "Map IT general controls (ITGC) and application controls",
                    "Create SOD (Segregation of Duties) matrices and monitoring",
                    "Implement continuous monitoring using GRC platforms"
                ])
        
        if not hints:
            hints = [
                "Review relevant compliance documentation",
                "Consider consulting with legal or compliance teams",
                "Check for recent regulatory updates"
            ]
        
        return hints[:3]  # Return top 3 hints
    
    async def get_contextual_hints(self, query: str, internal_cites: List[Dict] = None, external_cites: List[Dict] = None) -> Dict:
        if not self.initialized:
            raise RuntimeError("Hint module not initialized")
        
        try:
            # Get basic hints
            basic_hints = self.get_hints(query)
            
            # Generate next step hint if citations are provided
            next_step_hint = None
            if internal_cites or external_cites:
                next_step_hint = await self.generate_next_step_hint(
                    query, 
                    internal_cites or [], 
                    external_cites or []
                )
            
            return {
                "basic_hints": basic_hints,
                "next_step_hint": next_step_hint,
                "query": query
            }
            
        except Exception as e:
            logger.error(f"Error getting contextual hints: {e}")
            return {
                "basic_hints": self.get_hints(query),
                "next_step_hint": "Could not generate contextual hint at this time.",
                "query": query,
                "error": str(e)
            }
    
    # Synchronous wrapper for backward compatibility
    def get_contextual_hints_sync(self, query: str, internal_cites: List[Dict] = None, external_cites: List[Dict] = None) -> Dict:
        return asyncio.run(self.get_contextual_hints(query, internal_cites, external_cites)) 