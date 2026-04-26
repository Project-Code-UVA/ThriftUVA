import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSupabaseClient } from "../../lib/supabase";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 16 * 2 - 10) / 2;

const TRENDING = ["UVA Crewneck", "Levi's", "White Sneakers", "Patagonia", "Mini Skirt", "Brandy"];

const POPULAR_TAGS = [
  "#vintage", "#y2k", "#90s", "#80s", "#thrifted", "#streetwear",
  "#preppy", "#boho", "#cottagecore", "#minimalist", "#grunge",
  "#academia", "#athleisure", "#formal", "#business casual",
  "#going out", "#date night", "#gameday", "#sustainable",
  "#deadstock", "#designer", "#luxury", "#fast fashion",
  "#handmade", "#upcycled", "#denim", "#leather", "#linen",
];

type Listing = {
  id: string;
  title: string;
  price: number;
  seller_id: string;
  size: string | null;
  images: string[];
};

export default function SearchScreen() {
  const supabase = useSupabaseClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Listing[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (query.length > 1) {
      const timer = setTimeout(() => runSearch(query), 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query]);

  const runSearch = async (q: string) => {
    setSearching(true);
    const { data } = await supabase
      .from("listings")
      .select("id, title, price, seller_id, size, images")
      .eq("status", "active")
      .ilike("title", `%${q}%`)
      .limit(20);
    setResults(data || []);
    setSearching(false);
  };

  const handleTag = (tag: string) => {
    setQuery(tag.replace("#", ""));
    inputRef.current?.focus();
  };

  const renderCard = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/product_detail", params: { id: item.id } })}
    >
      <View style={styles.cardImageWrap}>
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
        <Text style={styles.cardPrice}>${item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search input */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search listings, tags, sellers..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {query.length > 1 ? (
        /* Search results */
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !searching ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No results for "{query}"</Text>
              </View>
            ) : null
          }
        />
      ) : (
        /* Discovery content */
        <ScrollView contentContainerStyle={styles.discovery} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>TRENDING ON GROUNDS</Text>
          <View style={styles.trendingWrap}>
            {TRENDING.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.trendChip}
                onPress={() => setQuery(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.trendChipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>POPULAR TAGS</Text>
          <View style={styles.tagsWrap}>
            {POPULAR_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.tagChip}
                onPress={() => handleTag(tag)}
                activeOpacity={0.7}
              >
                <Text style={styles.tagChipText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  searchWrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: "#111" },

  discovery: { paddingHorizontal: 16, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#9CA3AF",
    marginBottom: 12,
  },

  trendingWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  trendChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  trendChipText: { fontSize: 14, fontWeight: "600", color: "#111" },

  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  tagChipText: { fontSize: 13, color: "#374151" },

  grid: { paddingHorizontal: 16, paddingBottom: 20 },
  row: { justifyContent: "space-between", marginBottom: 10 },
  card: { width: CARD_WIDTH, borderRadius: 12, backgroundColor: "#fff" },
  cardImageWrap: {
    width: "100%",
    aspectRatio: 0.85,
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
  cardPrice: { fontSize: 14, fontWeight: "700", color: "#111" },

  noResults: { alignItems: "center", paddingTop: 60 },
  noResultsText: { fontSize: 15, color: "#9CA3AF" },
});
