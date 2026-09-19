import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '../theme';

interface Props {
  text: string;
  color?: string;
  background?: string;
  /** `label` renders small all-caps; `tag` renders sentence case. */
  variant?: 'label' | 'tag';
}

/** Small rounded chip used for bucket labels, tags, cost and status. */
export function Pill({
  text,
  color = colors.inkMuted,
  // The drab chip surface from the palette, a step darker than the inset panels.
  background = colors.surfaceMuted,
  variant = 'tag',
}: Props) {
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <Text style={[variant === 'label' ? styles.label : styles.tag, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: space.md - 2,
    alignSelf: 'flex-start',
  },
  tag: { ...type.small, fontWeight: '500' },
  label: { ...type.label },
});
