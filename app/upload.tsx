import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";

import {
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export default function Upload() {
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [itemName, setItemName] = useState("");
  const [size, setSize] = useState("");
  const [clothingType, setClothingType] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const availableTags = [
    "#orange", "#shirt", "#vintage", "#uva", "#shoes", "#accessories", "#pants", "#blue",
    "#cotton", "#large", "#small", "#medium", "#summer", "#winter", "#formal", "#casual",
    "#denim", "#leather", "#sneakers", "#heels", "#bags", "#hats", "#scarves", "#jewelry",
    "#retro", "#modern", "#unisex", "#kids", "#men", "#women", "#brandname", "#handmade",
    "#sustainable", "#limitededition", "#sale", "#newarrival", "#classic", "#trendy",
    "#boho", "#preloved", "#upcycled", "#designer", "#streetwear", "#athleisure", "#luxury",
    "#budgetfriendly", "#red", "#green", "#yellow", "#black", "#white", "#pink", "#purple",
    "#brown", "#gray", "#multicolor", "#floral", "#striped", "#plaid", "#solidColor",
    "#oversized", "#fitted", "#hoodie", "#jacket", "#coat", "#dress", "#skirt", "#jeans",
    "#shorts", "#tshirt", "#blouse", "#sweater", "#activewear", "#basicallynew", "#gentlyUsed",
  ];

  /* enum categories for clothing type */
  const categoryOptions = [
    "tops",
    "bottoms",
    "dresses",
    "outerwear",
    "shoes",
    "accessories",
    "activewear",
    "formal",
    "vintage",
    "other",
  ];

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const filteredTags = useMemo(() => {
    return availableTags.filter(
      (tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedTags.includes(tag)
    );
  }, [searchQuery, selectedTags]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow photo access to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages(result.assets.map((asset) => asset.uri));
    }
  };

  const uploadListing = async () => {
    try {
      setUploading(true);

      // const {
      //   data: { user },
      //   error: userError,
      // } = await supabase.auth.getUser();

      // if (userError || !user) {
      //   Alert.alert("Error", "You must be logged in to upload an item.");
      //   return;
      // }

      const user = {
        id: "0123456789",
      };

      if (!itemName.trim() || !price.trim()) {
        Alert.alert("Missing fields", "Please enter an outfit name and price.");
        return;
      }

      const uploadedImageUrls: string[] = [];

      for (const imageUri of images) {
        const response = await fetch(imageUri);
        const arrayBuffer = await response.arrayBuffer();

        const fileExt = imageUri.split(".").pop()?.split("?")[0] || "jpg";
        const filePath = `${user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("listings")
          .upload(filePath, arrayBuffer, {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("listings")
          .getPublicUrl(filePath);

        uploadedImageUrls.push(data.publicUrl);
      }

      const { error: insertError } = await supabase.from("listings").insert({
        seller_id: user.id,
        title: itemName.trim(),
        description: description.trim(),
        price: Number(price),
        size: size.trim(),
        category: clothingType || null,
        images: uploadedImageUrls,
        tags: selectedTags.map((tag) => tag.replace("#", "")),
        status: "active",
      });

      if (insertError) throw insertError;

      Alert.alert("Success", "Your item was uploaded!");

      setItemName("");
      setPrice("");
      setDescription("");
      setSize("");
      setClothingType("");
      setSelectedTags([]);
      setImages([]);
    } catch (error: any) {
      Alert.alert("Upload failed", error.message ?? "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.responsiveWrapper}>
          <Text style={styles.headerText}>THRIFT UVA</Text>

          <View style={styles.uploadBox}>
            <Text style={styles.uploadTitle}>Select Photos to Upload</Text>

            <TouchableOpacity style={styles.selectButton} onPress={pickImages}>
              <Text style={styles.selectButtonText}>Select Files</Text>
            </TouchableOpacity>

            {images.length > 0 && (
              <View style={styles.previewRow}>
                {images.map((uri) => (
                  <View key={uri} style={styles.previewWrapper}>
                    <Image source={{ uri }} style={styles.previewImage} />

                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setImages(images.filter((image) => image !== uri))}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

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

            {/* <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Hoodie"
                value={clothingType}
                onChangeText={setClothingType}
                placeholderTextColor="#999"
              />
            </View> */}
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Type</Text>

              <TouchableOpacity
                style={styles.input}
                onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              >
                <View style={styles.dropdownRow}>
                  <Text style={{ fontSize: 16, color: clothingType ? "#000" : "#999" }}>
                    {clothingType || "Select type"}
                  </Text>

                  <Text style={styles.dropdownIcon}>
                    {categoryDropdownOpen ? "▲" : "▼"}
                  </Text>
                </View>
              </TouchableOpacity>

              {categoryDropdownOpen && (
                <View style={styles.categoryDropdown}>
                  {categoryOptions.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={styles.categoryDropdownItem}
                      onPress={() => {
                        setClothingType(category);
                        setCategoryDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownText}>{category}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={[styles.formGroup, { zIndex: 1000, elevation: 1000 }]}>
            {selectedTags.length > 0 && (
              <View style={styles.selectedTagsArea}>
                <Text style={styles.subLabel}>Selected Tags:</Text>

                <View style={styles.selectedTagsRow}>
                  {selectedTags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={styles.activeTagChip}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text style={styles.activeTagText}>{tag} ✕</Text>
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
                  if (searchQuery.length > 0) setIsDropdownOpen(true);
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
              multiline
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#999"
              scrollEnabled={true}
            />
          </View>

          <TouchableOpacity
            style={[styles.uploadItemButton, uploading && { opacity: 0.6 }]}
            onPress={uploadListing}
            disabled={uploading}
          >
            <Text style={styles.uploadItemText}>
              {uploading ? "Uploading..." : "Upload Item"}
            </Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.navWrapper}>
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 120,
  },
  responsiveWrapper: { width: "100%", maxWidth: 500, paddingHorizontal: 20 },
  headerText: {
    fontSize: 45,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  uploadBox: {
    width: "100%",
    minHeight: 230,
    borderWidth: 1,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    padding: 20,
  },
  uploadTitle: { fontSize: 18, fontWeight: "600", marginBottom: 15 },
  selectButton: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  selectButtonText: { fontSize: 15, fontWeight: "600" },

  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 15,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    margin: 5,
  },

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
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  dropdownText: { fontSize: 16, color: "#000" },
  noResultText: { color: "#999", fontStyle: "italic" },

  selectedTagsArea: { marginBottom: 15 },
  selectedTagsRow: { flexDirection: "row", flexWrap: "wrap" },
  activeTagChip: {
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  activeTagText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  textArea: { height: 100, textAlignVertical: "top", paddingTop: 12 },

  uploadItemButton: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  uploadItemText: { fontSize: 18, fontWeight: "700" },
  navWrapper: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignItems: "center",
  },
  categoryDropdown: {
    position: "absolute",
    top: 55,
    left: 0, 
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 12,
    marginTop: 5,
    overflow: "hidden",
    zIndex: 9999,
    elevation: 10,
  },

  categoryDropdownItem: {
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  dropdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dropdownIcon: {
    fontSize: 14,
    color: "#666",
  },
  previewWrapper: {
    position: "relative",
    margin: 5,
  },

  removeImageButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  removeImageText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  
});