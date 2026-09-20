import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
  /** ms. Stagger siblings by ~70ms so a list arrives as a sequence, not a slab. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fade-and-rise on mount. Deliberately small: 10px and 380ms reads as the page
 * settling, where a larger move reads as a transition and slows the demo down.
 */
export function Reveal({ children, delay = 0, style }: Props) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 380,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [enter, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
