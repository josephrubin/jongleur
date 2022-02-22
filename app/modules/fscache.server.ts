/**
 * A simple filesystem cache for "pure" function outputs.
 */
import * as fs from "fs/promises";

const cacheKeysUsed: Set<string> = new Set();
const cacheDirectory = "fscache";

await fs.mkdir(cacheDirectory);

export async function cachedFunction(sourceFunction: () => Promise<object>, uniqueCacheKey: string) {
  if (cacheKeysUsed.has(uniqueCacheKey)) {
    throw "Duplicate cache key.";
  }
  cacheKeysUsed.add(uniqueCacheKey);

  return function() {
    const [cachedValue, shouldRenew] = await readFromCache(uniqueCacheKey);

    if (cachedValue) {
      if (shouldRenew) {
        writeToCache(uniqueCacheKey, sourceFunction());
      }

      return cachedValue;
    }

    const result = await sourceFunction();
    writeToCache(result, uniqueCacheKey);

    return result;
  };
}

async function readFromCache(key: string): Promise<[object, boolean]> {
  return Promise.resolve([{}, false]);
}

async function writeToCache(key: string, asyncValue: Promise<object>): Promise<void> {
  if (!cacheKeysUsed.has(key)) {
    throw "Invalid write cache key.";
  }

  const value = await asyncValue;
  fs.writeFile(`${cacheDirectory}/${key}.json`, JSON.stringify(value));
}
