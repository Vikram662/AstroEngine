// Production process definitions. Build the frontend first (`npm run build`).
// Secrets (SESSION_SECRET, ASTRO_INTERNAL_SECRET, ...) must come from the
// environment / .env files, never from this file. For local development run
// `npm run dev` and `uvicorn app.main:app --reload` directly instead.
module.exports = {
  apps: [
    {
      name: "astro-backend",
      cwd: "./backend",
      script: ".\venv\Scripts\uvicorn.exe",
      args: "app.main:app --host 127.0.0.1 --port 8000 --workers 1",
      interpreter: "none",
      watch: false,
      env: {
        PYTHONUNBUFFERED: "1",
        ENVIRONMENT: "production",
      },
    },
    {
      name: "astro-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "run start",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
