# ADHD Women's Health App (Phased MVP)

React + Capacitor iOS app for women with ADHD, optimized for fast daily check-ins and low cognitive load.

## Implemented phases

- ✅ ADHD-friendly onboarding + quick logging
- ✅ Cycle/symptom/mood logging
- ✅ Weekly insights cards
- ✅ Local-first persistence (`@capacitor/preferences`, web fallback)
- ✅ Reminder scheduling scaffold (`@capacitor/local-notifications`)
- ✅ Auth scaffold screen (magic-link style UI)
- ✅ Supabase client scaffold + env detection
- ✅ JSON backup export/import

## Run locally

```bash
cd /Users/tj/ADHD Womens Health App
npm install
npm run dev
```

## Build

```bash
npm run build
```

## iOS (Capacitor)

```bash
npm run cap:sync
npm run cap:ios
```

Then press Run in Xcode.

## Local-first mode (what you chose: A)

No backend is required to run and test.
Everything works locally right now.

## Optional Supabase wiring (later)

Create `.env`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

When set, the app detects Supabase-ready mode in the Auth tab.

## Next production steps

1. Implement real magic-link auth calls
2. Add cloud sync + conflict handling
3. Add secure user profile + encrypted health record strategy
4. Add notification deep-links into Today check-in
5. Add App Store compliance pages (privacy, terms, restore purchases)
