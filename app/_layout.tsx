import { ClerkProvider, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useSupabaseClient } from "../lib/supabase";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

// Upserts the Clerk user into public.users so FK constraints are satisfied
// and RLS policies keyed on auth.uid() work correctly.
function UserSync() {
  const { user, isSignedIn } = useUser();
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!isSignedIn || !user) return;
    supabase
      .from("users")
      .upsert(
        {
          id: user.id,
          uva_email: user.primaryEmailAddress?.emailAddress ?? "",
          display_name: user.fullName ?? user.username ?? null,
          avatar_url: user.imageUrl ?? null,
        },
        { onConflict: "id" }
      )
      .then(({ error }) => {
        if (error) console.error("[UserSync]", error.message);
      });
  }, [isSignedIn, user?.id]);

  return null;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <UserSync />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product_detail" />
        <Stack.Screen name="conversation" />
      </Stack>
      <StatusBar style="auto" />
    </ClerkProvider>
  );
}
