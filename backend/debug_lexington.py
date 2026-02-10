
import re
from typing import List, Dict

# --- MOCK EXTRACTOR ---
def _extract_model_numbers(text: str) -> List[str]:
    # Exact copy of current logic
    tokens = text.split()
    models = []
    for t in tokens:
        t_clean = re.sub(r'[^\w\-]', '', t).upper()
        if any(c.isdigit() for c in t_clean) and len(t_clean) > 2:
             if t_clean not in ["SIZE", "PACK", "WITH", "BLACK", "WHITE", "BLUE", "GOLD", "WOMEN", "MENS", "KIDS", "ROSE", "GOLD", "WATCH", "DARCI", "1PC", "2PC", "100ML", "50ML", "500G", "1KG"]:
                models.append(t_clean)
    return models

def _extract_series_name(text: str) -> str:
    # New logic proposal: Extract proper nouns/Series names that aren't the brand
    # Heuristic: Captialized words that aren't common stopwords or Brand parts
    
    # 1. Known Watch Series (We could have a small DB, or just rely on heuristics)
    known_series = ["LEXINGTON", "BRADSHAW", "RUNWAY", "DARCI", "SOFIE", "PYPER", "PARKER", "SLIM", "RITZ"]
    
    text_upper = text.upper()
    for series in known_series:
        if series in text_upper:
            return series
            
    return None

query = "MICHAEL KORS Lexington Analog Watch - For Women"
print(f"Query: '{query}'")

models = _extract_model_numbers(query)
print(f"Models Detected: {models}")

if not models:
    print("❌ No Model Number found. Fallback to Attribute Filter.")
    
    # Test Series Extraction
    series = _extract_series_name(query)
    print(f"Series Detected: {series}")
    
    if series:
        print(f"✅ ACTION: Filter results to require '{series}' in title.")
    else:
        print("❌ No Series detected. Results will be messy (Brand only).")
