import { Pressable, StyleSheet, Text } from 'react-native'
import { AUTH_COLORS } from '@/constants/authTheme'

type AuthTextButtonProps = {
  label: string
  onPress: () => void
  disabled?: boolean
}

export function AuthTextButton({ label, onPress, disabled }: AuthTextButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, disabled && styles.textDisabled]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    marginTop: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: AUTH_COLORS.uvaOrange,
  },
  textDisabled: {
    opacity: 0.6,
  },
})
