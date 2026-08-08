export type SleepTip = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export const SLEEP_TIPS: SleepTip[] = [
  {
    id: 'consistent-bedtime',
    icon: '🌙',
    title: 'Keep a consistent bedtime',
    description: 'Going to sleep and waking at the same time trains your body to wind down naturally.',
  },
  {
    id: 'dim-the-lights',
    icon: '🕯️',
    title: 'Dim the lights early',
    description: 'Lowering light an hour before bed helps your body ease into sleep mode.',
  },
  {
    id: 'limit-screens',
    icon: '📵',
    title: 'Step away from screens',
    description: 'Bright screens close to bedtime can make it harder for your mind to settle.',
  },
  {
    id: 'slow-breathing',
    icon: '🌬️',
    title: 'Try slow, steady breathing',
    description: 'A few minutes of slow breathing can quiet a racing mind before sleep.',
  },
  {
    id: 'cool-quiet-room',
    icon: '❄️',
    title: 'Keep your room cool and quiet',
    description: 'A cool, dark, quiet space is one of the simplest ways to support deeper sleep.',
  },
];
