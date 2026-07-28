import { useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import ImageView from 'react-native-image-viewing';
import { useCachedImage } from '../hooks/useCachedImage';

interface TeacherImageViewerProps {
  imageUrl?: string;
  width?: number;
  height?: number;
  style?: any;
}

export function TeacherImageViewer({
  imageUrl,
  width = 120,
  height = 150,
  style,
}: TeacherImageViewerProps) {
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);
  const localUri = useCachedImage(imageUrl);

  const handleImagePress = () => {
    if (localUri) setIsImageViewVisible(true);
  };

  if (!imageUrl) {
    return null;
  }

  return (
    <>
      <Pressable onPress={handleImagePress}>
        <Image
          source={localUri ? { uri: localUri } : undefined}
          style={[styles.photo, { width, height }, style]}
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

const styles = StyleSheet.create({
  photo: {
    borderRadius: 20,
    backgroundColor: '#222',
  },
});
