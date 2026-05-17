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
    console.log('Conectado!');

    // Kill any lingering nohup processes of openclaw to prevent port conflicts
    await ssh.execCommand('pkill -f "openclaw gateway run"');
    
    // Ensure PM2 openclaw is the only one running
    await ssh.execCommand('pm2 restart openclaw');
    
    console.log('Process restarted. Waiting 40 seconds to ensure fully booted...');
    await new Promise(r => setTimeout(r, 40000));
    
    console.log('\n--- PM2 OPENCLAW CHECK ---');
    const logs = await ssh.execCommand('pm2 logs openclaw --lines 50 --nostream 2>&1');
    console.log(logs.stdout || logs.stderr);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error.message);
    ssh.dispose();
  }
}

main();
