import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

// const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

// if (!publishableKey) {
//   throw new Error('Add your Clerk Publishable Key to the .env file')
// }

// export default function RootLayout() {
//   return (
//     <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
//       <Stack screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="index" />
//       <Stack.Screen name="(auth)" />
//         <Stack.Screen name="login" />
//         {/* <Stack.Screen name="(tabs)" /> */}
//       </Stack>
//       <StatusBar style="auto" />
//     </ClerkProvider>
//   );
// }

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="upload" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="sell" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
