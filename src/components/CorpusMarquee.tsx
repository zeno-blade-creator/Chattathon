import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { CORPUS_NAMES } from '../data/corpusNames';
import { colors, radius, space, type } from '../theme';

/** Pixels per second. Slow enough to read a name as it passes. */
const SPEED = 34;

/**
 * The corpus, drifting past.
 *
 * Every name here is a real entry from data/corpus.boston.json, written by the
 * generator rather than typed, so it cannot drift from the file. It is doing
 * an argument rather than a decoration: the claim is a hand-verified local
 * corpus, and this is that corpus, visible before you have typed anything.
 */
export function CorpusMarquee() {
  const x = useRef(new Animated.Value(0)).current;
  const [runWidth, setRunWidth] = useState(0);

  useEffect(() => {
    if (!runWidth) return;
    let cancelled = false;
    const loop = () => {
      if (cancelled) return;
      x.setValue(0);
      Animated.timing(x, {
        toValue: -runWidth,
        duration: (runWidth / SPEED) * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(({ finished }) => { if (finished && !cancelled) loop(); });
    };
    loop();
    return () => { cancelled = true; x.stopAnimation(); };
  }, [runWidth, x]);

  // Two identical runs side by side: when the first has travelled its own
  // width the second is exactly where it started, so the reset is invisible.
  const run = (measure: boolean) => (
    <View
      style={styles.run}
      onLayout={measure ? (e) => setRunWidth(e.nativeEvent.layout.width) : undefined}
    >
      {CORPUS_NAMES.map((c, i) => (
        <View key={`${c.name}-${i}`} style={styles.item}>
          <View style={[styles.dot, c.type === 'event' && styles.dotEvent,
                        c.type === 'channel' && styles.dotChannel]} />
          <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[styles.track, { transform: [{ translateX: x }] }]}>
        {run(true)}
        {run(false)}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', paddingVertical: space.sm },
  track: { flexDirection: 'row' },
  run: { flexDirection: 'row', alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: space.xl },
  dot: { width: 5, height: 5, borderRadius: radius.pill, backgroundColor: colors.person },
  dotEvent: { backgroundColor: colors.event },
  dotChannel: { backgroundColor: colors.channel },
  name: { ...type.small, color: colors.inkMuted },
});
