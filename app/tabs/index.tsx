import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from '@/screens/HomeScreen';

export default function HomeRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <HomeScreen />
    </SafeAreaView>
  );
}
