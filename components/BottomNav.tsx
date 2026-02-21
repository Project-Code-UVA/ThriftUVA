import { router, usePathname } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Route = "/" | "/search" | "/sell" | "/profile";

type Tab = {
  label: string;
  href: Route;
};

const TABS: Tab[] = [
  { label: "Home", href: "/" },
  { label: "Search", href: "/search" },
  { label: "Sell", href: "/sell" },
  { label: "Profile", href: "/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <View style={styles.bottomNav}>
      {TABS.map((t) => {
        const active = pathname === t.href;

        return (
          <TouchableOpacity
            key={t.href}
            activeOpacity={0.8}
            onPress={() => router.replace(t.href)}
          >
            <Text style={[styles.navItem, active && styles.navItemActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    height: 60,
    width: "90%",
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
    color: "#111",
  },
  navItemActive: {
    textDecorationLine: "underline",
  },
});