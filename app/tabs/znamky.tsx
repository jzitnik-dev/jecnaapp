import { SafeAreaView } from 'react-native-safe-area-context';
import GradesScreen from '@/screens/GradesScreen';

export default function ZnamkyRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <GradesScreen />
    </SafeAreaView>
  );
}
