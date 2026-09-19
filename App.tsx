import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { buildProfile } from './lib/profile.mjs';
import { SAMPLE_PLAN } from './src/data/samplePlan';
import { saveProfile } from './src/lib/corpus';
import { IntakeScreen } from './src/screens/IntakeScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { colors } from './src/theme';
import type { IntakeProfile, Plan } from './src/types';

type Route = 'intake' | 'loading' | 'plan';

export default function App() {
  const [route, setRoute] = useState<Route>('intake');
  const [plan, setPlan] = useState<Plan | null>(null);
  /**
   * The founder_profiles row id. Needed to write item_status, and it only
   * exists client-side — RLS grants the anon key INSERT but not SELECT, so it
   * can never be read back.
   */
  const profileId = useRef<string | null>(null);

  const onGenerate = useCallback((raw: IntakeProfile) => {
    setRoute('loading');

    // Person A's buildProfile does the validation, normalisation and signal
    // derivation. Persisting is fire-and-forget on purpose: a Supabase outage
    // must not stop the plan rendering.
    try {
      const built = buildProfile({
        building: raw.building,
        city: raw.city,
        stage: raw.stage as Exclude<IntakeProfile['stage'], ''>,
        customer: raw.customer,
        goal: raw.goal as Exclude<IntakeProfile['goal'], ''>,
        already_tried: raw.tried || null,
      });
      saveProfile(built)
        .then(({ id }) => {
          profileId.current = id;
        })
        .catch(() => {
          /* degraded, not fatal */
        });
    } catch (err) {
      // The intake screen already blocks invalid submissions; this is the
      // belt-and-braces path if the two validators ever disagree.
      console.warn('[app] profile rejected by buildProfile', err);
    }
  }, []);

  // TODO(Person B): replace with the single batched model call, then read the
  // result from generated_plans. The UI already renders pending/ready/failed.
  const onLoaded = useCallback(() => {
    setPlan(SAMPLE_PLAN);
    setRoute('plan');
  }, []);

  const onRestart = useCallback(() => {
    setPlan(null);
    profileId.current = null;
    setRoute('intake');
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.root}>
          {route === 'intake' ? <IntakeScreen onGenerate={onGenerate} /> : null}
          {route === 'loading' ? <LoadingScreen onDone={onLoaded} /> : null}
          {route === 'plan' && plan ? (
            <PlanScreen plan={plan} profileId={profileId} onRestart={onRestart} />
          ) : null}
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
