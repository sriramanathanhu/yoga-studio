"""
Redis caching implementation for Yoga AI application
"""
import json
import pickle
from typing import Any, Optional, Union
from datetime import timedelta
import redis
from .config import settings
from .logging import app_logger

class CacheManager:
    """Redis cache manager with fallback to in-memory cache"""
    
    def __init__(self):
        self.redis_client = None
        self.in_memory_cache = {}
        self._connect_redis()
    
    def _connect_redis(self):
        """Connect to Redis with fallback to in-memory cache"""
        try:
            # Try to connect to Redis
            redis_url = getattr(settings, 'redis_url', 'redis://redis:6379/0')
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            # Test connection
            self.redis_client.ping()
            app_logger.info("Connected to Redis cache")
        except Exception as e:
            app_logger.warning(f"Redis connection failed, using in-memory cache: {e}")
            self.redis_client = None
    
    def _serialize_value(self, value: Any) -> str:
        """Serialize value for storage"""
        if isinstance(value, (str, int, float, bool)):
            return json.dumps(value)
        else:
            # Use pickle for complex objects, encode as base64
            import base64
            return base64.b64encode(pickle.dumps(value)).decode('utf-8')
    
    def _deserialize_value(self, value: str) -> Any:
        """Deserialize value from storage"""
        try:
            return json.loads(value)
        except (json.JSONDecodeError, ValueError):
            # Try pickle decode
            import base64
            return pickle.loads(base64.b64decode(value.encode('utf-8')))
    
    def set(self, key: str, value: Any, ttl: Optional[Union[int, timedelta]] = None) -> bool:
        """Set a value in cache with optional TTL"""
        try:
            serialized_value = self._serialize_value(value)
            
            if self.redis_client:
                if ttl:
                    if isinstance(ttl, timedelta):
                        ttl = int(ttl.total_seconds())
                    return self.redis_client.setex(key, ttl, serialized_value)
                else:
                    return self.redis_client.set(key, serialized_value)
            else:
                # In-memory fallback
                self.in_memory_cache[key] = {
                    'value': serialized_value,
                    'ttl': ttl
                }
                return True
        except Exception as e:
            app_logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from cache"""
        try:
            if self.redis_client:
                value = self.redis_client.get(key)
                if value is not None:
                    return self._deserialize_value(value)
            else:
                # In-memory fallback
                if key in self.in_memory_cache:
                    cached_item = self.in_memory_cache[key]
                    return self._deserialize_value(cached_item['value'])
            
            return None
        except Exception as e:
            app_logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """Delete a key from cache"""
        try:
            if self.redis_client:
                return bool(self.redis_client.delete(key))
            else:
                # In-memory fallback
                if key in self.in_memory_cache:
                    del self.in_memory_cache[key]
                    return True
                return False
        except Exception as e:
            app_logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            if self.redis_client:
                return bool(self.redis_client.exists(key))
            else:
                return key in self.in_memory_cache
        except Exception as e:
            app_logger.error(f"Cache exists error for key {key}: {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern"""
        try:
            if self.redis_client:
                keys = self.redis_client.keys(pattern)
                if keys:
                    return self.redis_client.delete(*keys)
                return 0
            else:
                # In-memory fallback
                import fnmatch
                keys_to_delete = [k for k in self.in_memory_cache.keys() 
                                if fnmatch.fnmatch(k, pattern)]
                for key in keys_to_delete:
                    del self.in_memory_cache[key]
                return len(keys_to_delete)
        except Exception as e:
            app_logger.error(f"Cache clear pattern error for pattern {pattern}: {e}")
            return 0

# Global cache instance
cache = CacheManager()

# Cache key helpers
def user_cache_key(user_id: int) -> str:
    """Generate cache key for user data"""
    return f"user:{user_id}"

def asana_cache_key(asana_id: int) -> str:
    """Generate cache key for asana data"""
    return f"asana:{asana_id}"

def asanas_list_cache_key(difficulty: str = None, skip: int = 0, limit: int = 100) -> str:
    """Generate cache key for asanas list"""
    return f"asanas:list:{difficulty or 'all'}:{skip}:{limit}"

def routine_cache_key(routine_id: int) -> str:
    """Generate cache key for routine data"""
    return f"routine:{routine_id}"

def user_routines_cache_key(user_id: int) -> str:
    """Generate cache key for user routines"""
    return f"user:{user_id}:routines"

# Cache decorators
def cache_result(key_func, ttl: int = 3600):
    """Decorator to cache function results"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = key_func(*args, **kwargs)
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                app_logger.debug(f"Cache hit for key: {cache_key}")
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            app_logger.debug(f"Cache miss, stored result for key: {cache_key}")
            
            return result
        return wrapper
    return decorator