import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cscm_cache_';
const CACHE_TTL_KEY = 'cscm_cache_ttl';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCached(key) {
  try {
    const cacheKey = CACHE_PREFIX + key;
    const cached = await AsyncStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const ttl = await getCacheTTL(key);

    if (Date.now() - timestamp > ttl) {
      await removeCached(key);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export async function setCached(key, data, ttlMs) {
  try {
    const cacheKey = CACHE_PREFIX + key;
    const entry = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
    if (ttlMs) {
      await setCacheTTL(key, ttlMs);
    }
  } catch {
    // Silently fail
  }
}

export async function removeCached(key) {
  try {
    const cacheKey = CACHE_PREFIX + key;
    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(cacheKey + '_ttl');
  } catch {
    // Silently fail
  }
}

export async function clearAllCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch {
    // Silently fail
  }
}

async function getCacheTTL(key) {
  try {
    const ttlStr = await AsyncStorage.getItem(CACHE_TTL_KEY);
    if (!ttlStr) return DEFAULT_TTL;
    const ttls = JSON.parse(ttlStr);
    return ttls[key] || DEFAULT_TTL;
  } catch {
    return DEFAULT_TTL;
  }
}

async function setCacheTTL(key, ttlMs) {
  try {
    const ttlStr = await AsyncStorage.getItem(CACHE_TTL_KEY);
    const ttls = ttlStr ? JSON.parse(ttlStr) : {};
    ttls[key] = ttlMs;
    await AsyncStorage.setItem(CACHE_TTL_KEY, JSON.stringify(ttls));
  } catch {
    // Silently fail
  }
}

export async function getCacheStats() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX) && !k.endsWith('_ttl'));
    let totalSize = 0;
    let validCount = 0;
    let expiredCount = 0;

    for (const key of cacheKeys) {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        totalSize += raw.length;
        const { timestamp } = JSON.parse(raw);
        const ttl = await getCacheTTL(key.replace(CACHE_PREFIX, ''));
        if (Date.now() - timestamp <= ttl) {
          validCount++;
        } else {
          expiredCount++;
        }
      }
    }

    return { totalEntries: cacheKeys.length, validEntries: validCount, expiredEntries: expiredCount, totalSize };
  } catch {
    return { totalEntries: 0, validEntries: 0, expiredEntries: 0, totalSize: 0 };
  }
}
