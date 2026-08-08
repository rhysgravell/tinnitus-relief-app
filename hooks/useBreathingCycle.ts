import { useEffect, useState } from 'react';

export type BreathingPhase = {
  label: string;
  duration: number;
};

export const BREATHING_PHASES: BreathingPhase[] = [
  { label: 'Breathe in', duration: 4 },
  { label: 'Hold', duration: 4 },
  { label: 'Breathe out', duration: 6 },
  { label: 'Hold', duration: 2 },
];

export function useBreathingCycle(phases: BreathingPhase[]) {
  const [state, setState] = useState({ phaseIndex: 0, secondsRemaining: phases[0].duration });

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.secondsRemaining > 1) {
          return { phaseIndex: prev.phaseIndex, secondsRemaining: prev.secondsRemaining - 1 };
        }
        const nextIndex = (prev.phaseIndex + 1) % phases.length;
        return { phaseIndex: nextIndex, secondsRemaining: phases[nextIndex].duration };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phases]);

  return {
    phase: phases[state.phaseIndex],
    phaseIndex: state.phaseIndex,
    secondsRemaining: state.secondsRemaining,
  };
}
