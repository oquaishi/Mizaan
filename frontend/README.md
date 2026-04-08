# Mizaan - Frontend

React Native mobile app built with Expo for the Mizaan prayer accountability platform.

## Setup

```bash
npm install
npx expo start
```

## Running

- **Expo Go (iPhone/Android):** Scan QR code from terminal
- **Web browser:** `npx expo start --web`
- **Android emulator:** `npx expo start --android`

## Project Structure

```
app/
  (tabs)/         - Tab screens (Home, Check-In, Prayer Times, Settings)
  login.tsx       - Login screen
  register.tsx    - Register screen
  _layout.tsx     - Root layout with auth navigation

src/
  context/        - AuthContext, PrayerTimesContext
  services/       - API calls (auth, prayer times, check-in)
```

## Environment

Update `src/services/api.ts` with your machine's local IP for physical device testing.
