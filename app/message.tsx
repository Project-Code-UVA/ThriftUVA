import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";

const fakeUserId = "0123456789";

export default function Message() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        listings (
          id,
          title,
          images
        )
      `)
      .or(`sender_id.eq.${fakeUserId},receiver_id.eq.${fakeUserId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Fetch threads error:", error);
      setThreads([]);
      setLoading(false);
      return;
    }

    const threadMap = new Map();

    (data || []).forEach((msg) => {
      const otherUserId =
        msg.sender_id === fakeUserId ? msg.receiver_id : msg.sender_id;

      const key = `${otherUserId}-${msg.listing_id}`;

      if (!threadMap.has(key)) {
        threadMap.set(key, {
          otherUserId,
          listingId: msg.listing_id,
          listingTitle: msg.listings?.title || "Listing",
          listingImage: msg.listings?.images?.[0] || "",
          lastMessage: msg.content,
          createdAt: msg.created_at,
        });
      }
    });

    setThreads(Array.from(threadMap.values()));
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Messages</Text>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && <Text style={styles.emptyText}>Loading messages...</Text>}

        {!loading && threads.length === 0 && (
          <Text style={styles.emptyText}>No messages yet.</Text>
        )}

        {!loading &&
          threads.map((thread) => (
            <TouchableOpacity
              key={`${thread.otherUserId}-${thread.listingId}`}
              style={styles.threadCard}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/chat" as any,
                  params: {
                    sellerId: thread.otherUserId,
                    listingId: thread.listingId,
                    listingTitle: thread.listingTitle,
                  },
                })
              }
            >
              {thread.listingImage ? (
                <Image source={{ uri: thread.listingImage }} style={styles.image} />
              ) : (
                <View style={styles.placeholder} />
              )}

              <View style={styles.threadInfo}>
                <Text style={styles.listingTitle}>{thread.listingTitle}</Text>
                <Text style={styles.userText}>Chat with {thread.otherUserId}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {thread.lastMessage}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 24,
  },
  content: {
    paddingBottom: 130,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#777",
    fontSize: 16,
  },
  threadCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#F8F8F8",
    marginBottom: 14,
  },
  image: {
    width: 70,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  placeholder: {
    width: 70,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  threadInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  listingTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  userText: {
    marginTop: 4,
    fontSize: 13,
    color: "#777",
  },
  lastMessage: {
    marginTop: 8,
    fontSize: 14,
    color: "#333",
  },
});