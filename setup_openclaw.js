const { NodeSSH } = require('c:\\Users\\Brayan\\Documents\\empanadas\\backend\\node_modules\\node-ssh');
const ssh = new NodeSSH();

async function main() {
  try {
    console.log('Conectando al Redmi 7A...');
    await ssh.connect({
      host: '192.168.1.150',
      username: 'u0_a143',
      password: 'Luca1618$',
      port: 8022
    });
    console.log('¡Conectado!');

    console.log('Clonando OpenClaw desde GitHub...');
    // Clonar solo si no existe
    await ssh.execCommand('git clone https://github.com/openclaw/openclaw.git', { cwd: '/data/data/com.termux/files/home' });

    console.log('Instalando dependencias (esto puede tardar unos minutos)...');
    const npmInstall = await ssh.execCommand('npm install', { cwd: '/data/data/com.termux/files/home/openclaw' });
    if (npmInstall.stderr) console.log(npmInstall.stderr);

    console.log('Preparando archivo .env...');
    await ssh.execCommand('cp .env.example .env || touch .env', { cwd: '/data/data/com.termux/files/home/openclaw' });

    console.log('Iniciando OpenClaw con PM2...');
    await ssh.execCommand('pm2 delete openclaw', { cwd: '/data/data/com.termux/files/home/openclaw' }); // Por si ya existía
    const startResult = await ssh.execCommand('pm2 start npm --name "openclaw" -- start', { cwd: '/data/data/com.termux/files/home/openclaw' });
    
    await ssh.execCommand('pm2 save');

    console.log('✅ OpenClaw instalado e iniciado en PM2.');
    
    const logs = await ssh.execCommand('pm2 logs openclaw --lines 15 --nostream');
    console.log('\n--- LOGS DE OPENCLAW ---');
    console.log(logs.stdout || logs.stderr);

    ssh.dispose();
  } catch (error) {
    console.error('Error durante la instalación:', error);
    ssh.dispose();
  }
}

main();
