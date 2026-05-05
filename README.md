# Argus frontend

React (Create React App) app for the Argus student and school portal: assessments, proctoring, registration, and related flows. Backend is Firebase (Auth, Firestore) and Cloud Functions; API base URL and Firebase client config are supplied via `REACT_APP_*` environment variables at build time.

## Local dev

```bash
npm install
npm start
```

App runs at [http://localhost:3000](http://localhost:3000). Create a `.env` in this folder with the same `REACT_APP_*` keys used in production.

## Build

```bash
npm run build
```

Output is in `build/`. Production deploys for the public site are handled by **Vercel** from the connected GitHub repo; set environment variables in the Vercel project.

## Other

- `npm test` - Jest in watch mode (see [CRA testing](https://create-react-app.dev/docs/running-tests/)).
- `npm run eject` - optional; permanently exposes CRA config. Not required for normal work.
