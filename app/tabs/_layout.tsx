import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { LayoutPathsProvider, tabsPaths } from '@/lib/layoutPaths';

export default function TabsLayout() {
  return (
    <LayoutPathsProvider paths={tabsPaths}>
      <NativeTabs tabBarRespectsIMEInsets={false}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Domov</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'house', selected: 'house.fill' }}
            md="home"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="rozvrh">
          <NativeTabs.Trigger.Label>Rozvrh</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'calendar', selected: 'calendar' }}
            md="calendar_month"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="znamky">
          <NativeTabs.Trigger.Label>Známky</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'star', selected: 'star.fill' }}
            md="star"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="more">
          <NativeTabs.Trigger.Label>Více</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{
              default: 'ellipsis.circle',
              selected: 'ellipsis.circle.fill',
            }}
            md="more_horiz"
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </LayoutPathsProvider>
  );
}
