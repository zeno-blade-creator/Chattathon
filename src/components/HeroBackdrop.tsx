import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../theme';

/**
 * The home screen's graphic backdrop: concentric rings radiating from a pinned
 * point, on deep green.
 *
 * Drawn from plain Views rather than an image or react-native-svg — it stays
 * sharp at any size, adds no dependency and nothing has to load before the
 * first paint. The figure is a map radius around a dropped pin, which is the
 * product in one image: everything worth doing inside a short reach of you.
 *
 * Alphas are moss and page-white at low opacity. They are written as rgba
 * literals because React Native has no colour-mix function.
 */

/** Ring diameters as multiples of the base, largest last. */
const RINGS = [1, 1.5, 2.1, 2.8, 3.6, 4.5];

interface Props {
  height: number;
  /** Animated transform supplied by the screen, so parallax stays scroll-linked. */
  style?: StyleProp<ViewStyle>;
}

export function HeroBackdrop({ height, style }: Props) {
  // Scaled off the hero height so the figure keeps its proportions on a phone
  // and on a wide desktop window alike.
  const base = height * 0.42;

  return (
    <Animated.View style={[styles.root, { height }, style]} pointerEvents="none">
      <View style={styles.field}>
        {RINGS.map((multiple, i) => {
          const size = base * multiple;
          return (
            <View
              key={multiple}
              style={[
                styles.ring,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  marginLeft: -size / 2,
                  marginTop: -size / 2,
                  // Outer rings sit further back.
                  opacity: 1 - i * 0.14,
                },
              ]}
            />
          );
        })}

        {/* The dropped pin. This is the home screen's single amber element. */}
        <View style={styles.pin} />
        <View style={styles.pinHalo} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.deepGreen,
    overflow: 'hidden',
  },
  /**
   * The point every ring is centred on. Offset right and low so the figure
   * bleeds off two edges instead of sitting like a target in the middle.
   */
  field: {
    position: 'absolute',
    left: '74%',
    top: '58%',
  },
  ring: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderWidth: 1,
    borderColor: 'rgba(151, 188, 98, 0.34)',
  },
  pin: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    marginTop: -7,
    backgroundColor: colors.accent,
    zIndex: 2,
  },
  pinHalo: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: -20,
    marginTop: -20,
    backgroundColor: 'rgba(232, 176, 75, 0.18)',
  },
});
