import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { JecnaAPI } from '@jzitnik/jecnaapi-react-native';
import { router, type Href } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Text, useTheme } from 'react-native-paper';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useLayoutPaths } from '@/lib/layoutPaths';
import downloadFile from '@/utils/fileDownload';

export default function DokumentyIndex() {
  const theme = useTheme();
  const { currentTheme: appTheme } = useAppTheme();
  const paths = useLayoutPaths();

  const {
    data: documentsPage,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['documentsPage', '/dokumenty'],
    queryFn: () => JecnaAPI.getDocumentsPage('/dokumenty'),
  });

  const handleFolderPress = (folderPath: string) => {
    const relativePath = folderPath.replace('/dokumenty/', '');
    router.push(paths.dokumentyFolder(relativePath) as Href);
  };

  const handleFilePress = async (file: { path: string; label: string }) => {
    try {
      await downloadFile(file.path, file.label);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[styles.loadingText, { color: theme.colors.onBackground }]}
            >
              Načítání dokumentů...
            </Text>
          </View>
        ) : documentsPage &&
          documentsPage.documents &&
          documentsPage.documents.length > 0 ? (
          <View style={styles.listContainer}>
            {documentsPage.documents.map((doc, index) =>
              doc.type === 'DocumentFolder' ? (
                <Card
                  key={index}
                  style={[
                    styles.card,
                    { backgroundColor: appTheme.colors.surface },
                  ]}
                  onPress={() => handleFolderPress(doc.path)}
                >
                  <Card.Content style={styles.cardContent}>
                    <Ionicons
                      name="folder-outline"
                      size={24}
                      color={theme.colors.primary}
                    />
                    <Text
                      variant="bodyLarge"
                      style={[
                        styles.cardLabel,
                        { color: appTheme.colors.onSurface },
                      ]}
                      numberOfLines={1}
                    >
                      {doc.label}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </Card.Content>
                </Card>
              ) : (
                <Card
                  key={index}
                  style={[
                    styles.card,
                    { backgroundColor: appTheme.colors.surface },
                  ]}
                  onPress={() => handleFilePress(doc)}
                >
                  <Card.Content style={styles.cardContent}>
                    <Ionicons
                      name="document-text-outline"
                      size={24}
                      color={theme.colors.tertiary}
                    />
                    <Text
                      variant="bodyLarge"
                      style={[
                        styles.cardLabel,
                        { color: appTheme.colors.onSurface },
                      ]}
                      numberOfLines={1}
                    >
                      {doc.label}
                    </Text>
                  </Card.Content>
                </Card>
              )
            )}
          </View>
        ) : (
          <View style={styles.centered}>
            <Ionicons
              name="folder-open-outline"
              size={64}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.emptyText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Tato složka je prázdná
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardLabel: {
    flex: 1,
  },
});
