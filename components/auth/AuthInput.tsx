import React from 'react'
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native'
import { AUTH_COLORS, AUTH_SPACING } from '@/constants/authTheme'

type AuthInputProps = TextInputProps & {
  label: string
  errorText?: string
}

export function AuthInput({ label, errorText, style, onFocus, onBlur, ...props }: AuthInputProps) {
  const [isFocused, setIsFocused] = React.useState(false)

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          !!errorText && styles.inputError,
          style,
        ]}
        placeholderTextColor={AUTH_COLORS.mutedText}
        onFocus={(e) => {
          setIsFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          onBlur?.(e)
        }}
      />
      {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  group: {
    marginBottom: AUTH_SPACING.sectionGap,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AUTH_COLORS.uvaBlue,
    marginBottom: 10,
  },
  input: {
    backgroundColor: AUTH_COLORS.softBlueTint,
    borderWidth: 1.5,
    borderColor: AUTH_COLORS.border,
    borderRadius: AUTH_SPACING.inputRadius,
    paddingHorizontal: AUTH_SPACING.inputHorizontal,
    paddingVertical: AUTH_SPACING.inputVertical,
    fontSize: 16,
    color: AUTH_COLORS.uvaBlue,
  },
  inputFocused: {
    borderColor: AUTH_COLORS.uvaBlue,
    borderWidth: 2,
    backgroundColor: AUTH_COLORS.white,
  },
  inputError: {
    borderColor: AUTH_COLORS.error,
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: AUTH_COLORS.error,
  },
})
