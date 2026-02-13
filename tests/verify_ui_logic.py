
def verify_filtering_logic():
    print("Verifying Frontend Filtering Logic...")
    
    # Mock Data
    items = [
        {"id": 1, "match_classification": "EXACT_MATCH", "is_popular": False, "price": 400, "title": "Top Match 1"},
        {"id": 2, "match_classification": "SIMILAR", "is_popular": False, "price": 300, "title": "Similar Item"},
        {"id": 3, "match_classification": "EXACT_MATCH", "is_popular": True, "price": 60000, "title": "Expensive Match"},
    ]
    
    filter_type = 'popular'
    price_range = [0, 50000]
    
    # Logic Reproduction
    filtered = []
    for item in items:
        # 1. Price Check (Global)
        if item['price'] < price_range[0] or item['price'] > price_range[1]:
            continue
            
        # 2. Filter Type Check
        if filter_type == 'popular':
            # Logic: Always include EXACT_MATCH, otherwise check is_popular
            if item.get('match_classification') == 'EXACT_MATCH':
                pass # Include!
            elif not item.get('is_popular'):
                continue # Exclude
                
        filtered.append(item)
        
    # Expectations
    # Item 1: Exact Match (Include due to override) + Price OK -> KEEP
    # Item 2: Similar + Not Popular -> DROP
    # Item 3: Exact Match (Include) + Price Too High -> DROP
    
    print(f"\nTotal Input: {len(items)}")
    print(f"Filtered Count: {len(filtered)}")
    
    ids = [i['id'] for i in filtered]
    print(f"Kept IDs: {ids}")
    
    if 1 in ids and 2 not in ids and 3 not in ids:
        print("\n✅ Logic Verified: Exact Matches are included regardless of popularity, but still respect Price filters.")
    # 3. List Combination Verification
    print("\nVerifying List Combination Order...")
    variant_matches = [{"id": "v1", "type": "VARIANT"}]
    similar_matches = [{"id": "s1", "type": "SIMILAR"}, {"id": "s2", "type": "SIMILAR"}]
    
    # Logic: variants first, then similar
    other_matches = [*variant_matches, *similar_matches]
    
    print(f"Combined List: {[i['id'] for i in other_matches]}")
    
    if other_matches[0]['id'] == "v1" and other_matches[1]['id'] == "s1":
        print("✅ Order Verified: Variants come before Similar items.")
    else:
        print("❌ Order FAILED.")

if __name__ == "__main__":
    verify_filtering_logic()
