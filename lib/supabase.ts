import { createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/expo";
import { useRef, useState } from "react";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export function useSupabaseClient() {
  const { session } = useSession();
  // Keep a ref so the accessToken callback always reads the latest session
  // without recreating the client (which would break Realtime subscriptions).
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const [client] = useState(() =>
    createClient(supabaseUrl, supabaseAnonKey, {
      async accessToken() {
        return sessionRef.current?.getToken() ?? null;
      },
    })
  );

  return client;
}
