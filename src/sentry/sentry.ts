import React from "react";
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router-dom";
import * as Sentry from "@sentry/react";

const isLocalHost =
  typeof window !== "undefined" &&
  /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);

const isDevBuild = process.env.NODE_ENV !== "production";

function isHotReloadNoise(event: Sentry.ErrorEvent): boolean {
  const frames =
    event.exception?.values?.flatMap((v) => v.stacktrace?.frames ?? []) ?? [];
  if (
    frames.some(
      (f) =>
        typeof f.filename === "string" &&
        (f.filename.includes("hot-update") ||
          f.filename.includes("react-refresh") ||
          f.function === "performReactRefresh" ||
          f.function === "scheduleRefresh")
    )
  ) {
    return true;
  }
  const message = event.exception?.values?.[0]?.value ?? "";
  return (
    message.includes("__WEBPACK_DEFAULT_EXPORT__") ||
    (typeof event.transaction === "string" &&
      frames.some((f) => f.function === "performReactRefresh"))
  );
}

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  // Local `npm start` was reporting as "production" and flooding Issues with HMR crashes.
  environment: isDevBuild || isLocalHost ? "development" : "production",
  enabled: Boolean(process.env.REACT_APP_SENTRY_DSN) && !isDevBuild && !isLocalHost,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
    })
],
  tracesSampleRate: 0.1,
  tracePropagationTargets: ["https://argus-talent-search.web.app/", "https://exams.argus.ai"],
  // Session Replay off — was burning the 50/month quota; we weren't using Replays.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  beforeSend(event) {
    if (isHotReloadNoise(event)) return null;
    return event;
  },
});