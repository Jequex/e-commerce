import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/providers/AuthProvider';
import { CartProvider } from '@/providers/CartProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { LoadingProvider } from '@/providers/LoadingProvider';
import { Toast } from '@/components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <NotificationProvider>
                <LoadingProvider>
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="auth" options={{ headerShown: false }} />
                    <Stack.Screen name="product/[id]" options={{ title: 'Product Details' }} />
                    <Stack.Screen name="cart" options={{ title: 'Shopping Cart' }} />
                    <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
                    <Stack.Screen name="profile/orders" options={{ title: 'My Orders' }} />
                    <Stack.Screen name="profile/addresses" options={{ title: 'My Addresses' }} />
                    <Stack.Screen name="profile/settings" options={{ title: 'Settings' }} />
                  </Stack>
                  <Toast />
                  <StatusBar style="auto" />
                </LoadingProvider>
              </NotificationProvider>
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}