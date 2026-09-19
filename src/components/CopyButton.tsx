import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { colors, radius, space, type } from '../theme';

interface Props {
  /** The exact text placed on the clipboard. */
  value: string;
  label?: string;
  /**
   * `solid` for the primary draft copy, `quiet` for inline secondary copies,
   * `onDark` for use inside the dark Week One card — a solid button there is
   * ink-on-ink and effectively invisible.
   */
  tone?: 'solid' | 'quiet' | 'onDark';
}

/**
 * Copy-to-clipboard with a two-second confirmation. The confirmation matters:
 * on stage there is no other signal that the press did anything.
 */
export function CopyButton({ value, label = 'Copy', tone = 'solid' }: Props) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Without this a press-then-unmount (e.g. regenerating) sets state on a dead component.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onPress = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    try {
      await Clipboard.setStringAsync(value);
      setCopied(true);
      setFailed(false);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Web clipboard writes reject outside a secure context or without
      // permission. Saying so beats a button that silently does nothing.
      setFailed(true);
      timer.current = setTimeout(() => setFailed(false), 3000);
    }
  }, [value]);

  const toneStyle =
    tone === 'solid' ? styles.solid : tone === 'onDark' ? styles.onDark : styles.quiet;
  const toneLabel =
    tone === 'solid' ? styles.labelSolid : tone === 'onDark' ? styles.labelOnDark : styles.labelQuiet;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} to clipboard`}
      style={({ pressed }) => [
        styles.base,
        toneStyle,
        copied && styles.copied,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.inner}>
        <Text style={[styles.label, toneLabel, copied && styles.labelCopied]}>
          {copied ? '✓  Copied' : failed ? 'Press and hold to copy' : label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderWidth: 1,
  },
  inner: { flexDirection: 'row', alignItems: 'center' },
  solid: { backgroundColor: colors.deepGreen, borderColor: colors.deepGreen },
  quiet: { backgroundColor: 'transparent', borderColor: colors.lineStrong },
  /** Amber — this is the Plan view's single accent element. */
  onDark: { backgroundColor: colors.accent, borderColor: colors.accent },
  copied: { backgroundColor: colors.midGreen, borderColor: colors.midGreen },
  pressed: { opacity: 0.75 },
  label: { ...type.smallStrong },
  labelSolid: { color: colors.onDark },
  labelQuiet: { color: colors.inkMuted },
  labelOnDark: { color: colors.deepGreen },
  labelCopied: { color: colors.onDark },
});
