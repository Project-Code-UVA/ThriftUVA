import { useOAuth, useSignIn } from '@clerk/expo';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

const NAVY = '#232D4B';
const ORANGE = '#E57200';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startMicrosoftFlow } = useOAuth({ strategy: 'oauth_microsoft' });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else {
        setError('Sign-in could not be completed. Please try again.');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? 'Sign-in failed. Check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'microsoft') => {
    setOauthLoading(provider);
    setError('');
    try {
      const startFlow = provider === 'google' ? startGoogleFlow : startMicrosoftFlow;
      const { createdSessionId, setActive: oauthSetActive } = await startFlow({
        redirectUrl: Linking.createURL('/'),
      });
      if (createdSessionId) {
        await oauthSetActive!({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message ?? 'OAuth sign-in failed. Please try again.';
      setError(msg);
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logo}>
              <Text style={styles.logoThrift}>Thrift</Text>
              <Text style={styles.logoUVA}>UVA</Text>
            </Text>
            <Text style={styles.tagline}>UVA's student marketplace</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your account</Text>

            {/* OAuth buttons */}
            <TouchableOpacity
              style={styles.socialBtn}
              activeOpacity={0.8}
              onPress={() => handleOAuth('google')}
              disabled={!!oauthLoading || loading}
            >
              {oauthLoading === 'google' ? (
                <ActivityIndicator size="small" color={NAVY} />
              ) : (
                <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
              )}
              <Text style={styles.socialBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialBtn}
              activeOpacity={0.8}
              onPress={() => handleOAuth('microsoft')}
              disabled={!!oauthLoading || loading}
            >
              {oauthLoading === 'microsoft' ? (
                <ActivityIndicator size="small" color={NAVY} />
              ) : (
                <MaterialCommunityIcons name="microsoft" size={20} color="#00A4EF" />
              )}
              <Text style={styles.socialBtnText}>Continue with Microsoft</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                placeholder="wahoo@virginia.edu"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading && !oauthLoading}
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading && !oauthLoading}
              />
            </View>

            {/* Error */}
            {!!error && <Text style={styles.errorText}>{error}</Text>}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.primaryBtn, (loading || !email || !password) && styles.primaryBtnDisabled]}
              onPress={handleSignIn}
              activeOpacity={0.85}
              disabled={loading || !email || !password || !!oauthLoading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign in</Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 },

  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logo: { fontSize: 42, fontWeight: '800', letterSpacing: -1 },
  logoThrift: { color: NAVY },
  logoUVA: { color: ORANGE },
  tagline: { fontSize: 14, color: '#6B7A90', marginTop: 6, fontWeight: '500' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: NAVY, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#6B7A90', marginBottom: 24 },

  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  socialBtnText: { fontSize: 15, fontWeight: '600', color: NAVY },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },

  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fff',
  },

  errorText: {
    fontSize: 13,
    color: '#B91C1C',
    marginBottom: 12,
    fontWeight: '500',
  },

  primaryBtn: {
    backgroundColor: NAVY,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0, elevation: 0 },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 14, color: '#6B7A90' },
  footerLink: { fontSize: 14, fontWeight: '700', color: ORANGE },
});
