const { NodeSSH } = require('c:\\Users\\Brayan\\Documents\\empanadas\\backend\\node_modules\\node-ssh');
const ssh = new NodeSSH();

async function main() {
  try {
    console.log('Conectando al Redmi 7A...');
    await ssh.connect({
      host: '192.168.1.150',
      username: 'u0_a143',
      password: 'Luca1618$',
      port: 8022,
      readyTimeout: 30000
    });
    console.log('¡Conectado!');

    // 1. Restaurar PM2 (discord-bot y empanadas-backend)
    console.log('Restaurando procesos PM2...');
    await ssh.execCommand('pm2 resurrect');

    // 2. Verificar que volvieron
    const pm2 = await ssh.execCommand('pm2 list');
    console.log(pm2.stdout);

    // 3. Instalar openclaw con --ignore-scripts para evitar compilación C++
    console.log('Instalando OpenClaw globalmente (sin compilar C++)...');
    const install = await ssh.execCommand('npm install -g openclaw@latest --ignore-scripts 2>&1');
    console.log(install.stdout || install.stderr);

    // 4. Verificar instalación
    const version = await ssh.execCommand('openclaw --version 2>&1');
    console.log('OpenClaw version:', version.stdout);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error.message);
    ssh.dispose();
  }
}

main();
