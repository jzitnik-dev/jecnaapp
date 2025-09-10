import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { Galeria } from '@nandorojo/galeria';

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
  if (!imageUrl) {
    return null;
  }

  return (
    <Galeria urls={[imageUrl]}>
      <Galeria.Image index={0}>
        <Pressable>
          <Image
            source={{ uri: imageUrl }}
            style={[styles.photo, { width, height }, style]}
          />
        </Pressable>
      </Galeria.Image>
    </Galeria>
  );
}

const styles = StyleSheet.create({
  photo: {
    borderRadius: 20,
    backgroundColor: '#222',
  },
});
