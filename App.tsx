import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { generatePlan, type GenerateResult } from './src/api';
import { IntakeScreen } from './src/screens/IntakeScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { colors, radius, space, type } from './src/theme';
import type { IntakeProfile, Plan } from './src/types';

type View_ = 'intake' | 'loading' | 'plan' | 'blocked';

export default function App() {
  const [view, setView] = useState<View_>('intake');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [notice, setNotice] = useState<string>('');
  const [fallbackUsed, setFallbackUsed] = useState(false);

  // Generation takes ~20-25s; the loading animation is shorter. We hold the
  // result until the animation has also finished so the transition never
  // snaps mid-sentence, and never cuts the plan off early either.
  const result = useRef<GenerateResult | null>(null);
  const [animDone, setAnimDone] = useState(false);
  const [settled, setSettled] = useState(false);

  const onGenerate = (p: IntakeProfile) => {
    result.current = null;
    setAnimDone(false);
    setSettled(false);
    setView('loading');
    generatePlan(p).then((r) => { result.current = r; setSettled(true); });
  };

  useEffect(() => {
    if (!settled || !animDone) return;
    const r = result.current;
    if (!r) return;
    if (r.status === 'ready') {
      setPlan(r.plan); setFallbackUsed(r.fallbackUsed); setView('plan'); return;
    }
    setNotice(
      r.status === 'unsupported_city'
        ? r.message
        : `Generation failed: ${r.error}. Check the server is running on :8787.`,
    );
    setView('blocked');
  }, [settled, animDone]);

  const onRestart = () => {
    setPlan(null); setNotice(''); setFallbackUsed(false); result.current = null;
    setAnimDone(false); setSettled(false); setView('intake');
  };

  // The home screen's hero runs to the top of the display, so the inset above
  // it is painted deep green and the status bar icons flip to light. Every
  // other view is a light page.
  const onHero = view === 'intake';

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.safe, onHero && styles.safeHero]}
        edges={['top', 'left', 'right']}
      >
        <View style={styles.root}>
          {view === 'intake' ? <IntakeScreen onGenerate={onGenerate} /> : null}
          {view === 'loading' ? <LoadingScreen onDone={() => setAnimDone(true)} /> : null}
          {view === 'plan' && plan ? <PlanScreen plan={plan} onRestart={onRestart} fallbackUsed={fallbackUsed} /> : null}
          {view === 'blocked' ? (
            <View style={styles.blocked}>
              <Text style={styles.blockedTitle}>We cover Boston today</Text>
              <Text style={styles.blockedBody}>{notice}</Text>
              <Pressable onPress={onRestart} style={styles.button}>
                <Text style={styles.buttonText}>Start again</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
        <StatusBar style={onHero ? 'light' : 'dark'} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  safeHero: { backgroundColor: colors.deepGreen },
  root: { flex: 1, backgroundColor: colors.bg },
  blocked: { flex: 1, justifyContent: 'center', padding: space.lg, gap: space.md },
  blockedTitle: { ...type.title, color: colors.ink },
  blockedBody: { ...type.body, color: colors.inkMuted },
  button: { alignSelf: 'flex-start', backgroundColor: colors.ink,
            paddingVertical: space.sm, paddingHorizontal: space.lg, borderRadius: radius.md },
  buttonText: { ...type.body, color: colors.bg, fontWeight: '600' },
});
