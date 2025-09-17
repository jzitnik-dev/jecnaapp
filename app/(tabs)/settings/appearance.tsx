import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  Button,
  Card,
  Divider,
  List,
  Switch,
  Text,
  useTheme,
  Portal,
  Modal,
} from 'react-native-paper';
import ColorPicker, {
  Preview,
  Panel1,
  HueSlider,
  OpacitySlider,
  Swatches,
} from 'reanimated-color-picker';
import { runOnJS } from 'react-native-reanimated';
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
    primary: '#666666',
    onPrimary: '#ffffff',
    background: '#000000',
    surface: '#121212',
    surfaceVariant: '#1c1e24',
    onSurface: '#ffffff',
    onSurfaceVariant: '#b3b3b3',
    card: '#121212',
    text: '#ffffff',
    border: '#333333',
    notification: '#666666',
  });

  const predefinedThemes = getPredefinedThemes();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [pickerColor, setPickerColor] = useState<string>('#ffffff');

  useEffect(() => {
    if (customColors) {
      setLocalCustomColors(customColors);
    }
  }, [customColors]);

  const handleThemeSelect = async (themeName: string) => {
    await setSelectedTheme(themeName);
  };

  const handleCustomColorsToggle = async (enabled: boolean) => {
    await setUseCustomColors(enabled);
    if (enabled) {
      await setCustomColors(localCustomColors);
    }
  };

  // Open color picker modal for given color key
  const openColorPicker = (key: string, currentColor: string) => {
    setEditingKey(key);
    setPickerColor(currentColor);
    setModalVisible(true);
  };

  // Save selected color into local and app customColors
  const savePickedColor = () => {
    if (editingKey) {
      const updatedColors = { ...localCustomColors, [editingKey]: pickerColor };
      setLocalCustomColors(updatedColors);
      setCustomColors(updatedColors);
    }
    setModalVisible(false);
    setEditingKey(null);
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
                labelStyle={{
                  color:
                    selectedTheme === themeOption.name ? '#000000' : '#ffffff',
                }}
                style={{
                  backgroundColor:
                    selectedTheme === themeOption.name ? '#ffffff' : '#000000',
                }}
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
                    onPress={() => openColorPicker(key, value)}
                  />
                  <Divider />
                </View>
              ))}
            </List.Section>
          </Card.Content>
        </Card>
      )}

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={{ marginBottom: 10, color: theme.colors.onSurface }}>
            Vyberte barvu pro: {editingKey}
          </Text>

          <TextInput
            value={pickerColor}
            onChangeText={text => {
              const formatted = text.startsWith('#')
                ? text.slice(0, 6)
                : `#${text.slice(0, 6)}`;
              setPickerColor(formatted);
            }}
            style={{ marginTop: 16, color: theme.colors.onSurface }}
          />
          <ColorPicker
            style={{ width: '100%', height: 320 }}
            value={pickerColor}
            onComplete={color => {
              'worklet';
              runOnJS(setPickerColor)(color.hex);
            }}
          >
            <Preview />

            <Panel1 style={{ flex: 1, marginVertical: 20 }} />
            <HueSlider style={{ height: 30, marginVertical: 10 }} />
            <OpacitySlider style={{ height: 30, marginVertical: 10 }} />
            <Swatches />
          </ColorPicker>

          {/* Manual HEX Input */}

          <Button
            mode="contained"
            onPress={savePickedColor}
            style={{ marginTop: 16 }}
          >
            Uložit
          </Button>
        </Modal>
      </Portal>
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
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },
});
