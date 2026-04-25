import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import BottomNav from "../components/BottomNav";

export default function Upload() {
  // Existing State
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // New State Fields
  const [itemName, setItemName] = useState("");
  const [size, setSize] = useState("");
  const [clothingType, setClothingType] = useState("");

  const availableTags = ["#orange", "#shirt", "#vintage", "#uva", "#shoes", "#accessories", "#pants", "#blue", "#cotton", "#large",
    "#small", "#medium", "#summer", "#winter", "#formal", "#casual", "#denim", "#leather", "#sneakers", "#heels", "#bags", "#hats", "#scarves", "#jewelry", "#retro", "#modern", "#unisex", "#kids", "#men", "#women", "#brandname", "#handmade", "#sustainable", "#limitededition", "#sale", "#newarrival", "#classic", "#trendy", "#boho", "#preloved", "#upcycled", "#designer", "#streetwear", "#athleisure", "#luxury", "#budgetfriendly",
    "#colorful", "#monochrome", "#patterned", "#plain", "#oversized", "#fitted", "#cropped", "#longsleeve", "#shortsleeve", "#sleeveless", "#hoodie", "#jacket", "#coat", "#dress", "#skirt", "#pantsuit", "#jeans", "#shorts", "#tshirt", "#blouse", "#sweater", "#cardigan", "#vest", "#romper", "#jumpsuit", "#swimsuit", "#activewear", "#loungewear", "#workwear", "#partywear", "#formalwear", "#casualwear", "#vintagefinds", "#thriftedstyle", "#sustainablefashion", "#ethicalfashion", "#slowfashion", "#secondhandstyle", "#prelovedfashion", "#upcycledfashion", "#handmeDowns", "#resaleFinds",
    "#fashionRevolution", "#consciousFashion", "#ecofriendlyFashion", "#zerowasteFashion", "#circularFashion", "#fairtradeFashion", "#veganFashion", "#crueltyfreeFashion", "#organicFashion", "#recycledFashion", "#localFashion", "#artisanalFashion", "#bespokeFashion", "#customMadeFashion", "#limitedEditionFashion", "#oneOfAKindFashion", "#uniqueStyle", "#personalStyle", "#individualityInStyle", "#red", "#green", "#yellow", "#black", "#white", "#pink", "#purple", "#brown", "#gray", "#multicolor", "#floral", "#striped", "#polkaDots", "#plaid", "#camouflage", "#animalPrint", "#geometricPrint", "#abstractPrint", "#graphicPrint",
    "#solidColor", "#colorBlocking", "#ombre", "#tieDye", "#distressed", "#embellished", "#embroidered", "#beaded", "#sequined", "#fringed", "#ripped", "#patched", "#layered", "#asymmetrical", "#cutOuts", "#mesh", "#sheer", "#lace", "#satin", "#silk", "#velvet", "#denimFabric", "#leatherFabric", "#cottonFabric", "#woolFabric", "#linenFabric", "#basicallynew", "#gentlyUsed"];

  const filteredTags = useMemo(() => {
    return availableTags.filter(tag => 
      tag.toLowerCase().includes(searchQuery.toLowerCase()) && 
      !selectedTags.includes(tag)
    );
  }, [searchQuery, selectedTags]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.responsiveWrapper}>
          
          <Text style={styles.headerText}>THRIFT UVA</Text>

          {/* Upload Box */}
          <View style={styles.uploadBox}>
            <Text style={styles.uploadTitle}>Select Photos to Upload</Text>
            <TouchableOpacity style={styles.selectButton}>
              <Text style={styles.selectButtonText}>Select Files</Text>
            </TouchableOpacity>
          </View>

          {/* Item Name Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Outfit Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Vintage UVA Gameday Fit" 
              value={itemName}
              onChangeText={setItemName}
              placeholderTextColor="#999"
            />
          </View>

          {/* Sizing and Type (Side by Side) */}
          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Size</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Medium" 
                value={size}
                onChangeText={setSize}
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Type</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Hoodie" 
                value={clothingType}
                onChangeText={setClothingType}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Tag Section */}
          <View style={[styles.formGroup, { zIndex: 1000, elevation: 1000 }]}>
            {selectedTags.length > 0 && (
              <View style={styles.selectedTagsArea}>
                <Text style={styles.subLabel}>Selected Tags:</Text>
                <View style={styles.selectedTagsRow}>
                  {selectedTags.map(tag => (
                    <TouchableOpacity 
                      key={tag} 
                      style={styles.activeTagChip} 
                      onPress={() => toggleTag(tag)}
                    >
                      <Text style={styles.activeTagText}>{tag}  ✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.label}>Add Tags</Text>
            <View style={styles.searchWrapper}>
              <TextInput 
                style={styles.input} 
                placeholder="Search tags..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setIsDropdownOpen(text.length > 0);
                }}
                onFocus={() => {
                   if(searchQuery.length > 0) setIsDropdownOpen(true);
                }}
              />
              
              {isDropdownOpen && (
                <View style={styles.dropdown}>
                  <ScrollView style={{ maxHeight: 150 }} keyboardShouldPersistTaps="handled">
                    {filteredTags.length > 0 ? (
                      filteredTags.map((tag) => (
                        <TouchableOpacity 
                          key={tag} 
                          style={styles.dropdownItem} 
                          onPress={() => toggleTag(tag)}
                        >
                          <Text style={styles.dropdownText}>{tag}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.dropdownItem}>
                        <Text style={styles.noResultText}>No tags found</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Other Fields */}
          <View style={[styles.formGroup, { zIndex: 1 }]}>
            <Text style={styles.label}>Selling Price</Text>
            <TextInput 
              style={styles.input} 
              placeholder="$00.00" 
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              placeholderTextColor="#999"
            />
          </View>

          <View style={[styles.formGroup, { zIndex: 1 }]}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Type a description..."
              multiline={true}
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity style={styles.uploadItemButton}>
            <Text style={styles.uploadItemText}>Upload Item</Text>
          </TouchableOpacity>
          
        </View>
      </ScrollView>

      <View style={styles.navWrapper}>
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1, alignItems: "center", paddingTop: 40, paddingBottom: 120 },
  responsiveWrapper: { width: "100%", maxWidth: 500, paddingHorizontal: 20 },
  headerText: { fontSize: 42, fontWeight: "300", textAlign: "center", marginBottom: 20 },
  
  uploadBox: {
    width: "100%", aspectRatio: 1.4, borderWidth: 1, borderRadius: 30,
    justifyContent: "center", alignItems: "center", marginBottom: 25
  },
  uploadTitle: { fontSize: 18, fontWeight: "600", marginBottom: 15 },
  selectButton: { backgroundColor: "#E0E0E0", paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20 },
  
  formGroup: { width: "100%", marginBottom: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  label: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  subLabel: { fontSize: 14, color: "#666", marginBottom: 5 },
  
  searchWrapper: { position: "relative" },
  dropdown: {
    position: "absolute",
    top: 52, 
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 12,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  dropdownItem: { padding: 15, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
  dropdownText: { fontSize: 16, color: "#000" },
  noResultText: { color: "#999", fontStyle: "italic" },

  selectedTagsArea: { marginBottom: 15 },
  selectedTagsRow: { flexDirection: "row", flexWrap: "wrap" },
  activeTagChip: { 
    backgroundColor: "#000", paddingHorizontal: 12, paddingVertical: 6, 
    borderRadius: 15, marginRight: 8, marginBottom: 8 
  },
  activeTagText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  input: { 
    width: "100%", height: 48, borderWidth: 1, borderRadius: 15, 
    paddingHorizontal: 15, fontSize: 16, backgroundColor: "#fff" 
  },
  textArea: { height: 100, textAlignVertical: "top", paddingTop: 12 },
  
  uploadItemButton: { backgroundColor: "#E0E0E0", paddingVertical: 15, borderRadius: 25, alignItems: "center", marginTop: 10 },
  uploadItemText: { fontSize: 18, fontWeight: "700" },
  navWrapper: { position: "absolute", bottom: 0, width: "100%", alignItems: "center" }
});