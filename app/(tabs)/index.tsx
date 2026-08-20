import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text as RNText, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Pill } from '../../components/Pill';
import { ResumeCard } from '../../components/ResumeCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SoundCard } from '../../components/SoundCard';
import { useSoundStates } from '../../context/SoundStateContext';
import { useGreeting } from '../../hooks/useGreeting';
import { useLastSession } from '../../hooks/useLastSession';
import { useTheme } from '../../theme/ThemeProvider';
import { LAYOUT, SPACE } from '../../theme/tokens';
import { SOUND_FILTERS, findSound, isPlayable, soundsInCategory } from '../../store/sounds';
import type { SoundCategory } from '../../store/sounds';

const GRID_GAP = SPACE.s14;

/**
 * Sounds — the home screen. Resume first, then browse: the fastest path to relief is
 * repeating last night, so that is the one thing above the fold.
 */
export default function SoundsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { stateFor, toggleSaved } = useSoundStates();
  const { session } = useLastSession();
  // Read from a hook rather than the clock: this screen outlives the hour it opened in.
  const greeting = useGreeting();
  const [filter, setFilter] = useState<SoundCategory | 'all'>('all');

  // Two columns with a fixed width rather than `flex: 1`, so a row holding one card leaves
  // the gap beside it instead of stretching the card across the screen.
  const cardWidth = Math.floor((width - LAYOUT.screenGutter * 2 - GRID_GAP) / 2);

  const resumeSound = session ? findSound(session.soundId) : undefined;
  // A sound can drop out of the catalogue, and the recording for one of them has not
  // shipped. Either way there is nothing to resume, so the card stays away.
  const resumable = resumeSound && isPlayable(resumeSound) ? resumeSound : undefined;

  const openSession = (soundId: string) => {
    router.push({ pathname: '/session', params: { soundId } });
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        greeting={greeting}
        title="Let's settle things"
        paddingBottom={0}
        action={<SettingsButton onPress={() => router.push('/settings')} />}
      />

      {resumable && session ? (
        <View style={styles.resume}>
          <ResumeCard
            sound={resumable}
            session={session}
            onPress={() => openSession(resumable.id)}
          />
        </View>
      ) : null}

      <View style={styles.filters}>
        {SOUND_FILTERS.map(({ value, label }) => (
          <Pill
            key={value}
            label={label}
            size="compact"
            selected={filter === value}
            onPress={() => setFilter(value)}
          />
        ))}
      </View>

      <FlatList
        data={soundsInCategory(filter)}
        keyExtractor={(sound) => sound.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <SoundCard
              sound={item}
              saved={stateFor(item.id).saved}
              onPress={() => openSession(item.id)}
              onToggleSaved={() => toggleSaved(item.id)}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

/** The 38pt circle in the header. It is the only way into Settings — there is no fifth tab. */
function SettingsButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Settings"
      hitSlop={(LAYOUT.minTouchTarget - SETTINGS_BUTTON_SIZE) / 2}
      style={({ pressed }) => [
        styles.settingsButton,
        { backgroundColor: colors.surface, borderColor: colors.borderStrong },
        pressed && styles.pressed,
      ]}
    >
      {/* The design's glyph is a chevron, and this design ships no icon library. */}
      <RNText style={[styles.settingsGlyph, { color: colors.textMuted }]}>⌄</RNText>
    </Pressable>
  );
}

const SETTINGS_BUTTON_SIZE = 38;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  resume: {
    paddingTop: SPACE.s20,
    paddingHorizontal: LAYOUT.screenGutter,
  },
  filters: {
    flexDirection: 'row',
    gap: SPACE.s8,
    paddingTop: SPACE.s24,
    paddingBottom: SPACE.s10,
    paddingHorizontal: LAYOUT.screenGutter,
  },
  row: {
    gap: GRID_GAP,
  },
  grid: {
    paddingTop: SPACE.s6,
    paddingHorizontal: LAYOUT.screenGutter,
    paddingBottom: SPACE.s20,
    gap: GRID_GAP,
  },
  settingsButton: {
    width: SETTINGS_BUTTON_SIZE,
    height: SETTINGS_BUTTON_SIZE,
    borderRadius: SETTINGS_BUTTON_SIZE / 2,
    borderWidth: LAYOUT.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    // The chevron reads as lower than the title without this; the design nudges it down.
    marginTop: SPACE.s6,
  },
  settingsGlyph: {
    fontSize: 16,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.7,
  },
});
