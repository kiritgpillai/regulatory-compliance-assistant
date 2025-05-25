import requests
import json
import time

API_BASE_URL = "http://localhost:8000"

def test_health():
    print("Testing health endpoint...")
    response = requests.get(f"{API_BASE_URL}/health")
    if response.status_code == 200:
        print("✅ Health check passed")
        print(json.dumps(response.json(), indent=2))
    else:
        print("❌ Health check failed")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    print("-" * 50)

def test_query_endpoint():
    print("Testing query endpoint...")
    
    payload = {
        "text": "What is our data privacy policy?",
        "use_rag": True,
        "use_sonar": True,
        "use_hints": True,
        "load_sample_data": True
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/query",
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            print("✅ Query endpoint test passed")
            result = response.json()
            print(f"Query: {result.get('query')}")
            print(f"Internal citations: {result.get('summary', {}).get('internal_count', 0)}")
            print(f"External citations: {result.get('summary', {}).get('external_count', 0)}")
            print(f"Next step hint: {result.get('hints', {}).get('next_step_hint', 'N/A')}")
        else:
            print("❌ Query endpoint test failed")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Query endpoint test timed out")
    except Exception as e:
        print(f"❌ Query endpoint test failed with error: {e}")
    
    print("-" * 50)

def test_streaming_endpoint():
    print("Testing streaming chat endpoint...")
    
    payload = {
        "text": "Tell me about GDPR compliance requirements",
        "use_rag": True,
        "use_sonar": True,
        "use_hints": True,
        "load_sample_data": False
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/chat",
            json=payload,
            stream=True,
            timeout=60
        )
        
        if response.status_code == 200:
            print("✅ Streaming endpoint accessible")
            print("Stream data:")
            
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        data = line_str[6:]  # Remove 'data: ' prefix
                        try:
                            parsed_data = json.loads(data)
                            print(f"  - {parsed_data.get('status', parsed_data)}")
                        except json.JSONDecodeError:
                            print(f"  - {data}")
        else:
            print("❌ Streaming endpoint test failed")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Streaming endpoint test timed out")
    except Exception as e:
        print(f"❌ Streaming endpoint test failed with error: {e}")
    
    print("-" * 50)

def main():
    print("Starting API tests...")
    print("=" * 50)
    
    # Test health endpoint first
    test_health()
    
    # Wait a moment
    time.sleep(1)
    
    # Test query endpoint
    test_query_endpoint()
    
    # Wait a moment
    time.sleep(1)
    
    # Test streaming endpoint
    test_streaming_endpoint()
    
    print("All tests completed!")

if __name__ == "__main__":
    main() 