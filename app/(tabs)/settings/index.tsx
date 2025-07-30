import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, List, useTheme } from 'react-native-paper';

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <List.Section>
        <Link href="/(tabs)/settings/account" asChild>
          <List.Item
            title="Účet"
            description="Informace o účtu a odhlášení"
            left={props => <List.Icon {...props} icon="account-outline" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
        </Link>
        <Divider />
        <Link href="/(tabs)/settings/appearance" asChild>
          <List.Item
            title="Vzhled"
            description="Nastavení témat a barev aplikace"
            left={props => <List.Icon {...props} icon="palette-outline" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
        </Link>
        <Divider />
        <Link href="/(tabs)/settings/notifications" asChild>
          <List.Item
            title="Notifikace"
            description="Nastavení notifikací pro známky a další události"
            left={props => <List.Icon {...props} icon="bell-outline" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
        </Link>
        <Divider />
        <Link href="/(tabs)/settings/extraordinarySchedule" asChild>
          <List.Item
            title="Mimořádný rozvrh"
            description="Zobrazení mimořádného rozvrhu přímo ve stálém rozvrhu"
            left={props => <List.Icon {...props} icon="calendar" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
        </Link>
        <Divider />
        <Link href="/(tabs)/settings/advancedSettings" asChild>
          <List.Item
            title="Rozšířené nastavení"
            description="Pokročilé nastavení aplikace"
            left={props => <List.Icon {...props} icon="tune" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
        </Link>
        <Divider />
        <Link href="/(tabs)/settings/about" asChild>
          <List.Item
            title="O aplikaci"
            description="Informace o aplikaci a kontakt"
            left={props => <List.Icon {...props} icon="information-outline" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
        </Link>
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
