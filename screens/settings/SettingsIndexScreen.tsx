import { Link, type Href } from 'expo-router';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Divider, List, useTheme } from 'react-native-paper';

import { useLayoutPaths } from '@/lib/layoutPaths';

export default function SettingsScreen() {
  const theme = useTheme();
  const paths = useLayoutPaths();

  const isDebugMode =
    process.env.EXPO_PUBLIC_ENABLE_DEBUG_MENU === 'true' || __DEV__;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView>
        <List.Section>
          <Link href={paths.settingsAccount as Href} asChild>
            <List.Item
              title="Účet"
              description="Informace o účtu a odhlášení"
              left={props => <List.Icon {...props} icon="account-outline" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          </Link>
          <Divider />
          <Link href={paths.settingsAppearance as Href} asChild>
            <List.Item
              title="Vzhled"
              description="Nastavení témat a barev aplikace"
              left={props => <List.Icon {...props} icon="palette-outline" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          </Link>
          <Divider />
          <Link href={paths.settingsDashboard as Href} asChild>
            <List.Item
              title="Nastavení widgetů"
              description="Upravení widgetů na dashboardu"
              left={props => <List.Icon {...props} icon="tune" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          </Link>
          <Divider />
          <Link href={paths.settingsNotifications as Href} asChild>
            <List.Item
              title="Notifikace"
              description="Nastavení notifikací pro známky a další události"
              left={props => <List.Icon {...props} icon="bell-outline" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          </Link>
          <Divider />
          <Link href={paths.settingsExtraordinarySchedule as Href} asChild>
            <List.Item
              title="Mimořádný rozvrh"
              description="Zobrazení mimořádného rozvrhu přímo ve stálém rozvrhu"
              left={props => <List.Icon {...props} icon="calendar" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          </Link>
          <Divider />
          <Link href={paths.settingsAdvancedSettings as Href} asChild>
            <List.Item
              title="Rozšířené nastavení"
              description="Pokročilé nastavení aplikace"
              left={props => <List.Icon {...props} icon="tune" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          </Link>
          <Divider />
          <Link href={paths.settingsAbout as Href} asChild>
            <List.Item
              title="O aplikaci"
              description="Informace o aplikaci a kontakt"
              left={props => (
                <List.Icon {...props} icon="information-outline" />
              )}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          </Link>
          {isDebugMode && (
            <>
              <Divider />
              <Link href={paths.settingsDebug as Href} asChild>
                <List.Item
                  title="Debug"
                  description="Debug menu"
                  right={props => <List.Icon {...props} icon="chevron-right" />}
                />
              </Link>
            </>
          )}
        </List.Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
