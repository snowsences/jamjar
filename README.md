# Jamjar — plain static PWA

No Next.js, React, TypeScript, npm, build step, or package manager is required.

Deploy the contents of this folder directly to the root of the `jamjar` GitHub repository and publish with GitHub Pages. The existing PWA manifest expects `https://snowsences.github.io/jamjar/`.

Firebase Authentication must authorize `snowsences.github.io`. The existing Firebase web config is retained in `firebase-client.js`, and `firebase/firestore.rules.snippet` contains the Jamjar Firestore rules.

Main files: `index.html`, `styles.css`, `app.js`, `firebase-client.js`, `manifest.webmanifest`, `sw.js`, local Firebase vendor modules, icons, and the Figtree font.
