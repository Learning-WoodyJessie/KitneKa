
import sys
import os
import logging
import re

# Add backend to path - Assuming we run from project root 
# Correctly resolve modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

# Mock minimal SmartSearchService if import fails due to dependencies
try:
    from app.services.smart_search_service import SmartSearchService
except ImportError as e:
    print(f"Import Failed: {e}")
    # Create simplified mock for testing logic only if full import fails
    class SmartSearchService:
        def __init__(self):
            pass
        
        def _extract_model_numbers(self, text: str):
            # COPY LOGIC FROM FILE
            tokens = text.split()
            models = []
            for t in tokens:
                t_clean = re.sub(r'[^\w\-]', '', t).upper()
                if any(c.isdigit() for c in t_clean) and len(t_clean) > 2:
                     if t_clean.endswith('I') and len(t_clean) > 3 and t_clean[-2].isdigit():
                         t_clean = t_clean[:-1]
                     if t_clean not in ["SIZE", "PACK", "WITH", "BLACK", "WHITE", "BLUE", "GOLD", "WOMEN", "MENS", "KIDS", "ROSE", "GOLD", "WATCH", "DARCI", "1PC", "2PC", "100ML", "50ML", "500G", "1KG"]:
                        models.append(t_clean)
            return models

        def _calculate_match_score(self, target_model: str, target_brand: str, target_fingerprint: dict, candidate_title: str, candidate_source: str) -> dict:
            # COPY LOGIC FROM FILE
            score = 0
            reasons = []
            title_upper = candidate_title.upper()
            if target_model and target_model in title_upper:
                score += 90
                reasons.append("Model Match")
            if target_brand and target_brand.upper() in title_upper:
                score += 20
                reasons.append("Brand Match")
            return {"score": score, "reasons": reasons}

logging.basicConfig(level=logging.INFO)

def test_logic():
    print("Initializing Service...")
    service = SmartSearchService()
    
    test_cases = [
        "MK7548",
        "mk7548i",
        "Michael KORS 7548",
        "Michael Kors MK-7548",
        "MK 7548",
        "mk 7548"
    ]

    target_title_success = "Michael Kors Women's Watch MK7548 Gold"
    
    print(f"\n{'QUERY':<25} | {'EXTRACTED':<15} | {'MATCH TARGET?':<15} | {'SCORE':<5}")
    print("-" * 70)
    
    for query in test_cases:
        # 1. Extraction
        models = service._extract_model_numbers(query)
        extracted = models[0] if models else None
        
        # 2. Matching
        if extracted:
            score_data = service._calculate_match_score(
                target_model=extracted,
                target_brand="Michael Kors", 
                target_fingerprint={},
                candidate_title=target_title_success,
                candidate_source="Amazon"
            )
            score = score_data['score']
            is_match = "YES" if score >= 90 else "NO"
        else:
            score = 0
            is_match = "NO (No Model)"
            extracted = "NONE"
        
        print(f"{query:<25} | {extracted:<15} | {is_match:<15} | {score:<5}")

    test_cases_conflict = [
        # Query (extracted FP), Candidate Title, Expected Score Change
        ({"collection": "COREY"}, "Michael Kors Parker Watch", -30), 
        ({"collection": "COREY"}, "Michael Kors Corey Watch", 15),
    ]

    print(f"\n{'TARGET':<20} | {'CANDIDATE SERIES':<20} | {'SCORE':<5} | {'REASON'}")
    print("-" * 80)

    for target_fp, candidate_title, expected_impact in test_cases_conflict:
        score_data = service._calculate_match_score(
            target_model=None,
            target_brand="Michael Kors",
            target_fingerprint=target_fp,
            candidate_title=candidate_title,
            candidate_source="Amazon"
        )
        print(f"{target_fp.get('collection'):<20} | {candidate_title:<20} | {score_data['score']:<5} | {score_data['reasons']}")

if __name__ == "__main__":
    test_logic()
