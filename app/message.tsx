import { StyleSheet, Text, View } from "react-native";
import BottomNav from "../components/BottomNav";

export default function Message() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Message</Text>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  text: { fontSize: 22, fontWeight: "700" },
});