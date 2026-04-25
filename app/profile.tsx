import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";

const fakeUserId = "0123456789";

type ProductItem = {
  id: string;
  image: string;
  title: string;
  price: string;
};

type ListingRow = {
  id: string;
  title: string | null;
  price: number | null;
  status: string | null;
  images: string[] | null;
};

type TransactionWithListingRow = {
  status: string | null;
  listing: ListingRow | ListingRow[] | null;
};

type UserProfile = {
  id: string;
  uva_email: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  currentShop: ProductItem[];
  previouslySold: ProductItem[];
  upcomingPurchases: ProductItem[];
  previousPurchases: ProductItem[];
};

const SOLD_STATUSES = new Set(["sold", "completed"]);
const COMPLETED_TRANSACTION_STATUSES = new Set(["completed", "succeeded", "paid"]);
const EXCLUDED_UPCOMING_TRANSACTION_STATUSES = new Set([
  "cancelled",
  "canceled",
  "failed",
]);

const mapListingToProductItem = (listing: ListingRow): ProductItem => ({
  id: listing.id,
  image: listing.images?.[0] ?? "",
  title: listing.title ?? "Untitled item",
  price: listing.price != null ? `$${Number(listing.price).toFixed(2)}` : "N/A",
});

const getListingFromTransaction = (
  tx: TransactionWithListingRow
): ListingRow | null => {
  if (!tx.listing) return null;
  if (Array.isArray(tx.listing)) return tx.listing[0] ?? null;
  return tx.listing;
};

export default function Profile() {
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editDisplayName, setEditDisplayName] = React.useState("");
  const [editBio, setEditBio] = React.useState("");
  const [editAvatarUrl, setEditAvatarUrl] = React.useState("");

  React.useEffect(() => {
    const loadUser = async () => {
      const baseUser = {
        id: fakeUserId,
        uva_email: "test@virginia.edu",
        display_name: "Test User",
        avatar_url: "",
      };

      await supabase.from("users").upsert(baseUser, { onConflict: "id" });

      const { data, error } = await supabase
        .from("users")
        .select("id, uva_email, display_name, avatar_url, bio")
        .eq("id", fakeUserId)
        .maybeSingle();

      if (error) {
        console.error("Failed to load user profile:", error.message);
        return;
      }

      if (!data) {
        console.error("No fake user found in users table.");
        return;
      }

      const { data: listingsData } = await supabase
        .from("listings")
        .select("id, title, price, status, images")
        .eq("seller_id", fakeUserId)
        .order("created_at", { ascending: false });

      const listings = (listingsData ?? []) as ListingRow[];

      const currentShop = listings
        .filter((listing) => !SOLD_STATUSES.has((listing.status ?? "").toLowerCase()))
        .map(mapListingToProductItem);

      const previouslySold = listings
        .filter((listing) => SOLD_STATUSES.has((listing.status ?? "").toLowerCase()))
        .map(mapListingToProductItem);

      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("status, listing:listings(id, title, price, status, images)")
        .eq("buyer_id", fakeUserId)
        .order("created_at", { ascending: false });

      const transactions = (transactionsData ?? []) as TransactionWithListingRow[];

      const previousPurchases = transactions
        .filter((tx) =>
          COMPLETED_TRANSACTION_STATUSES.has((tx.status ?? "").toLowerCase())
        )
        .map(getListingFromTransaction)
        .filter((listing): listing is ListingRow => listing !== null)
        .map(mapListingToProductItem);

      const upcomingPurchases = transactions
        .filter((tx) => {
          const status = (tx.status ?? "").toLowerCase();
          return (
            !COMPLETED_TRANSACTION_STATUSES.has(status) &&
            !EXCLUDED_UPCOMING_TRANSACTION_STATUSES.has(status)
          );
        })
        .map(getListingFromTransaction)
        .filter((listing): listing is ListingRow => listing !== null)
        .map(mapListingToProductItem);

      const loadedProfile = {
        id: data.id,
        uva_email: data.uva_email ?? baseUser.uva_email,
        display_name: data.display_name ?? baseUser.display_name,
        avatar_url: data.avatar_url ?? baseUser.avatar_url,
        bio: data.bio ?? "",
        currentShop,
        previouslySold,
        upcomingPurchases,
        previousPurchases,
      };

      setProfile(loadedProfile);
      setEditDisplayName(loadedProfile.display_name);
      setEditBio(loadedProfile.bio);
      setEditAvatarUrl(loadedProfile.avatar_url);
    };

    loadUser();
  }, []);

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loadingText}>Fetching your profile...</Text>
        <BottomNav />
      </SafeAreaView>
    );
  }

  const renderItemRow = (items: ProductItem[]) => (
    <View style={styles.sectionRow}>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>No items yet.</Text>
      ) : (
        items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/product_detail",
                params: { id: item.id },
              })
            }
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.statImage} />
            ) : (
              <View style={styles.statImagePlaceholder}>
                <Text style={styles.statImagePlaceholderText}>No image</Text>
              </View>
            )}
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemPrice}>{item.price}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const handleEditPress = () => {
    setEditDisplayName(profile.display_name);
    setEditBio(profile.bio);
    setEditAvatarUrl(profile.avatar_url);
    setIsEditing(true);
  };

  const pickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow photo access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setEditAvatarUrl(imageUri);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditDisplayName(profile.display_name);
    setEditBio(profile.bio);
    setEditAvatarUrl(profile.avatar_url);
  };

  const handleSaveProfile = async () => {
    const trimmedName = editDisplayName.trim();
    const trimmedBio = editBio.trim();
    const trimmedAvatarUrl = editAvatarUrl.trim();

    if (!trimmedName) {
      Alert.alert("Display name required", "Please enter a display name before saving.");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("users")
      .update({
        display_name: trimmedName,
        bio: trimmedBio,
        avatar_url: trimmedAvatarUrl,
      })
      .eq("id", profile.id);

    setIsSaving(false);

    if (error) {
      Alert.alert("Save failed", error.message);
      return;
    }

    setProfile({
      ...profile,
      display_name: trimmedName,
      bio: trimmedBio,
      avatar_url: trimmedAvatarUrl,
    });

    setIsEditing(false);
    Alert.alert("Saved", "Your profile has been updated.");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerText}>MY PROFILE</Text>

        <View style={styles.pfpContainer}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>?</Text>
            </View>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editSection}>
            <TextInput
              style={styles.input}
              value={editDisplayName}
              onChangeText={setEditDisplayName}
              placeholder="Display name"
              autoCapitalize="words"
            />

            <Text style={styles.username}>{profile.uva_email}</Text>

            <TextInput
              style={[styles.input, styles.bioInput]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Add description here..."
              placeholderTextColor="#6B7280"
              multiline
            />

            <TouchableOpacity style={styles.profileImageUpload} onPress={pickProfileImage}>
              {editAvatarUrl ? (
                <Image source={{ uri: editAvatarUrl }} style={styles.editAvatarPreview} />
              ) : (
                <Text style={styles.profileImageUploadText}>Upload profile picture</Text>
              )}
            </TouchableOpacity>

            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.8}
                onPress={handleCancelEdit}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                activeOpacity={0.8}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? "Saving..." : "Save Profile"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.name}>{profile.display_name}</Text>
            <Text style={styles.username}>{profile.uva_email}</Text>
            <Text style={styles.bio}>{profile.bio || "No bio yet."}</Text>

            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.8}
              onPress={handleEditPress}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.sectionTitle}>Current Shop</Text>
        {renderItemRow(profile.currentShop)}

        <Text style={styles.sectionTitle}>Previously Sold</Text>
        {renderItemRow(profile.previouslySold)}

        <Text style={styles.sectionTitle}>Upcoming Purchases</Text>
        {renderItemRow(profile.upcomingPurchases)}

        <Text style={styles.sectionTitle}>Previous Purchases</Text>
        {renderItemRow(profile.previousPurchases)}
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  content: { paddingHorizontal: 20, paddingBottom: 120 },
  headerText: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 16,
  },
  pfpContainer: { alignItems: "center" },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },
  username: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 20,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  sectionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  item: { width: 100 },
  statImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginBottom: 4,
  },
  statImagePlaceholder: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  statImagePlaceholderText: {
    fontSize: 12,
    color: "#6B7280",
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
  loadingText: {
    marginTop: 32,
    textAlign: "center",
    fontSize: 16,
    color: "#4B5563",
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 8,
  },
  editSection: { marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  bioInput: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 4,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  cancelButtonText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  profileImageUpload: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#F3F4F6",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },

  profileImageUploadText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 10,
    fontWeight: "600",
  },

  editAvatarPreview: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
});



// import React from "react";
// import { SafeAreaView, ScrollView, StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
// import BottomNav from "../components/BottomNav";
// import { router } from "expo-router";

// export default function Profile() {
//   const user = {
//     name: "ExampleUserName",
//     avatar: "https://hips.hearstapps.com/hmg-prod/images/bright-forget-me-nots-royalty-free-image-1677788394.jpg?crop=0.535xw:1.00xh;0.359xw,0",
//     bio: "2nd year. Available Times: XYZ",
//     currentShop: [
//       { id: 1, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item A", price: "$10" },
//       { id: 2, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item B", price: "$20" },
//       { id: 3, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item C", price: "$15" },
//     ],
//     previouslySold: [
//       { id: 4, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item D", price: "$8" },
//       { id: 5, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item E", price: "$12" },
//       { id: 6, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item F", price: "$18" },
//     ],
//     upcomingPurchases: [
//       { id: 7, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item G", price: "$25" },
//       { id: 8, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item H", price: "$30" },
//       { id: 9, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item I", price: "$22" },
//     ],
//     previousPurchases: [
//       { id: 10, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item J", price: "$5" },
//       { id: 11, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item K", price: "$14" },
//       { id: 12, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item L", price: "$19" },
//     ],
//   };

//   // Render clickable row with image, title, and price
//   const renderItemRow = (items) => (
//     <View style={styles.sectionRow}>
//       {items.map((item) => (
//         <TouchableOpacity
//           key={item.id}
//           style={styles.item}
//           activeOpacity={0.8}
//           onPress={() => router.push("/product_detail")}
//         >
//           <Image source={{ uri: item.image }} style={styles.statImage} />
//           <Text style={styles.itemTitle}>{item.title}</Text>
//           <Text style={styles.itemPrice}>{item.price}</Text>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.safe}>
//       <ScrollView contentContainerStyle={styles.content}>
//         <Text style={styles.headerText}>MY PROFILE</Text>

//         <View style = {styles.pfpContainer}>
//             <Image source={{ uri: user.avatar }} style={styles.avatar} />
//         </View>
//         <Text style={styles.name}>{user.name}</Text>
//         <Text style={styles.username}>{user.username}</Text>
//         <Text style={styles.bio}>{user.bio}</Text>
//         <TouchableOpacity
//           style={styles.editButton}
//           activeOpacity={0.8}
//         >
//           <Text style={styles.editButtonText}>Edit Profile</Text>
//         </TouchableOpacity>

//         <Text style={styles.sectionTitle}>Current Shop</Text>
//         {renderItemRow(user.currentShop)}

//         <Text style={styles.sectionTitle}>Previously Sold</Text>
//         {renderItemRow(user.previouslySold)}

//         <Text style={styles.sectionTitle}>Upcoming Purchases</Text>
//         {renderItemRow(user.upcomingPurchases)}

//         <Text style={styles.sectionTitle}>Previous Purchases</Text>
//         {renderItemRow(user.previousPurchases)}
//       </ScrollView>

//       <BottomNav />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: "#fff" },
//   content: { paddingHorizontal: 20, paddingBottom: 120 },
//   headerText: { fontSize: 24, fontWeight: "700", textAlign: "center", marginVertical: 16 },
//   avatar: { width: 100, height: 100, borderRadius: 50, alignSelf: "center", marginBottom: 12 },
//   name: { fontSize: 22, fontWeight: "700", color: "#111", textAlign: "center" },
//   username: { fontSize: 16, color: "#6B7280", textAlign: "center", marginBottom: 8 },
//   bio: { fontSize: 14, color: "#374151", textAlign: "center", lineHeight: 20, marginBottom: 20 },
//   editButton: {
//     backgroundColor: "#111",
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     alignSelf: "center",
//     marginBottom: 20,
//   },
//   editButtonText: {
//     color: "#fff",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
//   sectionRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
//   item: { width: 100 },
//   statImage: { width: 100, height: 150, borderRadius: 8, marginBottom: 4 },
//   itemTitle: { fontSize: 14, fontWeight: "500" },
//   itemPrice: { fontSize: 13, color: "#555", marginTop: 2 },
// });
