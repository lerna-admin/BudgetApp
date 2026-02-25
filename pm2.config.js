module.exports = {
  apps: [
    {
      name: "budgetapp-backend",
      cwd: "./backend",
      script: "npm",
      args: "run dev",
      watch: ["src"],
      env: {
        NODE_ENV: "development",
        PORT: 4000,
      },
    },
    {
      name: "budgetapp-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "run dev",
      watch: ["src"],
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
    },
  ],
};
