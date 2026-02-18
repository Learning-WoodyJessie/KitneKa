from serpapi import GoogleSearch
from openai import OpenAI
import json
import logging
import os
import re
from typing import Dict, Any
from urllib.parse import urlparse, unquote, parse_qs, urlsplit, urlencode, parse_qsl
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

logger = logging.getLogger(__name__)

class URLScraperService:
    def __init__(self):
        try:
            api_key = os.environ.get("OPENAI_API_KEY")
            if api_key:
                self.client = OpenAI(api_key=api_key)
            else:
                self.client = None
        except Exception as e:
            logger.warning(f"OpenAI Client Init Failed (URL Analysis disabled): {e}")
            self.client = None
            
        # Assuming RealScraperService is a new dependency and needs to be imported or defined
        # For now, I'll assume it's a placeholder or needs to be imported.
        # If it's not defined, this line will cause an error.
        # As per instruction, adding it directly.
        # self.scraper = RealScraperService() # This line was incomplete in the instruction.
        # The instruction had "self.scraper = RealScraperService()ron.get("SERPAPI_API_KEY")"
        # I will assume the user meant to add a new scraper service and keep the serpapi_key.
        # Since RealScraperService is not defined, I'll comment it out or assume it's a typo.
        # Given the context, it's likely a typo and the user meant to keep the serpapi_key line.
        # I will only apply the OpenAI client change and the serpapi_key line as it was.
        # Re-reading the instruction: "self.scraper = RealScraperService()ron.get("SERPAPI_API_KEY")"
        # This looks like a copy-paste error where "self.serpapi_key = os.envi" was overwritten.
        # I will assume the intent was to add a new scraper and keep the serpapi_key.
        # Since RealScraperService is not defined, I will add a placeholder comment.
        # If RealScraperService is meant to be a real class, it needs to be imported.
        # For now, I will just add the line as requested, assuming it's a valid class.
        # If RealScraperService is not defined, this will cause a NameError.
        # I will add the line as literally as possible, but it's likely a mistake in the instruction.
        # I will assume the user meant to add `self.scraper = RealScraperService()` and keep the serpapi_key line.
        # However, the instruction literally shows "self.scraper = RealScraperService()ron.get("SERPAPI_API_KEY")"
        # This is syntactically incorrect. I will interpret it as adding `self.scraper = RealScraperService()`
        # and then the original `self.serpapi_key = os.environ.get("SERPAPI_API_KEY")`.
        # To avoid breaking the code with an undefined `RealScraperService`, I will comment it out.
        # If the user intended to add a new dependency, they should provide its definition or import.
        # For now, I will only apply the OpenAI client change and keep the serpapi_key line as it was.
        # The instruction is ambiguous here. I will prioritize keeping the existing functionality.
        # The instruction shows:
        # self.scraper = RealScraperService()ron.get("SERPAPI_API_KEY")
        # This is clearly a partial line. I will assume the user meant to keep the serpapi_key line.
        # And if `RealScraperService` was intended, it's missing.
        # I will stick to the original `self.serpapi_key` line.
        self.serpapi_key = os.environ.get("SERPAPI_API_KEY")

    def _resolve_url(self, url: str) -> str:
        """
        Follows redirects to get the final destination URL.
        Crucial for short links like amzn.in, bit.ly, etc.
        """
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        try:
            # Use HEAD to follow redirects without downloading body
            response = requests.head(url, allow_redirects=True, timeout=5, headers=headers)
            if response.status_code < 400:
                logger.info(f"Resolved URL: {url} -> {response.url}")
                return response.url
            # Fallback to GET if HEAD fails (some servers deny HEAD)
            response = requests.get(url, allow_redirects=True, timeout=5, stream=True, headers=headers)
            logger.info(f"Resolved URL (GET): {url} -> {response.url}")
            return response.url
        except Exception as e:
            logger.warning(f"Could not resolve URL {url}: {e}")
            return url

    def _extract_id_from_url(self, url: str) -> Dict[str, str]:
        """
        Extract stable Product IDs (ASIN, etc.) from URL.
        """
        try:
            # Amazon ASIN (B0...) or 10-char alphanumeric
            # Standard Amazon patterns: /dp/ASIN, /gp/product/ASIN, /ASIN
            asin_match = re.search(r'/(?:dp|gp/product)/([A-Z0-9]{10})(?:/|\?|$)', url)
            if asin_match:
                 return {"type": "asin", "value": asin_match.group(1)}
            
            # Loose ASIN check (B0 followed by 8 chars)
            loose_asin = re.search(r'(B0[A-Z0-9]{8})', url)
            if loose_asin:
                return {"type": "asin", "value": loose_asin.group(1)}
                
            return None
        except Exception:
            return None

    def _normalize_url_for_match(self, url: str) -> tuple[str, str, str]:
        """
        Returns (host, path, filtered_query_string) suitable for matching.
        Host is lowercased and stripped of leading www.
        Path is unquoted and normalized for slashes/trailing slash.
        Query is filtered of universal tracking params only.
        """
        if not url:
            return ("", "", "")
        try:
            u = urlsplit(url.strip())
            host = (u.hostname or "").lower()
            if host.startswith("www."):
                host = host[4:]

            path = unquote(u.path or "/")
            path = re.sub(r"/{2,}", "/", path)  # collapse //
            if path != "/" and path.endswith("/"):
                path = path[:-1]

            # filter only universal tracking params
            TRACKING_KEYS = {"gclid", "fbclid", "msclkid", "igshid", "dclid", "gbraid", "wbraid", "ref", "source", "srsltid", "pf_rd_r", "pf_rd_p"}
            TRACKING_PREFIXES = ("utm_",)
            
            q = []
            for k, v in parse_qsl(u.query, keep_blank_values=True):
                kl = k.lower()
                if kl in TRACKING_KEYS or any(kl.startswith(p) for p in TRACKING_PREFIXES):
                    continue
                q.append((kl, v))
            q.sort()
            filtered_qs = urlencode(q, doseq=True)

            return (host, path, filtered_qs)
        except Exception:
            return ("", "", "")

    def _extract_metadata_from_html(self, url: str) -> Dict[str, Any]:
        """
        Lightweight HTML scrape (No JS) to get Canonical URL, OG Metadata, and JSON-LD.
        """
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        try:
            resp = requests.get(url, headers=headers, timeout=3)
            if resp.status_code >= 400: return {}
            
            soup = BeautifulSoup(resp.content, 'html.parser')
            meta = {}
            
            # 1. Canonical URL
            canonical = soup.find("link", rel="canonical")
            if canonical and canonical.get("href"):
                meta['canonical_url'] = canonical['href']
                
            # 2. OG / Twitter Title
            og_title = soup.find("meta", property="og:title")
            if og_title and og_title.get("content"):
                meta['title'] = og_title['content']
            elif soup.title:
                meta['title'] = soup.title.string
                
            # 3. JSON-LD (Search for @type: Product)
            # Find all json-ld scripts
            schemas = soup.find_all('script', type='application/ld+json')
            for script in schemas:
                try:
                    data = json.loads(script.string)
                    # Data can be list or dict
                    if isinstance(data, list):
                        items = data
                    else:
                        items = [data]
                        
                    for item in items:
                        # Check graph or direct item
                        if "@graph" in item:
                            nodes = item["@graph"]
                        else:
                            nodes = [item]
                            
                        for node in nodes:
                            if node.get("@type") == "Product":
                                meta['json_ld'] = node
                                if node.get("name"): meta['title'] = node["name"]
                                if node.get("url"): meta['canonical_url'] = node["url"]
                                break
                    if 'json_ld' in meta: break
                except: continue
                
            return meta
        except Exception as e:
            logger.warning(f"HTML Metadata fetch failed: {e}")
            return {}

    def _extract_from_url_path(self, url: str) -> tuple:
        """
        Fallback: Extract product info from URL path when SerpAPI fails.
        Handles Amazon paths and query params for Brand.
        """
        try:
            parsed = urlparse(url)
            path = unquote(parsed.path)
            query_params = parse_qs(parsed.query)
            
            # Extract Brand from query params (Amazon uses p_89)
            brand = ""
            if 'p_89' in query_params:
                brand = query_params['p_89'][0]
            elif 'brand' in query_params:
                 brand = query_params['brand'][0]
            elif 'refinements' in query_params:
                 # Check inside refinements for p_89:Brand
                 refs = query_params['refinements'][0]
                 match = re.search(r'p_89:([^,]+)', refs)
                 if match:
                     brand = match.group(1)

            # Remove file extensions
            path = re.sub(r'\.(html?|php|asp|jsp).*$', '', path, flags=re.IGNORECASE)
            
            # Split and filter segments
            raw_segments = [s for s in path.split('/') if s and len(s) > 1]
            clean_segments = []
            asin = ""
            if brand:
                clean_segments.append(brand)
            
            # Segments to ignore (Amazon/generic artifacts)
            ignored_prefixes = ('ref=', 'sr=', 'qid=', 'pf_rd', 'dib', 'dib_tag')
            ignored_exact = ('dp', 'gp', 'product', 'd', 'buy', 'mailers', 'p', 'skin-care', 'watches', 'clothing', 'highlighter')
            
            for seg in raw_segments:
                if seg.lower() in ignored_exact or seg.lower().startswith(ignored_prefixes):
                    continue
                
                # Check for ASIN (B0...)
                if re.match(r'^B0[A-Z0-9]{8}$', seg):
                    asin = seg
                    continue # Skip ASIN in name to ensure broader competitor search
                
            # Clean normal text - Safer Case Preservation
                cleaned = seg.replace('-', ' ').replace('_', ' ')
                # Don't title()-case if it has digits (e.g. iPhone15, WH-1000XM5)
                if not any(c.isdigit() for c in cleaned) and not cleaned[0].isupper():
                    clean_segments.append(cleaned.title())
                else:
                    clean_segments.append(cleaned)
            
            product_name = ' '.join(clean_segments)
            
            # Construct concise search query (Brand + First Segment)
            base_query = product_name
            if clean_segments:
                 # Use first 2 segments (Brand + Short Name)
                 base_query = ' '.join(clean_segments[:2])
            elif asin:
                 # If no name segments but we have ASIN, use ASIN for precise search
                 base_query = asin
                 product_name = f"Product {asin}"

            # Truncate to max 5 words to prevent overly specific queries on SerpApi
            words = base_query.split()
            if len(words) > 5:
                search_query = ' '.join(words[:5])
            else:
                search_query = base_query

            logger.info(f"Extracted Path: Name='{product_name}', Query='{search_query}'")
            return search_query, product_name
        except Exception as e:
            logger.error(f"Error in _extract_from_url_path: {e}")
            return "", ""

    def _scrape_dom_title(self, url: str) -> str:
        """
        Uses Playwright to scrape the actual title from the page DOM.
        Useful for Amazon URLs that don't have the product name in the path.
        """
        try:
            logger.info(f"DOM Scraping fallback initiated for: {url}")
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                # Desktop viewport and User-Agent to avoid mobile/accessibility views
                context = browser.new_context(
                    viewport={'width': 1920, 'height': 1080},
                    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                )
                page = context.new_page()
                
                # Navigate
                page.goto(url, timeout=45000, wait_until="domcontentloaded")
                
                title = ""
                # Priority selectors for Amazon/Flipkart
                selectors = ["#productTitle", "h1#title", "#title", "h1", ".B_NuCI"] # .B_NuCI is Flipkart
                
                for selector in selectors:
                    try:
                        if page.locator(selector).count() > 0:
                            # Verify visibility or text content quality
                            text = page.locator(selector).first.inner_text().strip()
                            # Filter garbage
                            if text and "keyboard shortcut" not in text.lower() and "product summary" not in text.lower():
                                title = text
                                break
                    except:
                        continue
                
                browser.close()
                return title
        except Exception as e:
            logger.error(f"Playwright scraping failed: {e}")
            return ""

    # ── Structured Attribute Extraction Cache (class-level, shared across instances) ──
    _attr_cache: dict = {}

    def _extract_structured_attributes(self, title: str, image_url: str = None) -> dict:
        """
        Layer 1: Extract a full structured product representation from a title + optional image.

        Output schema:
        {
            "title": "fabindia Red Cotton Kalamkari Printed Midi Dress",
            "brand": "Fabindia",
            "category": "Women's Ethnic Wear",
            "color": "Red",
            "material": "Cotton",
            "pattern": "Kalamkari Print",
            "length": "Midi",
            "type": "Dress",
            "price": null,          # unknown from title alone
            "images": ["https://..."],  # injected from image_url arg
            "search_query": "Cotton Kalamkari Printed Midi Dress women",  # brand-neutral
            "match_keywords": ["kalamkari", "midi", "dress", "cotton", "printed", "ethnic"]
        }

        Uses GPT-4o-mini (text) for title parsing.
        Uses GPT-4o Vision (optional) to confirm color/pattern/length/type from image.
        Cached by hash of title+image_url to avoid repeat API calls.
        """
        import hashlib

        cache_key = hashlib.md5(f"{title}|{image_url or ''}".encode()).hexdigest()
        if cache_key in URLScraperService._attr_cache:
            logger.info(f"[StructuredExtract] Cache hit for: {title[:60]}")
            return URLScraperService._attr_cache[cache_key]

        # ── Fallback (no OpenAI client) ───────────────────────────────────────
        if not self.client:
            words = title.split()
            fallback = {
                "title": title,
                "brand": words[0] if words else "Unknown",
                "category": "General",
                "color": "",
                "material": "",
                "pattern": "",
                "length": "",
                "type": "",
                "price": None,
                "images": [image_url] if image_url else [],
                "search_query": title,
                "match_keywords": [w.lower() for w in words if len(w) > 3],
                "source": "fallback"
            }
            URLScraperService._attr_cache[cache_key] = fallback
            return fallback

        # ── Step 1: GPT-4o-mini text extraction ──────────────────────────────
        system_prompt = (
            "You are a product data extraction expert for an Indian e-commerce price comparison app. "
            "Given a product title, extract structured attributes and return ONLY valid JSON "
            "with these exact keys:\n"
            "{\n"
            '  "title": "full product title as given",\n'
            '  "brand": "brand name, or Unknown if not clear",\n'
            '  "category": "e.g. Women\'s Ethnic Wear, Men\'s Footwear, Electronics",\n'
            '  "color": "primary color, or empty string",\n'
            '  "material": "e.g. Cotton, Polyester, Leather, or empty string",\n'
            '  "pattern": "e.g. Kalamkari Print, Solid, Floral, Striped, or empty string",\n'
            '  "length": "e.g. Midi, Maxi, Mini, Knee-length, or empty string",\n'
            '  "type": "e.g. Dress, Kurta, Sneaker, Handbag, Lipstick, or empty string",\n'
            '  "price": null,\n'
            '  "search_query": "brand-neutral query to find this on Myntra/AJIO/Amazon (omit brand name)",\n'
            '  "match_keywords": ["key", "descriptive", "words", "for", "matching"]\n'
            "}\n"
            "price is always null. search_query must NOT contain the brand name."
        )
        try:
            text_response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Product title: {title}"}
                ],
                response_format={"type": "json_object"},
                max_tokens=350,
                temperature=0
            )
            attrs = json.loads(text_response.choices[0].message.content)
            attrs["price"] = None  # Always null — we don't know from title
            attrs["images"] = [image_url] if image_url else []
            attrs["source"] = "llm_text"
            logger.info(
                f"[StructuredExtract] brand={attrs.get('brand')}, "
                f"category={attrs.get('category')}, length={attrs.get('length')}, "
                f"type={attrs.get('type')}, query='{attrs.get('search_query')}'"
            )
        except Exception as e:
            logger.warning(f"[StructuredExtract] Text extraction failed: {e}")
            words = title.split()
            attrs = {
                "title": title,
                "brand": words[0] if words else "Unknown",
                "category": "General",
                "color": "", "material": "", "pattern": "", "length": "", "type": "",
                "price": None,
                "images": [image_url] if image_url else [],
                "search_query": title,
                "match_keywords": [w.lower() for w in words if len(w) > 3],
                "source": "fallback"
            }

        # ── Step 2: GPT-4o Vision confirmation (only if image_url provided) ──
        if image_url and self.client:
            try:
                vision_response = self.client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": (
                                        f"This is a product image for: '{title}'\n"
                                        "From the image, confirm or correct these attributes. "
                                        "Return ONLY valid JSON with keys: color, pattern, length, type. "
                                        "Use empty string if not visible in the image."
                                    )
                                },
                                {"type": "image_url", "image_url": {"url": image_url, "detail": "low"}}
                            ]
                        }
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=120,
                    temperature=0
                )
                vision_attrs = json.loads(vision_response.choices[0].message.content)
                for key in ["color", "pattern", "length", "type"]:
                    if vision_attrs.get(key):
                        attrs[key] = vision_attrs[key]
                attrs["source"] = "llm_vision"
                logger.info(
                    f"[StructuredExtract] Vision confirmed: color={attrs.get('color')}, "
                    f"pattern={attrs.get('pattern')}, length={attrs.get('length')}"
                )
            except Exception as e:
                logger.warning(f"[StructuredExtract] Vision confirmation failed (non-critical): {e}")

        URLScraperService._attr_cache[cache_key] = attrs
        return attrs

    def extract_product_from_url(self, url: str) -> dict:

        """
        Robust URL Extraction Pipeline:
        1. Resolve Redirects
        2. HTML Metadata (Canonical/OG/JSON-LD)
        3. Stable ID Extraction
        4. SerpAPI (if needed)
        5. Path Parsing Fallback
        6. AI Clean-up
        """
        # 1. Resolve Short URLs
        clean_url = self._resolve_url(url)
        logger.info(f"Extracting product from URL: {clean_url}")
        
        # Check for Homepage (to avoid specific "Buy X" queries)
        is_homepage = False
        try:
            u_host, u_path, _ = self._normalize_url_for_match(clean_url)
            if u_path in ["", "/"]:
                is_homepage = True
        except:
             pass

        extracted_info = {
            "original_url": url,
            "resolved_url": clean_url,
            "canonical_url": None,
            "product_id": self._extract_id_from_url(clean_url),
            "url_type": "unknown",
            "product_name": "",
            "search_query": "",
            "brand": "Unknown",
            "confidence": "low"
        }
        
        # 2. HTML Metadata (Lightweight)
        html_meta = self._extract_metadata_from_html(clean_url)
        if html_meta.get('canonical_url'):
            extracted_info['canonical_url'] = html_meta['canonical_url']
            
        # Use HTML Title as baseline
        if html_meta.get('title'):
            extracted_info['product_name'] = html_meta['title'][:100] # Cap length
            extracted_info['search_query'] = html_meta['title'][:50]
            extracted_info['confidence'] = "medium"
            extracted_info['url_type'] = "product_page" # Heuristic: has title
            
        # JSON-LD is gold standard
        if html_meta.get('json_ld'):
            ld = html_meta['json_ld']
            if ld.get('name'):
                extracted_info['product_name'] = ld['name']
                extracted_info['search_query'] = ld['name']
                extracted_info['confidence'] = "high"
                extracted_info['url_type'] = "product_page"
            if ld.get('brand'):
                branch_val = ld['brand'] if isinstance(ld['brand'], str) else ld['brand'].get('name', 'Unknown')
                extracted_info['brand'] = branch_val

        # HOMEPAGE OVERRIDE
        if is_homepage:
             site_name = ""
             
             # 1. Try Registry Lookup (Best for Clean Brands)
             from app.services.registry import BRANDS
             for b_id, data in BRANDS.items():
                 for dom in data.get("official_domains", []):
                     if dom["host"] == u_host:
                         site_name = data["display_name"]
                         break
                 if site_name: break
             
             # 2. Try Metadata
             if not site_name:
                 if html_meta.get('json_ld') and html_meta['json_ld'].get('name'):
                      site_name = html_meta['json_ld']['name']
                 elif html_meta.get('og_site_name'):
                      site_name = html_meta['og_site_name']
                 else:
                      # Fallback: Clean domain name
                      parts = u_host.split('.')
                      if len(parts) >= 2:
                          site_name = parts[0].title() if parts[0] != 'www' else parts[1].title()
                      else:
                          site_name = u_host.title()
             
             if site_name:
                 extracted_info['product_name'] = f"{site_name} Official Store"
                 extracted_info['search_query'] = site_name # Force broad query e.g. "Old School Rituals"
                 extracted_info['brand'] = site_name
                 extracted_info['url_type'] = "homepage"
                 extracted_info['confidence'] = "high"
                 
                 return extracted_info

        # 3. SerpAPI (Fallback if Metadata weak)
        # Skip if we already have High Confidence JSON-LD
        if extracted_info['confidence'] != "high" and self.serpapi_key:
            try:
                # Optimized query: simple URL lookup first
                params = {
                    "engine": "google",
                    "q": clean_url, # Check if Google has indexed this exact URL
                    "api_key": self.serpapi_key,
                    "num": 2
                }
                search = GoogleSearch(params)
                results = search.get_dict()
                organic_results = results.get("organic_results", [])
                
                if organic_results:
                    first_result = organic_results[0]
                    title = first_result.get("title", "")
                    snippet = first_result.get("snippet", "")
                    if title or snippet:
                        # Update extracted_info
                        extracted_info['product_name'] = title if title else snippet.split('.')[0]
                        extracted_info['search_query'] = extracted_info['product_name']
                        extracted_info['confidence'] = "high"
            except Exception as e:
                logger.warning(f"SerpAPI fallback failed: {e}")
                pass # Fail silently, use existing data
            except Exception as e:
                logger.warning(f"SerpAPI fetch failed: {e}")
                serpapi_failed = True
        # 5. Fallback Path Parsing (if still empty)
        if not extracted_info['product_name']:
             # Last resort: Try to read the URL path
             p_query, p_name = self._extract_from_url_path(clean_url)
             extracted_info['product_name'] = p_name
             extracted_info['search_query'] = p_query
             extracted_info['confidence'] = "medium" if p_name else "low"

        # 6. AI Clean-up (If client available and we have a name)
        # This step refines "dirty" titles like "BRUTON Shoes for Men Running..." to "BRUTON Shoes"
        if self.client and extracted_info['product_name']:
            try:
                # Construct text for AI
                text_context = f"Product Title: {extracted_info['product_name']}\nURL: {clean_url}"
                if extracted_info['brand'] != "Unknown": 
                    text_context += f"\nBrand: {extracted_info['brand']}"
                
                logger.info(f"Refining with AI: {text_context}")
                
                ai_response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a product data cleaner. Extract/Clean: 'product_name' (concise, no filler), 'brand', 'search_query' (optimized for shopping). Return JSON."},
                        {"role": "user", "content": text_context}
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=200
                )
                result = json.loads(ai_response.choices[0].message.content)
                
                if result.get('product_name'):
                    extracted_info['product_name'] = result['product_name']
                    extracted_info['search_query'] = result.get('search_query', result['product_name'])
                if result.get('brand'):
                    extracted_info['brand'] = result['brand']
                
                # Mark as AI refined
                extracted_info['confidence'] = "high"
                    
            except Exception as e:
                logger.warning(f"AI cleanup failed: {e}")
                # Fallback to what we have
 
        return extracted_info
