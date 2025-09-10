import { useSpseJecnaClient } from '@/hooks/useSpseJecnaClient';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text as PaperText,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import { Event } from '@/api/SpseJecnaClient';
import RenderHtml from 'react-native-render-html';
import { Galeria } from '@nandorojo/galeria';

export default function NovinkyScreen() {
  const { client } = useSpseJecnaClient();
  const theme = useTheme();
  const { colors } = theme;
  const { width } = useWindowDimensions();

  const { data, isLoading, refetch } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      if (!client) throw new Error('Not logged in');
      return client.getNews();
    },
    enabled: !!client,
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {data?.map((event, id) => (
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
                {event.author.trim()} • {event.date.trim()}{' '}
                {event.onlyForSchool && '• Pouze pro školu'}
              </PaperText>
            </View>

            {/* Image Gallery */}
            {(event.images?.length || 0) > 0 && (
              <Galeria urls={event.images || []}>
                {event.images?.map((url, index) => (
                  <Galeria.Image index={index} key={index}>
                    <Image
                      source={{ uri: url }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  </Galeria.Image>
                ))}
              </Galeria>
            )}

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

            {/* File Links */}
            <View style={{ flexDirection: 'column', gap: 8 }}>
              {event.files?.map((file, key) => (
                <TouchableRipple
                  key={key}
                  onPress={() => Linking.openURL(file.url)}
                  borderless={false}
                  style={{
                    backgroundColor: theme.colors.surfaceVariant,
                    borderRadius: 4,
                    paddingVertical: 15,
                    paddingHorizontal: 15,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <PaperText
                    style={{
                      color: theme.colors.onSurface,
                      fontWeight: '600',
                      fontSize: 16,
                    }}
                  >
                    {file.label}
                  </PaperText>
                </TouchableRipple>
              ))}
            </View>
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
  thumbnail: {
    width: 100,
    height: 100,
    marginRight: 8,
    borderRadius: 8,
  },
});
