export type Mood = {
  id: string;
  emoji: string;
  label: string;
};

export const MOODS: Mood[] = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'calm', emoji: '😌', label: 'Calm' },
  { id: 'sad', emoji: '😔', label: 'Sad' },
  { id: 'anxious', emoji: '😟', label: 'Anxious' },
  { id: 'tired', emoji: '😴', label: 'Tired' },
  { id: 'frustrated', emoji: '😠', label: 'Frustrated' },
];
