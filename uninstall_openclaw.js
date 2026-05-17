const { NodeSSH } = require('c:\\Users\\Brayan\\Documents\\empanadas\\backend\\node_modules\\node-ssh');
const ssh = new NodeSSH();

async function main() {
  try {
    await ssh.connect({
      host: '192.168.1.150',
      username: 'u0_a143',
      password: 'Luca1618$',
      port: 8022,
      readyTimeout: 30000
    });
    console.log('Conectado. Iniciando desinstalación y limpieza de OpenClaw...');

    // 1. Detener y eliminar el proceso de PM2
    console.log('Eliminando proceso de PM2...');
    await ssh.execCommand('pm2 delete openclaw 2>/dev/null');
    await ssh.execCommand('pm2 save 2>/dev/null');

    // 2. Matar cualquier proceso huérfano de openclaw
    await ssh.execCommand('pkill -f "openclaw" 2>/dev/null');

    // 3. Desinstalar paquete global de npm
    console.log('Desinstalando paquete npm openclaw...');
    const uninstall = await ssh.execCommand('npm uninstall -g openclaw');
    console.log(uninstall.stdout || uninstall.stderr);

    // 4. Borrar todos los archivos de configuración y datos de OpenClaw
    console.log('Borrando datos, configuraciones y logs...');
    await ssh.execCommand('rm -rf ~/.openclaw');
    await ssh.execCommand('rm -rf /data/data/com.termux/files/usr/tmp/openclaw-*');
    
    // 5. Borrar scripts de prueba y logs huérfanos
    await ssh.execCommand('rm -f ~/ecosystem.config.js ~/openclaw_nohup.log');

    console.log('Desinstalación completa.');
    ssh.dispose();
  } catch (error) {
    console.error('Error:', error.message);
    ssh.dispose();
  }
}

main();
