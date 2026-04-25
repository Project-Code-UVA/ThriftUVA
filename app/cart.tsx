import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";

const fakeUserId = "0123456789";

export default function Cart() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          listing_id,
          listings (
            id,
            title,
            price,
            images,
            category,
            size,
            brand
          )
        `
        )
        .eq("user_id", fakeUserId)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Cart fetch error:", error);
        setCartItems([]);
      } else {
        setCartItems(data || []);
      }

      setLoading(false);
    };

    fetchCart();
  }, []);

  const removeFromCart = async (cartItemId: string) => {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId);

    if (error) {
      alert(error.message);
      return;
    }

    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const total = cartItems.reduce((sum, item) => {
    return sum + Number(item.listings?.price || 0);
  }, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Cart</Text>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && <Text style={styles.emptyText}>Loading cart...</Text>}

        {!loading && cartItems.length === 0 && (
          <Text style={styles.emptyText}>Your cart is empty.</Text>
        )}

        {!loading &&
          cartItems.map((item) => {
            const listing = item.listings;

            if (!listing) return null;

            return (
              <View key={item.id} style={styles.cartCard}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/product_detail",
                      params: { id: listing.id },
                    })
                  }
                >
                  {listing.images?.[0] ? (
                    <Image
                      source={{ uri: listing.images[0] }}
                      style={styles.itemImage}
                    />
                  ) : (
                    <View style={styles.placeholder} />
                  )}
                </TouchableOpacity>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{listing.title}</Text>
                  <Text style={styles.itemMeta}>
                    {[listing.category, listing.size, listing.brand]
                      .filter(Boolean)
                      .join(" • ")}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ${Number(listing.price).toFixed(2)}
                  </Text>

                  <TouchableOpacity
                    onPress={() => removeFromCart(item.id)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

        {!loading && cartItems.length > 0 && (
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>${total.toFixed(2)}</Text>
          </View>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 20,
  },
  content: {
    paddingBottom: 130,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: "#777",
  },
  cartCard: {
    flexDirection: "row",
    marginBottom: 18,
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    padding: 12,
  },
  itemImage: {
    width: 90,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#e5e5e5",
  },
  placeholder: {
    width: 90,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#e5e5e5",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
  },
  itemPrice: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
  },
  removeButton: {
    marginTop: 12,
  },
  removeText: {
    color: "#C0392B",
    fontWeight: "700",
  },
  totalBox: {
    marginTop: 10,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "800",
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "800",
  },
});