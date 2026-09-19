import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, space, type } from '../theme';

interface Props {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  index: number;
}

/** One numbered intake field. The number keeps the six-field promise visible. */
export function Field({ label, hint, value, onChangeText, placeholder, multiline, index }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.index}>{index}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline]}
        // Keeps the caret visible while typing in the taller fields.
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.xl },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  index: {
    ...type.label,
    // Not amber: #E8B04B on the near-white page is ~1.9:1 at this size.
    // Amber is used as a fill on this view, never as small text.
    color: colors.midGreen,
    width: 16,
  },
  label: { ...type.heading, color: colors.ink, flex: 1 },
  hint: { ...type.small, color: colors.inkFaint, marginTop: 2, marginLeft: 24 },
  input: {
    marginTop: space.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    ...type.body,
    color: colors.ink,
  },
  inputMultiline: { minHeight: 84 },
});
