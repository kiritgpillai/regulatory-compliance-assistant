
import requests
import time
import json
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import re

SITEMAP_URL  = "https://gdpr-info.eu/page-sitemap.xml"
OUTPUT_FILE  = "gdpr_articles.json"

def clean_text(text):
    # Clean text by removing special characters and normalizing whitespace.
    if not text:
        return ""
    
    # Remove or replace special characters, keeping basic punctuation
    cleaned = re.sub(r'[^\w\s\.\,\;\:\(\)\-\'\"\?!]', ' ', text)
    
    # Normalize whitespace - replace multiple spaces/newlines with single space
    cleaned = re.sub(r'\s+', ' ', cleaned)
    
    return cleaned.strip()

def clean_title(title):
    if not title:
        return ""
    
    # Remove various "Art/Article X GDPR" patterns from the beginning
    patterns_to_remove = [
        r'^Art\.?\s*\d+\s*[-:]?\s*GDPR\s*[-:]?\s*',  # Art. 16 GDPR, Art 16 - GDPR, etc.
        r'^Article\s*\d+\s*[-:]?\s*GDPR\s*[-:]?\s*',  # Article 16 GDPR, Article 16 - GDPR, etc.
        r'^Art\.?\s*\d+\s*[-:]?\s*',                  # Art. 16, Art 16 -, etc. (without GDPR)
        r'^Article\s*\d+\s*[-:]?\s*',                 # Article 16, Article 16 -, etc. (without GDPR)
    ]
    
    cleaned_title = title
    for pattern in patterns_to_remove:
        cleaned_title = re.sub(pattern, '', cleaned_title, flags=re.IGNORECASE)
        # If we removed something, break to avoid over-processing
        if cleaned_title != title:
            break
    
    # Clean any remaining special characters
    cleaned_title = clean_text(cleaned_title)
    
    return cleaned_title

def get_sitemap_article_links():

    resp = requests.get(SITEMAP_URL)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)
    ns   = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}

    links = []
    for url in root.findall("sm:url", ns):
        loc = url.find("sm:loc", ns)
        if loc is not None and "/art-" in loc.text and loc.text.endswith("/"):
            links.append(loc.text)
    print(f"[+] Found {len(links)} article URLs in sitemap")
    return links

def parse_article(url):

    resp = requests.get(url)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    # Title
    title_tag = soup.find("h1")
    raw_title = title_tag.get_text(strip=True) if title_tag else "No Title"
    title = clean_title(raw_title)

    # Article number from URL
    article_number = (
        url.rstrip("/")
           .split("/")[-1]
           .replace("art-", "")
           .replace("-gdpr", "")
    )

    # Main content block
    content_div = soup.find("div", class_="entry-content")
    if not content_div:
        return None

    # Remove any <nav> (prev/next links)
    for nav in content_div.find_all("nav"):
        nav.decompose()

    # Remove the specific unwanted divs by class
    for unwanted in content_div.select(
        ".page-navigation, .link-to-overview, .feedback, .feedback.hint"
    ):
        unwanted.decompose()

    # Fallback: strip out any paragraphs/divs containing navigation markers
    def is_footer(tag):
        txt = tag.get_text()
        return any(marker in txt for marker in [
            "←", "→", "GDPR", "Table of contents", "Report error"
        ])
    for footer in content_div.find_all(lambda t: t.name in ("p", "div") and is_footer(t)):
        footer.decompose()

    # Extract clean text
    raw_content = content_div.get_text(separator="\n", strip=True)
    content = clean_text(raw_content)

    return {
        "standard":       "gdpr",
        "article_number": article_number,
        "title":          title,
        "url":            url,
        "content":        content
    }

def main():
    articles = []
    links    = get_sitemap_article_links()

    for link in links:
        try:
            art = parse_article(link)
            if art:
                articles.append(art)
                print(f" • Scraped Article {art['article_number']}: {art['title']}")
        except Exception as e:
            print(f"[!] Error scraping {link}: {e}")
        time.sleep(0.5)  # polite pause between requests

    # Sort ascending by numeric article_number
    articles.sort(key=lambda a: int(a["article_number"]))

    # Write to JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)

    print(f"[✓] Saved {len(articles)} GDPR articles to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
