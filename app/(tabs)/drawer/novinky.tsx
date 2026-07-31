import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Card, Text as PaperText, useTheme } from 'react-native-paper';
import RenderHtml from 'react-native-render-html';
import ImageViewing from 'react-native-image-viewing';
import { JecnaAPI } from '@jzitnik/jecnaapi-react-native';
import { useCachedImage } from '@/hooks/useCachedImage';
import { ArticleFile, Cookies } from '@jzitnik/jecnaapi-react-native/jecnaapi';
import { Ionicons } from '@expo/vector-icons';
import downloadFile from '@/utils/fileDownload';

function GalleryThumbnail({
  url,
  index,
  onPress,
  onUriLoaded,
}: {
  url: string;
  index: number;
  onPress: (i: number) => void;
  onUriLoaded: (i: number, uri: string) => void;
}) {
  const localUri = useCachedImage(url);

  useEffect(() => {
    if (localUri) {
      onUriLoaded(index, localUri);
    }
  }, [localUri, index, onUriLoaded]);

  return (
    <TouchableOpacity onPress={() => onPress(index)}>
      <Image
        source={localUri ? { uri: localUri } : undefined}
        style={styles.thumbnail}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
}

function EventImageGallery({ images }: { images: string[] }) {
  const { colors } = useTheme();

  const [localUris, setLocalUris] = useState<string[]>([]);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleUriLoaded = useCallback((index: number, uri: string) => {
    setLocalUris(prev => {
      if (prev[index] === uri) {
        return prev;
      }

      const next = [...prev];
      next[index] = uri;
      return next;
    });
  }, []);
  const lightboxImages = images.map((url, i) => ({
    uri: localUris[i] || url,
  }));

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.imageGallery}
      >
        {images.map((url, i) => (
          <GalleryThumbnail
            key={i}
            url={url}
            index={i}
            onUriLoaded={handleUriLoaded}
            onPress={idx => {
              setCurrentIndex(idx);
              setLightboxVisible(true);
            }}
          />
        ))}
      </ScrollView>

      <ImageViewing
        images={lightboxImages}
        imageIndex={currentIndex}
        visible={lightboxVisible}
        onRequestClose={() => setLightboxVisible(false)}
        backgroundColor={colors.background}
      />
    </>
  );
}

function FilesList({ files }: { files: ArticleFile[] }) {
  const { colors } = useTheme();

  return (
    <View style={styles.filesContainer}>
      {files.map((file, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.fileItem,
            { backgroundColor: colors.elevation.level2 },
          ]}
          onPress={() => {
            downloadFile(file.downloadPath, file.label);
          }}
        >
          <Ionicons
            name="document-text-outline"
            size={22}
            color={colors.primary}
            style={styles.fileIcon}
          />
          <PaperText
            variant="bodyMedium"
            style={[styles.fileText, { color: colors.onSurface }]}
            numberOfLines={1}
          >
            {file.label}
          </PaperText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function NovinkyScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      return JecnaAPI.getNewsPage();
    },
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={refetch}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {data?.articles?.map((event, id) => (
        <Card
          style={[styles.card, { backgroundColor: colors.surface }]}
          elevation={3}
          key={id}
        >
          <Card.Content>
            <View style={styles.titleContainer}>
              <PaperText
                variant="titleLarge"
                style={[styles.title, { color: colors.onSurface }]}
              >
                {event.title}
              </PaperText>

              <PaperText style={{ color: colors.onSurfaceVariant }}>
                {event.author?.trim()} •{' '}
                {event.date.toLocaleDateString('cs-CZ')}
              </PaperText>
            </View>

            {event.images.length > 0 && (
              <EventImageGallery images={event.images!} />
            )}

            {event.files.length > 0 && <FilesList files={event.files} />}

            <RenderHtml
              contentWidth={width}
              source={{ html: event.content }}
              tagsStyles={{
                h1: {
                  fontSize: 26,
                  fontWeight: 'bold',
                  color: colors.primary,
                  marginBottom: 12,
                },
                h2: {
                  fontSize: 22,
                  fontWeight: 'bold',
                  color: colors.primary,
                  marginVertical: 8,
                },
                h3: {
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: colors.primary,
                  marginVertical: 6,
                },
                p: {
                  fontSize: 16,
                  color: colors.onBackground,
                  marginBottom: 10,
                  lineHeight: 22,
                },
                strong: { fontWeight: 'bold', color: colors.primary },
                em: { fontStyle: 'italic' },
                a: {
                  color: colors.primary,
                  textDecorationLine: 'underline',
                  fontWeight: '600',
                },
                ul: { marginVertical: 8, paddingLeft: 20 },
                ol: { marginVertical: 8, paddingLeft: 20 },
                li: {
                  marginBottom: 6,
                  color: colors.onBackground,
                  fontSize: 16,
                },
              }}
              defaultTextProps={{ style: { color: colors.onBackground } }}
              renderersProps={{
                li: {
                  markerTextStyle: {
                    color: colors.onBackground,
                    fontSize: 16,
                  },
                },
              }}
            />
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    borderRadius: 16,
  },
  titleContainer: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
  },
  imageGallery: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  thumbnail: {
    width: 100,
    height: 100,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  filesContainer: {
    marginBottom: 16,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  fileIcon: {
    marginRight: 10,
  },
  fileText: {
    flex: 1,
    fontWeight: '500',
  },
});
