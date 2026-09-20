import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, type StyleProp, type TextStyle } from 'react-native';

interface Props {
  to: number;
  /** ms. Kept short — this is punctuation, not a performance. */
  duration?: number;
  delay?: number;
  style?: StyleProp<TextStyle>;
  suffix?: string;
}

/**
 * A number that counts up when it first appears.
 *
 * Built on Animated rather than a timer so the easing matches every other
 * motion in the app, and on a listener rather than Animated.Text because React
 * Native cannot animate text content directly.
 */
export function Counter({ to, duration = 900, delay = 0, style, suffix = '' }: Props) {
  const [shown, setShown] = useState(0);
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = value.addListener(({ value: v }) => setShown(Math.round(v)));
    const anim = Animated.timing(value, {
      toValue: to,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      // Driving a JS listener rules out the native driver by definition.
      useNativeDriver: false,
    });
    anim.start();
    return () => {
      anim.stop();
      value.removeListener(id);
    };
  }, [to, duration, delay, value]);

  return <Text style={style}>{shown}{suffix}</Text>;
}
