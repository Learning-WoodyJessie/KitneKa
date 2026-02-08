"""
In-Memory Cache Service with TTL support.
Provides fast caching for search results to reduce API calls.

Environment Variables:
- CACHE_TTL_SEARCH: TTL in seconds for search results (default: 3600 = 1 hour)
- CACHE_TTL_BRAND: TTL in seconds for brand results (default: 21600 = 6 hours)
- CACHE_ENABLED: Set to 'false' to disable caching (default: true)
"""
from datetime import datetime, timedelta
from typing import Any, Optional
import logging
import hashlib
import os

logger = logging.getLogger(__name__)

# Environment variable configuration
def _get_env_int(key: str, default: int) -> int:
    """Get integer from environment variable with default."""
    try:
        return int(os.environ.get(key, default))
    except (ValueError, TypeError):
        return default

def _get_env_bool(key: str, default: bool) -> bool:
    """Get boolean from environment variable with default."""
    val = os.environ.get(key, str(default)).lower()
    return val in ('true', '1', 'yes', 'on')

# Configurable TTLs via environment
CACHE_ENABLED = _get_env_bool("CACHE_ENABLED", True)
CACHE_TTL_SEARCH = _get_env_int("CACHE_TTL_SEARCH", 3600)  # 1 hour default
CACHE_TTL_BRAND = _get_env_int("CACHE_TTL_BRAND", 21600)   # 6 hours default

logger.info(f"Cache Config: enabled={CACHE_ENABLED}, search_ttl={CACHE_TTL_SEARCH}s, brand_ttl={CACHE_TTL_BRAND}s")


class CacheService:
    """Simple in-memory cache with TTL (Time To Live) support."""
    
    def __init__(self):
        self._cache = {}  # {key: (value, expiry_time)}
        self._hits = 0
        self._misses = 0
    
    def _make_key(self, prefix: str, *args) -> str:
        """Create a cache key from prefix and arguments."""
        key_parts = [prefix] + [str(a).lower().strip() for a in args]
        key_str = ":".join(key_parts)
        # Hash long keys to keep them manageable
        if len(key_str) > 100:
            key_str = f"{prefix}:{hashlib.md5(key_str.encode()).hexdigest()}"
        return key_str
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if exists and not expired."""
        if not CACHE_ENABLED:
            return None
            
        if key in self._cache:
            value, expiry = self._cache[key]
            if datetime.now() < expiry:
                self._hits += 1
                logger.info(f"CACHE HIT: {key[:50]}... (hits={self._hits})")
                return value
            else:
                # Expired, remove it
                del self._cache[key]
                logger.info(f"CACHE EXPIRED: {key[:50]}...")
        
        self._misses += 1
        return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        """Store value in cache with TTL."""
        if not CACHE_ENABLED:
            return
            
        expiry = datetime.now() + timedelta(seconds=ttl_seconds)
        self._cache[key] = (value, expiry)
        logger.info(f"CACHE SET: {key[:50]}... (TTL={ttl_seconds}s, size={len(self._cache)})")
    
    def delete(self, key: str) -> bool:
        """Delete a key from cache."""
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    def clear(self) -> int:
        """Clear all cached items. Returns count of items cleared."""
        count = len(self._cache)
        self._cache = {}
        logger.info(f"CACHE CLEARED: {count} items removed")
        return count
    
    def cleanup_expired(self) -> int:
        """Remove all expired entries. Returns count of items removed."""
        now = datetime.now()
        expired_keys = [k for k, (v, exp) in self._cache.items() if exp < now]
        for key in expired_keys:
            del self._cache[key]
        if expired_keys:
            logger.info(f"CACHE CLEANUP: {len(expired_keys)} expired items removed")
        return len(expired_keys)
    
    def stats(self) -> dict:
        """Get cache statistics."""
        return {
            "enabled": CACHE_ENABLED,
            "size": len(self._cache),
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": self._hits / (self._hits + self._misses) if (self._hits + self._misses) > 0 else 0,
            "ttl_search": CACHE_TTL_SEARCH,
            "ttl_brand": CACHE_TTL_BRAND
        }


# Singleton instance for app-wide use
_cache_instance = None

def get_cache() -> CacheService:
    """Get the singleton cache instance."""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = CacheService()
    return _cache_instance


# Convenience functions
def cache_search(query: str, location: str, results: dict, ttl: int = None) -> None:
    """Cache search results (uses CACHE_TTL_SEARCH env var)."""
    cache = get_cache()
    key = cache._make_key("search", query, location)
    cache.set(key, results, ttl or CACHE_TTL_SEARCH)

def get_cached_search(query: str, location: str) -> Optional[dict]:
    """Get cached search results."""
    cache = get_cache()
    key = cache._make_key("search", query, location)
    return cache.get(key)

def cache_brand(brand: str, results: dict, ttl: int = None) -> None:
    """Cache brand results (uses CACHE_TTL_BRAND env var)."""
    cache = get_cache()
    key = cache._make_key("brand", brand)
    cache.set(key, results, ttl or CACHE_TTL_BRAND)

def get_cached_brand(brand: str) -> Optional[dict]:
    """Get cached brand results."""
    cache = get_cache()
    key = cache._make_key("brand", brand)
    return cache.get(key)

def clear_all_cache() -> int:
    """Clear entire cache. Call when you want to force refresh."""
    return get_cache().clear()
