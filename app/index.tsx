// import { useAuth } from '@clerk/expo'
// import { Redirect } from 'expo-router'
// import { ActivityIndicator, View } from 'react-native'

// export default function Index() {
//   const { isSignedIn, isLoaded } = useAuth()

//   if (!isLoaded) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color="#1e2a4a" />
//       </View>
//     )
//   }

//   if (isSignedIn) {
//     return <Redirect href="/(tabs)" />
//   }

//   return <Redirect href="/(auth)/sign-in" />
// }

import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/clothing_catalog" />;
}