import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '../theme';

interface Props {
  label: string;
  hint?: string;
  /**
   * The labels a founder reads. The database-accepted code is looked up from
   * STAGE_VALUES / GOAL_VALUES at submit — see src/types.ts.
   */
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  index: number;
}

/**
 * Single-select chips. Used for stage and goal — both are closed sets, and
 * tapping is faster than typing when the founder is on a phone.
 */
export function ChoiceGroup({ label, hint, options, value, onChange, index }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.index}>{index}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.options}>
        {options.map((opt) => {
          const selected = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt}</Text>
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
