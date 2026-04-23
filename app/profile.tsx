import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import BottomNav from "../components/BottomNav";
import { router } from "expo-router";

export default function Profile() {
  const user = {
    name: "ExampleUserName",
    avatar: "https://hips.hearstapps.com/hmg-prod/images/bright-forget-me-nots-royalty-free-image-1677788394.jpg?crop=0.535xw:1.00xh;0.359xw,0",
    bio: "2nd year. Available Times: XYZ",
    currentShop: [
      { id: 1, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item A", price: "$10" },
      { id: 2, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item B", price: "$20" },
      { id: 3, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item C", price: "$15" },
    ],
    previouslySold: [
      { id: 4, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item D", price: "$8" },
      { id: 5, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item E", price: "$12" },
      { id: 6, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item F", price: "$18" },
    ],
    upcomingPurchases: [
      { id: 7, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item G", price: "$25" },
      { id: 8, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item H", price: "$30" },
      { id: 9, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item I", price: "$22" },
    ],
    previousPurchases: [
      { id: 10, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item J", price: "$5" },
      { id: 11, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item K", price: "$14" },
      { id: 12, image: "https://ae-pic-a1.aliexpress-media.com/kf/Safa7b307ec3c48caa0a598307331c355F.jpg_960x960q75.jpg_.avif", title: "Item L", price: "$19" },
    ],
  };

  // Render clickable row with image, title, and price
  const renderItemRow = (items) => (
    <View style={styles.sectionRow}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.item}
          activeOpacity={0.8}
          onPress={() => router.push("/product_detail")}
        >
          <Image source={{ uri: item.image }} style={styles.statImage} />
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemPrice}>{item.price}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerText}>MY PROFILE</Text>

        <View style = {styles.pfpContainer}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.bio}>{user.bio}</Text>
        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.8}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Current Shop</Text>
        {renderItemRow(user.currentShop)}

        <Text style={styles.sectionTitle}>Previously Sold</Text>
        {renderItemRow(user.previouslySold)}

        <Text style={styles.sectionTitle}>Upcoming Purchases</Text>
        {renderItemRow(user.upcomingPurchases)}

        <Text style={styles.sectionTitle}>Previous Purchases</Text>
        {renderItemRow(user.previousPurchases)}
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  content: { paddingHorizontal: 20, paddingBottom: 120 },
  headerText: { fontSize: 24, fontWeight: "700", textAlign: "center", marginVertical: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, alignSelf: "center", marginBottom: 12 },
  name: { fontSize: 22, fontWeight: "700", color: "#111", textAlign: "center" },
  username: { fontSize: 16, color: "#6B7280", textAlign: "center", marginBottom: 8 },
  bio: { fontSize: 14, color: "#374151", textAlign: "center", lineHeight: 20, marginBottom: 20 },
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
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  sectionRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  item: { width: 100 },
  statImage: { width: 100, height: 150, borderRadius: 8, marginBottom: 4 },
  itemTitle: { fontSize: 14, fontWeight: "500" },
  itemPrice: { fontSize: 13, color: "#555", marginTop: 2 },
});
