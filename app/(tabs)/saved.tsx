import { useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { SavedRow } from '../../components/SavedRow';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Text } from '../../components/Text';
import { useSoundStates } from '../../context/SoundStateContext';
import { useTheme } from '../../theme/ThemeProvider';
import { LAYOUT, SPACE } from '../../theme/tokens';
import { savedMeta, savedSounds } from '../../store/saved';
import { isPlayable } from '../../store/sounds';

/**
 * Saved — the shortlist. Everything here is one tap from playing, in the order the user
 * actually reaches for them.
 */
export default function SavedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { states, ready, refresh } = useSoundStates();

  // The session writes its count and timer to storage as it closes, without going through
  // the context, so those numbers are stale here until they are read again.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const entries = savedSounds(states);
  // Only the sounds that have a recording are on the phone, so only they can be promised.
  const playable = entries.filter(({ sound }) => isPlayable(sound));

  const openSession = (soundId: string) => {
    router.push({ pathname: '/session', params: { soundId } });
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Saved" subtitle="The ones that work for you" />

      {/* Nothing until the read lands: an empty state that flashed on every visit would
          suggest the list had been lost. */}
      {!ready ? null : entries.length === 0 ? (
        <EmptyState
          testID="saved-empty"
          glyph="☆"
          title="Nothing saved yet"
          body="Tap the star on any sound and it'll wait for you here — with the volume and timer you last used."
          action={{ label: 'Browse sounds', onPress: () => router.navigate('/') }}
        />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={({ sound }) => sound.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SavedRow
              sound={item.sound}
              meta={savedMeta(item)}
              onPress={() => openSession(item.sound.id)}
            />
          )}
          ListFooterComponent={
            playable.length > 0 ? <OfflineNote count={playable.length} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}

/**
 * The reassurance under the list. It matters more than it looks: the app's job happens at
 * 3am, and knowing it does not need a connection is part of trusting it to be there.
 */
function OfflineNote({ count }: { count: number }) {
  return (
    <Card tone="alt" style={styles.note}>
      <Text variant="cardTitleSmall">Downloaded for offline</Text>
      <Text variant="bodySecondary" tone="muted" style={styles.noteBody}>
        {count === 1
          ? 'It came with the app — so it plays in flight mode, at 3am, with no signal.'
          : 'They came with the app — so they play in flight mode, at 3am, with no signal.'}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    paddingHorizontal: LAYOUT.screenGutter,
    paddingBottom: SPACE.s20,
    gap: SPACE.s10,
  },
  note: {
    // On top of the list's own gap, as the design sets the note a little apart from the
    // rows it is describing.
    marginTop: SPACE.s8,
  },
  noteBody: {
    marginTop: SPACE.s4,
  },
});
