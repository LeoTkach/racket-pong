module.exports = {
  apps: [
    {
      name: "tt-api",
      script: "server/index.js",
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};