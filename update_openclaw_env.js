const { NodeSSH } = require('c:\\Users\\Brayan\\Documents\\empanadas\\backend\\node_modules\\node-ssh');
const ssh = new NodeSSH();

async function main() {
  try {
    await ssh.connect({
      host: '192.168.1.150',
      username: 'u0_a143',
      password: 'Luca1618$',
      port: 8022
    });
    
    const envVars = `OPENAI_API_KEY=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\nMODEL=moonshotai/kimi-k2.6\nBASE_URL=https://integrate.api.nvidia.com/v1\n`;
    await ssh.execCommand(`echo '${envVars}' > .env`, { cwd: '/data/data/com.termux/files/home/openclaw' });
    await ssh.execCommand('pm2 restart openclaw', { cwd: '/data/data/com.termux/files/home/openclaw' });
    
    console.log('✅ Updated .env and restarted openclaw!');
    ssh.dispose();
  } catch (err) {
    console.error(err);
    ssh.dispose();
  }
}
main();
