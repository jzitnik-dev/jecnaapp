import { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Card, Switch, Text, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, {
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';

interface DashboardCard {
  id: string;
  component: string;
  name: string;
  icon: string;
  enabled: boolean;
}

const ALL_AVAILABLE_WIDGETS: DashboardCard[] = [
  {
    id: 'welcome',
    component: 'WelcomeCard',
    name: 'Vítej zpět',
    icon: 'home',
    enabled: true,
  },
  {
    id: 'nextLesson',
    component: 'NextLessonCard',
    name: 'Další hodina',
    icon: 'clock',
    enabled: true,
  },
  {
    id: 'canteen',
    component: 'CanteenCard',
    name: 'Dnešní jídlo',
    icon: 'food',
    enabled: true,
  },
  {
    id: 'grades',
    component: 'GradeCard',
    name: 'Známky',
    icon: 'school',
    enabled: true,
  },
  {
    id: 'absence',
    component: 'AbsenceCard',
    name: 'Absence',
    icon: 'calendar-remove',
    enabled: true,
  },
  {
    id: 'locker',
    component: 'LockerCard',
    name: 'Skříňka',
    icon: 'locker',
    enabled: true,
  },
];

interface WidgetLogic {
  function: () => boolean;
  setValue: boolean;
  customText: string;
}

const CUSTOM_LOGIC: Record<string, WidgetLogic> = {
  canteen: {
    function: () => SecureStore.getItem('show-jidelna-no-login') === 'true',
    setValue: false,
    customText: 'Nelze zobrazit při jídelně v anonymním módu',
  },
};

export default function WidgetSettingsScreen() {
  const theme = useTheme();
  const [widgets, setWidgets] = useState<DashboardCard[]>(
    ALL_AVAILABLE_WIDGETS
  );

  // Load saved widgets
  useEffect(() => {
    const loadWidgets = async () => {
      try {
        const saved = await SecureStore.getItemAsync('widgetSettings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setWidgets(parsed);
        }
      } catch (e) {
        console.error('Error loading widgets', e);
      }
    };
    loadWidgets();
  }, []);

  const saveWidgets = async (updatedWidgets: DashboardCard[]) => {
    try {
      setWidgets(updatedWidgets);
      await SecureStore.setItemAsync(
        'widgetSettings',
        JSON.stringify(updatedWidgets)
      );
    } catch (e) {
      console.error('Error saving widgets', e);
    }
  };

  const handleToggleWidget = (id: string) => {
    const updated = widgets.map(w =>
      w.id === id ? { ...w, enabled: !w.enabled } : w
    );
    saveWidgets(updated);
  };

  const handleReorderWidgets = ({ data }: { data: DashboardCard[] }) => {
    saveWidgets(data);
  };

  const renderItem = ({ item, drag }: RenderItemParams<DashboardCard>) => {
    const editing =
      item.id in CUSTOM_LOGIC ? !CUSTOM_LOGIC[item.id].function() : true;

    const enabled = editing ? item.enabled : CUSTOM_LOGIC[item.id].setValue;
    const text = editing
      ? item.enabled
        ? 'Zobrazeno na hlavní stránce'
        : 'Skryto'
      : CUSTOM_LOGIC[item.id].customText;

    return (
      <Card
        style={[styles.widgetCard, { backgroundColor: theme.colors.surface }]}
      >
        <Card.Content>
          <View style={styles.widgetRow}>
            <View style={styles.widgetInfo}>
              <MaterialCommunityIcons
                name={item.icon as any}
                size={24}
                color={
                  enabled ? theme.colors.primary : theme.colors.onSurfaceVariant
                }
              />
              <View style={styles.widgetText}>
                <Text
                  variant="titleMedium"
                  style={{
                    color: enabled
                      ? theme.colors.onSurface
                      : theme.colors.onSurfaceVariant,
                  }}
                >
                  {item.name}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {text}
                </Text>
              </View>
            </View>

            <View style={styles.widgetControls}>
              <Switch
                value={enabled}
                disabled={!editing}
                onValueChange={() => handleToggleWidget(item.id)}
              />
              <Pressable
                onPressIn={drag}
                style={styles.dragHandle}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="drag-horizontal"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              </Pressable>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderHeader = () => (
    <Card
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, marginBottom: 16 },
      ]}
    >
      <Card.Content>
        <Text
          variant="titleLarge"
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          Nastavení widgetů
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
        >
          Přetáhněte widgety pro změnu pořadí a použijte přepínače pro
          zobrazení/skrytí.
        </Text>
        <Button
          mode="contained"
          onPress={() => Updates.reloadAsync()}
          style={{ marginTop: 12 }}
        >
          Restartovat aplikaci
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={widgets}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        onDragEnd={handleReorderWidgets}
        scrollEnabled
        activationDistance={20}
        ListHeaderComponent={renderHeader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { elevation: 2 },
  title: { fontWeight: 'bold', marginBottom: 8 },
  description: { lineHeight: 20 },
  widgetCard: { marginBottom: 8, elevation: 1 },
  widgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  widgetInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  widgetText: { marginLeft: 12, flex: 1 },
  widgetControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dragHandle: { padding: 4 },
});
