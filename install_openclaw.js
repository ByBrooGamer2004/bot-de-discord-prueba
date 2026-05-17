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

    // Limpiar restos si los hay
    await ssh.execCommand('rm -rf ~/openclaw ~/openclaw.zip', { cwd: '/data/data/com.termux/files/home' });

    console.log('Descargando OpenClaw en formato ZIP...');
    const download = await ssh.execCommand('curl -L -o openclaw.zip https://github.com/openclaw/openclaw/archive/refs/heads/main.zip', { cwd: '/data/data/com.termux/files/home' });
    if (download.stderr && !download.stderr.includes('%')) console.log(download.stderr);

    console.log('Descomprimiendo...');
    await ssh.execCommand('unzip -q openclaw.zip && mv openclaw-main openclaw', { cwd: '/data/data/com.termux/files/home' });
    await ssh.execCommand('rm openclaw.zip', { cwd: '/data/data/com.termux/files/home' });

    console.log('Instalando dependencias (esto puede tardar unos minutos)...');
    const npmInstall = await ssh.execCommand('npm install', { cwd: '/data/data/com.termux/files/home/openclaw' });
    if (npmInstall.stderr) console.log(npmInstall.stderr);

    console.log('Configurando .env...');
    const envVars = `OPENAI_API_KEY=tu_api_key_de_nvidia\nMODEL=kimi-2.6\nBASE_URL=https://integrate.api.nvidia.com/v1\n`;
    await ssh.execCommand(`echo '${envVars}' > .env`, { cwd: '/data/data/com.termux/files/home/openclaw' });

    console.log('Iniciando OpenClaw con PM2...');
    await ssh.execCommand('pm2 delete openclaw', { cwd: '/data/data/com.termux/files/home/openclaw' }); 
    await ssh.execCommand('pm2 start npm --name "openclaw" -- start', { cwd: '/data/data/com.termux/files/home/openclaw' });
    await ssh.execCommand('pm2 save');

    console.log('✅ OpenClaw instalado e iniciado en PM2.');
    
    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
    ssh.dispose();
  }
}

main();
