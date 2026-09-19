import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { buildProfile } from './lib/profile.mjs';
import { DEFAULT_MODE, generatePlan, type GenerateResult, type Mode } from './src/api';
import { saveProfile } from './src/lib/corpus';
import { IntakeScreen } from './src/screens/IntakeScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { colors, radius, space, type } from './src/theme';
import type { IntakeProfile, Plan } from './src/types';

type Route = 'intake' | 'loading' | 'plan' | 'blocked';

export default function App() {
  const [route, setRoute] = useState<Route>('intake');
  const [plan, setPlan] = useState<Plan | null>(null);
  /**
   * The founder_profiles row id. Needed to write item_status, and it only
   * exists client-side — RLS grants the anon key INSERT but not SELECT, so it
   * can never be read back.
   */
  const profileId = useRef<string | null>(null);

  /**
   * 'ai' runs the real generation. 'demo' serves the recorded plan instantly —
   * the switch exists so a dead network on stage costs a tap, not the pitch.
   */
  const [mode, setMode] = useState<Mode>(DEFAULT_MODE);
  const [notice, setNotice] = useState('');

  // Generation takes ~20-30s and the loading animation is shorter, so we hold
  // the result until both are done: never cut the plan off, never snap early.
  const result = useRef<GenerateResult | null>(null);
  const [animDone, setAnimDone] = useState(false);
  const [settled, setSettled] = useState(false);

  const onGenerate = useCallback((raw: IntakeProfile) => {
    result.current = null;
    setAnimDone(false);
    setSettled(false);
    setRoute('loading');

    // The real call. The server does the model work and holds every API key.
    generatePlan(raw, mode).then((r) => { result.current = r; setSettled(true); });

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
  }, [mode]);

  useEffect(() => {
    if (!settled || !animDone) return;
    const r = result.current;
    if (!r) return;
    if (r.status === 'ready') {
      setPlan(r.plan);
      if (r.profileId) profileId.current = r.profileId;
      setRoute('plan');
      return;
    }
    setNotice(r.status === 'unsupported_city'
      ? r.message
      : `${r.error} Start the server with \`npm run server\`, or switch to Demo.`);
    setRoute('blocked');
  }, [settled, animDone]);

  const onRestart = useCallback(() => {
    setPlan(null);
    setNotice('');
    result.current = null;
    profileId.current = null;
    setAnimDone(false);
    setSettled(false);
    setRoute('intake');
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.root}>
          {route === 'intake' ? (
            <>
              <View style={styles.modeBar}>
                {(['ai', 'demo'] as const).map((m) => (
                  <Pressable key={m} onPress={() => setMode(m)} accessibilityRole="radio"
                    accessibilityState={{ selected: mode === m }}
                    style={[styles.modeChip, mode === m && styles.modeChipOn]}>
                    <Text style={[styles.modeText, mode === m && styles.modeTextOn]}>
                      {m === 'ai' ? 'Live AI' : 'Demo (offline)'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <IntakeScreen onGenerate={onGenerate} />
            </>
          ) : null}
          {route === 'loading' ? <LoadingScreen onDone={() => setAnimDone(true)} /> : null}
          {route === 'plan' && plan ? (
            <PlanScreen plan={plan} profileId={profileId} onRestart={onRestart} />
          ) : null}
          {route === 'blocked' ? (
            <View style={styles.blocked}>
              <Text style={styles.blockedTitle}>We cover Boston today</Text>
              <Text style={styles.blockedBody}>{notice}</Text>
              <Pressable onPress={onRestart} style={styles.button}>
                <Text style={styles.buttonText}>Start again</Text>
              </Pressable>
            </View>
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
  modeBar: { flexDirection: 'row', gap: 6, paddingHorizontal: space.lg,
             paddingTop: space.sm, justifyContent: 'flex-end' },
  modeChip: { paddingVertical: 4, paddingHorizontal: space.sm,
              borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line },
  modeChipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  modeText: { ...type.small, color: colors.inkMuted },
  modeTextOn: { color: colors.bg, fontWeight: '600' },
  blocked: { flex: 1, justifyContent: 'center', padding: space.lg, gap: space.md },
  blockedTitle: { ...type.title, color: colors.ink },
  blockedBody: { ...type.body, color: colors.inkMuted },
  button: { alignSelf: 'flex-start', backgroundColor: colors.ink,
            paddingVertical: space.sm, paddingHorizontal: space.lg, borderRadius: radius.md },
  buttonText: { ...type.body, color: colors.bg, fontWeight: '600' },
});
