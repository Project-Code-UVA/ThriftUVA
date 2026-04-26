import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

const fakeUserId = "0123456789";

export default function Chat() {
  const { sellerId, listingId, listingTitle } = useLocalSearchParams<{
    sellerId: string;
    listingId: string;
    listingTitle: string;
  }>();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    fetchMessages();
  }, [sellerId, listingId]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("listing_id", listingId)
      .or(
        `and(sender_id.eq.${fakeUserId},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${fakeUserId})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.log("Fetch messages error:", error);
      return;
    }

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!text.trim()) return;

    const { error } = await supabase.from("messages").insert({
      sender_id: fakeUserId,
      receiver_id: sellerId,
      listing_id: listingId,
      content: text.trim(),
    });

    if (error) {
      alert(error.message);
      return;
    }

    setText("");
    fetchMessages();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <View>
          <Text style={styles.title}>Chat</Text>
          <Text style={styles.subtitle}>{listingTitle}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.messages}>
        {messages.length === 0 && (
          <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === fakeUserId;

          return (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                isMine ? styles.myMessage : styles.theirMessage,
              ]}
            >
              <Text style={isMine ? styles.myMessageText : styles.theirMessageText}>
                {msg.content}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={text}
          onChangeText={setText}
        />

        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  back: {
    fontSize: 36,
    color: "#111",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  messages: {
    flexGrow: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#777",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#2278CE",
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },
  myMessageText: {
    color: "#fff",
    fontSize: 15,
  },
  theirMessageText: {
    color: "#111",
    fontSize: 15,
  },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 22,
    paddingHorizontal: 16,
  },
  sendButton: {
    backgroundColor: "#2278CE",
    paddingHorizontal: 18,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: {
    color: "#fff",
    fontWeight: "800",
  },
});