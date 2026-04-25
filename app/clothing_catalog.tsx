import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";

const categories = [
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "shoes",
  "accessories",
  "activewear",
  "formal",
  "vintage",
  "other",
];

export default function Index() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    setErrorMessage("");

    console.log("SUPABASE URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);

    const { data, error, count } = await supabase
      .from("listings")
      .select("*", { count: "exact" });

    console.log("LISTINGS COUNT:", count);

    if (error) {
      setErrorMessage(error.message);
      setListings([]);
    } else {
      setListings(data || []);
    }

    setLoading(false);
  };

  const groupedListings = categories.map((category) => ({
    category,
    items: listings.filter((item) => item.category === category),
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>THRIFT UVA</Text>

      <View style={styles.row}>
        <TextInput style={styles.search} placeholder="Search" />
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {loading && (
          <Text style={styles.emptyText}>Loading listings...</Text>
        )}

        {!loading && errorMessage !== "" && (
          <Text style={styles.emptyText}>Error: {errorMessage}</Text>
        )}

        {!loading && !errorMessage && listings.length === 0 && (
          <Text style={styles.emptyText}>No listings found yet.</Text>
        )}
        {groupedListings.map(({ category, items }) => {
          if (items.length === 0) return null;

          return (
            <View key={category} style={{ marginBottom: 30 }}>
              <Text style={styles.sectionTitle}>{category.toUpperCase()}</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemCard}
                    onPress={() =>
                      router.push({
                        pathname: "/product_detail",
                        params: { id: item.id },
                      })
                    }
                  >
                    {item.images?.[0] ? (
                      <Image source={{ uri: item.images[0] }} style={styles.itemImage} />
                    ) : (
                      <View style={styles.placeholder} />
                    )}

                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemPrice}>${item.price}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingHorizontal: 20,
    flex: 1,
    backgroundColor: "#fff",
  },
  logo: {
    fontSize: 45,
    textAlign: "center",
    marginTop: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 60,
  },
  search: {
    backgroundColor: "#f2f2f2",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    fontSize: 16,
    textAlign: "center",
    width: "70%",
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  plusText: {
    color: "#888",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 40,
  },
  item: {
    width: 100,
  },
  placeholder: {
    width: "100%",
    height: 150,
    backgroundColor: "#e5e5e5",
    borderRadius: 8,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemPrice: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
    marginBottom: 50,
  },
  bottomNav: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    height: 60,
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 40,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 8,
  },
  navItem: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  navItemActive: {
    textDecorationLine: "underline",
  },
  itemCard: {
    width: 100,
    marginRight: 24,
  },

  itemImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#e5e5e5",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: "#777",
  },
});