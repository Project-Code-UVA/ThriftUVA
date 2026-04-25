import { StyleSheet } from 'react-native'
import { AuthInput } from './AuthInput'

type VerificationCodeInputProps = {
  value: string
  onChangeText: (text: string) => void
  editable?: boolean
  errorText?: string
}

export function VerificationCodeInput({
  value,
  onChangeText,
  editable,
  errorText,
}: VerificationCodeInputProps) {
  return (
    <AuthInput
      label="Verification code"
      value={value}
      placeholder="Enter 6-digit code"
      keyboardType="numeric"
      editable={editable}
      onChangeText={onChangeText}
      errorText={errorText}
      style={styles.input}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 20,
  },
})
