import { Pressable, View } from 'react-native';
import { Text } from 'react-native-paper';


export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Pressable onPress={() => console.log('Pressed!')}>
        <Text>Click me</Text>
      </Pressable>
    </View>
  )
} 