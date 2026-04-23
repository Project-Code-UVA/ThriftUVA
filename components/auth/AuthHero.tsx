import { StyleSheet, Text, View } from 'react-native'
import { AUTH_COLORS } from '@/constants/authTheme'

type AuthHeroProps = {
  eyebrow: string
  title: string
  subtitle: string
  supportingText: string
}

export function AuthHero({ eyebrow, title, subtitle, supportingText }: AuthHeroProps) {
  return (
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Text style={styles.supportingText}>{supportingText}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  hero: {
    zIndex: 2,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: AUTH_COLORS.uvaOrange,
    marginBottom: 10,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: AUTH_COLORS.headingText,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '700',
    color: AUTH_COLORS.uvaBlue,
  },
  supportingText: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: AUTH_COLORS.mutedText,
  },
})
