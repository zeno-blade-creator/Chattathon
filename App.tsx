import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { SAMPLE_PLAN } from './src/data/samplePlan';
import { IntakeScreen } from './src/screens/IntakeScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { colors } from './src/theme';
import type { IntakeProfile, Plan } from './src/types';

type View_ = 'intake' | 'loading' | 'plan';

export default function App() {
  const [view, setView] = useState<View_>('intake');
  const [plan, setPlan] = useState<Plan | null>(null);
  // Kept so the generation layer has the profile to send when it lands.
  const [, setProfile] = useState<IntakeProfile | null>(null);

  const onGenerate = (p: IntakeProfile) => {
    setProfile(p);
    setView('loading');
  };

  // TODO(Person B): replace with the single batched model call. The loading
  // view already runs for as long as this takes; swap the sample for the
  // response and nothing else in the UI changes.
  const onLoaded = () => {
    setPlan(SAMPLE_PLAN);
    setView('plan');
  };

  const onRestart = () => {
    setPlan(null);
    setProfile(null);
    setView('intake');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.root}>
          {view === 'intake' ? <IntakeScreen onGenerate={onGenerate} /> : null}
          {view === 'loading' ? <LoadingScreen onDone={onLoaded} /> : null}
          {view === 'plan' && plan ? <PlanScreen plan={plan} onRestart={onRestart} /> : null}
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  root: { flex: 1, backgroundColor: colors.bg },
});
