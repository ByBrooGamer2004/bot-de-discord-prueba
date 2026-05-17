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

    console.log('Limpiando instalación errónea...');
    await ssh.execCommand('pm2 delete openclaw', { cwd: '/data/data/com.termux/files/home' });
    await ssh.execCommand('rm -rf ~/openclaw', { cwd: '/data/data/com.termux/files/home' });

    console.log('Instalando paquete oficial de OpenClaw globalmente...');
    const install = await ssh.execCommand('npm install -g openclaw@latest', { cwd: '/data/data/com.termux/files/home' });
    if (install.stderr && install.stderr.includes('ERR!')) console.log(install.stderr);

    console.log('Creando directorio de trabajo y configurando llaves de NVIDIA...');
    await ssh.execCommand('mkdir -p ~/openclaw-bot', { cwd: '/data/data/com.termux/files/home' });
    
    const envVars = `OPENAI_API_KEY=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\nMODEL=moonshotai/kimi-k2.6\nBASE_URL=https://integrate.api.nvidia.com/v1\n`;
    await ssh.execCommand(`echo '${envVars}' > .env`, { cwd: '/data/data/com.termux/files/home/openclaw-bot' });

    console.log('Iniciando OpenClaw con PM2...');
    await ssh.execCommand('pm2 start openclaw --name "openclaw"', { cwd: '/data/data/com.termux/files/home/openclaw-bot' });
    await ssh.execCommand('pm2 save');

    console.log('✅ OpenClaw instalado correctamente desde npm.');
    const logs = await ssh.execCommand('pm2 logs openclaw --lines 15 --nostream');
    console.log(logs.stdout || logs.stderr);
    
    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
    ssh.dispose();
  }
}

main();
