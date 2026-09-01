# AfterFlight Mobile — flight recorder POC

Proves one thing: that a phone can record a flight with the screen locked and
ForeFlight in the foreground, offline, and that the result appears in the
existing web Flight Replay.

Not a port of the web app. Five screens, one job.

## Why a native app at all

Browser geolocation stops or is throttled the moment the tab backgrounds or
the screen locks — iOS Safari suspends it outright — and no web API grants
Core Location background updates. That single capability is the entire reason
this project exists.

## Setup

```bash
cd apps/mobile
npm install
npx expo prebuild          # generates ios/ and android/
```

**Expo Go will not validate this.** Background location needs the native
capability, which Go's prebuilt binary does not carry. Use a development build:

```bash
npx eas build --profile development --platform ios
```

That step needs an Apple Developer account.

## The release gate

Not passed until this exact sequence runs on a real iPhone:

1. Install the development build
2. Tap START FLIGHT, confirm fixes arriving
3. Open ForeFlight, lock the screen
4. Leave backgrounded 30–60+ minutes, part of it in airplane mode
5. Reopen, tap END FLIGHT, reconnect
6. Open Flight Replay on web, confirm the whole track

Nothing short of that verifies background recording.
