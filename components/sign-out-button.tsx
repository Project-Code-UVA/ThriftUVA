import { ThemedText } from '@/components/themed-text'
import { useAuth, useClerk } from '@clerk/expo'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet } from 'react-native'

export const SignOutButton = () => {
  const { isLoaded: authLoaded } = useAuth()
  const { signOut } = useClerk()
  const router = useRouter()

  const handleSignOut = async () => {
    if (!authLoaded || !signOut) return
    try {
      await signOut()
      router.replace('/(auth)/sign-in')
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }

  if (!authLoaded) return null

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={handleSignOut}
    >
      <ThemedText style={styles.buttonText}>Sign out</ThemedText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
})