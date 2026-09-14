# Jamjar

A shared, installable Grocery and Pantry PWA based on Red Ridge's To-Do interaction model.

## Deploying to GitHub Pages

The repository is configured to publish automatically to:

`https://snowsences.github.io/jamjar/`

Every push to `main` builds the static app and deploys the `out` directory through GitHub Actions. In the repository's **Settings → Pages**, set **Source** to **GitHub Actions** if GitHub does not select it automatically.

## Firebase setup

Jamjar uses Google sign-in and stores its shared data under `jamjarHouseholds/shared`.

1. Add `snowsences.github.io` to Firebase Authentication → Settings → Authorized domains. Use the hostname only, without `https://` or `/jamjar/`.
2. Enable Google as a sign-in provider.
3. Merge `firebase/firestore.rules.snippet` into the project's existing Firestore rules. It allows only `allenkevinc@gmail.com` and `meganec96@gmail.com`.

The public Firebase web configuration is in `public/firebase-client.js`. Never add a Firebase service-account key to this repository.

## Local development

```bash
pnpm install
pnpm dev
```

The app is served under `/jamjar/` locally as well as on GitHub Pages.

## Gestures

- Grocery: swipe right to mark an item bought or restore it. Swipe at least two-thirds of the screen to move it to Pantry.
- Pantry: swipe left to move an item to Grocery.
- Tap any item to edit it. Delete is available only in the editor.
- Settings → History Log shows every action and its signed-in actor.
