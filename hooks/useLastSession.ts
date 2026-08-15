import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getLastSession } from '../store/sessions';
import type { Session } from '../store/sessions';

type Result = {
  /** Null for a first-run user, which is why the resume card is hidden rather than empty. */
  session: Session | null;
  /** False until the first read lands, so the card can appear rather than pop in empty. */
  loaded: boolean;
};

/**
 * The last finished session, re-read whenever the screen regains focus. Focus rather than
 * mount because the session that changes this value is recorded on a screen presented on
 * top of this one — Sounds is never unmounted in between.
 */
export function useLastSession(): Result {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getLastSession().then((stored) => {
        if (!active) return;
        setSession(stored);
        setLoaded(true);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  return { session, loaded };
}
