import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { UndoSnackbar } from '@/components/UndoSnackbar';
import { Animation } from '@/constants/app-theme';
import { TaskProvider } from '@/context/TaskContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TaskProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F8F9FA' },
            animation: 'slide_from_right',
            animationDuration: Animation.stackDuration,
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="list/[id]" />
        </Stack>
        <UndoSnackbar />
        <StatusBar style="dark" />
      </TaskProvider>
    </GestureHandlerRootView>
  );
}
