import { useAuth, useSignUp } from '@clerk/expo'
import { type Href, useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AuthCard } from '@/components/auth/AuthCard'
import { AuthDivider } from '@/components/auth/AuthDivider'
import { AuthFooterLink } from '@/components/auth/AuthFooterLink'
import { AuthInput } from '@/components/auth/AuthInput'
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton'
import { AuthScreenShell } from '@/components/auth/AuthScreenShell'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import { AUTH_COPY } from '@/constants/authCopy'

export default function Page() {
  const { signUp, errors, fetchStatus } = useSignUp()
  const { isSignedIn } = useAuth()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')

  const handleSubmit = async () => {
    const { error } = await signUp.password({ emailAddress, password })
    console.log('error:', JSON.stringify(error, null, 2))
    console.log('signUp.status:', signUp.status)
    if (error) return
    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl('/')
          router.push(url as Href)
        },
      })
    } else {
      console.log('status is not complete, it is:', signUp.status)
    }
  }

  if (signUp.status === 'complete' || isSignedIn) return null

  return (
    <View style={{ flex: 1 }}>
      <AuthScreenShell
        eyebrow={AUTH_COPY.eyebrow}
        title="ThriftUVA"
        subtitle={AUTH_COPY.signUp.subtitle}
        supportingText={AUTH_COPY.signUp.supporting}
      >
        <AuthCard>
          <SocialAuthButtons />
          <AuthDivider text={AUTH_COPY.divider} />
          <AuthInput
            label="Email address"
            autoCapitalize="none"
            autoCorrect={false}
            value={emailAddress}
            placeholder="you@example.com"
            onChangeText={setEmailAddress}
            keyboardType="email-address"
            editable={fetchStatus !== 'fetching'}
            errorText={errors?.fields?.emailAddress?.message}
          />
          <AuthInput
            label="Password"
            value={password}
            placeholder="Min. 8 characters"
            secureTextEntry
            onChangeText={setPassword}
            editable={fetchStatus !== 'fetching'}
            errorText={errors?.fields?.password?.message}
          />
          <AuthPrimaryButton
            label={fetchStatus === 'fetching' ? 'Creating account…' : 'Create account'}
            onPress={handleSubmit}
            disabled={!emailAddress || !password || fetchStatus === 'fetching'}
          />
          <AuthFooterLink
            prompt="Already have an account?"
            actionText="Sign in"
            href="/(auth)/sign-in"
          />
        </AuthCard>
      </AuthScreenShell>
      <View nativeID="clerk-captcha" style={styles.captcha} />
    </View>
  )
}
const styles = StyleSheet.create({
  captcha: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
  },
})
