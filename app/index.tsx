import { router, usePathname } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getAvailableListings } from "../services/listings";

type Route = "/" | "/cart" | "/sell" | "/message" | "/profile";

type Listing = {
  id: string;
  Brand?: string;
  ClothingType?: string;
  Color?: string;
  ConditionRating?: string;
  CreatedAt?: any;
  Description?: string;
  ImageURLs?: string[];
  Name?: string;
  Price?: number;
  SellerID?: string;
  Size?: string;
  Status?: string;
  Tags?: string[];
  UpdatedAt?: any;
};

export default function Index() {
  const pathname = usePathname();

  const [searchText, setSearchText] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const goTab = (href: Route) => {
    if (pathname !== href) router.replace(href);
  };

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    const data = await getAvailableListings();
    setListings(data);
    setLoading(false);
  };

  const filteredListings = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return listings;

    return listings.filter((item) => {
      const name = item.Name?.toLowerCase() ?? "";
      const brand = item.Brand?.toLowerCase() ?? "";
      const clothingType = item.ClothingType?.toLowerCase() ?? "";
      const color = item.Color?.toLowerCase() ?? "";
      const size = item.Size?.toLowerCase() ?? "";
      const description = item.Description?.toLowerCase() ?? "";
      const tags = (item.Tags ?? []).join(" ").toLowerCase();

      return (
        name.includes(query) ||
        brand.includes(query) ||
        clothingType.includes(query) ||
        color.includes(query) ||
        size.includes(query) ||
        description.includes(query) ||
        tags.includes(query)
      );
    });
  }, [searchText, listings]);

  const recommendedListings = filteredListings.slice(0, 3);
  const newListings = filteredListings.slice(3, 6);

  const renderListingCard = (item: Listing) => {
    const imageUrl = item.ImageURLs?.[0];

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.item}
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: "/product_detail",
            params: { listingId: item.id },
          })
        }
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder} />
        )}

        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.Name || "Unnamed Item"}
        </Text>

        <Text style={styles.itemMeta} numberOfLines={1}>
          {[item.Brand, item.Size].filter(Boolean).join(" • ")}
        </Text>

        <Text style={styles.itemPrice}>
          ${typeof item.Price === "number" ? item.Price.toFixed(2) : "0.00"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>THRIFT UVA</Text>

      <View style={styles.row}>
        <TextInput
          style={styles.search}
          placeholder="Search clothing..."
          placeholderTextColor="#888"
          autoCapitalize="none"
          autoCorrect={false}
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.8}>
          <Text style={styles.filterButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.sectionTitle}>Recommended</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {recommendedListings.length > 0 ? (
              recommendedListings.map(renderListingCard)
            ) : (
              <Text style={styles.emptyText}>No matching listings found.</Text>
            )}
          </ScrollView>

          <Text style={styles.sectionTitle}>New</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {newListings.length > 0 ? (
              newListings.map(renderListingCard)
            ) : (
              <Text style={styles.emptyText}>No more listings yet.</Text>
            )}
          </ScrollView>
        </ScrollView>
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navSlot} activeOpacity={0.8} onPress={() => goTab("/")}>
          <Text style={[styles.navItem, pathname === "/" && styles.navItemActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navSlot} activeOpacity={0.8} onPress={() => goTab("/cart")}>
          <Text style={[styles.navItem, pathname === "/cart" && styles.navItemActive]}>Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navSlot} activeOpacity={0.8} onPress={() => goTab("/sell")}>
          <Text style={[styles.navItem, pathname === "/sell" && styles.navItemActive]}>Sell</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navSlot}
          activeOpacity={0.8}
          onPress={() => goTab("/message")}
        >
          <Text style={[styles.navItem, pathname === "/message" && styles.navItemActive]}>
            Message
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navSlot}
          activeOpacity={0.8}
          onPress={() => goTab("/profile")}
        >
          <Text style={[styles.navItem, pathname === "/profile" && styles.navItemActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 45,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 30,
  },
  search: {
    width: "70%",
    backgroundColor: "#f2f2f2",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    fontSize: 16,
    textAlign: "center",
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonText: {
    color: "#888",
    fontWeight: "bold",
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  horizontalList: {
    paddingRight: 10,
    gap: 16,
    marginBottom: 28,
  },
  item: {
    width: 150,
  },
  productImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#e5e5e5",
  },
  placeholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#e5e5e5",
    borderRadius: 10,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemMeta: {
    fontSize: 12,
    color: "#777",
    marginTop: 3,
  },
  itemPrice: {
    fontSize: 14,
    color: "#111",
    marginTop: 4,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    color: "#777",
    marginBottom: 20,
  },
  bottomNav: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    width: "90%",
    height: 70,
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
  navSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navItem: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  navItemActive: {
    textDecorationLine: "underline",
  },
});