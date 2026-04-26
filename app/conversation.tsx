import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSupabaseClient } from "../lib/supabase";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
};

export default function ConversationScreen() {
  const { partnerId, listingId } = useLocalSearchParams<{ partnerId: string; listingId?: string }>();
  const { user } = useUser();
  const supabase = useSupabaseClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerName, setPartnerName] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!user || !partnerId) return;

    fetchMessages();
    fetchPartnerName();

    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`conv:${[user.id, partnerId].sort().join("_")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          const isThisConv =
            (msg.sender_id === user.id && msg.receiver_id === partnerId) ||
            (msg.sender_id === partnerId && msg.receiver_id === user.id);
          if (isThisConv) {
            setMessages((prev) => {
              // Avoid duplicates (insert from send() already optimistically added)
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, partnerId]);

  const fetchMessages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, created_at, read")
      .in("sender_id", [user.id, partnerId])
      .in("receiver_id", [user.id, partnerId])
      .order("created_at", { ascending: true });

    setMessages(data || []);

    // Mark received messages as read
    supabase
      .from("messages")
      .update({ read: true })
      .eq("receiver_id", user.id)
      .eq("sender_id", partnerId)
      .eq("read", false)
      .then(() => {});
  };

  const fetchPartnerName = async () => {
    const { data } = await supabase
      .from("users")
      .select("display_name, uva_email")
      .eq("id", partnerId)
      .single();
    if (data) {
      setPartnerName(data.display_name || data.uva_email?.split("@")[0] || "Wahoo");
    }
  };

  const send = async () => {
    if (!text.trim() || !user || sending) return;
    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: partnerId,
        listing_id: listingId || null,
        content: text.trim(),
      })
      .select("id, sender_id, receiver_id, content, created_at, read")
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as Message]);
      setText("");
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
    setSending(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[styles.bubbleWrap, isMine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
            {item.content}
          </Text>
        </View>
        <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="person" size={16} color="#9CA3AF" />
          </View>
          <Text style={styles.headerName} numberOfLines={1}>
            {partnerName || "Conversation"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={send}
            activeOpacity={0.8}
            disabled={!text.trim() || sending}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerName: { fontSize: 16, fontWeight: "700", color: "#111" },

  messageList: { paddingHorizontal: 16, paddingVertical: 16, gap: 6 },

  bubbleWrap: { marginBottom: 6 },
  bubbleWrapMine: { alignItems: "flex-end" },
  bubbleWrapTheirs: { alignItems: "flex-start" },

  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: "#232D4B",
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMine: { color: "#fff" },
  bubbleTextTheirs: { color: "#111" },

  bubbleTime: { fontSize: 11, marginTop: 3, color: "#9CA3AF" },
  bubbleTimeMine: { textAlign: "right" },
  bubbleTimeTheirs: { textAlign: "left" },

  emptyChat: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 },
  emptyChatText: { fontSize: 15, color: "#9CA3AF" },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 10,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111",
    maxHeight: 100,
    backgroundColor: "#F9FAFB",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#232D4B",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#D1D5DB" },
});
