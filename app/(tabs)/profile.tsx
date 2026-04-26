import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/expo";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { router } from "expo-router";
import {
  createConnectedAccountForUser,
  createUserOnboardingLink,
  getUserPaymentStatus,
} from "../../lib/stripeApi";
import { useSupabaseClient } from "../../lib/supabase";

const { width } = Dimensions.get("window");
const ITEM_SIZE = (width - 16 * 2 - 10) / 2;

type Listing = {
  id: string;
  title: string;
  price: number;
  images: string[];
  status: string;
};

type PaymentStatus =
  | "not_connected"
  | "onboarding_incomplete"
  | "ready_to_receive_payments";

const TABS = ["Active", "Sold", "Purchases"];

export default function ProfileScreen() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("Active");
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [soldListings, setSoldListings] = useState<Listing[]>([]);
  const [purchases, setPurchases] = useState<Listing[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("not_connected");
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
      refreshPaymentStatus();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [activeRes, soldRes, purchaseRes] = await Promise.all([
      supabase
        .from("listings")
        .select("id, title, price, images, status")
        .eq("seller_id", user.id)
        .eq("status", "active"),
      supabase
        .from("listings")
        .select("id, title, price, images, status")
        .eq("seller_id", user.id)
        .eq("status", "sold"),
      supabase
        .from("transactions")
        .select("listing:listing_id(id, title, price, images, status)")
        .eq("buyer_id", user.id),
    ]);

    setMyListings(activeRes.data || []);
    setSoldListings(soldRes.data || []);
    setPurchases((purchaseRes.data || []).map((t: any) => t.listing).filter(Boolean));
  };

  /**
   * Reads seller payment status from backend + Stripe account API.
   */
  const refreshPaymentStatus = async () => {
    if (!user) return;
    setPaymentsLoading(true);
    try {
      const statusPayload = await getUserPaymentStatus(user.id);
      setStripeAccountId(statusPayload?.stripeAccountId || null);
      if (!statusPayload?.stripeAccountId) {
        setPaymentStatus("not_connected");
      } else if (statusPayload?.readyToReceivePayments) {
        setPaymentStatus("ready_to_receive_payments");
      } else {
        setPaymentStatus("onboarding_incomplete");
      }
    } catch (error: any) {
      const msg = error?.message || "";
      if (msg.includes("does not have stripe_account_id") || msg.includes("404")) {
        setStripeAccountId(null);
        setPaymentStatus("not_connected");
      } else {
        Alert.alert("Payments status unavailable", msg || "Could not refresh payments status.");
      }
    } finally {
      setPaymentsLoading(false);
    }
  };

  /**
   * Creates connected account when needed and opens onboarding link.
   */
  const handleSetUpPayments = async () => {
    if (!user) {
      Alert.alert("Sign in required", "Please sign in to set up seller payments.");
      return;
    }

    const contactEmail = user.primaryEmailAddress?.emailAddress;
    if (!contactEmail) {
      Alert.alert("Email required", "Add a primary email in your account before onboarding payments.");
      return;
    }

    setPaymentsLoading(true);
    try {
      if (!stripeAccountId) {
        const created = await createConnectedAccountForUser({
          appUserId: user.id,
          displayName: user.fullName || user.username || contactEmail.split("@")[0],
          contactEmail,
        });
        setStripeAccountId(created?.accountId || null);
      }

      const onboardingUrl = await createUserOnboardingLink(user.id);
      setPaymentStatus("onboarding_incomplete");
      await Linking.openURL(onboardingUrl);
    } catch (error: any) {
      Alert.alert("Payments setup unavailable", error?.message || "Could not start onboarding.");
    } finally {
      setPaymentsLoading(false);
    }
  };

  const paymentStatusLabel =
    paymentStatus === "ready_to_receive_payments"
      ? "Ready to receive payments"
      : paymentStatus === "onboarding_incomplete"
        ? "Onboarding incomplete"
        : "Not connected";

  const paymentStatusColor =
    paymentStatus === "ready_to_receive_payments"
      ? "#0F766E"
      : paymentStatus === "onboarding_incomplete"
        ? "#D97706"
        : "#6B7A90";

  const currentData =
    activeTab === "Active" ? myListings :
    activeTab === "Sold" ? soldListings :
    purchases;

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
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.cardPrice}>${item.price}</Text>
    </TouchableOpacity>
  );

  const avatarUrl = user?.imageUrl;
  const displayName = user?.fullName || user?.username || "Wahoo";
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const username = email.split("@")[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={() => signOut()}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={32} color="#9CA3AF" />
              </View>
            )}
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.username}>@{username}</Text>

          {/* Stats row */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{myListings.length}</Text>
              <Text style={styles.statLabel}>Listed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{soldListings.length}</Text>
              <Text style={styles.statLabel}>Sold</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{purchases.length}</Text>
              <Text style={styles.statLabel}>Bought</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>

          <View style={styles.paymentsCard}>
            <Text style={styles.paymentsTitle}>Seller payments</Text>
            <Text style={[styles.paymentsStatus, { color: paymentStatusColor }]}>
              {paymentStatusLabel}
            </Text>
            {stripeAccountId ? (
              <Text style={styles.paymentsMeta}>Account: {stripeAccountId}</Text>
            ) : (
              <Text style={styles.paymentsMeta}>No connected Stripe account yet.</Text>
            )}

            <View style={styles.paymentsActions}>
              <TouchableOpacity
                style={[styles.paymentsBtn, paymentsLoading && styles.paymentsBtnDisabled]}
                onPress={handleSetUpPayments}
                activeOpacity={0.85}
                disabled={paymentsLoading}
              >
                {paymentsLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.paymentsBtnText}>Set up payments</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.refreshBtn, paymentsLoading && styles.refreshBtnDisabled]}
                onPress={refreshPaymentStatus}
                activeOpacity={0.85}
                disabled={paymentsLoading}
              >
                <Text style={styles.refreshBtnText}>Refresh payment status</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid */}
        {currentData.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shirt-outline" size={36} color="#D1D5DB" />
            <Text style={styles.emptyText}>Nothing here yet</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {currentData.map((item) => (
              <View key={item.id} style={{ width: ITEM_SIZE }}>
                {renderCard({ item })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#232D4B" },
  signOutBtn: { padding: 6 },

  profileCard: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatarWrap: { marginBottom: 14 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: "#F3F4F6" },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  displayName: { fontSize: 20, fontWeight: "800", color: "#111", marginBottom: 2 },
  username: { fontSize: 14, color: "#9CA3AF", marginBottom: 20 },

  stats: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 0 },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "800", color: "#232D4B" },
  statLabel: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: "#E5E7EB" },

  editBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#232D4B",
  },
  editBtnText: { fontSize: 14, fontWeight: "700", color: "#232D4B" },
  paymentsCard: {
    marginTop: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#F8FAFC",
  },
  paymentsTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#232D4B",
    marginBottom: 4,
  },
  paymentsStatus: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  paymentsMeta: {
    fontSize: 12,
    color: "#6B7A90",
    marginBottom: 10,
  },
  paymentsActions: { gap: 8 },
  paymentsBtn: {
    backgroundColor: "#232D4B",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  paymentsBtnDisabled: { opacity: 0.6 },
  paymentsBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  refreshBtn: {
    borderWidth: 1,
    borderColor: "#D9E2EC",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  refreshBtnDisabled: { opacity: 0.6 },
  refreshBtnText: { color: "#232D4B", fontSize: 13, fontWeight: "700" },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  tabActive: { backgroundColor: "#232D4B" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#9CA3AF" },
  tabTextActive: { color: "#fff" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
  },
  card: { width: "100%" },
  cardImageWrap: {
    width: "100%",
    aspectRatio: 0.85,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardImagePlaceholder: { flex: 1, backgroundColor: "#F5EEE6" },
  cardImage: { width: "100%", height: "100%" },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#111", marginTop: 6, marginBottom: 2 },
  cardPrice: { fontSize: 14, fontWeight: "700", color: "#111" },

  emptyState: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
});
