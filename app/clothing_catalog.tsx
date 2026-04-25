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

export default function ClothingCatalog() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Fetch error:", error);
        setErrorMessage(error.message);
        setListings([]);
      } else {
        setListings(data || []);
      }

      setLoading(false);
    };

    fetchListings();
  }, []);

  const filteredListings = listings.filter((item) => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return true;

    const searchableText = [
      item.title,
      item.description,
      item.category,
      item.condition,
      item.size,
      item.brand,
      ...(item.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  });

  const groupedListings = categories.map((category) => ({
    category,
    items: filteredListings.filter((item) => item.category === category),
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>THRIFT UVA</Text>

      <View style={styles.row}>
        <TextInput
          style={styles.search}
          placeholder="Search"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#888"
        />

        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.catalogScroll}
        contentContainerStyle={styles.catalogContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && <Text style={styles.emptyText}>Loading listings...</Text>}

        {!loading && errorMessage !== "" && (
          <Text style={styles.emptyText}>Error: {errorMessage}</Text>
        )}

        {!loading && !errorMessage && filteredListings.length === 0 && (
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? `No results found for "${searchQuery}"`
              : "No listings found yet."}
          </Text>
        )}

        {!loading &&
          !errorMessage &&
          groupedListings.map(({ category, items }) => {
            if (items.length === 0) return null;

            return (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.sectionTitle}>{category.toUpperCase()}</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.itemCard}
                      activeOpacity={0.85}
                      onPress={() =>
                        router.push({
                          pathname: "/product_detail",
                          params: { id: item.id },
                        })
                      }
                    >
                      {item.images?.[0] ? (
                        <Image
                          source={{ uri: item.images[0] }}
                          style={styles.itemImage}
                        />
                      ) : (
                        <View style={styles.placeholder} />
                      )}

                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>

                      <Text style={styles.itemPrice}>
                        ${Number(item.price).toFixed(2)}
                      </Text>
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
    marginBottom: 30,
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
    fontSize: 20,
  },
  catalogScroll: {
    flex: 1,
  },
  catalogContent: {
    paddingBottom: 130,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#777",
    fontSize: 16,
  },
  categorySection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
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
  placeholder: {
    width: 100,
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
  },
});