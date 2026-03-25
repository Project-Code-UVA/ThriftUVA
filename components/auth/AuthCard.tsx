import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AUTH_COLORS, AUTH_SHADOWS, AUTH_SPACING } from '@/constants/authTheme'

type AuthCardProps = {
  children: React.ReactNode
}

export function AuthCard({ children }: AuthCardProps) {
  return <View style={styles.card}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    marginTop: AUTH_SPACING.cardOverlap,
    backgroundColor: AUTH_COLORS.white,
    borderRadius: AUTH_SPACING.cardRadius,
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    padding: AUTH_SPACING.cardPadding,
    ...AUTH_SHADOWS.card,
  },
})
