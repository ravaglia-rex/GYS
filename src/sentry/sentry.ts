import React from "react";
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router-dom";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
    })
],
  tracesSampleRate: 0.5,
  tracePropagationTargets: ["localhost", "https://argus-talent-search.web.app/", "https://exams.argus.ai"],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 0.4,
});