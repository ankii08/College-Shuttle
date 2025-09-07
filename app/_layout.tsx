import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AuthWrapper from '@/components/AuthWrapper';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ErrorBoundary>
      <AuthWrapper>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </AuthWrapper>
    </ErrorBoundary>
  );
}
