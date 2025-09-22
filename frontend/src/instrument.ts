import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "https://2210dd2b22251d8aa99b88692b2bde10@o4507587199369216.ingest.us.sentry.io/4510063524511744",

  // Environment configuration
  environment: import.meta.env.MODE || "development",

  // Enable logs for debugging
  enableLogs: true,

  // Performance monitoring
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in development

  // Session replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Send user info (IP, headers) for better debugging
  sendDefaultPii: true,

  integrations: [
    // Console logging integration
    Sentry.consoleLoggingIntegration({
      levels: ["error", "warn"] // Only capture errors and warnings to avoid spam
    }),

    // Session replay for debugging user interactions
    Sentry.replayIntegration(),

    // Browser tracing for performance monitoring
    Sentry.browserTracingIntegration(),
  ],

  // Custom error filtering
  beforeSend(event, hint) {
    // Filter out development errors
    if (import.meta.env.DEV && event.exception) {
      const error = hint.originalException as Error;
      // Don't send React hydration errors in development
      if (error?.message?.includes("hydration")) {
        return null;
      }
    }
    return event;
  },

  // Release tracking
  release: import.meta.env.VITE_APP_VERSION || "1.0.0",
});