import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { greetingFor, msUntilGreetingChanges } from '../utils/time';

/**
 * The greeting at the top of Sounds, kept honest.
 *
 * Sounds is a tab: it mounts once and stays mounted for the life of the app. Worked out at
 * render and left there, the greeting would still read "Good afternoon" when the phone is
 * picked up at half ten to wind down — which is the hour this whole app is for.
 *
 * Two things move it on. A timer to the next of noon, six or midnight, for a screen left
 * open across one of them; and coming back into the app, because timers are not to be
 * relied on while it is away and being picked up again is the case that actually matters.
 */
export function useGreeting(): string {
  const [greeting, setGreeting] = useState(() => greetingFor(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Re-armed from the clock each time rather than on a fixed interval, so a timer that
    // fired late — or not at all until the app came back — still lands on the right hour.
    const arm = () => {
      timer = setTimeout(() => {
        setGreeting(greetingFor(new Date()));
        arm();
      }, msUntilGreetingChanges(new Date()));
    };

    arm();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setGreeting(greetingFor(new Date()));
    });
    return () => subscription.remove();
  }, []);

  return greeting;
}
