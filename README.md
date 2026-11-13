# Pipes

A free pipe puzzle for young kids that works offline. The water needs to get from the tap on the left to the little plant on the right, but the pipes in between are turned the wrong way. Tap a pipe to turn it, and when they all join up, the water flows through and the plant blooms.

Made for ages 5 and up. There is no timer, no move counter and no way to lose: a pipe can be turned as often as you like.

## Demo

Check out the live demo at: https://mardesnic.github.io/des-pipes/

On your phone, open it and choose **Add to Home Screen** (Safari) or **Install app** (Chrome). It then opens like an app and works offline.

## Features

- Four levels:
  - **Very easy**: 3 × 3, only the pipes on the way
  - **Easy**: 4 × 4, with a few extra pipes
  - **Medium**: 5 × 5, with more extra pipes and a longer way
  - **Hard**: 6 × 6, a pipe on every tile
- The water fills each pipe it reaches, so you see how far it gets
- Every game is new, and every game can be solved
- A count of puzzles solved at each level
- Picks up where you left off after a reload
- Keeps the screen on while you play
- In English and Croatian, following the phone's language unless you pick one
- Light and dark mode
- No ads, accounts or tracking

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # game and translation tests
npm run build      # production build in dist/
```

`npm run deploy` builds the app and publishes it to GitHub Pages.
