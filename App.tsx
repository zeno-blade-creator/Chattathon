import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { DEFAULT_MODE, generatePlan, type GenerateResult, type Mode } from './src/api';
import { streamPlan, type StageEvent } from './src/streamPlan';
import { IntakeScreen } from './src/screens/IntakeScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { colors, radius, space, type } from './src/theme';
import type { IntakeProfile, Plan, PlanMeta } from './src/types';

type View_ = 'intake' | 'loading' | 'plan' | 'blocked';

export default function App() {
  const [view, setView] = useState<View_>('intake');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [notice, setNotice] = useState<string>('');
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [meta, setMeta] = useState<PlanMeta | undefined>(undefined);
  const [elapsedMs, setElapsedMs] = useState<number | undefined>(undefined);
  /**
   * 'ai' runs the real generation server. 'demo' serves the recorded plan
   * instantly and offline — a dead network on stage should cost a tap, not
   * the pitch. The GitHub Pages build defaults to 'demo' because static
   * hosting has no server to reach.
   */
  const [mode, setMode] = useState<Mode>(DEFAULT_MODE);

  // Generation takes ~20-25s; the loading animation is shorter. We hold the
  // result until the animation has also finished so the transition never
  // snaps mid-sentence, and never cuts the plan off early either.
  const result = useRef<GenerateResult | null>(null);
  const [animDone, setAnimDone] = useState(false);
  const [settled, setSettled] = useState(false);
  /** Live pipeline events. Empty in demo mode or when streaming is unavailable. */
  const [stages, setStages] = useState<StageEvent[]>([]);

  const onGenerate = (p: IntakeProfile) => {
    result.current = null;
    setAnimDone(false);
    setSettled(false);
    setStages([]);
    setView('loading');

    const finish = (r: GenerateResult) => { result.current = r; setSettled(true); };

    if (mode === 'demo') {
      // Recorded plan: instant, and there is no pipeline to narrate.
      generatePlan(p, mode).then(finish);
      return;
    }

    // Try the streaming pipeline first so the loading screen can show real
    // stages. A null result means streaming was unavailable or died mid-flight;
    // the plain endpoint is still there, including its own fallback plan.
    streamPlan(p, (e) => setStages((prev) => [...prev, e]))
      // A streamed hard failure is not final either — the buffered endpoint has
      // its own fallback plan, so try it before showing anyone an error.
      .then((r) => (r && r.status !== 'failed' ? finish(r) : generatePlan(p, mode).then(finish)))
      .catch(() => generatePlan(p, mode).then(finish));
  };

  useEffect(() => {
    if (!settled || !animDone) return;
    const r = result.current;
    if (!r) return;
    if (r.status === 'ready') {
      setPlan(r.plan); setFallbackUsed(r.fallbackUsed);
      setMeta(r.meta); setElapsedMs(r.ms); setView('plan'); return;
    }
    setNotice(
      r.status === 'unsupported_city'
        ? r.message
        : `Generation failed: ${r.error}. Check the server is running on :8787.`,
    );
    setView('blocked');
  }, [settled, animDone]);

  const onRestart = () => {
    setPlan(null); setNotice(''); setFallbackUsed(false);
    setMeta(undefined); setElapsedMs(undefined); setStages([]); result.current = null;
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
          {view === 'intake' ? (
            <IntakeScreen onGenerate={onGenerate} mode={mode} onModeChange={setMode} />
          ) : null}
          {view === 'loading' ? <LoadingScreen onDone={() => setAnimDone(true)} stages={stages} /> : null}
          {view === 'plan' && plan ? <PlanScreen
              plan={plan}
              onRestart={onRestart}
              fallbackUsed={fallbackUsed}
              meta={meta}
              elapsedMs={elapsedMs}
            /> : null}
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
  modeBar: {
    position: 'absolute', top: space.sm, right: space.lg, zIndex: 10,
    flexDirection: 'row', gap: 6,
  },
  modeChip: {
    paddingVertical: 4, paddingHorizontal: space.sm,
    borderRadius: radius.pill, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  modeChipOn: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  modeText: { ...type.small, color: 'rgba(255,255,255,0.85)' },
  modeTextOn: { color: colors.deepGreen, fontWeight: '700' },
  blocked: { flex: 1, justifyContent: 'center', padding: space.lg, gap: space.md },
  blockedTitle: { ...type.title, color: colors.ink },
  blockedBody: { ...type.body, color: colors.inkMuted },
  button: { alignSelf: 'flex-start', backgroundColor: colors.ink,
            paddingVertical: space.sm, paddingHorizontal: space.lg, borderRadius: radius.md },
  buttonText: { ...type.body, color: colors.bg, fontWeight: '600' },
});
