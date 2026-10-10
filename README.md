# Quiet

A calm companion for tinnitus, built with Expo and React Native. Not a medical device.

## Features

- **Sounds** — ambient soundscapes to play against the ringing, with a timer that fades out rather than cutting off.
- **Session** — the player itself: volume set just below the ringing, a countdown, and two slow breathing rings to follow.
- **Saved** — the sounds that worked, kept one tap away.
- **Sleep** — a wind-down routine for the night, a guided breathing exercise, and an optional reminder.
- **Check-in** — thirty seconds a day on how loud it was and how you felt, charted over a fortnight, with a sentence that sets the nights you ran a session against the nights you did not.
- **Settings** — timers, fade-out, reminders, and a dark palette that follows your phone.

## Tech stack

- [Expo](https://expo.dev) (SDK 55) + [Expo Router](https://docs.expo.dev/router/introduction/) for file-based navigation
- React Native 0.83 / React 19
- TypeScript
- Jest + React Native Testing Library for unit tests
- ESLint + Husky/lint-staged for linting on commit

## Getting started

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm start
```

Then run on a platform:

```bash
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

## Scripts

| Script | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run ios` | Build and run the native iOS app |
| `npm run android` | Build and run the native Android app |
| `npm run web` | Run the app in a browser |
| `npm test` | Run the Jest test suite |
| `npm run lint` | Lint the codebase |
| `npm run lint:fix` | Lint and auto-fix |

## Project structure

```
app/                  Screens and navigation (Expo Router)
  (tabs)/             Tab screens: Sounds, Saved, Sleep, Check-in
components/           Reusable UI components
context/              Providers: playback, settings, per-sound state
hooks/                Custom hooks (audio, timers, reminders, palette)
store/                The catalogue and everything persisted (AsyncStorage)
theme/                Design tokens and the palette provider
utils/                Small pure helpers (time, duration, breathing)
assets/               Icons, splash screens, artwork, and sound files
__tests__/            Screen and config tests that cannot sit beside their code
```

The one sound plays from `context/PlaybackContext.tsx`, above the navigator, rather than
from the Session screen. It has to outlive that screen: the wind-down routine promises the
sound is still playing underneath the breathing exercise, and the moon on the session is
what hands the night over.

Every colour, radius, font and spacing value comes from `theme/tokens.ts`; screens and
components never hardcode one. Tests sit beside the code they cover, except for screens —
Expo Router bundles everything under `app/`, so those live in `__tests__/app/`.

## Three conventions worth knowing before changing anything

**The day turns over at 5am, not at midnight.** A session that ends at 00:40 and a check-in
filled in at 01:00 are both about the night that has just been had, so both are filed under
the date before. `nightDate()` in `store/checkIns.ts` is the only thing that decides this,
and the trend chart's last column follows it too. Dating anything by the plain calendar date
puts it on a different day from the session it belongs beside. The copy follows the filing as
well as the data does: after midnight the Check-in screen asks "How was last night?" and
offers to save it, from the one noun `checkInDay()` returns, and the Sounds greeting reads
"Late night" until morning starts at the same hour. `NIGHT_UNTIL_HOUR` in `utils/time.ts` is
the one boundary all of them take.

**A screen reader gets its own wording where the visible text is abbreviated.** "45m" is read
aloud as forty-five metres, "22:30" as a pair of numbers, and a middle dot as nothing at all.
So the compact line on screen stays as the design draws it, and a spoken version travels
beside it: `spokenTimeOfDay()` and `timerAccessibilityLabel()` compose one, and components
that take a visible string take the spoken one next to it — `SavedRow`'s `spokenMeta`,
`TonightCard`'s `spokenTime`.

**The app never claims something it is not doing.** A sound whose recording has not shipped
says "Coming soon" rather than failing on a tap; the breathing sheet and the routine step
that opens it only promise a sound underneath when one is playing; the session's chevron
only offers to stop a sound that is audible. When a design line and the app's actual state
disagree, the state wins and the copy bends around it.

## The sound files are placeholders

`assets/sounds/` holds four `.wav` files that are one second of digital silence, and
`rain-on-canvas` has artwork but no recording at all — its card says so rather than
pretending. Everything around them is real: the catalogue, the timer, the fade, the volume,
the session log. Drop real recordings in over the top and the app plays them.

## Contributing

See [`.claude/skills/create-pr/SKILL.md`](.claude/skills/create-pr/SKILL.md) for the branch, test, and PR workflow used in this repo.
