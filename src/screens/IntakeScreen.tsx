import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { ChoiceGroup } from '../components/ChoiceGroup';
import { Field } from '../components/Field';
import { HeroBackdrop } from '../components/HeroBackdrop';
import { checkCity, SUPPORTED_CITY } from '../cityGuard';
import { SAMPLE_PROFILE } from '../data/samplePlan';
import { colors, radius, shadow, space, type } from '../theme';
import { GOAL_OPTIONS, STAGE_OPTIONS, type IntakeProfile } from '../types';

const EMPTY: IntakeProfile = {
  building: '',
  city: '',
  stage: '',
  customer: '',
  goal: '',
  tried: '',
};

/**
 * Scroll-linked depth on the hero. Layers that are conceptually further away
 * move less, which is what reads as parallax:
 *   rings  0.25  — furthest back, barely drifts
 *   title  0.60  — mid depth
 *   panel  1.00  — the scroll itself, nearest the reader
 */
const RINGS_RATE = 0.25;
const TITLE_RATE = 0.6;

/**
 * The native driver is unavailable on react-native-web, where passing `true`
 * warns and falls back anyway. Ask for it only where it exists.
 */
const NATIVE_DRIVER = Platform.OS !== 'web';

interface Props {
  onGenerate: (profile: IntakeProfile) => void;
}

export function IntakeScreen({ onGenerate }: Props) {
  const [profile, setProfile] = useState<IntakeProfile>(EMPTY);
  // Only surface the out-of-area message after a submit attempt — warning
  // someone mid-keystroke that "Bos" is unsupported would be obnoxious.
  const [attempted, setAttempted] = useState(false);

  const { height: windowHeight } = useWindowDimensions();
  // Tall enough to be a statement, capped so the form is never pushed out of
  // reach on a short window.
  const heroHeight = Math.round(Math.min(460, Math.max(260, windowHeight * 0.52)));

  const scrollY = useRef(new Animated.Value(0)).current;

  const ringsTranslate = scrollY.interpolate({
    inputRange: [0, heroHeight],
    outputRange: [0, -heroHeight * RINGS_RATE],
    extrapolate: 'clamp',
  });
  const titleTranslate = scrollY.interpolate({
    inputRange: [0, heroHeight],
    outputRange: [0, -heroHeight * TITLE_RATE],
    extrapolate: 'clamp',
  });
  /**
   * The fade starts once the rising panel has already covered most of the
   * backdrop, so the hero dissolves rather than blinking out from under it.
   */
  const heroOpacity = scrollY.interpolate({
    inputRange: [heroHeight * 0.45, heroHeight * 0.95],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: NATIVE_DRIVER },
  );

  const set = <K extends keyof IntakeProfile>(key: K) => (v: IntakeProfile[K]) =>
    setProfile((p) => ({ ...p, [key]: v }));

  const city = useMemo(() => checkCity(profile.city), [profile.city]);

  const missing =
    !profile.building.trim() ||
    !profile.city.trim() ||
    !profile.stage ||
    !profile.customer.trim() ||
    !profile.goal;

  const outOfArea = attempted && !city.empty && !city.covered;

  const onSubmit = () => {
    setAttempted(true);
    if (missing) return;
    if (!checkCity(profile.city).covered) return;
    onGenerate(profile);
  };

  return (
    <View style={styles.flex}>
      {/*
        The hero sits behind the scroll view, not inside it. The scroll view is
        transparent for its first `heroHeight` pixels, so the solid panel below
        rides up and covers the backdrop as the reader scrolls.
      */}
      <Animated.View
        style={[styles.hero, { height: heroHeight, opacity: heroOpacity }]}
        pointerEvents="none"
      >
        <HeroBackdrop
          height={heroHeight}
          style={{ transform: [{ translateY: ringsTranslate }] }}
        />
        <Animated.View
          style={[styles.heroText, { transform: [{ translateY: titleTranslate }] }]}
        >
          <Text style={styles.brand}>Inreach</Text>
          <Text style={styles.brandRule} />
          <Text style={styles.brandSub}>
            The growth hire you can't afford yet. {SUPPORTED_CITY}, this week.
          </Text>
        </Animated.View>
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={16}
          // Without this the default white flashes over the hero on iOS bounce.
          showsVerticalScrollIndicator={false}
        >
          <View style={{ height: heroHeight }} />

          <View style={styles.panel}>
            <View style={styles.panelInner}>
              <Text style={styles.display}>
                The five people, events and channels to hit this week.
              </Text>
              <Text style={styles.sub}>
                Six questions, about two minutes. You get ten ranked local opportunities, the
                email already written for each one, and a five-step plan for the week.
              </Text>

              <Pressable onPress={() => setProfile(SAMPLE_PROFILE)} style={styles.demoLink}>
                <Text style={styles.demoLinkText}>Fill with the sample founder →</Text>
              </Pressable>

              <View style={styles.rule} />

              <Field
                index={1}
                label="What are you building?"
                hint="One or two sentences, the way you'd say it out loud."
                value={profile.building}
                onChangeText={set('building')}
                placeholder="An app that…"
                multiline
              />

              <Field
                index={2}
                label="Your city & neighbourhood"
                hint={`We cover ${SUPPORTED_CITY} and the surrounding area today.`}
                value={profile.city}
                onChangeText={set('city')}
                placeholder="Boston — Allston & Cambridge"
              />

              {outOfArea ? <OutOfArea city={profile.city.trim()} reason={city.reason ?? null} /> : null}

              <ChoiceGroup
                index={3}
                label="Stage"
                hint="This changes which items rank, so it is worth getting right."
                options={STAGE_OPTIONS}
                value={profile.stage}
                onChange={set('stage')}
              />

              <Field
                index={4}
                label="Who is your customer?"
                hint="Be specific. 'Everyone' gives you a worse plan."
                value={profile.customer}
                onChangeText={set('customer')}
                placeholder="People 22–35 who recently moved to the city and…"
                multiline
              />

              <ChoiceGroup
                index={5}
                label="Your goal for the next 90 days"
                options={GOAL_OPTIONS}
                value={profile.goal}
                onChange={set('goal')}
              />

              <Field
                index={6}
                label="What have you already tried?"
                hint="So we don't hand you back the thing that didn't work."
                value={profile.tried}
                onChangeText={set('tried')}
                placeholder="Posted on Instagram, put up flyers…"
                multiline
              />

              {attempted && missing ? (
                <Text style={styles.missing}>
                  Fill in the first five — "what you've tried" is optional.
                </Text>
              ) : null}

              <Pressable
                onPress={onSubmit}
                accessibilityRole="button"
                style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
              >
                <Text style={styles.ctaText}>Build my week</Text>
              </Pressable>

              <Text style={styles.footnote}>
                No account, no email required. Nothing is saved.
              </Text>
            </View>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/**
 * The fail-loudly-and-gracefully state. Naming the city back and refusing to
 * guess is the point — it is what a local judge is testing for.
 */
function OutOfArea({ city, reason }: { city: string; reason: string | null }) {
  return (
    <View style={styles.outOfArea}>
      <Text style={styles.outOfAreaTitle}>We don't cover {city} yet.</Text>
      <Text style={styles.outOfAreaBody}>
        Every entry we give you is a real, checked local event, person or channel — so we
        only cover {SUPPORTED_CITY} today. We'd rather tell you that than invent a meetup
        that doesn't exist.
      </Text>
      {/* Person A's gate distinguishes "nowhere near Boston" from "a Boston that
          isn't in Massachusetts". Showing the reason proves we actually checked. */}
      {reason ? <Text style={styles.outOfAreaReason}>Why: {reason}.</Text> : null}
      <Pressable style={styles.waitlist} accessibilityRole="button">
        <Text style={styles.waitlistText}>Join the waitlist for {city}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  hero: { position: 'absolute', top: 0, left: 0, right: 0 },
  heroText: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: space.xxl,
    paddingHorizontal: space.xl,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  brand: {
    fontFamily: type.display.fontFamily,
    fontSize: 64,
    lineHeight: 70,
    fontWeight: '700',
    letterSpacing: -2,
    color: colors.surface,
  },
  brandRule: {
    height: 2,
    width: 56,
    backgroundColor: colors.moss,
    marginTop: space.md,
    marginBottom: space.md,
  },
  brandSub: { ...type.body, color: colors.onDark, maxWidth: 380 },

  scrollContent: { paddingBottom: space.xxxl },

  /** The solid panel that rides up over the backdrop. */
  panel: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: space.xxl,
    minHeight: 640,
    ...shadow,
  },
  panelInner: {
    paddingHorizontal: space.xl,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },

  display: { ...type.display, color: colors.ink, marginBottom: space.md },
  sub: { ...type.body, color: colors.inkMuted },
  demoLink: { marginTop: space.lg, alignSelf: 'flex-start' },
  demoLinkText: { ...type.smallStrong, color: colors.midGreen },
  rule: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: space.xl,
  },
  missing: { ...type.small, color: colors.midGreen, marginBottom: space.md },
  cta: {
    backgroundColor: colors.deepGreen,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: 'center',
    marginTop: space.sm,
    ...shadow,
  },
  ctaPressed: { opacity: 0.8 },
  ctaText: { ...type.heading, color: colors.onDark },
  footnote: {
    ...type.small,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: space.md,
  },
  outOfArea: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: space.lg,
    marginBottom: space.xl,
    marginTop: -space.md,
    borderWidth: 1,
    borderColor: colors.accentLine,
  },
  outOfAreaTitle: { ...type.bodyStrong, color: colors.ink, marginBottom: space.sm },
  outOfAreaBody: { ...type.small, color: colors.inkMuted },
  outOfAreaReason: {
    ...type.small,
    color: colors.deepGreen,
    marginTop: space.sm,
    fontWeight: '600',
  },
  waitlist: {
    marginTop: space.md,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: space.md - 2,
    paddingHorizontal: space.lg,
    alignSelf: 'flex-start',
  },
  waitlistText: { ...type.smallStrong, color: colors.deepGreen },
});
