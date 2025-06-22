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

export function ImageViewer({ 
  imageUrl, 
  size = 80, 
  fallbackSource = require('../assets/images/icon.png'),
  style 
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
          source={imageUrl ? { uri: imageUrl } : fallbackSource}
          style={style}
        />
      </Pressable>
      
      {imageUrl && (
        <ImageView
          images={[{ uri: imageUrl }]}
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