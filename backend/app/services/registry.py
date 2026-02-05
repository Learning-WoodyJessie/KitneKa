
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
        "official_domains": [
            {"host": "mamaearth.in", "path_prefix": "/"}
        ]
    },
    "old_school_rituals": {
        "display_name": "Old School Rituals",
        "aliases": ["old school rituals"],
        "categories": ["beauty", "wellness"],
        "is_clean_beauty": True, # User curated
        "official_domains": [
            {"host": "oldschoolrituals.in", "path_prefix": "/"}
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

