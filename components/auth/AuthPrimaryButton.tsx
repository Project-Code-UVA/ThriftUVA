import { Pressable, StyleSheet, Text } from 'react-native'
import { AUTH_COLORS, AUTH_SHADOWS, AUTH_SPACING } from '@/constants/authTheme'

type AuthPrimaryButtonProps = {
  label: string
  disabled?: boolean
  onPress: () => void
}

export function AuthPrimaryButton({ label, disabled, onPress }: AuthPrimaryButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    marginTop: 12,
    backgroundColor: AUTH_COLORS.uvaBlue,
    borderRadius: AUTH_SPACING.inputRadius,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...AUTH_SHADOWS.primaryButton,
  },
  buttonDisabled: {
    opacity: 0.58,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  text: {
    color: AUTH_COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
})
