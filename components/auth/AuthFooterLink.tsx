import { Link } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AUTH_COLORS } from '@/constants/authTheme'

type AuthFooterLinkProps = {
  prompt: string
  actionText: string
  href: string
}

export function AuthFooterLink({ prompt, actionText, href }: AuthFooterLinkProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>{prompt} </Text>
      <Link href={href as any} asChild>
        <Pressable hitSlop={8}>
          <Text style={styles.action}>{actionText}</Text>
        </Pressable>
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  prompt: {
    fontSize: 15,
    color: AUTH_COLORS.mutedText,
  },
  action: {
    fontSize: 15,
    fontWeight: '700',
    color: AUTH_COLORS.uvaOrange,
  },
})
