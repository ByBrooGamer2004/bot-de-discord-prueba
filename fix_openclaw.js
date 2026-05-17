const { NodeSSH } = require('c:\\Users\\Brayan\\Documents\\empanadas\\backend\\node_modules\\node-ssh');
const ssh = new NodeSSH();

async function main() {
  try {
    console.log('Conectando...');
    await ssh.connect({
      host: '192.168.1.150',
      username: 'u0_a143',
      password: 'Luca1618$',
      port: 8022,
      readyTimeout: 30000
    });
    console.log('¡Conectado!');

    // 1. Stop and delete old openclaw from PM2
    await ssh.execCommand('pm2 delete openclaw 2>/dev/null');
    console.log('Old PM2 process deleted.');

    // 2. Remove the broken source directory
    await ssh.execCommand('rm -rf ~/openclaw');
    console.log('Old openclaw directory removed.');

    // 3. Find the actual global openclaw binary path
    const findBin = await ssh.execCommand('command -v openclaw 2>&1');
    console.log('Global openclaw binary:', findBin.stdout);

    // 4. Start openclaw properly using the global binary with "gateway start"
    console.log('Starting openclaw gateway...');
    const globalPath = findBin.stdout.trim();
    const start = await ssh.execCommand(`pm2 start "${globalPath}" --name "openclaw" -- gateway start 2>&1`);
    console.log(start.stdout || start.stderr);

    await ssh.execCommand('pm2 save');

    // Wait and check logs
    await new Promise(r => setTimeout(r, 4000));
    const logs = await ssh.execCommand('pm2 logs openclaw --lines 20 --nostream');
    console.log('--- LOGS ---');
    console.log(logs.stdout || logs.stderr);

    // Show all PM2 processes
    const pm2list = await ssh.execCommand('pm2 list');
    console.log(pm2list.stdout);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error.message);
    ssh.dispose();
  }
}

main();
