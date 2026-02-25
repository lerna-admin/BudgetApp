module.exports = {
  apps: [
    {
      name: "budgetapp-app",
      cwd: "./app",
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
