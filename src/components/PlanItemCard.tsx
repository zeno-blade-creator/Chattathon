import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { bucketStyle, itemToText } from '../bucket';
import { colors, radius, shadow, space, type } from '../theme';
import type { ItemStatus, PlanItem } from '../types';
import { CopyButton } from './CopyButton';
import { Pill } from './Pill';

interface Props {
  item: PlanItem;
  status: ItemStatus;
  onStatusChange: (s: ItemStatus) => void;
}

export function PlanItemCard({ item, status, onStatusChange }: Props) {
  const bucket = bucketStyle(item.type);
  const muted = status !== 'todo';

  return (
    <View style={[styles.card, muted && styles.cardMuted]}>
      <View style={styles.header}>
        <View style={[styles.rank, { backgroundColor: bucket.soft }]}>
          <Text style={[styles.rankText, { color: bucket.color }]}>{item.rank}</Text>
        </View>
        <View style={styles.headerText}>
          <Pill text={bucket.label} variant="label" color={bucket.color} background={bucket.soft} />
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {item.date_or_cadence}
            <Text style={styles.metaDot}> · </Text>
            {item.cost}
          </Text>
        </View>
      </View>

      {/* The line the whole product rests on. Never render an item without it. */}
      <View style={[styles.why, { borderLeftColor: bucket.color }]}>
        <Text style={styles.whyLabel}>Why you, why now</Text>
        <Text style={styles.whyText}>{item.why_you_why_now}</Text>
      </View>

      {/* The deterministic half, deliberately separated from the model's prose
          above. This score and these reasons were computed before any model
          call — they are why the item was a candidate at all. Showing them
          means a reader can check the ranking without trusting the writing. */}
      {item.match_reasons && item.match_reasons.length > 0 ? (
        <View style={styles.match}>
          <View style={styles.matchHead}>
            <Text style={styles.matchLabel}>Matched before the model ran</Text>
            {typeof item.match_score === 'number' ? (
              <Text style={styles.matchScore}>score {item.match_score}</Text>
            ) : null}
          </View>
          <Text style={styles.matchText}>{item.match_reasons.join(' · ')}</Text>
        </View>
      ) : null}

      {item.opener ? (
        <View style={styles.opener}>
          <Text style={styles.blockLabel}>What to say when you walk up</Text>
          <Text style={styles.openerText}>{item.opener}</Text>
          <View style={styles.openerActions}>
            <CopyButton value={item.opener} label="Copy line" tone="quiet" />
          </View>
        </View>
      ) : null}

      {item.draft ? (
        <View style={styles.draft}>
          <Text style={styles.blockLabel}>
            {item.draft.channel === 'email'
              ? 'Your email — ready to send'
              : item.draft.channel === 'dm'
                ? 'Your DM — ready to send'
                : 'Your post — ready to publish'}
          </Text>
          {item.draft.subject ? (
            <Text style={styles.subject}>
              <Text style={styles.subjectLabel}>Subject: </Text>
              {item.draft.subject}
            </Text>
          ) : null}
          <Text style={styles.draftBody}>{item.draft.body}</Text>
          <View style={styles.draftActions}>
            <CopyButton
              value={
                item.draft.subject
                  ? `Subject: ${item.draft.subject}\n\n${item.draft.body}`
                  : item.draft.body
              }
              label={item.draft.channel === 'post' ? 'Copy post' : 'Copy email'}
            />
            <Text style={styles.route}>{item.contact_route}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.tags}>
        {item.tags.slice(0, 4).map((t) => (
          <Pill key={t} text={t} />
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => Linking.openURL(item.url)}
          accessibilityRole="link"
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        >
          <Text style={styles.linkText} numberOfLines={1}>
            {item.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} ↗
          </Text>
        </Pressable>

        <View style={styles.statusRow}>
          <StatusToggle
            label={item.draft ? 'Sent' : 'Done'}
            active={status === 'done'}
            activeColor={colors.done}
            onPress={() => onStatusChange(status === 'done' ? 'todo' : 'done')}
          />
          <StatusToggle
            label="Skip"
            active={status === 'skipped'}
            activeColor={colors.skipped}
            onPress={() => onStatusChange(status === 'skipped' ? 'todo' : 'skipped')}
          />
          <CopyButton value={itemToText(item)} label="Copy all" tone="quiet" />
        </View>
      </View>
    </View>
  );
}

function StatusToggle({
  label,
  active,
  activeColor,
  onPress,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      style={({ pressed }) => [
        styles.toggle,
        active && { backgroundColor: activeColor, borderColor: activeColor },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
        {active ? `✓ ${label}` : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    marginBottom: space.lg,
    ...shadow,
  },
  // Completed and skipped items stay in place but stop competing for attention.
  cardMuted: { opacity: 0.52 },

  header: { flexDirection: 'row', gap: space.md },
  match: {
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  matchHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  matchLabel: { ...type.label, color: colors.inkFaint },
  matchScore: {
    ...type.small,
    color: colors.mossDeep,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  matchText: { ...type.small, color: colors.inkMuted },
  rank: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { ...type.bodyStrong, fontWeight: '700' },
  headerText: { flex: 1, gap: space.xs },
  name: { ...type.title, color: colors.ink, marginTop: 2 },
  meta: { ...type.small, color: colors.inkMuted },
  metaDot: { color: colors.inkFaint },

  why: {
    marginTop: space.lg,
    borderLeftWidth: 3,
    paddingLeft: space.md,
  },
  whyLabel: { ...type.label, color: colors.inkFaint, marginBottom: space.xs },
  whyText: { ...type.body, color: colors.ink },

  blockLabel: { ...type.label, color: colors.inkFaint, marginBottom: space.sm },

  opener: {
    marginTop: space.lg,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    padding: space.md,
  },
  openerText: { ...type.body, color: colors.ink, fontStyle: 'italic' },
  openerActions: { flexDirection: 'row', marginTop: space.md },

  draft: {
    marginTop: space.lg,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    padding: space.md,
  },
  subject: { ...type.small, color: colors.ink, marginBottom: space.sm },
  subjectLabel: { ...type.smallStrong, color: colors.inkFaint },
  draftBody: { ...type.body, color: colors.ink },
  draftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.md,
    flexWrap: 'wrap',
  },
  route: { ...type.small, color: colors.inkFaint, flex: 1, minWidth: 140 },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg },

  footer: {
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: space.md,
  },
  link: { alignSelf: 'flex-start' },
  linkText: { ...type.small, color: colors.midGreen, fontWeight: '600' },
  pressed: { opacity: 0.6 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  toggle: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
  toggleText: { ...type.smallStrong, color: colors.inkMuted },
  toggleTextActive: { color: colors.onDark },
});
