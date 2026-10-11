# The device pass

Everything in this app is covered by tests except the parts that only a phone can answer: what
the OS paints before any app code runs, what a notification does when it is tapped from the lock
screen, whether a sound survives a call, and whether a screen reader says what we think it says.

This is the list of those, why each one cannot be checked here, and what you should see. It is
written to be reused — a native change puts items back on it — with the state as of the last
update at the bottom.

## First, a rebuild — iOS is behind

`ios/` and `android/` are not in git, so they drift. As of 2026-10-12 the iOS project predates
three merged PRs:

| | in `app.json` | in `ios/` |
|---|---|---|
| bundle identifier (#45) | `com.rhysgravell.quiet` | `com.rhysgravell.tinnitusreliefapp` |
| URL scheme (#46) | `quietapp` | `quiet` |
| dark splash (#48) | `#0E1A1B` | light colour only |

Android is already current on all three. So:

```sh
npx expo prebuild --clean
```

**On iOS this installs as a new app.** The bundle identifier is what the OS uses for identity, so
the new build is a different app from the one on the phone now: a second icon, and none of the old
`AsyncStorage` — no saved sounds, no check-ins, no session log. That is correct, not a bug. Delete
the old install first so you are not testing against a stale copy.

## Appearance

`userInterfaceStyle` was pinned to `"light"` until #34, which meant "Dark after sunset" could not
fire however the phone was set. The current iOS project does carry `Automatic`, so this is a check
rather than a blocker — but it is the check that was impossible to pass before.

- Phone set to Light, "Dark after sunset" on → app stays light.
- Phone set to Dark → app dims. The toggle follows the phone rather than a clock, so this is the
  whole of the feature.
- **Launch with the phone in Dark** → the splash should be `#0E1A1B`, not the light `#EFF3F1`.

The splash is the only surface the OS paints before any app code runs, so nothing but a real launch
shows it. The rest is unreachable in Jest, which mocks `useColorScheme` outright.

## Notifications

All of this happens in the OS, which is why none of it is tested.

- Set a wind-down reminder in Settings. Lock the phone, wait for it, tap it → **Sleep** opens, not
  wherever the app was last left. The check-in reminder opens **Check-in** (#37).
- Do that twice: once with the app backgrounded, once force-quit. Cold start takes a different path
  through `useLastNotificationResponse`.
- Then turn notifications off for Quiet in the phone's settings and come back. The row should stop
  promising a nudge and say "Notifications are off for this app" (#41).
- Turn them back on and come back again. That claim should clear — but the reminder should stay
  **off**, because the OS allowing a reminder is not you asking for one (#57).

## Playback

**You cannot check any of this by ear.** The shipped recordings are one second of pure digital
silence (see below), so a session that is playing perfectly sounds exactly like one that has
failed. Judge it by the elapsed clock still counting and the transport button still offering
"Pause" — or drop one real recording into `assets/sounds/` for the pass and use that sound
throughout.

- Start a session, lock the phone → playback keeps going. `enableBackgroundPlayback` and
  `UIBackgroundModes: audio` are both in the build, so this should hold.
- **Take a call mid-session.** This is an open question rather than a check: nothing in the app
  handles an audio interruption, so whether it resumes on hang-up or stays silent is unknown. Worth
  finding out before deciding whether it needs handling.
- Start a session, tap the moon → Sleep opens and the sound carries on underneath (#40). Then leave
  by the chevron or a swipe → it stops. Those two exits deliberately do opposite things.
- At no point should a microphone permission prompt appear. #36 removed it from the manifest, and
  the iOS build has no `NSMicrophoneUsageDescription` — but a prompt is the kind of thing that only
  shows up in front of a user.

## The 5am turnover

Three recent changes (#70, #71, #72) only show at an hour that is awkward to sit through. Set the
phone clock to 01:00 — Settings → General → Date & Time, auto off — with **no session open**, since
moving the clock backwards confuses a wall-clock timer. Then:

- Sounds greets you "Late night", not "Good morning".
- Check-in asks "How was last night?" and the button reads "Save last night".
- A session from the evening before reads "Earlier tonight", not "Last night".

Put the clock back afterwards.

## VoiceOver

The whole spoken-wording sweep (#50–#69) has been reasoned about and never heard. Turn VoiceOver on
and swipe every screen. Nothing should read "45m" as forty-five metres, "22:30" as a pair of
numbers, or a middle dot as nothing at all. Specifically:

- The breathing exercise announces each phase as it turns over, and the end (#66).
- The loudness bars name their own ends — "Level 1 of 5, Barely there" (#63).
- A sound with no recording says why it will not open, not "Coming soon" (#67).

## Not worth judging yet

So you do not spend the pass forming opinions on placeholders:

- **The audio.** All four `.wav` files are byte-identical and silent: 1.000 second, mono,
  44.1 kHz, every one of the 88,200 data bytes zero. Nothing will come out of the speaker on any
  sound, which is the placeholder and not the playback — see the warning under Playback.
- **`rain-on-canvas`** has no recording at all, so its card is dimmed and reads "Coming soon".
- **The icon and splash artwork** are still the pre-redesign blue rings. The colours around them
  are tokens; the drawings are not.

---

State at last update (2026-10-12): the Android project is current. The iOS project carries #34's
`Automatic` and #36's missing microphone key, so its last prebuild fell between #36 and #45 —
nothing merged from #45 onward has been inside an iOS build.
