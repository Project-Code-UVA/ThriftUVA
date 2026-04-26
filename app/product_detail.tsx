import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { createCheckoutSession, syncListingStripeProduct } from "../lib/stripeApi";
import { useSupabaseClient } from "../lib/supabase";

const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = Math.round(width * 1.1);

type Listing = {
  id: string;
  title: string;
  price: number;
  description: string | null;
  seller_id: string;
  size: string | null;
  brand: string | null;
  condition: string | null;
  images: string[];
  tags: string[];
  stripe_price_id: string | null;
};

type SellerPaymentState = {
  hasAccount: boolean;
  readyToReceivePayments: boolean;
};

export default function ProductDetail() {
  const supabase = useSupabaseClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const [listing, setListing] = useState<Listing | null>(null);
  const [sellerPaymentState, setSellerPaymentState] = useState<SellerPaymentState>({
    hasAccount: false,
    readyToReceivePayments: false,
  });
  const [addingToCart, setAddingToCart] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [syncingPaymentSetup, setSyncingPaymentSetup] = useState(false);

  useEffect(() => {
    if (id) fetchListing();
  }, [id]);

  const fetchListing = async () => {
    const { data } = await supabase
      .from("listings")
      .select("id, title, price, description, seller_id, size, brand, condition, images, tags, stripe_price_id")
      .eq("id", id)
      .single();
    if (data) {
      setListing(data);
      const { data: seller } = await supabase
        .from("users")
        .select("stripe_account_id, stripe_ready_to_receive_payments")
        .eq("id", data.seller_id)
        .single();
      setSellerPaymentState({
        hasAccount: Boolean(seller?.stripe_account_id),
        readyToReceivePayments: Boolean(seller?.stripe_ready_to_receive_payments),
      });
    }
  };

  const handleAddToCart = async () => {
    if (!user) { Alert.alert("Sign in required", "Please sign in to add items to your cart."); return; }
    if (!listing) return;
    setAddingToCart(true);
    const { error } = await supabase.from("cart_items").insert({
      user_id: user.id,
      listing_id: listing.id,
    });
    if (error) {
      Alert.alert("Error", "Could not add to cart.");
    } else {
      setInCart(true);
    }
    setAddingToCart(false);
  };

  const handleMessage = async () => {
    if (!user) { Alert.alert("Sign in required", "Please sign in to message sellers."); return; }
    if (!listing) return;
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: listing.seller_id,
      listing_id: listing.id,
      content: `Hi! I'm interested in your listing: ${listing.title}`,
    });
    if (!error) {
      Alert.alert("Message sent!", "The seller will reply soon.");
      router.push("/(tabs)/messages");
    }
  };

  /**
   * Starts Stripe hosted checkout for this listing.
   * Secret actions stay on the backend; client only opens returned Checkout URL.
   */
  const handleBuyNow = async () => {
    if (!user) {
      Alert.alert("Sign in required", "Please sign in to buy this item.");
      return;
    }
    if (!listing) return;
    if (!sellerPaymentState.hasAccount || !sellerPaymentState.readyToReceivePayments) {
      Alert.alert("Seller has not enabled payments yet");
      return;
    }
    if (!listing.stripe_price_id) {
      Alert.alert("Payment setup pending");
      return;
    }

    setCreatingCheckout(true);
    try {
      const checkoutUrl = await createCheckoutSession(listing.id, user.id);
      await Linking.openURL(checkoutUrl);
    } catch (error: any) {
      Alert.alert("Checkout unavailable", error?.message || "Could not start checkout.");
    } finally {
      setCreatingCheckout(false);
    }
  };

  const handleSyncPaymentSetup = async () => {
    if (!user || !listing) return;
    setSyncingPaymentSetup(true);
    try {
      await syncListingStripeProduct(listing.id);
      await fetchListing();
      Alert.alert("Payment setup ready", "Listing payment setup has been refreshed.");
    } catch (error: any) {
      Alert.alert("Payment setup pending", error?.message || "Could not sync listing payment setup.");
    } finally {
      setSyncingPaymentSetup(false);
    }
  };

  const conditionLabel: Record<string, string> = {
    new: "New",
    like_new: "Like New",
    good: "Good",
    fair: "Fair",
  };

  if (!listing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} bounces={false}>

        {/* Hero image */}
        <View style={styles.imageWrap}>
          {listing.images?.[0] ? (
            <Image source={{ uri: listing.images[0] }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: "#F5EEE6" }]} />
          )}

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={20} color="#111" />
          </TouchableOpacity>

          {/* Condition badge */}
          {listing.condition && (
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionBadgeText}>{conditionLabel[listing.condition] || listing.condition}</Text>
            </View>
          )}
        </View>

        {/* Bottom sheet */}
        <View style={styles.sheet}>

          {/* Title + price */}
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>${listing.price}</Text>

          {/* Seller row */}
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Ionicons name="person" size={14} color="#9CA3AF" />
            </View>
            <Text style={styles.sellerLabel}>@seller</Text>
          </View>

          {/* Meta pills */}
          <View style={styles.metaRow}>
            {listing.size && (
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>{listing.size}</Text>
              </View>
            )}
            {listing.brand && (
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>{listing.brand}</Text>
              </View>
            )}
            {listing.condition && (
              <View style={[styles.metaPill, styles.metaPillAccent]}>
                <Text style={[styles.metaPillText, styles.metaPillTextAccent]}>
                  {conditionLabel[listing.condition] || listing.condition}
                </Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {listing.tags?.length > 0 && (
            <View style={styles.tagsRow}>
              {listing.tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          {listing.description && (
            <Text style={styles.description}>{listing.description}</Text>
          )}

          {/* Actions */}
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleMessage} activeOpacity={0.85}>
            <Ionicons name="chatbubble-outline" size={16} color="#111" />
            <Text style={styles.secondaryBtnText}>Message seller</Text>
          </TouchableOpacity>

          {(!sellerPaymentState.hasAccount || !sellerPaymentState.readyToReceivePayments) ? (
            <View style={styles.warningPill}>
              <Text style={styles.warningText}>Seller has not enabled payments yet</Text>
            </View>
          ) : !listing.stripe_price_id ? (
            user?.id === listing.seller_id ? (
              <TouchableOpacity
                style={[styles.primaryBtn, syncingPaymentSetup && styles.primaryBtnDisabled]}
                onPress={handleSyncPaymentSetup}
                activeOpacity={0.85}
                disabled={syncingPaymentSetup}
              >
                <Ionicons name="sync-outline" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>
                  {syncingPaymentSetup ? "Setting up..." : "Set up payment for this listing"}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.warningPill}>
                <Text style={styles.warningText}>Payment setup pending</Text>
              </View>
            )
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, creatingCheckout && styles.primaryBtnDisabled]}
              onPress={handleBuyNow}
              activeOpacity={0.85}
              disabled={creatingCheckout}
            >
              <Ionicons name="card-outline" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>
                {creatingCheckout ? "Starting checkout..." : "Buy Now"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, (addingToCart || inCart) && styles.primaryBtnDisabled]}
            onPress={handleAddToCart}
            activeOpacity={0.85}
            disabled={addingToCart || inCart}
          >
            <Ionicons name={inCart ? "checkmark" : "bag-outline"} size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>
              {inCart ? "Added to Cart" : addingToCart ? "Adding..." : "Add to Cart"}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 8 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#9CA3AF", fontSize: 15 },

  imageWrap: { width: "100%", height: IMAGE_HEIGHT, backgroundColor: "#F5EEE6" },
  heroImage: { width: "100%", height: "100%" },

  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  conditionBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  conditionBadgeText: { fontSize: 12, fontWeight: "700", color: "#111" },

  sheet: {
    marginTop: -24,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 4,
  },

  title: { fontSize: 24, fontWeight: "800", color: "#111", marginBottom: 6 },
  price: { fontSize: 22, fontWeight: "800", color: "#E57200", marginBottom: 14 },

  sellerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  sellerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  sellerLabel: { fontSize: 14, color: "#9CA3AF", fontWeight: "500" },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  metaPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  metaPillAccent: { backgroundColor: "#FFF4E8" },
  metaPillText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  metaPillTextAccent: { color: "#E57200" },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  tagChipText: { fontSize: 12, color: "#6B7280" },

  description: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 20,
  },

  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "700", color: "#111" },
  warningPill: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#F8FAFC",
  },
  warningText: {
    color: "#6B7A90",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 999,
    backgroundColor: "#232D4B",
    shadowColor: "#232D4B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0 },
  primaryBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
