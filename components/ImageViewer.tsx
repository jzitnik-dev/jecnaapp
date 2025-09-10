import React, { useState } from 'react';
import { Pressable } from 'react-native-gesture-handler';
import { Avatar } from 'react-native-paper';
import { Galeria } from '@nandorojo/galeria';

interface ImageViewerProps {
  imageUrl?: string;
  size?: number;
  fallbackSource?: any;
  style?: any;
}

export function ImageViewer({
  imageUrl,
  size = 80,
  fallbackSource = require('../assets/images/icon.png'),
  style,
}: ImageViewerProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (!imageUrl) {
    return <Avatar.Image size={size} source={fallbackSource} style={style} />;
  }

  return (
    <Galeria urls={[imageUrl]}>
      <Galeria.Image index={0}>
        <Pressable onPress={() => setIsVisible(true)}>
          <Avatar.Image size={size} source={{ uri: imageUrl }} style={style} />
        </Pressable>
      </Galeria.Image>
    </Galeria>
  );
}
