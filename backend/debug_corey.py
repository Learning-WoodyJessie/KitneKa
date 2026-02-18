
import re
from typing import List

def _extract_model_numbers(text: str) -> List[str]:
    tokens = text.split()
    models = []
    for t in tokens:
        # standard clean
        t_clean = re.sub(r'[^\w\-]', '', t).upper()
        
        # Strict Rule: Must have digit and be > 2 chars
        if any(c.isdigit() for c in t_clean) and len(t_clean) > 2:
             # Check for India/International suffix "I" (e.g. MK7548I -> MK7548)
             if t_clean.endswith('I') and len(t_clean) > 3 and t_clean[-2].isdigit():
                 print(f"DEBUG: Stripping 'I' suffix: {t_clean} -> {t_clean[:-1]}")
                 t_clean = t_clean[:-1]
                 
             if t_clean not in ["SIZE", "PACK", "WITH", "BLACK", "WHITE", "BLUE", "GOLD", "WOMEN", "MENS", "KIDS", "ROSE", "GOLD", "WATCH", "DARCI", "1PC", "2PC", "100ML", "50ML", "500G", "1KG"]:
                models.append(t_clean)
    return models

def run_simulation():
    # 1. Simulate Input (from URL metadata)
    # Myntra URL: https://www.myntra.com/watches/michael+kors/michael-kors-women-corey-stainless-steel-straps-analogue-watch-mk7548i/35546875/buy
    # Likely extracted title:
    input_title = "Michael Kors Women Corey Stainless Steel Straps Analogue Watch MK7548I"
    
    print(f"INPUT Title: {input_title}")
    
    # 2. Extract Model
    models = _extract_model_numbers(input_title)
    print(f"EXTRACTED Models: {models}")
    
    if not models:
        print("FAIL: No model detected.")
        return

    detected_model = models[0] # likely MK7548I

    # 3. Simulate Search Results (Hypothetical)
    simulated_results = [
        {"title": "Michael Kors Women Corey Watch MK7548I", "source": "Myntra (Exact)"},
        {"title": "Michael Kors Corey Three-Hand Stainless Steel Watch MK7548", "source": "Amazon (Base Model)"}, 
        {"title": "Michael Kors Corey MK7548 Rose Gold", "source": "Flipkart (Base Model)"},
        {"title": "Michael Kors Parker MK5896", "source": "Irrelevant"}
    ]
    
    print("\n--- Testing Strict Filter ---")
    print(f"Filtering for: '{detected_model}'")
    
    matched = []
    rejected = []
    
    for item in simulated_results:
        title_upper = item["title"].upper()
        # The logic in smart_search_service.py:
        # if any(m in title_upper for m in query_models):
        if detected_model in title_upper:
            matched.append(item)
        else:
            rejected.append(item)
            
    print(f"\nKEPT ({len(matched)}):")
    for m in matched: print(f" - {m['title']} ({m['source']})")
    
    print(f"\nREJECTED ({len(rejected)}):")
    for r in rejected: print(f" - {r['title']} ({r['source']})")
    
    # 4. Check for suffix issue
    if len(matched) < 3: # We expect to find the Amazon/Flipkart ones too
        print("\n[!] POTENTIAL ISSUE DETECTED: 'I' suffix prevented matching base model.")
        # Proposed fix: Try removing trailing 'I' if model ends with digit+I?
        
        base_model = detected_model
        if detected_model.endswith("I") and detected_model[-2].isdigit():
             base_model = detected_model[:-1]
             print(f"PROPOSED FIX: Use base model '{base_model}' for filtering.")
             
             matched_fixed = []
             for item in simulated_results:
                 if base_model in item["title"].upper():
                     matched_fixed.append(item)
             
             print(f"\nKEPT WITH FIX ({len(matched_fixed)}):")
             for m in matched_fixed: print(f" - {m['title']} ({m['source']})")

if __name__ == "__main__":
    run_simulation()
