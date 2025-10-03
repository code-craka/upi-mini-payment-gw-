// Sentry initialization for ES modules
// This file must be imported BEFORE any other modules
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://2f866d51f30d7758f82d2c263da74fe0@o4507587199369216.ingest.us.sentry.io/4510063746547712",

  // Environment configuration
  environment: process.env.NODE_ENV || "development",

  integrations: [
    nodeProfilingIntegration(),
  ],

  // Send structured logs to Sentry
  enabledLogs: true,

  // Tracing - different rates for prod vs dev
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Set sampling rate for profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will send default PII data to Sentry.
  sendDefaultPii: true,

  // Custom error filtering
  beforeSend(event, hint) {
    // Filter out development-only errors
    if (process.env.NODE_ENV === 'development') {
      // Don't send CORS errors in development
      if (event.exception && event.exception.values) {
        for (const exception of event.exception.values) {
          if (exception.value?.includes('CORS')) {
            return null;
          }
        }
      }
    }
    return event;
  },

  // Release tracking
  release: process.env.APP_VERSION || "1.0.0",
});

export default Sentry;