import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { AUTH_COLORS, AUTH_SHADOWS, AUTH_SPACING } from '@/constants/authTheme'

type SocialAuthButtonsProps = {
  onGooglePress?: () => void
  onMicrosoftPress?: () => void
}

function SocialButton({
  label,
  icon,
  onPress,
}: {
  label: string
  icon: 'google' | 'microsoft'
  onPress?: () => void
}) {
  return (
    <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={22} color={AUTH_COLORS.uvaBlue} />
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  )
}

export function SocialAuthButtons({ onGooglePress, onMicrosoftPress }: SocialAuthButtonsProps) {
  return (
    <>
      <SocialButton label="Continue with Google" icon="google" onPress={onGooglePress} />
      <SocialButton
        label="Continue with Microsoft"
        icon="microsoft"
        onPress={onMicrosoftPress}
      />
    </>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: AUTH_COLORS.border,
    borderRadius: AUTH_SPACING.inputRadius,
    backgroundColor: AUTH_COLORS.white,
    paddingVertical: 18,
    paddingHorizontal: AUTH_SPACING.inputHorizontal,
    marginBottom: 14,
    ...AUTH_SHADOWS.social,
  },
  buttonPressed: {
    backgroundColor: AUTH_COLORS.softBlueTint,
    opacity: 0.92,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AUTH_COLORS.uvaBlue,
  },
})
