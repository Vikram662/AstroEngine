module.exports = {
  apps: [
    {
      name: "astro-backend",
      cwd: "./backend",
      script: ".\\venv\\Scripts\\uvicorn.exe",
      args: "app.main:app --port 8000 --reload",
      interpreter: "none",
      watch: false,
      env: {
        PYTHONUNBUFFERED: "1",
      },
    },
    {
      name: "astro-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "run dev",
      watch: false,
      env: {
        NODE_ENV: "development",
        PORT: "3000",
      },
    },
  ],
};
