import { Redirect, type Href } from 'expo-router';
import { View } from 'react-native';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useColors } from '@/constants/theme';

export default function Index() {
  const { ready, hasCompleted } = useOnboarding();
  const colors = useColors();

  if (!ready) {
    // Storage check is synchronous on web but the initial render happens once
    // before the effect runs — show a blank themed background to avoid a flash.
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  // Cast covers the moment after creating /onboarding when the generated
  // typed-routes file hasn't been refreshed yet by the Metro dev server.
  const href = (hasCompleted ? '/(tabs)' : '/onboarding') as Href;
  return <Redirect href={href} />;
}
