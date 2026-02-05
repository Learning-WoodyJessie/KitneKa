
from urllib.parse import urlparse, unquote

def extract_from_path(url):
    parsed = urlparse(url)
    path_segments = parsed.path.split('/')
    clean_segments = []
    
    for seg in path_segments:
        if not seg or len(seg) < 3: continue
        if seg in ['dp', 'gp', 'product', 'd']: continue
        if seg.startswith('B0'): continue 
        
        # Clean text
        cleaned = seg.replace('-', ' ').replace('_', ' ')
        clean_segments.append(cleaned)
        
    return ' '.join(clean_segments)

url = "https://www.amazon.in/BRUTON-Sport-Shoes-Running-White/dp/B0F2THXY4T?source=..."
print(f"Path Extract: '{extract_from_path(url)}'")
