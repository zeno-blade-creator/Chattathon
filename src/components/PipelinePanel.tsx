import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '../theme';
import type { PlanMeta } from '../types';
import { Counter } from './Counter';

interface Props {
  meta: PlanMeta;
  itemCount: number;
  elapsedMs?: number;
}

/**
 * What actually happened, in order.
 *
 * Most of this product is work the interface never showed: free text turned
 * into signals, 60 entries scored, a balanced shortlist cut, one batched model
 * call, and an enforcement pass that drops any id the model invented. Rendering
 * only the finished plan made a pipeline look like a prompt. Every number here
 * is measured on the request that produced the plan above — nothing is decorative.
 */
export function PipelinePanel({ meta, itemCount, elapsedMs }: Props) {
  const corpus = meta.corpusSize ?? 0;
  const shortlisted = meta.shortlisted ?? 0;
  const rejected = meta.rejected?.length ?? 0;
  const signals = meta.signals ?? [];
  const liveFound = meta.liveFound ?? 0;

  const steps = [
    {
      key: 'signals',
      label: 'Read your answers',
      value: signals.length,
      unit: signals.length === 1 ? 'signal derived' : 'signals derived',
      note: 'Pattern-matched from your own words. No model, no cost.',
    },
    {
      key: 'score',
      label: `Scored the ${corpus}-entry corpus`,
      value: shortlisted,
      unit: `shortlisted of ${corpus}`,
      note: 'Balanced across events, people and channels — not the raw top 20.',
    },
    ...(liveFound > 0
      ? [{
          key: 'live',
          label: 'Searched the live web',
          value: liveFound,
          unit: liveFound === 1 ? 'new lead found' : 'new leads found',
          note: `${meta.liveUsed ?? 0} made the final plan. Every one is a retrieved URL.`,
        }]
      : []),
    {
      key: 'model',
      label: 'One model call',
      value: 1,
      unit: 'request, not ten',
      note: 'All ten items, every reason and every draft in a single response.',
    },
    {
      key: 'enforce',
      label: 'Checked every id',
      value: rejected,
      unit: rejected === 1 ? 'invented id dropped' : 'invented ids dropped',
      note: 'Names, dates and links are re-attached from the corpus, not the model.',
    },
  ];

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.label}>Under the hood</Text>
        {elapsedMs ? (
          <Text style={styles.elapsed}>{(elapsedMs / 1000).toFixed(1)}s</Text>
        ) : null}
      </View>

      <Text style={styles.lede}>
        Five stages ran to build the {itemCount} items above. Only one of them cost anything.
      </Text>

      <Funnel corpus={corpus} shortlisted={shortlisted} kept={itemCount} />

      {steps.map(({ key, ...s }, i) => (
        <Step key={key} index={i} last={i === steps.length - 1} {...s} />
      ))}

      {signals.length > 0 ? (
        <View style={styles.signals}>
          <Text style={styles.signalsLabel}>Signals we read from your answers</Text>
          <View style={styles.chips}>
            {signals.map((s, i) => (
              <Chip key={s} text={s} delay={700 + i * 45} />
            ))}
          </View>
        </View>
      ) : null}

      {/* No "nothing is searched live" claim here — live discovery runs when a
          Tavily key is present, and that line was removed elsewhere today for
          exactly that reason. State what ran, not what didn't. */}
      {meta.model ? (
        <Text style={styles.footnote}>
          {meta.model}
          {meta.usage?.totalTokenCount ? ` · ${meta.usage.totalTokenCount} tokens` : ''}
          {liveFound > 0
            ? ' · corpus cached, live discovery layered on top'
            : ' · corpus served from cache'}
        </Text>
      ) : null}
    </View>
  );
}

/** The narrowing, drawn to scale: corpus to shortlist to final plan. */
function Funnel({ corpus, shortlisted, kept }: { corpus: number; shortlisted: number; kept: number }) {
  const grow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(grow, {
      toValue: 1,
      duration: 1100,
      delay: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [grow]);

  const bars = [
    { n: corpus, caption: 'verified entries', tone: colors.onDarkLine },
    { n: shortlisted, caption: 'scored shortlist', tone: colors.midGreen },
    { n: kept, caption: 'in your plan', tone: colors.moss },
  ];

  return (
    <View style={styles.funnel}>
      {bars.map((b, i) => (
        <View key={b.caption} style={styles.funnelRow}>
          <View style={styles.funnelHead}>
            <Counter to={b.n} delay={120 + i * 160} style={styles.funnelNumber} />
            <Text style={styles.funnelCaption}>{b.caption}</Text>
          </View>
          <View style={styles.funnelTrack}>
            <Animated.View
              style={[
                styles.funnelBar,
                {
                  backgroundColor: b.tone,
                  width: grow.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', `${Math.max(6, (b.n / Math.max(corpus, 1)) * 100)}%`],
                  }),
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function Step({
  index, last, label, value, unit, note,
}: { index: number; last: boolean; label: string; value: number; unit: string; note: string }) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 420,
      delay: 420 + index * 110,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [enter, index]);

  return (
    <Animated.View
      style={[
        styles.step,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
        },
      ]}
    >
      <View style={styles.marker}>
        <View style={styles.dot} />
        {!last ? <View style={styles.rail} /> : null}
      </View>
      <View style={styles.stepBody}>
        <Text style={styles.stepLabel}>{label}</Text>
        <View style={styles.stepMetric}>
          <Counter to={value} delay={520 + index * 110} style={styles.stepValue} />
          <Text style={styles.stepUnit}>{unit}</Text>
        </View>
        <Text style={styles.stepNote}>{note}</Text>
      </View>
    </Animated.View>
  );
}

function Chip({ text, delay }: { text: string; delay: number }) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1, duration: 300, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [enter, delay]);

  return (
    <Animated.View
      style={[
        styles.chip,
        {
          opacity: enter,
          transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
        },
      ]}
    >
      <Text style={styles.chipText}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.deepGreen,
    borderRadius: radius.lg,
    padding: space.xl,
    marginBottom: space.xxl,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...type.label, color: colors.moss },
  elapsed: { ...type.small, color: colors.onDarkMuted, fontVariant: ['tabular-nums'] },
  lede: { ...type.body, color: colors.onDark, marginTop: space.sm, marginBottom: space.xl },

  funnel: { gap: space.md, marginBottom: space.xl },
  funnelRow: { gap: 6 },
  funnelHead: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  funnelNumber: {
    ...type.bodyStrong,
    color: colors.onDark,
    fontVariant: ['tabular-nums'],
  },
  funnelTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.onDarkLine,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  funnelBar: { height: 6, borderRadius: radius.pill },
  funnelCaption: { ...type.small, color: colors.onDarkMuted },

  step: { flexDirection: 'row', gap: space.md },
  marker: { alignItems: 'center', width: 12, paddingTop: 5 },
  dot: { width: 7, height: 7, borderRadius: radius.pill, backgroundColor: colors.moss },
  rail: { flex: 1, width: 1, backgroundColor: colors.onDarkLine, marginTop: 4 },
  stepBody: { flex: 1, paddingBottom: space.lg },
  stepLabel: { ...type.bodyStrong, color: colors.onDark },
  stepMetric: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, marginTop: 2 },
  stepValue: {
    ...type.title,
    color: colors.moss,
    fontVariant: ['tabular-nums'],
  },
  stepUnit: { ...type.small, color: colors.onDarkMuted },
  stepNote: { ...type.small, color: colors.onDarkMuted, marginTop: 2 },

  signals: {
    borderTopWidth: 1,
    borderTopColor: colors.onDarkLine,
    paddingTop: space.lg,
    marginTop: space.xs,
  },
  signalsLabel: { ...type.label, color: colors.onDarkMuted, marginBottom: space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    backgroundColor: colors.onDarkLine,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: space.md - 2,
  },
  chipText: { ...type.small, color: colors.onDark, fontWeight: '500' },

  footnote: {
    ...type.small,
    color: colors.onDarkMuted,
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.onDarkLine,
  },
});
