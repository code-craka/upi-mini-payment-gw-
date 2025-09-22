import app from "./index.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Sentry enabled: ${Boolean(process.env.SENTRY_DSN)}`);
});

export default app;
