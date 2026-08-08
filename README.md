# Tinnitus Relief

A calming companion app for tinnitus relief, built with Expo and React Native.

## Features

- **Soundscapes** — a grid of ambient soundscapes (rain, fire, ocean, forest, and more) to play and mix into the background, with an optional sleep timer to auto-stop playback.
- **Favourites** — quick access to your saved soundscapes.
- **Sleep** — wind-down tips for the night, including a guided breathing exercise.
- **Mood** — a simple emoji grid for tracking how you're feeling.

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
  (tabs)/             Tab screens: Soundscapes, Favourites, Sleep, Mood
components/           Reusable UI components
context/              React context providers (e.g. favourites)
hooks/                Custom hooks (audio playback, timers, layout)
store/                Static app data (soundscapes, moods, sleep tips)
assets/               Icons, splash screens, and sound files
```

## Contributing

See [`.claude/skills/create-pr/SKILL.md`](.claude/skills/create-pr/SKILL.md) for the branch, test, and PR workflow used in this repo.
