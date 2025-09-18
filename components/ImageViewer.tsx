import React, { useState } from 'react';
import { Pressable } from 'react-native-gesture-handler';
import ImageView from 'react-native-image-viewing';
import { Avatar } from 'react-native-paper';

interface ImageViewerProps {
  imageUrl?: string;
  size?: number;
  fallbackSource?: any;
  style?: any;
}

export function buildHeaders(
  extraHeaders?: Record<string, string>
): HeadersInit {
  function generateUserAgent() {
    const userAgents = [
      // Chrome
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.140 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.188 Safari/537.36',
      // Firefox
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 13.5; rv:119.0) Gecko/20100101 Firefox/119.0',
      // Edge
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.188 Safari/537.36 Edg/116.0.1938.81',
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  return {
    'User-Agent': generateUserAgent(),
    Cookie: 'WTDGUID=10',
    ...extraHeaders,
  };
}

export function normalizeHeaders(
  headers: HeadersInit | undefined
): { [key: string]: string } | undefined {
  if (!headers) return undefined;
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return headers;
}

export function ImageViewer({
  imageUrl,
  size = 80,
  fallbackSource = require('../assets/images/icon.png'),
  style,
}: ImageViewerProps) {
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);

  const handleImagePress = () => {
    if (imageUrl) {
      setIsImageViewVisible(true);
    }
  };

  return (
    <>
      <Pressable onPress={handleImagePress}>
        <Avatar.Image
          size={size}
          source={
            imageUrl
              ? { uri: imageUrl, headers: buildHeaders({}) }
              : fallbackSource
          }
          style={style}
        />
      </Pressable>

      {imageUrl && (
        <ImageView
          images={[
            { uri: imageUrl, headers: normalizeHeaders(buildHeaders()) },
          ]}
          imageIndex={0}
          visible={isImageViewVisible}
          onRequestClose={() => setIsImageViewVisible(false)}
          swipeToCloseEnabled={true}
          doubleTapToZoomEnabled={true}
          backgroundColor="rgba(0, 0, 0, 0.95)"
        />
      )}
    </>
  );
}
