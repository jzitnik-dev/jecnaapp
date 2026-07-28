import { useState } from 'react';
import { Pressable } from 'react-native-gesture-handler';
import ImageView from 'react-native-image-viewing';
import { Avatar } from 'react-native-paper';
import { useCachedImage } from '../hooks/useCachedImage';

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
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);
  const localUri = useCachedImage(imageUrl);

  const handleImagePress = () => {
    if (localUri) setIsImageViewVisible(true);
  };

  return (
    <>
      <Pressable onPress={handleImagePress}>
        <Avatar.Image
          size={size}
          source={localUri ? { uri: localUri } : fallbackSource}
          style={style}
        />
      </Pressable>
      {localUri && (
        <ImageView
          images={[{ uri: localUri }]}
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
