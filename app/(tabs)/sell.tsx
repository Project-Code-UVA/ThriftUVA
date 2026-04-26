import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { syncListingStripeProduct } from "../../lib/stripeApi";
import { useSupabaseClient } from "../../lib/supabase";

const AVAILABLE_TAGS = [
  "#vintage", "#y2k", "#90s", "#uva", "#gameday", "#preppy", "#boho",
  "#streetwear", "#athleisure", "#cottagecore", "#grunge", "#academia",
  "#formal", "#casual", "#sustainable", "#thrifted", "#designer", "#luxury",
  "#hoodie", "#jacket", "#dress", "#jeans", "#tshirt", "#blouse", "#sweater",
  "#cardigan", "#shorts", "#skirt", "#coat", "#vest", "#romper",
  "#red", "#blue", "#green", "#black", "#white", "#pink", "#purple",
  "#brown", "#gray", "#multicolor", "#floral", "#striped", "#denim",
  "#new", "#like_new", "#good", "#fair", "#preloved", "#upcycled",
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];
const CATEGORIES = ["Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories", "Activewear", "Formal", "Vintage", "Other"];
const CONDITIONS = [
  { label: "New", value: "new" },
  { label: "Like New", value: "like_new" },
  { label: "Good", value: "good" },
  { label: "Fair", value: "fair" },
];
export default function SellScreen() {
  const supabase = useSupabaseClient();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagQuery, setTagQuery] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImageUris, setSelectedImageUris] = useState<string[]>([]);

  const filteredTags = useMemo(() =>
    AVAILABLE_TAGS.filter(
      (t) => t.includes(tagQuery.toLowerCase()) && !selectedTags.includes(t)
    ),
    [tagQuery, selectedTags]
  );

  const addTag = (tag: string) => {
    setSelectedTags((prev) => [...prev, tag]);
    setTagQuery("");
    setShowTagDropdown(false);
  };

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  /**
   * Lets the seller pick up to 6 images from their library.
   */
  const handlePickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow photo access to upload item images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 6,
    });

    if (result.canceled) return;

    const uris = result.assets.map((asset) => asset.uri).filter(Boolean);
    setSelectedImageUris((prev) => [...new Set([...prev, ...uris])].slice(0, 6));
  };

  const removeImage = (uri: string) => {
    setSelectedImageUris((prev) => prev.filter((item) => item !== uri));
  };

  /**
   * Uploads selected local images to Supabase Storage and returns public URLs.
   * If upload fails, we throw and caller decides whether to continue listing creation.
   */
  const uploadListingImages = async (listingId: string) => {
    if (!user || selectedImageUris.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (let index = 0; index < selectedImageUris.length; index += 1) {
      const uri = selectedImageUris[index];
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `${Date.now()}-${index}.jpg`;
      const objectPath = `${user.id}/${listingId}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(objectPath, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(objectPath);

      if (publicUrlData?.publicUrl) {
        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !price || !selectedCategory || !selectedCondition) {
      Alert.alert("Missing fields", "Please fill in title, price, category, and condition.");
      return;
    }
    if (!user) {
      Alert.alert("Not signed in", "You must be signed in to list an item.");
      return;
    }

    setSubmitting(true);
    const { data: insertedListing, error } = await supabase
      .from("listings")
      .insert({
        seller_id: user.id,
        title: title.trim(),
        price: parseFloat(price),
        description: description.trim() || null,
        brand: brand.trim() || null,
        size: selectedSize || null,
        category: selectedCategory.toLowerCase(),
        condition: selectedCondition,
        tags: selectedTags,
        images: [],
      })
      .select("id")
      .single();

    if (error) {
      Alert.alert("Error", "Could not create listing. Please try again.");
      console.error(error);
    } else {
      let paymentSetupPending = false;
      let imageUploadPending = false;

      // Best-effort image upload. Listing creation still succeeds if uploads fail.
      if (insertedListing?.id && selectedImageUris.length > 0) {
        try {
          const uploadedImageUrls = await uploadListingImages(insertedListing.id);
          if (uploadedImageUrls.length > 0) {
            const { error: updateImagesError } = await supabase
              .from("listings")
              .update({ images: uploadedImageUrls })
              .eq("id", insertedListing.id);
            if (updateImagesError) {
              imageUploadPending = true;
              console.warn("[listing-images] Listing created but image URL save failed:", updateImagesError);
            }
          }
        } catch (imageError) {
          imageUploadPending = true;
          console.warn("[listing-images] Listing created but image upload failed:", imageError);
        }
      }

      // Best-effort Stripe product sync for the listing.
      // If the sample server is not configured, listing creation still succeeds.
      if (insertedListing?.id) {
        try {
          await syncListingStripeProduct(insertedListing.id);
        } catch (syncError) {
          paymentSetupPending = true;
          console.warn("[stripe-sync] Listing created but Stripe sync request failed:", syncError);
        }
      }
      if (paymentSetupPending && imageUploadPending) {
        Alert.alert("Listed!", "Listing created, but payment and image setup are still pending.");
      } else if (paymentSetupPending) {
        Alert.alert("Listed!", "Listing created, but payment setup is still pending.");
      } else if (imageUploadPending) {
        Alert.alert("Listed!", "Listing created, but image upload is still pending.");
      } else {
        Alert.alert("Listed!", "Your item is now live.");
      }
      setTitle(""); setPrice(""); setDescription(""); setBrand("");
      setSelectedSize(""); setSelectedCategory(""); setSelectedCondition("");
      setSelectedTags([]);
      setSelectedImageUris([]);
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Text style={styles.header}>List an Item</Text>

          {/* Photo upload placeholder */}
          <TouchableOpacity style={styles.photoBox} activeOpacity={0.8} onPress={handlePickImages}>
            <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
            <Text style={styles.photoLabel}>
              {selectedImageUris.length > 0 ? "Edit Photos" : "Add Photos"}
            </Text>
            <Text style={styles.photoSub}>Tap to select up to 6 images</Text>
          </TouchableOpacity>

          {selectedImageUris.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previewRow}
            >
              {selectedImageUris.map((uri) => (
                <View key={uri} style={styles.previewWrap}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removePreviewBtn}
                    onPress={() => removeImage(uri)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Vintage UVA Gameday Crewneck"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Brand + Price row */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Brand</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Nike"
                placeholderTextColor="#9CA3AF"
                value={brand}
                onChangeText={setBrand}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Price</Text>
              <TextInput
                style={styles.input}
                placeholder="$0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          {/* Size */}
          <View style={styles.field}>
            <Text style={styles.label}>Size</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {SIZES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.optionChip, selectedSize === s && styles.optionChipActive]}
                  onPress={() => setSelectedSize(selectedSize === s ? "" : s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionChipText, selectedSize === s && styles.optionChipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.gridChips}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.optionChip, selectedCategory === c && styles.optionChipActive]}
                  onPress={() => setSelectedCategory(selectedCategory === c ? "" : c)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionChipText, selectedCategory === c && styles.optionChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Condition */}
          <View style={styles.field}>
            <Text style={styles.label}>Condition</Text>
            <View style={styles.gridChips}>
              {CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.optionChip, selectedCondition === c.value && styles.optionChipActive]}
                  onPress={() => setSelectedCondition(selectedCondition === c.value ? "" : c.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionChipText, selectedCondition === c.value && styles.optionChipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tags */}
          <View style={[styles.field, { zIndex: 100 }]}>
            <Text style={styles.label}>Tags</Text>
            {selectedTags.length > 0 && (
              <View style={styles.selectedTags}>
                {selectedTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.selectedTag}
                    onPress={() => removeTag(tag)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.selectedTagText}>{tag}</Text>
                    <Ionicons name="close" size={12} color="#fff" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={{ position: "relative" }}>
              <TextInput
                style={styles.input}
                placeholder="Search tags..."
                placeholderTextColor="#9CA3AF"
                value={tagQuery}
                onChangeText={(t) => { setTagQuery(t); setShowTagDropdown(t.length > 0); }}
                onFocus={() => tagQuery.length > 0 && setShowTagDropdown(true)}
              />
              {showTagDropdown && filteredTags.length > 0 && (
                <View style={styles.dropdown}>
                  <ScrollView style={{ maxHeight: 150 }} keyboardShouldPersistTaps="handled">
                    {filteredTags.map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        style={styles.dropdownItem}
                        onPress={() => addTag(tag)}
                      >
                        <Text style={styles.dropdownText}>{tag}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          <View style={[styles.field, { zIndex: 1 }]}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the item — fit, wear, history..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? "Listing..." : "List Item"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },

  header: {
    fontSize: 26,
    fontWeight: "800",
    color: "#232D4B",
    marginBottom: 20,
  },

  photoBox: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    marginBottom: 24,
    gap: 6,
  },
  photoLabel: { fontSize: 15, fontWeight: "700", color: "#374151" },
  photoSub: { fontSize: 12, color: "#9CA3AF" },
  previewRow: { gap: 10, marginBottom: 20 },
  previewWrap: {
    position: "relative",
    width: 96,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
  },
  removePreviewBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(17,17,17,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },

  row: { flexDirection: "row", gap: 12 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 8, letterSpacing: 0.3 },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111",
    backgroundColor: "#fff",
  },
  textArea: { height: 96, textAlignVertical: "top", paddingTop: 12 },

  chipScroll: { gap: 8 },
  gridChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  optionChipActive: { backgroundColor: "#232D4B", borderColor: "#232D4B" },
  optionChipText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  optionChipTextActive: { color: "#fff" },

  selectedTags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  selectedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#232D4B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  selectedTagText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  dropdown: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    zIndex: 999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  dropdownText: { fontSize: 14, color: "#111" },

  submitBtn: {
    backgroundColor: "#E57200",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#E57200",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnDisabled: { backgroundColor: "#D1D5DB", shadowOpacity: 0 },
  submitBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
