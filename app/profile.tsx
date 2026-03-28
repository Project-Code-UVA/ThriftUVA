import { StyleSheet, Text, View } from "react-native";
import BottomNav from "../components/BottomNav";

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile</Text>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  text: { fontSize: 22, fontWeight: "700" },
});