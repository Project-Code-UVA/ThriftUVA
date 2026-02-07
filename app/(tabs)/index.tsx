import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <Text style={styles.logo}>THRIFT UVA</Text>

      <View style={styles.row}>
        {/* Search bar */}
        <TextInput
          style={styles.search}
          placeholder="Search…"
          placeholderTextColor="#888"
        />
        {/* Filter button */}
        <TouchableOpacity style={styles.filterButton}>
            <Text style={{ color: "#888", fontWeight: "bold" }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Item catalog */}
      <Text style={styles.sectionTitle}>Recommended</Text>

      {/* Row of items */}
      <View style={styles.sectionRow}>
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={styles.item}>
            {/* Rectangle placeholder */}
            <View style={styles.placeholder} />

            {/* Item title */}
            <Text style={styles.itemTitle}>Item {i + 1}</Text>

            {/* Item price */}
            <Text style={styles.itemPrice}>$0.00</Text>
          </View>
        ))}
      </View>

      {/* Item catalog */}
      <Text style={styles.sectionTitle}>New</Text>

      {/* Row of items */}
      <View style={styles.sectionRow}>
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={styles.item}>
            {/* Rectangle placeholder */}
            <View style={styles.placeholder} />

            {/* Item title */}
            <Text style={styles.itemTitle}>Item {i + 1}</Text>

            {/* Item price */}
            <Text style={styles.itemPrice}>$0.00</Text>
          </View>
        ))}
      </View>

      <View style={styles.bottomNav}>
        <Text style={styles.navItem}>Home</Text>
        <Text style={styles.navItem}>Search</Text>
        <Text style={styles.navItem}>Sell</Text>
        <Text style={styles.navItem}>Profile</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingHorizontal: 20,
    flex: 1,
    backgroundColor: "#fff",
  },
  logo: {
    fontSize: 45,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: 'center',
    alignItems: "center",
    gap: 10,
    marginBottom: 60,
  },
  search: {
    backgroundColor: "#f2f2f2",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    fontSize: 16,
    textAlign: 'center',
    width: '70%',
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f2f2f2",
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },

  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 40,
  },
  item: {
    width: 100,
  },
  placeholder: {
    width: '100%',
    height: 150,
    backgroundColor: "#e5e5e5",
    borderRadius: 8,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
    marginBottom: 50,
  },
  bottomNav: {
  position: "absolute",
  bottom: 40,
  alignSelf: "center",
  height: 60,
  width: '90%',
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

navItem: {
  fontSize: 14,
  fontWeight: "600",
},

});
