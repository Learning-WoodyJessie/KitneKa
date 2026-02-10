
import re
from typing import List

def _extract_model_numbers(text: str) -> List[str]:
        """
        Extracts alphanumeric model codes (e.g., MK6475, WH-1000XM4, iPhone15)
        Ignores generic terms like 'Women', 'Watch', 'Size', 'Pack'
        """
        # Look for tokens with mixed alpha+digits OR pure digits of specific length (e.g. 501)
        tokens = text.split()
        models = []
        for t in tokens:
            t_clean = re.sub(r'[^\w\-]', '', t).upper()
            # Strict Rule: Model numbers MUST have at least one digit (e.g. MK3192, iphone15)
            # Pure alpha words (MICHAEL, ROSE, GOLD) are almost never unique model IDs in this context.
            if any(c.isdigit() for c in t_clean) and len(t_clean) > 2:
                 # Filter out common false positives
                 if t_clean not in ["SIZE", "PACK", "WITH", "1PC", "2PC", "100ML", "50ML", "500G", "1KG"]:
                    models.append(t_clean)
        return models

test_str = "Michael Kors Women Darci Rose Gold Watch MK3192"
print(f"Testing: '{test_str}'")
extracted = _extract_model_numbers(test_str)
print(f"Extracted: {extracted}")

if "MK3192" in extracted:
    print("SUCCESS: MK3192 found.")
else:
    print("FAILURE: MK3192 NOT found.")
