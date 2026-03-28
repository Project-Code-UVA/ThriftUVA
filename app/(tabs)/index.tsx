import { httpsCallable } from "firebase/functions";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { functions } from "../../firebaseConfig";

export default function BuyingPage() {
  const pickupOptions = [
    {
      id: "1",
      location: "Newcomb Hall",
      time: "Mon, 3:00 PM - 3:30 PM",
    },
    {
      id: "2",
      location: "Clemons Library",
      time: "Tue, 5:00 PM - 5:30 PM",
    },
    {
      id: "3",
      location: "Rice Hall",
      time: "Wed, 1:00 PM - 1:30 PM",
    },
  ];

  const handleRequest = async () => {
    try {
      const createPurchaseRequest = httpsCallable(
        functions,
        "createPurchaseRequest",
      );

      const res = await createPurchaseRequest({
        itemId: "demo-item-id",
        proposedMeetup: {
          locationId: "newcomb",
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        },
      });

      console.log("SUCCESS:", res.data);
    } catch (err) {
      console.error("ERROR:", err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Buying Page</Text>

      <View style={styles.card}>
        <Text style={styles.itemTitle}>Grey Hoodie</Text>
        <Text style={styles.price}>$25</Text>
        <Text style={styles.detail}>Seller: Alex Johnson</Text>
        <Text style={styles.detail}>Brand: Nike</Text>
        <Text style={styles.detail}>Usage Duration: 6 months</Text>
        <Text style={styles.detail}>Purchase Platform: ThriftUVA</Text>
        <Text style={styles.detail}>
          Description: Lightly used hoodie in good condition.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Pickup Options</Text>

      {pickupOptions.map((option) => (
        <View key={option.id} style={styles.optionCard}>
          <Text style={styles.optionLocation}>{option.location}</Text>
          <Text style={styles.optionTime}>{option.time}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={handleRequest}>
        <Text style={styles.buttonText}>Request Purchase</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#ffffff",
  },
  header: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 20,
    marginTop: 20,
  },
  card: {
    backgroundColor: "#f3f3f3",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  itemTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  detail: {
    fontSize: 15,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  optionLocation: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  optionTime: {
    fontSize: 14,
  },
  button: {
    backgroundColor: "#1e1e1e",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
