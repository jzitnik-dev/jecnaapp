import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Divider,
  List,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';
import { useAppTheme } from '../../../hooks/useAppTheme';

export default function AppearanceScreen() {
  const theme = useTheme();
  const {
    selectedTheme,
    customColors,
    useCustomColors,
    setSelectedTheme,
    setCustomColors,
    setUseCustomColors,
    getPredefinedThemes,
  } = useAppTheme();

  const [localCustomColors, setLocalCustomColors] = useState({
    primary: '#666',
    background: '#000000',
    surface: '#121212',
    surfaceVariant: '#1c1e24',
    onSurface: '#ffffff',
    onSurfaceVariant: '#b3b3b3',
    card: '#121212',
    text: '#ffffff',
    border: '#333333',
    notification: '#666',
  });

  const predefinedThemes = getPredefinedThemes();

  useEffect(() => {
    if (customColors) {
      setLocalCustomColors(customColors);
    }
  }, [customColors]);

  const handleThemeSelect = async (themeName: string) => {
    await setSelectedTheme(themeName);
  };

  const handleCustomColorChange = async (colorKey: string, value: string) => {
    const newColors = { ...localCustomColors, [colorKey]: value };
    setLocalCustomColors(newColors);
    if (useCustomColors) {
      await setCustomColors(newColors);
    }
  };

  const handleCustomColorsToggle = async (enabled: boolean) => {
    await setUseCustomColors(enabled);
    if (enabled) {
      await setCustomColors(localCustomColors);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text
            variant="titleLarge"
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            Přednastavená témata
          </Text>
          <Text
            variant="bodyMedium"
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Vyberte si z přednastavených témat nebo vytvořte vlastní.
          </Text>
        </Card.Content>
      </Card>

      {predefinedThemes.map(themeOption => (
        <Card
          key={themeOption.name}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderWidth: selectedTheme === themeOption.name ? 2 : 0,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <Card.Content>
            <View style={styles.themeRow}>
              <View style={styles.themeInfo}>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.onSurface }}
                >
                  {themeOption.name}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {themeOption.description}
                </Text>
              </View>
              <View style={styles.colorPreview}>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: themeOption.colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: themeOption.colors.background },
                  ]}
                />
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: themeOption.colors.surface },
                  ]}
                />
              </View>
              <Button
                mode={
                  selectedTheme === themeOption.name ? 'contained' : 'outlined'
                }
                onPress={() => handleThemeSelect(themeOption.name)}
                compact
              >
                {selectedTheme === themeOption.name ? 'Vybrané' : 'Vybrat'}
              </Button>
            </View>
          </Card.Content>
        </Card>
      ))}

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurface }}
              >
                Vlastní barvy
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Zapnout/vypnout vlastní nastavení barev
              </Text>
            </View>
            <Switch
              value={useCustomColors}
              onValueChange={handleCustomColorsToggle}
            />
          </View>
        </Card.Content>
      </Card>

      {useCustomColors && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text
              variant="titleLarge"
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              Vlastní barvy
            </Text>
            <Text
              variant="bodyMedium"
              style={[
                styles.description,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Upravte jednotlivé barvy aplikace.
            </Text>

            <List.Section>
              {Object.entries(localCustomColors).map(([key, value]) => (
                <View key={key}>
                  <List.Item
                    title={key.charAt(0).toUpperCase() + key.slice(1)}
                    description={`Aktuální barva: ${value}`}
                    left={props => (
                      <View
                        style={[
                          styles.colorPreviewDot,
                          { backgroundColor: value },
                        ]}
                      />
                    )}
                    onPress={() => {
                      // Here you would open a color picker
                      console.log('Open color picker for:', key);
                    }}
                  />
                  <Divider />
                </View>
              ))}
            </List.Section>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    lineHeight: 20,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeInfo: {
    flex: 1,
    marginRight: 16,
  },
  colorPreview: {
    flexDirection: 'row',
    marginRight: 16,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  colorPreviewDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
});
