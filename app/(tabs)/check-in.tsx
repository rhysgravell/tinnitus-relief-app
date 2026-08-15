import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { LoudnessScale } from '../../components/LoudnessScale';
import { MoodChips } from '../../components/MoodChips';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionCard } from '../../components/QuestionCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SectionLabel } from '../../components/SectionLabel';
import { Text } from '../../components/Text';
import { TextLink } from '../../components/TextLink';
import { TrendChart } from '../../components/TrendChart';
import { useCheckIn } from '../../hooks/useCheckIn';
import { useTheme } from '../../theme/ThemeProvider';
import { LAYOUT, SPACE } from '../../theme/tokens';
import { saveLabel } from '../../store/checkIns';
import {
  hasEarlierThan,
  loggedDays,
  TREND_DAYS,
  TREND_DAYS_WIDE,
  trendCaption,
  trendWindow,
} from '../../store/trend';

/**
 * Check-in — how loud it was, how it felt, and what that has been doing.
 *
 * Loudness comes first because it is the thing that actually changes, and the trend sits
 * directly underneath both questions so logging pays off in the same second it is done.
 */
export default function CheckInScreen() {
  const { colors } = useTheme();
  const { ready, entries, nights, draft, status, setLoudness, setMood, save, refresh } =
    useCheckIn();
  const [wide, setWide] = useState(false);

  // The first read, and every one after it. A screen left open overnight is showing
  // yesterday, so coming back to it re-reads the date as well as the history.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const days = trendWindow(entries, wide ? TREND_DAYS_WIDE : TREND_DAYS);
  const logged = loggedDays(days);
  const earlier = hasEarlierThan(entries, days);

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Two cards, a button and the trend overflow a small phone, so the screen scrolls —
          the design's fixed frame is a large one. */}
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="How was today?" subtitle="Thirty seconds, once a day" />

        <View style={styles.form}>
          <QuestionCard testID="loudness-card" question="How loud was the ringing?">
            <LoudnessScale value={draft.loudness} onChange={setLoudness} />
          </QuestionCard>

          <QuestionCard testID="mood-card" question="And how did you feel?" gap={SPACE.s12}>
            <MoodChips value={draft.mood} onChange={setMood} />
          </QuestionCard>

          <PrimaryButton
            label={saveLabel(status)}
            onPress={save}
            // Off both when there is nothing to save and when there is nothing left to
            // save, which is what tells the user the last tap landed.
            disabled={status === 'incomplete' || status === 'saved'}
          />
        </View>

        <View style={styles.trend}>
          <View style={styles.trendHeader}>
            <SectionLabel>{`Last ${wide ? TREND_DAYS_WIDE : TREND_DAYS} days`}</SectionLabel>
            {/* Offered only when the wider window would actually show something more. */}
            {earlier || wide ? (
              <TextLink
                testID="trend-range"
                label={wide ? 'Show less' : 'See more'}
                accessibilityLabel={`Show the last ${wide ? TREND_DAYS : TREND_DAYS_WIDE} days`}
                onPress={() => setWide((current) => !current)}
              />
            ) : null}
          </View>

          {/* Nothing until the read lands, and no empty plot before the first check-in. */}
          {ready && logged.length > 0 ? <TrendChart testID="trend-chart" days={days} /> : null}

          {ready ? (
            <Text
              variant="bodySecondary"
              tone="secondary"
              // Set off from the chart, but needing no separation when there is no chart.
              style={logged.length > 0 ? styles.caption : null}
            >
              {trendCaption(days, nights)}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: SPACE.s24,
  },
  form: {
    paddingHorizontal: LAYOUT.screenGutter,
    gap: SPACE.s14,
  },
  trend: {
    paddingTop: SPACE.s24,
    paddingHorizontal: LAYOUT.screenGutter,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: SPACE.s14,
  },
  caption: {
    marginTop: SPACE.s16,
  },
});
