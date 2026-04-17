import requests

def fetch_wikipedia_summary(topic: str) -> dict:
    base_url = "https://en.wikipedia.org/api/rest_v1/page/summary/"
    
    query = topic.replace(" ", "_")
    
    try:
        response = requests.get(base_url + query, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            extract = data.get("extract", "").strip()
            
            return {
                "source_title": data.get("title", ""),
                "source_url": data.get("content_urls", {}).get("desktop", {}).get("page", ""),
                "reference_text": extract
            }
    except Exception:
        pass

    return {
        "source_title": "",
        "source_url": "",
        "reference_text": ""
    }

if __name__ == "__main__":
    print(fetch_wikipedia_summary("AI"))