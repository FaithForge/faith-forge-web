module.exports = {
  apps: [
    {
      name: 'kid-church',
      script: 'npx', // Usa npx para ejecutar comandos de NX
      args: 'nx run kid-church:start', // Comando NX para iniciar la app
      exec_mode: 'cluster', // Modo clúster para escalabilidad
      autorestart: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
