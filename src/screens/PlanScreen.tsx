import { useMemo, useState, type MutableRefObject } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { weekOneToText } from '../bucket';
import { CopyButton } from '../components/CopyButton';
import { PlanItemCard } from '../components/PlanItemCard';
import { saveItemStatus } from '../lib/corpus';
import { colors, radius, shadow, space, type } from '../theme';
import { BUCKETS, type ItemStatus, type Plan } from '../types';

interface Props {
  plan: Plan;
  /** Ref, not value — the id arrives from Supabase after this screen mounts. */
  profileId: MutableRefObject<string | null>;
  onRestart: () => void;
}

export function PlanScreen({ plan, profileId, onRestart }: Props) {
  // MVP+: per-item progress. Optimistic locally, mirrored to item_status so a
  // later generation can skip what this founder already did.
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>({});

  const setStatus = (id: string, s: ItemStatus) => {
    setStatuses((prev) => ({ ...prev, [id]: s }));
    void saveItemStatus(profileId.current, id, s);
  };

  const handled = useMemo(
    () => plan.items.filter((i) => (statuses[i.id] ?? 'todo') !== 'todo').length,
    [plan.items, statuses],
  );

  const ranked = useMemo(
    () => [...plan.items].sort((a, b) => a.rank - b.rank),
    [plan.items],
  );

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>
          {plan.city} · {plan.generatedAt}
        </Text>
        <Pressable onPress={onRestart} style={({ pressed }) => pressed && styles.pressed}>
          <Text style={styles.restart}>Start over</Text>
        </Pressable>
      </View>

      <Text style={styles.headline}>{plan.headline}</Text>

      <WeekOne plan={plan} />

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Your ten opportunities</Text>
        <Text style={styles.progress}>
          {handled} of {plan.items.length} handled
        </Text>
      </View>

      {BUCKETS.map((bucket) => {
        const items = ranked.filter((i) => i.type === bucket.type);
        if (items.length === 0) return null;
        return (
          <View key={bucket.type} style={styles.bucket}>
            <Text style={styles.bucketLabel}>{bucket.label}</Text>
            <Text style={styles.bucketBlurb}>{bucket.blurb}</Text>
            {items.map((item) => (
              <PlanItemCard
                key={item.id}
                item={item}
                status={statuses[item.id] ?? 'todo'}
                onStatusChange={(s) => setStatus(item.id, s)}
              />
            ))}
          </View>
        );
      })}

      <Text style={styles.footnote}>
        Every item above is a checked {plan.city} entry. We cover one city on purpose —
        we would rather say "we don't have that" than invent it.
      </Text>
    </ScrollView>
  );
}

/** F4 — five actions, in order, with the total time on the front. */
function WeekOne({ plan }: { plan: Plan }) {
  return (
    <View style={styles.week}>
      <View style={styles.weekHeader}>
        <View style={styles.weekHeaderText}>
          <Text style={styles.weekLabel}>Week one</Text>
          <Text style={styles.weekTitle}>Five things, {plan.week_one.total_time} total</Text>
        </View>
        <CopyButton value={weekOneToText(plan)} label="Copy plan" tone="onDark" />
      </View>

      {plan.week_one.actions.map((a, i) => (
        <View key={a.id} style={styles.action}>
          <View style={styles.actionMarker}>
            <Text style={styles.actionNumber}>{i + 1}</Text>
            {i < plan.week_one.actions.length - 1 ? <View style={styles.actionLine} /> : null}
          </View>
          <View style={styles.actionBody}>
            <Text style={styles.actionWhen}>
              {a.day}
              {a.time ? ` ${a.time}` : ''}
              <Text style={styles.actionDuration}> · {a.duration}</Text>
            </Text>
            <Text style={styles.actionTitle}>{a.title}</Text>
            <Text style={styles.actionDetail}>{a.detail}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: space.xl,
    paddingBottom: space.xxxl,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  eyebrow: { ...type.label, color: colors.accent },
  restart: { ...type.smallStrong, color: colors.inkFaint },
  pressed: { opacity: 0.6 },
  headline: { ...type.display, color: colors.ink, marginBottom: space.xl },

  week: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.xxl,
    ...shadow,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
    marginBottom: space.xl,
  },
  weekHeaderText: { flex: 1 },
  weekLabel: { ...type.label, color: '#B8B09C', marginBottom: space.xs },
  weekTitle: { ...type.title, color: colors.bg },

  action: { flexDirection: 'row', gap: space.md },
  actionMarker: { alignItems: 'center', width: 24 },
  actionNumber: {
    ...type.smallStrong,
    color: colors.bg,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#474334',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionLine: { flex: 1, width: 1, backgroundColor: '#3A3628', marginVertical: space.xs },
  actionBody: { flex: 1, paddingBottom: space.lg },
  actionWhen: { ...type.smallStrong, color: '#E0B894' },
  actionDuration: { color: '#8E8878', fontWeight: '400' },
  actionTitle: { ...type.bodyStrong, color: colors.bg, marginTop: 2 },
  actionDetail: { ...type.small, color: '#ADA695', marginTop: space.xs },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  sectionTitle: { ...type.title, color: colors.ink },
  progress: { ...type.small, color: colors.inkFaint },

  bucket: { marginBottom: space.lg },
  bucketLabel: { ...type.heading, color: colors.ink },
  bucketBlurb: { ...type.small, color: colors.inkFaint, marginBottom: space.lg, marginTop: 2 },

  footnote: {
    ...type.small,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: space.lg,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
