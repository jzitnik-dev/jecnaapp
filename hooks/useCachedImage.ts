import { useEffect, useState } from 'react';
import { File, Paths } from 'expo-file-system';

export function buildHeaders(
  extraHeaders?: Record<string, string>
): Record<string, string> {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.140 Safari/537.36',
    Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    Cookie: 'WTDGUID=10',
    ...extraHeaders,
  };
}

function cacheFileNameFor(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash * 31 + url.charCodeAt(i)) | 0;
  }
  const ext = url.split('.').pop()?.split('?')[0]?.slice(0, 4) || 'jpg';
  return `img_${Math.abs(hash)}.${ext}`;
}

const inFlightDownloads = new Map<string, Promise<string | undefined>>();

async function fetchToLocalFile(url: string): Promise<string | undefined> {
  const file = new File(Paths.cache, cacheFileNameFor(url));

  if (file.exists) {
    return file.uri;
  }

  const key = file.uri;
  if (inFlightDownloads.has(key)) {
    return inFlightDownloads.get(key);
  }

  const promise = (async () => {
    try {
      const downloaded = await File.downloadFileAsync(url, file, {
        headers: buildHeaders({}),
      });
      if (!downloaded.exists) {
        console.log(
          '[useCachedImage] download failed, file missing after download'
        );
        return undefined;
      }
      return downloaded.uri;
    } catch (err) {
      console.log('[useCachedImage] download threw:', err);
      try {
        if (file.exists) file.delete();
      } catch {}
      return undefined;
    } finally {
      inFlightDownloads.delete(key);
    }
  })();

  inFlightDownloads.set(key, promise);
  return promise;
}

/**
 * Resolves a possibly-relative remote image URL against `baseUrl`,
 * downloads it to local disk (with caching + de-duped in-flight requests),
 * and returns the local file:// URI once ready.
 */
export function useCachedImage(
  imageUrl: string | undefined,
  baseUrl: string = 'https://www.spsejecna.cz'
): string | undefined {
  const [localUri, setLocalUri] = useState<string | undefined>(undefined);

  const resolvedUrl = imageUrl ? new URL(imageUrl, baseUrl).href : undefined;

  useEffect(() => {
    let cancelled = false;
    setLocalUri(undefined);
    if (resolvedUrl) {
      fetchToLocalFile(resolvedUrl).then(uri => {
        if (!cancelled) setLocalUri(uri);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [resolvedUrl]);

  return localUri;
}
