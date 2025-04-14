import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right', 
        animationDuration: 200,
        gestureEnabled: true,
        gestureDirection: 'horizontal'
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Чаты',
        }}
      />
      <Stack.Screen 
        name="[roomId]" 
        options={{
          title: 'Чат',
          presentation: 'card'
        }}
      />
    </Stack>
  );
} 