
# Registry of Trusted Brands and Stores for India
# Used by TrustService to tag search results.

# --- BRANDS REGISTRY ---
# Structure:
# id: {
#   aliases: list[str],
#   categories: list[str],
#   is_clean_beauty: bool,
#   official_domains: list[dict] { host, path_prefix }
# }

BRANDS = {
    "nike": {
        "display_name": "Nike",
        "aliases": ["nike"],
        "categories": ["fashion", "sports"],
        "is_clean_beauty": False,
        "official_domains": [
            {"host": "nike.com", "path_prefix": "/in/"}
        ]
    },
    "adidas": {
        "display_name": "Adidas",
        "aliases": ["adidas"],
        "categories": ["fashion", "sports"],
        "is_clean_beauty": False,
        "official_domains": [
            {"host": "adidas.co.in", "path_prefix": "/"}
        ]
    },
    "puma": {
        "display_name": "Puma",
        "aliases": ["puma"],
        "categories": ["fashion", "sports"],
        "is_clean_beauty": False,
        "official_domains": [
            {"host": "in.puma.com", "path_prefix": "/"}
        ]
    },
    "hm": {
        "display_name": "H&M",
        "aliases": ["h&m", "h and m"],
        "categories": ["fashion"],
        "is_clean_beauty": False,
        "official_domains": [
            {"host": "www2.hm.com", "path_prefix": "/en_in/"}
        ]
    },
    "michael_kors": {
        "display_name": "Michael Kors",
        "aliases": ["michael kors", "mk", "michaelkors"],
        "categories": ["fashion", "luxury", "accessories"],
        "is_clean_beauty": False,
        "official_domains": [
            {"host": "michaelkors.global", "path_prefix": "/in/en/"},
            {"host": "michaelkors.com", "path_prefix": "/in/"} # Backup
        ]
    },
    "fossil": {
        "display_name": "Fossil",
        "aliases": ["fossil"],
        "categories": ["fashion", "accessories", "watches"],
        "is_clean_beauty": False,
        "official_domains": [
            {"host": "fossil.com", "path_prefix": "/en-in/"}
        ]
    },
    "titan": {
        "display_name": "Titan",
        "aliases": ["titan"],
        "categories": ["accessories", "watches"],
        "is_clean_beauty": False,
        "official_domains": [
            {"host": "titan.co.in", "path_prefix": "/"}
        ]
    },
    "biba": {
        "display_name": "Biba",
        "aliases": ["biba"],
        "categories": ["fashion", "ethnic"],
        "is_clean_beauty": False,
        "official_domains": [
            {"host": "biba.in", "path_prefix": "/"}
        ]
    },
    "fabindia": {
        "display_name": "Fabindia",
        "aliases": ["fabindia", "fab india"],
        "categories": ["fashion", "ethnic", "lifestyle"],
        "is_clean_beauty": False, # Often sustainable but check specific clean criteria
        "official_domains": [
            {"host": "fabindia.com", "path_prefix": "/"}
        ]
    },
    "manyavar": {
        "display_name": "Manyavar",
        "aliases": ["manyavar"],
        "categories": ["fashion", "ethnic", "wedding"],
        "is_clean_beauty": False,
        "official_domains": [
            {"host": "manyavar.com", "path_prefix": "/"}
        ]
    },
    "shoppers_stop": {
        "display_name": "Shoppers Stop",
        "aliases": ["shoppers stop"],
        "categories": ["fashion", "beauty"],
        "is_clean_beauty": False,
        "official_domains": [
            {"host": "shoppersstop.com", "path_prefix": "/"}
        ]
    },
    # --- BEAUTY BRANDS ---
    "mac": {
        "display_name": "M.A.C",
        "aliases": ["m.a.c", "mac", "mac cosmetics"],
        "categories": ["beauty", "makeup"],
        "is_clean_beauty": False,
        "official_domains": [
            {"host": "maccosmetics.in", "path_prefix": "/"}, # India site often redirects to locators
            {"host": "maccosmetics.com", "path_prefix": "/"},
            # Note: MAC often sells via Nykaa/Sephora officially
        ]
    },
    "mamaearth": {
        "display_name": "Mamaearth",
        "aliases": ["mamaearth"],
        "categories": ["beauty", "wellness"],
        "is_clean_beauty": True, # User curated
        "image": "https://ui-avatars.com/api/?name=Mamaearth&background=a0d468&color=fff&size=512&font-size=0.33",
        "banner_image": "https://images.unsplash.com/photo-1521334884684-d80222895322?q=80&w=2000&auto=format&fit=crop",
        "popular_searches": ["Mamaearth Face Wash", "Mamaearth Onion Hair Oil", "Mamaearth Vitamin C"],
        "official_domains": [
            {"host": "mamaearth.in", "path_prefix": "/"}
        ]
    },
    "old_school_rituals": {
        "display_name": "Old School Rituals",
        "aliases": ["old school rituals"],
        "categories": ["beauty", "wellness"],
        "is_clean_beauty": True, 
        "image": "https://ui-avatars.com/api/?name=Old+School&background=cba135&color=fff&size=512&font-size=0.33",
        "banner_image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2000&auto=format&fit=crop",
        "popular_searches": [
            "Old School Rituals", 
            "Old School Rituals Skincare", 
            "Old School Rituals Hair", 
            "Old School Rituals Body", 
            "Old School Rituals Face Wash",
            "Old School Rituals Oil",
            "Old School Rituals Shampoo"
        ],
        "official_domains": [
            {"host": "oldschoolrituals.in", "path_prefix": "/"}
        ]
    },
    "faces_canada": {
        "display_name": "Faces Canada",
        "aliases": ["faces canada", "facescanada"],
        "categories": ["beauty", "makeup"],
        "is_clean_beauty": False,
        "official_domains": [
            {"host": "facescanada.com", "path_prefix": "/"}
        ]
    },
    "forest_essentials": {
        "display_name": "Forest Essentials",
        "aliases": ["forest essentials"],
        "categories": ["beauty", "ayurveda"],
        "is_clean_beauty": True,
        "image": "https://ui-avatars.com/api/?name=Forest+E&background=0f4d19&color=ffd700&size=512&font-size=0.33",
        "banner_image": "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=2000&auto=format&fit=crop",
        "popular_searches": ["Forest Essentials Soundarya", "Forest Essentials Hair Cleanser"],
        "official_domains": [
            {"host": "forestessentialsindia.com", "path_prefix": "/"}
        ]
    },
    "plum": {
        "display_name": "Plum Goodness",
        "aliases": ["plum goodness", "plum"],
        "categories": ["beauty", "skincare"],
        "is_clean_beauty": True,
        "image": "https://ui-avatars.com/api/?name=Plum&background=5d3a9b&color=fff&size=512&font-size=0.33",
        "banner_image": "https://images.unsplash.com/photo-1596462502278-27bfdd403cc2?q=80&w=2000&auto=format&fit=crop",
        "popular_searches": ["Plum Green Tea", "Plum Vitamin C Serum", "Plum Body Lovin"],
        "official_domains": [
            {"host": "plumgoodness.com", "path_prefix": "/"}
        ]
    },
    "kama_ayurveda": {
        "display_name": "Kama Ayurveda",
        "aliases": ["kama ayurveda"],
        "categories": ["beauty", "ayurveda"],
        "is_clean_beauty": True,
        "image": "https://ui-avatars.com/api/?name=Kama&background=3e2723&color=d4af37&size=512&font-size=0.33",
        "banner_image": "https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?q=80&w=2000&auto=format&fit=crop",
        "popular_searches": ["Kumkumadi Thailam", "Kama Ayurveda Rose Water"],
        "official_domains": [
            {"host": "kamaayurveda.in", "path_prefix": "/"}
        ]
    },
    "sugar_cosmetics": {
        "display_name": "Sugar Cosmetics",
        "aliases": ["sugar cosmetics", "sugar"],
        "categories": ["beauty", "makeup"],
        "is_clean_beauty": True,
        "image": "https://ui-avatars.com/api/?name=Sugar&background=000&color=fff&size=512&font-size=0.33",
        "banner_image": "https://images.unsplash.com/photo-1596462502278-27bfdd403cc2?q=80&w=2000&auto=format&fit=crop", 
        "popular_searches": ["Sugar Cosmetics Lipstick", "Sugar Foundation", "Sugar Kajal"],
        "official_domains": [
            {"host": "sugarcosmetics.com", "path_prefix": "/"}
        ]
    },
    "the_tribe_concepts": {
        "display_name": "The Tribe Concepts",
        "aliases": ["the tribe concepts", "tribe concepts"],
        "categories": ["beauty", "ayurveda"],
        "is_clean_beauty": True,
        "image": "https://ui-avatars.com/api/?name=Tribe&background=8d6e63&color=fff&size=512&font-size=0.33",
        "banner_image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2000&auto=format&fit=crop",
        "popular_searches": ["Tribe Concepts Face Brightening", "Tribe Concepts Hair Oil"],
        "official_domains": [
            {"host": "thetribeconcepts.com", "path_prefix": "/"}
        ]
    }
}

# --- STORE REGISTRY ---
# Structure:
# {
#   id: str,
#   display_name: str,
#   domains: list[str], # Hostnames
#   tier: "popular_marketplace" | "specialist" | "pharmacy"
#   categories: list[str] # Primary categories
# }

STORES = [
    # Fashion & General Marketplaces
    {
        "id": "myntra",
        "display_name": "Myntra",
        "domains": ["myntra.com"],
        "tier": "popular_marketplace",
        "categories": ["fashion", "beauty", "lifestyle"]
    },
    {
        "id": "ajio",
        "display_name": "Ajio",
        "domains": ["ajio.com"],
        "tier": "popular_marketplace",
        "categories": ["fashion", "lifestyle"]
    },
    {
        "id": "tatacliq",
        "display_name": "Tata CLiQ",
        "domains": ["tatacliq.com", "luxury.tatacliq.com"],
        "tier": "popular_marketplace",
        "categories": ["fashion", "electronics", "luxury"]
    },
    {
        "id": "nykaafashion",
        "display_name": "Nykaa Fashion",
        "domains": ["nykaafashion.com"],
        "tier": "popular_marketplace",
        "categories": ["fashion"]
    },
    {
        "id": "amazon",
        "display_name": "Amazon",
        "domains": ["amazon.in"],
        "tier": "popular_marketplace", # Or general
        "categories": ["all"]
    },
    {
        "id": "flipkart",
        "display_name": "Flipkart",
        "domains": ["flipkart.com"],
        "tier": "popular_marketplace",
        "categories": ["all"]
    },

    # Beauty Specialists
    {
        "id": "nykaa",
        "display_name": "Nykaa",
        "domains": ["nykaa.com"],
        "tier": "specialist",
        "categories": ["beauty"]
    },
    {
        "id": "tira",
        "display_name": "Tira",
        "domains": ["tirabeauty.com"],
        "tier": "specialist",
        "categories": ["beauty"]
    },
    {
        "id": "purplle",
        "display_name": "Purplle",
        "domains": ["purplle.com"],
        "tier": "specialist",
        "categories": ["beauty"]
    },
    {
        "id": "sephora_india",
        "display_name": "Sephora",
        "domains": ["sephora.in"],
        "tier": "specialist",
        "categories": ["beauty", "luxury"]
    },

    # Wellness / Pharmacy
    {
        "id": "1mg",
        "display_name": "Tata 1mg",
        "domains": ["1mg.com"],
        "tier": "pharmacy",
        "categories": ["wellness", "medicine"]
    },
    {
        "id": "pharmeasy",
        "display_name": "PharmEasy",
        "domains": ["pharmeasy.in"],
        "tier": "pharmacy",
        "categories": ["wellness", "medicine"]
    },
    {
        "id": "netmeds",
        "display_name": "Netmeds",
        "domains": ["netmeds.com"],
        "tier": "pharmacy",
        "categories": ["wellness", "medicine"]
    },
    {
        "id": "apollo247",
        "display_name": "Apollo 24|7",
        "domains": ["apollo247.com"],
        "tier": "pharmacy",
        "categories": ["wellness", "medicine"]
    },
    {
        "id": "healthkart",
        "display_name": "HealthKart",
        "domains": ["healthkart.com"],
        "tier": "specialist",
        "categories": ["wellness", "supplements"]
    }
]

# Helper Sets for Fast Lookup
POPULAR_STORE_DOMAINS = {d for s in STORES if s["tier"] in ("popular_marketplace", "specialist", "pharmacy") for d in s["domains"]}
CLEAN_BEAUTY_BRANDS = {b_id for b_id, data in BRANDS.items() if data["is_clean_beauty"]}

