# Jamjar — plain static PWA

No Next.js, React, TypeScript, npm, build step, or package manager is required.

Deploy the contents of this folder directly to the root of the `jamjar` GitHub repository and publish with GitHub Pages. The existing PWA manifest expects `https://snowsences.github.io/jamjar/`.

Firebase Authentication must authorize `snowsences.github.io`. The existing Firebase web config is retained in `firebase-client.js`, and `firebase/firestore.rules.snippet` contains the Jamjar Firestore rules.

## Required Firebase rules setup

Jamjar uses the dedicated `jamjar-ec8c6` Firebase project. Before items can be saved, publish the complete rules from `firebase/firestore.rules.snippet` in that project's Firestore Rules editor.

The Jamjar rules allow new item fields without requiring future rule edits. Access remains limited to `allenkevinc@gmail.com` and `meganec96@gmail.com`, and History records remain append-only.

Main files: `index.html`, `styles.css`, `app.js`, `firebase-client.js`, `manifest.webmanifest`, `sw.js`, local Firebase vendor modules, icons, and the Figtree font.
