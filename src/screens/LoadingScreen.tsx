import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { Counter } from '../components/Counter';
import { SUPPORTED_CITY } from '../cityGuard';
import { colors, radius, space, type } from '../theme';
import type { StageEvent } from '../streamPlan';

interface Props {
  onDone: () => void;
  /** Live pipeline events. Empty when the server can't stream — see fallback below. */
  stages?: StageEvent[];
}

/**
 * The pipeline, as it happens.
 *
 * This screen used to be a five-step timer that ran for 3.4 seconds and said
 * the same thing every time, whatever the backend was doing. Now each line
 * appears when its stage actually completes, carrying the number that stage
 * actually produced, and the grid of dots is the corpus narrowing in real time.
 *
 * When the server can't stream, `stages` stays empty and the screen degrades
 * to an indeterminate pulse with honest copy rather than inventing progress.
 */
export function LoadingScreen({ onDone, stages = [] }: Props) {
  const done = useRef(onDone);
  done.current = onDone;

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - started), 100);
    return () => clearInterval(id);
  }, []);

  const byName = useMemo(() => {
    const m: Record<string, StageEvent> = {};
    for (const e of stages) m[e.name] = e;
    return m;
  }, [stages]);

  const corpusSize: number = byName.corpus?.data.size ?? 60;
  const kept: number | null = byName.shortlist?.data.kept ?? null;
  const finalCount: number | null = byName.enforce?.data.kept ?? null;
  const signals: string[] = byName.signals?.data.signals ?? [];
  const live = byName.live?.data;
  const modelStarted = Boolean(byName['model:start']);
  const modelDone = byName.model?.data;
  const rejected: string[] = byName.enforce?.data.rejected ?? [];

  // onDone only reports that this screen has had its moment — App still waits
  // for the request to settle before it navigates. So arm it unconditionally:
  // without this, the non-streaming path (demo mode, or a server that cannot
  // stream) would never receive a `done` event and the app would sit here
  // forever.
  useEffect(() => {
    const t = setTimeout(() => done.current(), 2600);
    return () => clearTimeout(t);
  }, []);

  // A stream that finishes in 400ms is jarring, and the point of this screen is
  // that the work is visible. Hold briefly so each stage stays legible.
  useEffect(() => {
    if (!byName.done) return;
    const t = setTimeout(() => done.current(), 900);
    return () => clearTimeout(t);
  }, [byName.done]);

  const streaming = stages.length > 0;

  const rows = [
    byName.city && {
      key: 'city', label: `${SUPPORTED_CITY} confirmed`, value: null as number | null,
      unit: byName.city.data.matched ? `matched "${byName.city.data.matched}"` : 'in coverage',
      at: byName.city.at,
    },
    byName.signals && {
      key: 'signals', label: 'Read your answers', value: signals.length,
      unit: signals.length === 1 ? 'signal derived' : 'signals derived', at: byName.signals.at,
    },
    byName.shortlist && {
      key: 'shortlist', label: `Scored all ${corpusSize} entries`, value: kept,
      unit: `shortlisted`, at: byName.shortlist.at,
    },
    live && !live.skipped && {
      key: 'live', label: 'Searched the live web', value: live.found,
      unit: live.found === 1 ? 'new lead' : 'new leads', at: byName.live.at,
    },
    modelDone && {
      key: 'model', label: 'One model call', value: null,
      unit: modelDone.model ?? 'complete', at: byName.model.at,
    },
    byName.enforce && {
      key: 'enforce', label: 'Checked every id it returned',
      value: rejected.length,
      unit: rejected.length === 1 ? 'invented id dropped' : 'invented ids dropped',
      at: byName.enforce.at,
    },
  ].filter(Boolean) as { key: string; label: string; value: number | null; unit: string; at: number }[];

  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <View style={styles.headRow}>
          <Text style={styles.eyebrow}>Building your week</Text>
          <Text style={styles.clock}>{(elapsed / 1000).toFixed(1)}s</Text>
        </View>

        <CorpusGrid total={corpusSize} kept={kept} finalCount={finalCount} />

        {signals.length > 0 ? (
          <View style={styles.chips}>
            {signals.map((s, i) => (
              <SignalChip key={s} text={s} delay={i * 40} />
            ))}
          </View>
        ) : null}

        <View style={styles.rows}>
          {rows.map(({ key, ...r }) => (
            <StageRow key={key} {...r} />
          ))}
          {modelStarted && !modelDone ? <Pending label="Writing your ten and every draft" /> : null}
          {!streaming ? <Pending label={`Matching you against the ${SUPPORTED_CITY} corpus`} /> : null}
        </View>
      </View>
    </View>
  );
}

/**
 * One dot per corpus entry. They light together when the corpus loads, dim to
 * the ones that survived scoring, then settle on the final plan. It is a
 * quantity picture — the dots are not individual entries in any fixed order.
 *
 * The narrowing is the whole point, so each state gets a minimum dwell. Without
 * it a fast pipeline jumps straight from 60 to 10 and the middle step — the
 * deterministic scoring pass, the part people assume is the model — is never
 * seen at all.
 */
const DWELL_MS = 750;

function CorpusGrid({ total, kept, finalCount }: { total: number; kept: number | null; finalCount: number | null }) {
  // The distinct states to play, in order: 60, then 20, then 10.
  const targets = useMemo(() => {
    const out = [total];
    for (const n of [kept, finalCount]) {
      if (typeof n === 'number' && n !== out[out.length - 1]) out.push(n);
    }
    return out;
  }, [total, kept, finalCount]);

  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= targets.length - 1) return;
    const id = setTimeout(() => setStep((n) => n + 1), DWELL_MS);
    return () => clearTimeout(id);
  }, [step, targets.length]);

  const shown = targets[Math.min(step, targets.length - 1)];

  return (
    <View style={styles.grid}>
      {Array.from({ length: total }, (_, i) => (
        <Dot key={i} index={i} on={i < shown} delay={i * 9} />
      ))}
    </View>
  );
}

function Dot({ index, on, delay }: { index: number; on: boolean; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: on ? 1 : 0.18,
      duration: 420,
      delay: on ? delay : (index % 7) * 30,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [on, delay, index, v]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity: v,
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
        },
      ]}
    />
  );
}

function StageRow({ label, value, unit, at }: { label: string; value: number | null; unit: string; at: number }) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [enter]);

  return (
    <Animated.View
      style={[
        styles.row,
        { opacity: enter,
          transform: [{ translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] },
      ]}
    >
      <Text style={styles.tick}>✓</Text>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.rowValue}>
          {value !== null ? <Counter to={value} duration={600} style={styles.rowNumber} /> : null}
          <Text style={styles.rowUnit}>{unit}</Text>
        </View>
      </View>
      <Text style={styles.rowAt}>{(at / 1000).toFixed(1)}s</Text>
    </Animated.View>
  );
}

/** An honest indeterminate state: something is happening, we can't say how far. */
function Pending({ label }: { label: string }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.row, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }]}>
      <Text style={styles.tickPending}>·</Text>
      <Text style={styles.rowLabel}>{label}</Text>
    </Animated.View>
  );
}

function SignalChip({ text, delay }: { text: string; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1, duration: 260, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [v, delay]);
  return (
    <Animated.View
      style={[styles.chip, { opacity: v,
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }] }]}
    >
      <Text style={styles.chipText}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: space.xl, backgroundColor: colors.deepGreen },
  inner: { maxWidth: 560, width: '100%', alignSelf: 'center' },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  eyebrow: { ...type.label, color: colors.moss },
  clock: { ...type.small, color: colors.onDarkMuted, fontVariant: ['tabular-nums'] },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    marginTop: space.xl, marginBottom: space.xl,
  },
  dot: { width: 9, height: 9, borderRadius: radius.pill, backgroundColor: colors.moss },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: space.xl },
  chip: {
    backgroundColor: colors.onDarkLine, borderRadius: radius.pill,
    paddingVertical: 3, paddingHorizontal: space.md - 2,
  },
  chipText: { ...type.small, color: colors.onDark },

  rows: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  rowBody: { flex: 1, gap: 1 },
  tick: { ...type.small, color: colors.moss, width: 12 },
  tickPending: { ...type.small, color: colors.onDarkMuted, width: 12 },
  rowLabel: { ...type.body, color: colors.onDark },
  rowValue: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  rowNumber: { ...type.bodyStrong, color: colors.moss, fontVariant: ['tabular-nums'] },
  rowUnit: { ...type.small, color: colors.onDarkMuted },
  rowAt: { ...type.small, color: colors.onDarkMuted, fontVariant: ['tabular-nums'], paddingTop: 3 },
});
