// Product details screen
import React from "react";
import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

const TAGS = ["Top", "Blue", "Denim"];

export default function CuteTopScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Image header */}
        {/* Image header */}
        <View style={styles.imageWrap}>
        <Image
            source={{
            uri: "https://i.pinimg.com/736x/e5/ab/8a/e5ab8a5ec0a3f608e047f6b4f7a71974.jpg",
            }}
            style={styles.heroImage}
            resizeMode="cover"
        />

        {/* Back button (top-left) */}
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.8}>
            <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>

        {/* Carousel dots (optional) */}
        {/*
        <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotInactive]} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotInactive]} />
        </View>
        */}
        </View>


        {/* Bottom sheet card */}
        <View style={styles.sheet}>
          <Text style={styles.title}>Cute Top</Text>
          <Text style={styles.price}>$20.20</Text>

          {/* Seller row */}
          <View style={styles.sellerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarIcon}></Text>
            </View>
            <Text style={styles.sellerName}>Seller Name</Text>
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            {TAGS.map((t) => (
              <View key={t} style={styles.tagPill}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <Text style={styles.desc}>
            Cute blue denim top. Lightly worn and sized at a medium. Comfortable
            material and true to size. Owned for 1 year.
          </Text>

          {/* Buttons */}
          <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>Message seller</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.9}>
            <Text style={styles.primaryBtnText}>Add to cart</Text>
          </TouchableOpacity>

          {/* Spacer to mimic extra white area */}
          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const IMAGE_HEIGHT = Math.round(width * 1.25);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1 },
  content: { paddingBottom: 24 },

  imageWrap: {
    width: "100%",
    height: IMAGE_HEIGHT,
    backgroundColor: "#EEE",
  },
  heroImage: { width: "100%", height: "100%" },

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

//   dotsRow: {
//     position: "absolute",
//     bottom: 14,
//     width: "100%",
//     flexDirection: "row",
//     justifyContent: "center",
//     gap: 8,
//   },
//   dot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//   },
//   dotActive: { backgroundColor: "#FFFFFF" },
//   dotInactive: { backgroundColor: "rgba(255,255,255,0.55)" },

  sheet: {
    marginTop: -90,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    // subtle top shadow
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
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: { fontSize: 16 },
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
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "700", color: "#111" },

  primaryBtn: {
    marginTop: 12,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2278CE", // close to screenshot blue
  },
  primaryBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
});
