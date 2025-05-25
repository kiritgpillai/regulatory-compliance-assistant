import os
import re
import json
import time
import requests
import fitz  

PDF_URL     = "https://www.govinfo.gov/content/pkg/PLAW-107publ204/pdf/PLAW-107publ204.pdf"
PDF_PATH    = "sox.pdf"
OUTPUT_FILE = "sox_sections.json"

def download_pdf():
    # Download the SOX PDF from govinfo if not already present.
    if not os.path.exists(PDF_PATH):
        print(f"[+] Downloading SOX from {PDF_URL} …")
        resp = requests.get(PDF_URL)
        resp.raise_for_status()
        with open(PDF_PATH, "wb") as f:
            f.write(resp.content)
        time.sleep(0.5)
        print("[✓] Download complete")
    else:
        print("[i] PDF already present, skipping download")
    return PDF_PATH

def extract_full_text(pdf_path):
    doc = fitz.open(pdf_path)
    all_lines = []
    for page in doc:
        text = page.get_text()
        # remove page headers/footers like "Page X" or repeated title lines
        cleaned = []
        for line in text.splitlines():
            low = line.strip().lower()
            if low.startswith("page ") or "sarbanes-oxley act" in low:
                continue
            cleaned.append(line)
        all_lines.extend(cleaned)
    return "\n".join(all_lines)

def clean_content(content):
    # Clean the extracted content by removing formatting artifacts and normalizing whitespace.
    lines = content.split('\n')
    cleaned_lines = []
    
    for line in lines:
        line = line.strip()
        # Skip empty lines, page numbers, and common headers/footers
        if not line or line.startswith('VerDate') or line.startswith('Jkt') or \
           line.startswith('PO 00000') or line.startswith('Frm') or \
           line.startswith('Fmt') or line.startswith('Sfmt') or \
           'G:\\COMP\\SEC\\' in line or line.startswith('HOLC') or \
           line.startswith('February') or line.startswith('As Amended Through') or \
           line.startswith('Sec.') and len(line.split()) <= 2:
            continue
        cleaned_lines.append(line)
    
    # Join lines with spaces and normalize whitespace
    cleaned_text = ' '.join(cleaned_lines)
    
    # Remove multiple spaces and normalize
    import re
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text)
    cleaned_text = cleaned_text.strip()
    
    return cleaned_text

def split_into_sections(full_text):
    # Define the specific sections we want to extract based on the table of contents
    target_sections = {
        # Title I - Public Company Accounting Oversight Board
        '101', '102', '103', '104', '105', '106', '107', '108', '109',
        # Title II - Auditor Independence  
        '201', '202', '203', '204', '205', '206', '207', '208', '209',
        # Title III - Corporate Responsibility
        '301', '302', '303', '304', '305', '306', '307', '308',
        # Title IV - Enhanced Financial Disclosures
        '401', '402', '403', '404', '405', '406', '407', '408', '409',
        # Title V - Analyst Conflicts of Interest
        '501',
        # Title VI - Commission Resources and Authority
        '601', '602', '603', '604',
        # Title VII - Studies and Reports
        '701', '702', '703', '704', '705',
        # Title VIII - Corporate and Criminal Fraud Accountability
        '801', '802', '803', '804', '805', '806', '807',
        # Title IX - White-Collar Crime Penalty Enhancements
        '901', '902', '903', '904', '905', '906',
        # Title X - Corporate Tax Returns
        '1001',
        # Title XI - Corporate Fraud and Accountability
        '1101', '1102', '1103', '1104', '1105', '1106', '1107'
    }
    
    # Regex to capture each section heading - looking for "SEC. 101." format
    pattern = re.compile(r'(SEC\.\s+(\d+)\.\s+[^\n]+)', re.MULTILINE)
    parts = pattern.split(full_text)
    
    # parts = [preamble, heading1, num1, content1, heading2, num2, content2, ...]
    sections = []
    for i in range(1, len(parts), 3):
        if i+2 < len(parts):  # Make sure we have all parts
            heading = parts[i].strip()
            section_number = parts[i+1].strip()
            content = parts[i+2].strip()
            
            # Only process sections that are in our target list
            if section_number not in target_sections:
                continue
            
            # Clean the content
            content = clean_content(content)
            
            # Extract title from heading (remove "SEC. XXX." part)
            title_match = re.match(r'SEC\.\s+\d+\.\s*(.*)', heading)
            title = title_match.group(1) if title_match else heading
            
            # Clean the title as well
            title = clean_content(title)
            
            # Determine title number from section number
            if section_number.startswith('10'):  # 1001, 1101, etc.
                if section_number.startswith('100'):
                    title_number = "10"  # Title X
                elif section_number.startswith('110'):
                    title_number = "11"  # Title XI
                else:
                    title_number = section_number[0]  # Fallback
            else:
                title_number = section_number[0]  # First digit for titles 1-9
            
            # Include section number in the title
            full_title = f"Section {section_number}: {title}"
            
            sections.append({
                "standard": "sox",
                "article_number": title_number,
                "title": full_title,
                "url": PDF_URL,
                "content": content
            })
    return sections

def main():
    download_pdf()
    print("[+] Extracting text …")
    text = extract_full_text(PDF_PATH)
    print("[+] Splitting into sections …")
    sections = split_into_sections(text)

    # Sort by section number
    sections.sort(key=lambda s: int(s["article_number"]))

    # Write out JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(sections, f, indent=2, ensure_ascii=False)

    print(f"[✓] Extracted {len(sections)} SOX sections to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
