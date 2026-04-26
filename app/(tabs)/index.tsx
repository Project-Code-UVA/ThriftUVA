import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSupabaseClient } from "../../lib/supabase";

const CATEGORIES = ["All", "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories"];
const HORIZONTAL_PADDING = 16;
const GRID_GAP = 12;
const TAB_BAR_SAFE_PADDING = 110;
const MAX_GRID_WIDTH = 560;

type Listing = {
  id: string;
  title: string;
  price: number;
  seller_id: string;
  size: string | null;
  images: string[];
  category: string | null;
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const supabase = useSupabaseClient();
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const isNarrowPhone = width < 420;
  const numColumns = isNarrowPhone ? 1 : 2;
  const availableGridWidth = Math.min(width - HORIZONTAL_PADDING * 2, MAX_GRID_WIDTH);
  const cardWidth =
    numColumns === 1 ? availableGridWidth : (availableGridWidth - GRID_GAP) / numColumns;
  const cardAspectRatio = Platform.OS === "web" ? 0.9 : 0.86;

  useEffect(() => {
    fetchListings();
  }, [activeCategory]);

  const fetchListings = async () => {
    let query = supabase
      .from("listings")
      .select("id, title, price, seller_id, size, images, category")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (activeCategory !== "All") {
      query = query.eq("category", activeCategory.toLowerCase());
    }

    const { data, error } = await query;
    if (error) console.error("[listings] fetch error:", error.message, error.details);
    setListings(data || []);
  };

  const renderCard = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/product_detail", params: { id: item.id } })}
    >
      <View style={[styles.cardImageWrap, { aspectRatio: cardAspectRatio }]}>
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardImagePlaceholder} />
        )}
        {item.size && (
          <View style={styles.sizeBadge}>
            <Text style={styles.sizeBadgeText}>{item.size}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>${item.price}</Text>
          <Text style={styles.cardSeller}>@wahoo</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const header = (
    <>
      <View style={styles.header}>
        <Text style={styles.logo}>
          {"Thrift".split("").map((char, i) => (
            <Text key={i} style={styles.logoThrift}>{char}</Text>
          ))}
          <Text style={styles.logoUVA}>UVA</Text>
        </Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={22} color="#232D4B" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.searchBar}
        activeOpacity={0.8}
        onPress={() => router.push("/(tabs)/search")}
      >
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <Text style={styles.searchPlaceholder}>Search wahoos for fits...</Text>
        <View style={styles.filterBtn}>
          <Ionicons name="options-outline" size={16} color="#fff" />
        </View>
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, activeCategory === cat && styles.chipActive]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        key={`home-grid-${numColumns}`}
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        numColumns={numColumns}
        ListHeaderComponent={header}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        contentContainerStyle={[styles.grid, { paddingBottom: TAB_BAR_SAFE_PADDING }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="shirt-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No listings yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logo: { fontSize: 26, fontWeight: "800" },
  logoThrift: { color: "#232D4B" },
  logoUVA: { color: "#E57200" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  searchBar: {
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 9,
    gap: 8,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: "#9CA3AF" },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#232D4B",
    alignItems: "center",
    justifyContent: "center",
  },

  categoryScroll: { paddingHorizontal: HORIZONTAL_PADDING, gap: 8, paddingBottom: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#232D4B", borderColor: "#232D4B" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  chipTextActive: { color: "#fff" },

  grid: {
    paddingHorizontal: HORIZONTAL_PADDING,
    alignSelf: "center",
    width: "100%",
    maxWidth: MAX_GRID_WIDTH + HORIZONTAL_PADDING * 2,
  },
  row: { justifyContent: "space-between", marginBottom: GRID_GAP },

  card: { borderRadius: 12, backgroundColor: "#fff", marginBottom: GRID_GAP },
  cardImageWrap: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  cardImagePlaceholder: { flex: 1, backgroundColor: "#F5EEE6" },
  cardImage: { width: "100%", height: "100%" },
  sizeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  sizeBadgeText: { fontSize: 11, fontWeight: "700", color: "#111" },
  cardBody: { paddingTop: 8, paddingHorizontal: 2 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#111", marginBottom: 3 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardPrice: { fontSize: 14, fontWeight: "700", color: "#111" },
  cardSeller: { fontSize: 11, color: "#9CA3AF" },

  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, color: "#9CA3AF", fontWeight: "500" },
});
