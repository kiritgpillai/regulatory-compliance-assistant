#!/usr/bin/env python3
# Demo script for Regulatory Compliance Assistant MVP
# Showcases the system's capabilities with example compliance queries.

import asyncio
import json
import sys
from typing import Dict, Any
import dotenv

# Load environment variables 
dotenv.load_dotenv()

async def demo_query(query_text: str, description: str = "") -> Dict[Any, Any]:
    # Demonstrate a single query to the compliance assistant.
    print(f"\n{'='*60}")
    print(f"🔍 DEMO: {description or query_text}")
    print(f"{'='*60}")
    print(f"Query: {query_text}")
    print("-" * 60)
    
    try:
        # Import the modules
        from app.rag_module import RAGModule
        from app.sonar_module import SonarModule  
        from app.hint_module import HintModule
        
        # Initialize modules
        rag = RAGModule()
        sonar = SonarModule()
        hint = HintModule()
        
        print("🔧 Initializing modules...")
        rag.initialize()
        sonar.initialize()
        hint.initialize()
        
        # Check initialization status
        if not rag.initialized:
            print("⚠️  RAG module not initialized - may need Pinecone setup")
        if not sonar.initialized:
            print("⚠️  Sonar module not initialized - may need Perplexity API key")
        if not hint.initialized:
            print("⚠️  Hint module not initialized")
        
        # Perform queries
        internal_citations = []
        external_citations = []
        
        if rag.initialized:
            print("📚 Querying internal documents...")
            internal_citations = await rag.query_rag_system(query_text)
            print(f"   Found {len(internal_citations)} internal citations")
        
        if sonar.initialized:
            print("🌐 Querying external sources...")
            sonar_result = await sonar.analyze_query(query_text)
            external_citations = sonar_result.get('citations', []) if isinstance(sonar_result, dict) else []
            print(f"   Found {len(external_citations)} external citations")
        
        # Generate hints
        hints = {}
        if hint.initialized:
            print("💡 Generating actionable hints...")
            hints = await hint.get_contextual_hints(query_text, internal_citations, external_citations)
        
        # Display results
        print("\n📋 RESULTS:")
        print("-" * 40)
        
        if internal_citations:
            print(f"\n📚 Internal Citations ({len(internal_citations)}):")
            for i, citation in enumerate(internal_citations[:3], 1):  # Show max 3
                print(f"  {i}. {citation.get('title', 'N/A')}")
                print(f"     Standard: {citation.get('standard', 'Unknown')}")
                print(f"     Source: {citation.get('source', 'N/A')}")
                print(f"     Excerpt: {citation.get('excerpt', 'No excerpt')[:100]}...")
                print()
        
        if external_citations:
            print(f"\n🌐 External Citations ({len(external_citations)}):")
            for i, citation in enumerate(external_citations[:3], 1):  # Show max 3
                print(f"  {i}. {citation.get('title', 'External Source')}")
                print(f"     Snippet: {citation.get('snippet', 'No snippet')[:100]}...")
                print()
        
        if hints and hints.get('next_step_hint'):
            print(f"\n💡 Next Step Hint:")
            print(f"   {hints['next_step_hint']}")
        
        # Return structured results
        return {
            "query": query_text,
            "internal_citations": internal_citations,
            "external_citations": external_citations,
            "hints": hints,
            "summary": {
                "internal_count": len(internal_citations),
                "external_count": len(external_citations),
                "total_citations": len(internal_citations) + len(external_citations)
            }
        }
        
    except Exception as e:
        print(f"❌ Error during demo: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return {"error": str(e)}

async def run_demo():
    # Run a comprehensive demo of the Regulatory Compliance Assistant.
    print("🚀 Regulatory Compliance Assistant MVP Demo")
    print("🤖 This demo showcases the system's capabilities with example queries")
    print("="*80)
    
    # Demo queries covering different compliance areas
    demo_queries = [
        {
            "text": "What are the GDPR requirements for data breach notification?",
            "description": "GDPR Data Breach Notification Requirements"
        },
        {
            "text": "What are the SOX requirements for financial reporting and internal controls?",
            "description": "SOX Financial Reporting Compliance"
        },
        {
            "text": "How should we handle cross-border data transfers under GDPR?",
            "description": "GDPR Cross-Border Data Transfer Compliance"
        }
    ]
    
    results = []
    
    for i, query_info in enumerate(demo_queries, 1):
        print(f"\n🎯 Running Demo {i}/{len(demo_queries)}")
        result = await demo_query(query_info["text"], query_info["description"])
        results.append(result)
        
        # Pause between queries for readability
        if i < len(demo_queries):
            print("\n⏸️  Press Enter to continue to next demo...")
            input()
    
    # Summary
    print(f"\n{'='*80}")
    print("📊 DEMO SUMMARY")
    print(f"{'='*80}")
    
    total_internal = sum(r.get('summary', {}).get('internal_count', 0) for r in results if 'summary' in r)
    total_external = sum(r.get('summary', {}).get('external_count', 0) for r in results if 'summary' in r)
    total_citations = total_internal + total_external
    
    print(f"📋 Queries processed: {len(demo_queries)}")
    print(f"📚 Total internal citations: {total_internal}")
    print(f"🌐 Total external citations: {total_external}")
    print(f"📑 Total citations: {total_citations}")
    
    print(f"\n🎉 Demo completed successfully!")
    print(f"💼 Your Regulatory Compliance Assistant is ready for production use")
    
    return results

def main():
    # Main function to run the demo.
    print("Starting Regulatory Compliance Assistant Demo...")
    
    try:
        # Run the async demo
        results = asyncio.run(run_demo())
        
        # Optional: Save results to file
        print(f"\n💾 Would you like to save the demo results to a file? (y/n): ", end="")
        save_results = input().lower().strip()
        
        if save_results == 'y':
            with open('demo_results.json', 'w') as f:
                json.dump(results, f, indent=2, default=str)
            print("📁 Results saved to demo_results.json")
        
    except KeyboardInterrupt:
        print("\n⏹️  Demo interrupted by user")
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 