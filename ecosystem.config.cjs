module.exports = {
  apps: [
    {
      name: 'ai-notes-24h',
      script: 'app.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 4000,
      max_memory_restart: '750M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        JWT_EXPIRES_IN: '30d'
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
