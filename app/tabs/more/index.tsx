import { SafeAreaView } from 'react-native-safe-area-context';
import MoreScreen from '@/screens/MoreScreen';

export default function MoreRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <MoreScreen />
    </SafeAreaView>
  );
}
