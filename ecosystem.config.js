module.exports = {
  apps: [{
    name: 'memomind',
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 9021
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 9021
    },
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=2048',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
