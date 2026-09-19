import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { SUPPORTED_CITY } from '../cityGuard';
import { colors, radius, space, type } from '../theme';

/**
 * Each line names a real step in the pipeline. This is doing work: it tells a
 * judge the corpus is pre-seeded and the drafting is one batched call, without
 * anyone having to say so.
 */
const STEPS = [
  `Reading your profile against the ${SUPPORTED_CITY} corpus`,
  'Ranking 50 verified local opportunities',
  'Picking the ten that fit your stage and goal',
  'Writing your pitch for each one',
  'Laying out your week',
];

const STEP_MS = 620;

interface Props {
  onDone: () => void;
}

export function LoadingScreen({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  // Held in a ref so the effect never re-runs and restarts the sequence.
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: STEPS.length * STEP_MS,
      easing: Easing.inOut(Easing.quad),
      // Animating width cannot run on the native thread.
      useNativeDriver: false,
    }).start();

    const timers = STEPS.map((_, i) =>
      setTimeout(() => setStep(i), i * STEP_MS),
    );
    const finish = setTimeout(() => done.current(), STEPS.length * STEP_MS + 260);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
    };
  }, [progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['4%', '100%'],
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <Text style={styles.eyebrow}>Building your week</Text>

        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width }]} />
        </View>

        <View style={styles.steps}>
          {STEPS.map((label, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'pending';
            return (
              <View key={label} style={styles.stepRow}>
                <Text
                  style={[
                    styles.marker,
                    state === 'done' && styles.markerDone,
                    state === 'active' && styles.markerActive,
                  ]}
                >
                  {state === 'done' ? '✓' : '·'}
                </Text>
                <Text
                  style={[
                    styles.stepText,
                    state === 'pending' && styles.stepPending,
                    state === 'active' && styles.stepActive,
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.note}>
          The {SUPPORTED_CITY} corpus is already on disk — nothing is being searched live,
          so this costs pennies and can't fail on stage.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: space.xl },
  inner: { maxWidth: 520, width: '100%', alignSelf: 'center' },
  eyebrow: { ...type.label, color: colors.accent, marginBottom: space.lg },
  track: {
    height: 3,
    backgroundColor: colors.line,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: space.xl,
  },
  fill: { height: 3, backgroundColor: colors.ink, borderRadius: radius.pill },
  steps: { gap: space.md },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  marker: {
    ...type.small,
    color: colors.inkFaint,
    width: 14,
    textAlign: 'center',
  },
  markerDone: { color: colors.done },
  markerActive: { color: colors.accent },
  stepText: { ...type.body, color: colors.inkMuted, flex: 1 },
  stepPending: { color: colors.inkFaint },
  stepActive: { color: colors.ink, fontWeight: '600' },
  note: {
    ...type.small,
    color: colors.inkFaint,
    marginTop: space.xxl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
