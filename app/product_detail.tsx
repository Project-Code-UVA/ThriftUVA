import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = Math.round(width * 1.25);

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (id) fetchProductDetail();
  }, [id]);

  const fetchProductDetail = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        *,
        users:seller_id (
          id,
          display_name,
          avatar_url,
          uva_email
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.log("Product detail error:", error);
      setListing(null);
      setSeller(null);
    } else {
      setListing(data);
      setSeller(data.users);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading product...</Text>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Product not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const images = listing.images || [];
  const currentImage = images[activeImageIndex];

  const tags = [
    listing.category,
    listing.condition,
    listing.size,
    listing.brand,
    ...(listing.tags || []),
  ]
    .filter(Boolean)
    .map((t: string) => t.replace("#", ""));
  
  const addToCart = async () => {
    const fakeUserId = "0123456789";

    const { error } = await supabase.from("cart_items").insert({
      user_id: fakeUserId,
      listing_id: listing.id,
    });

    if (error) {
      if (error.code === "23505") {
        alert("This item is already in your cart.");
      } else {
        alert(error.message);
      }
      return;
    }

    alert("Added to cart!");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.imageWrap}>
          {currentImage ? (
            <Image
              source={{ uri: currentImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>No image</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>

          {images.length > 1 && (
            <View style={styles.imageDots}>
              {images.map((_: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setActiveImageIndex(index)}
                  style={[
                    styles.dot,
                    activeImageIndex === index && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.sheet}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>${Number(listing.price).toFixed(2)}</Text>

          <View style={styles.sellerRow}>
            {seller?.avatar_url ? (
              <Image source={{ uri: seller.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle} />
            )}

            <Text style={styles.sellerName}>
              {seller?.display_name || seller?.uva_email || "Unknown Seller"}
            </Text>
          </View>

          <View style={styles.tagsRow}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>{String(tag)}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.desc}>
            {listing.description || "No description provided."}
          </Text>

          <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>Message seller</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.9}
            onPress={addToCart}
          >
            <Text style={styles.primaryBtnText}>Add to cart</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1 },
  content: { paddingBottom: 24 },

  center: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  imageWrap: {
    width: "100%",
    height: IMAGE_HEIGHT,
    backgroundColor: "#EEE",
  },
  heroImage: { width: "100%", height: "100%" },

  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#777",
    fontWeight: "600",
  },

  backBtn: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  backChevron: {
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2,
    color: "#111",
  },

  imageDots: {
    position: "absolute",
    bottom: 55,
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  activeDot: {
    width: 18,
    backgroundColor: "#FFFFFF",
  },

  sheet: {
    marginTop: -40,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 3,
  },

  title: { fontSize: 26, fontWeight: "700", color: "#111" },
  price: { marginTop: 4, fontSize: 18, color: "#6B7280", fontWeight: "600" },

  sellerRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
  },
  sellerName: { fontSize: 15, color: "#111", fontWeight: "600" },

  tagsRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tagPill: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: { fontSize: 13, color: "#374151", fontWeight: "600" },

  desc: {
    marginTop: 12,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },

  secondaryBtn: {
    marginTop: 18,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "700", color: "#111" },

  primaryBtn: {
    marginTop: 12,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2278CE",
  },
  primaryBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
});