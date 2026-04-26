import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { createCheckoutSession } from "../../lib/stripeApi";
import { useSupabaseClient } from "../../lib/supabase";

type CartItem = {
  id: string;
  listing: {
    id: string;
    title: string;
    price: number;
    images: string[];
    size: string | null;
    seller_id: string;
    stripe_price_id: string | null;
  };
};

type SellerPaymentMap = Record<
  string,
  {
    hasAccount: boolean;
    readyToReceivePayments: boolean;
  }
>;

export default function CartScreen() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerPayments, setSellerPayments] = useState<SellerPaymentMap>({});
  const [checkoutLoadingCartItemId, setCheckoutLoadingCartItemId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("cart_items")
      .select("id, listing:listing_id(id, title, price, images, size, seller_id, stripe_price_id)")
      .eq("user_id", user.id);
    const cartItems = (data as CartItem[]) || [];
    setItems(cartItems);

    const sellerIds = [...new Set(cartItems.map((item) => item.listing?.seller_id).filter(Boolean))];
    if (sellerIds.length > 0) {
      const { data: sellers } = await supabase
        .from("users")
        .select("id, stripe_account_id, stripe_ready_to_receive_payments")
        .in("id", sellerIds);

      const nextMap: SellerPaymentMap = {};
      (sellers || []).forEach((seller: any) => {
        nextMap[seller.id] = {
          hasAccount: Boolean(seller.stripe_account_id),
          readyToReceivePayments: Boolean(seller.stripe_ready_to_receive_payments),
        };
      });
      setSellerPayments(nextMap);
    } else {
      setSellerPayments({});
    }
    setLoading(false);
  };

  const removeItem = async (cartItemId: string) => {
    await supabase.from("cart_items").delete().eq("id", cartItemId);
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  /**
   * Checkout one cart item at a time by creating hosted Stripe Checkout.
   */
  const handleCheckoutItem = async (item: CartItem) => {
    if (!user) {
      Alert.alert("Sign in required", "Please sign in to continue checkout.");
      return;
    }

    const listing = item.listing;
    if (!listing) return;
    const sellerStatus = sellerPayments[listing.seller_id];
    if (!sellerStatus?.hasAccount || !sellerStatus?.readyToReceivePayments) {
      Alert.alert("Seller has not enabled payments yet");
      return;
    }
    if (!listing.stripe_price_id) {
      Alert.alert("Payment setup pending");
      return;
    }

    setCheckoutLoadingCartItemId(item.id);
    try {
      const checkoutUrl = await createCheckoutSession(listing.id, user.id);
      await Linking.openURL(checkoutUrl);
    } catch (error: any) {
      Alert.alert("Checkout unavailable", error?.message || "Could not start checkout.");
    } finally {
      setCheckoutLoadingCartItemId(null);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.listing?.price || 0), 0);

  const renderItem = ({ item }: { item: CartItem }) => {
    const listing = item.listing;
    if (!listing) return null;
    return (
      <View style={styles.cartItem}>
        <View style={styles.itemImage}>
          {listing.images?.[0] ? (
            <Image source={{ uri: listing.images[0] }} style={styles.itemImg} resizeMode="cover" />
          ) : (
            <View style={styles.itemImgPlaceholder} />
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>{listing.title}</Text>
          {listing.size && <Text style={styles.itemSize}>Size: {listing.size}</Text>}
          <Text style={styles.itemPrice}>${listing.price}</Text>
          <TouchableOpacity
            style={[
              styles.inlineCheckoutBtn,
              checkoutLoadingCartItemId === item.id && styles.inlineCheckoutBtnDisabled,
            ]}
            onPress={() => handleCheckoutItem(item)}
            disabled={checkoutLoadingCartItemId === item.id}
            activeOpacity={0.8}
          >
            <Text style={styles.inlineCheckoutBtnText}>
              {checkoutLoadingCartItemId === item.id ? "Starting..." : "Buy now"}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => removeItem(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        {items.length > 0 && (
          <Text style={styles.itemCount}>{items.length} item{items.length !== 1 ? "s" : ""}</Text>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="bag-outline" size={52} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Browse listings and add items to your cart</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={{ paddingBottom: 160 }}
          />

          {/* Checkout footer */}
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.checkoutBtn,
                (!items.length || checkoutLoadingCartItemId !== null) && styles.checkoutBtnDisabled,
              ]}
              onPress={() => items[0] && handleCheckoutItem(items[0])}
              activeOpacity={0.85}
              disabled={!items.length || checkoutLoadingCartItemId !== null}
            >
              <Text style={styles.checkoutBtnText}>Checkout first item</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#232D4B" },
  itemCount: { fontSize: 14, color: "#9CA3AF", fontWeight: "500" },

  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  itemImage: {
    width: 72,
    height: 88,
    borderRadius: 10,
    overflow: "hidden",
    flexShrink: 0,
  },
  itemImg: { width: "100%", height: "100%" },
  itemImgPlaceholder: { flex: 1, backgroundColor: "#F5EEE6" },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 4, lineHeight: 20 },
  itemSize: { fontSize: 12, color: "#9CA3AF", marginBottom: 6 },
  itemPrice: { fontSize: 16, fontWeight: "800", color: "#111" },
  inlineCheckoutBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#232D4B",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inlineCheckoutBtnDisabled: { backgroundColor: "#9CA3AF" },
  inlineCheckoutBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  removeBtn: { padding: 6 },

  separator: { height: 1, backgroundColor: "#F3F4F6", marginLeft: 16 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 16, fontWeight: "600", color: "#374151" },
  totalAmount: { fontSize: 22, fontWeight: "800", color: "#111" },
  checkoutBtn: {
    backgroundColor: "#232D4B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#232D4B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  checkoutBtnDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0, elevation: 0 },
  checkoutBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
});
