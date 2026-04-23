import { StyleSheet, Text, View } from 'react-native'
import { AUTH_COLORS } from '@/constants/authTheme'

type AuthDividerProps = {
  text: string
}

export function AuthDivider({ text }: AuthDividerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{text}</Text>
      <View style={styles.line} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: AUTH_COLORS.border,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: AUTH_COLORS.mutedText,
  },
})
