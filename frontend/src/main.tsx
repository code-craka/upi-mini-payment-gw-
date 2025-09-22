// Sentry initialization should be imported first!
import './instrument.ts';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App.tsx';

const container = document.getElementById('root')!;
const root = createRoot(container, {
  // React 19+ error hooks integration with Sentry
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.warn('Uncaught error', error, errorInfo.componentStack);
  }),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
});

root.render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />} showDialog>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);

// Error fallback component
function ErrorFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-white text-center max-w-md">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="mb-6">We've been notified about this error and are working to fix it.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}
