import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '../theme';

import type { Option } from '../types';

interface Props<T extends string> {
  label: string;
  hint?: string;
  /** The slug is stored, the label is shown. They are not interchangeable. */
  options: Option<T>[];
  value: T | '';
  onChange: (v: T) => void;
  index: number;
}

/**
 * Single-select chips. Used for stage and goal — both are closed sets, and
 * tapping is faster than typing when the founder is on a phone.
 */
export function ChoiceGroup<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
  index,
}: Props<T>) {
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.index}>{index}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.options}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.xl },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  index: { ...type.label, color: colors.midGreen, width: 16 },
  label: { ...type.heading, color: colors.ink, flex: 1 },
  hint: { ...type.small, color: colors.inkFaint, marginTop: 2, marginLeft: 24 },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: space.sm + 1,
    paddingHorizontal: space.lg,
  },
  chipSelected: { backgroundColor: colors.deepGreen, borderColor: colors.deepGreen },
  chipPressed: { opacity: 0.7 },
  chipText: { ...type.small, fontWeight: '600', color: colors.inkMuted },
  chipTextSelected: { color: colors.onDark },
});
