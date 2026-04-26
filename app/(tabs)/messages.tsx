import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSupabaseClient } from "../../lib/supabase";

type Thread = {
  partner_id: string;
  partner_name: string;
  last_message: string;
  last_time: string;
  unread: boolean;
  listing_id: string | null;
};

export default function MessagesScreen() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchThreads();
  }, [user]);

  const fetchThreads = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("sender_id, receiver_id, content, created_at, read, listing_id")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    // Group into threads by conversation partner
    const seen = new Set<string>();
    const partnerIds: string[] = [];
    const grouped: Thread[] = [];
    for (const msg of data) {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        partnerIds.push(partnerId);
        grouped.push({
          partner_id: partnerId,
          partner_name: partnerId.slice(0, 8) + "...",
          last_message: msg.content,
          last_time: new Date(msg.created_at).toLocaleDateString(),
          unread: !msg.read && msg.receiver_id === user.id,
          listing_id: msg.listing_id,
        });
      }
    }

    // Resolve display names for all partners in one query
    if (partnerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("users")
        .select("id, display_name, uva_email")
        .in("id", partnerIds);
      if (profiles) {
        const nameMap: Record<string, string> = {};
        for (const p of profiles) {
          nameMap[p.id] = p.display_name || p.uva_email?.split("@")[0] || "Wahoo";
        }
        for (const thread of grouped) {
          if (nameMap[thread.partner_id]) thread.partner_name = nameMap[thread.partner_id];
        }
      }
    }

    setThreads(grouped);
    setLoading(false);
  };

  const renderThread = ({ item }: { item: Thread }) => (
    <TouchableOpacity
      style={styles.thread}
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: "/conversation",
          params: { partnerId: item.partner_id, listingId: item.listing_id ?? "" },
        })
      }
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        <Ionicons name="person" size={20} color="#9CA3AF" />
      </View>
      {/* Content */}
      <View style={styles.threadContent}>
        <View style={styles.threadTop}>
          <Text style={[styles.partnerName, item.unread && styles.partnerNameUnread]}>
            {item.partner_name}
          </Text>
          <Text style={styles.time}>{item.last_time}</Text>
        </View>
        <Text
          style={[styles.lastMessage, item.unread && styles.lastMessageUnread]}
          numberOfLines={1}
        >
          {item.last_message}
        </Text>
      </View>
      {item.unread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : threads.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>Message a seller to start a conversation</Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.partner_id}
          renderItem={renderThread}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#232D4B" },

  thread: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  threadContent: { flex: 1 },
  threadTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  partnerName: { fontSize: 15, fontWeight: "600", color: "#111" },
  partnerNameUnread: { fontWeight: "800" },
  time: { fontSize: 12, color: "#9CA3AF" },
  lastMessage: { fontSize: 13, color: "#9CA3AF", lineHeight: 18 },
  lastMessageUnread: { color: "#374151", fontWeight: "600" },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#E57200",
  },
  separator: { height: 1, backgroundColor: "#F3F4F6", marginLeft: 76 },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
});
