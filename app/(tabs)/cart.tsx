import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
  };
};

export default function CartScreen() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("cart_items")
      .select("id, listing:listing_id(id, title, price, images, size, seller_id)")
      .eq("user_id", user.id);
    setItems((data as CartItem[]) || []);
    setLoading(false);
  };

  const removeItem = async (cartItemId: string) => {
    await supabase.from("cart_items").delete().eq("id", cartItemId);
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const handleCheckout = () => {
    Alert.alert("Checkout", "Payment flow coming soon!");
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
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} activeOpacity={0.85}>
              <Text style={styles.checkoutBtnText}>Checkout</Text>
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
  checkoutBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
});
