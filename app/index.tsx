import { router, usePathname } from "expo-router";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Route = "/" | "/cart" | "/sell" | "/message" | "/profile";

export default function Index() {
  const pathname = usePathname();

  const goTab = (href: Route) => {
    if (pathname !== href) router.replace(href);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>THRIFT UVA</Text>

      <View style={styles.row}>
        <TextInput
          style={styles.search}
          placeholder="Search…"
          placeholderTextColor="#888"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.8}>
          <Text style={styles.filterButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recommended</Text>
      <View style={styles.sectionRow}>
        {Array.from({ length: 3 }).map((_, i) => (
          <TouchableOpacity
            key={`rec-${i}`}
            style={styles.item}
            activeOpacity={0.85}
            onPress={() => router.push("/product_detail")}
          >
            <View style={styles.placeholder} />
            <Text style={styles.itemTitle}>Item {i + 1}</Text>
            <Text style={styles.itemPrice}>$0.00</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>New</Text>
      <View style={styles.sectionRow}>
        {Array.from({ length: 3 }).map((_, i) => (
          <TouchableOpacity
            key={`new-${i}`}
            style={styles.item}
            activeOpacity={0.85}
            onPress={() => router.push("/product_detail")}
          >
            <View style={styles.placeholder} />
            <Text style={styles.itemTitle}>Item {i + 1}</Text>
            <Text style={styles.itemPrice}>$0.00</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom tabs */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navSlot} activeOpacity={0.8} onPress={() => goTab("/")}>
          <Text style={[styles.navItem, pathname === "/" && styles.navItemActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navSlot}
          activeOpacity={0.8}
          onPress={() => goTab("/cart")}
        >
          <Text style={[styles.navItem, pathname === "/cart" && styles.navItemActive]}>
            Cart
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navSlot} 
          activeOpacity={0.8} 
          onPress={() => goTab("/sell")}
        >
          <Text style={[styles.navItem, pathname === "/sell" && styles.navItemActive]}>
            Sell
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navSlot} 
          activeOpacity={0.8} 
          onPress={() => goTab("/message")}
        >
          <Text style={[styles.navItem, pathname === "/message" && styles.navItemActive]}>
            Message
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navSlot}
          activeOpacity={0.8}
          onPress={() => goTab("/profile")}
        >
          <Text style={[styles.navItem, pathname === "/profile" && styles.navItemActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 45,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 60,
  },
  search: {
    width: "70%",
    backgroundColor: "#f2f2f2",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    fontSize: 16,
    textAlign: "center",
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonText: {
    color: "#888",
    fontWeight: "bold",
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 40,
  },
  item: {
    width: 100,
  },
  placeholder: {
    width: "100%",
    height: 150,
    backgroundColor: "#e5e5e5",
    borderRadius: 8,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemPrice: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
    marginBottom: 50,
  },
  bottomNav: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    width: "90%",
    height: 70,
    backgroundColor: "#fff",
    borderRadius: 40,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 8,
  },
  navSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navItem: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  navItemActive: {
    textDecorationLine: "underline",
  },
  plusButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -2,
  },
  plusButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
  },
});