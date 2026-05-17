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

    // 1. Get PM2 status
    const pm2 = await ssh.execCommand('pm2 list');
    console.log('--- PM2 PROCESSES ---');
    console.log(pm2.stdout);

    // 2. Get global NPM packages
    const npm = await ssh.execCommand('npm list -g --depth=0');
    console.log('\n--- GLOBAL NPM PACKAGES ---');
    console.log(npm.stdout);

    // 3. Get active services (Cloudflared, etc if any running outside PM2)
    const ps = await ssh.execCommand('ps -ef | grep -E "cloudflared|node|python" | grep -v grep');
    console.log('\n--- OTHER ACTIVE SERVICES ---');
    console.log(ps.stdout);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error.message);
    ssh.dispose();
  }
}

main();
