// Error fallback component for Sentry ErrorBoundary
export function ErrorFallback() {
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