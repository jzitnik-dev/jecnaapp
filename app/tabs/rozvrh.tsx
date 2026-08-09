import { SafeAreaView } from 'react-native-safe-area-context';
import TimetableScreen from '@/screens/TimetableScreen';

export default function RozvrhRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <TimetableScreen />
    </SafeAreaView>
  );
}
