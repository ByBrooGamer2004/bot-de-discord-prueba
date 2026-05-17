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

    const status = await ssh.execCommand('OPENCLAW_DEBUG=1 openclaw status 2>&1');
    console.log('\n--- STATUS DEBUG ---');
    console.log(status.stdout || status.stderr);

    const help = await ssh.execCommand('OPENCLAW_DEBUG=1 openclaw gateway --help 2>&1');
    console.log('\n--- GATEWAY HELP ---');
    console.log(help.stdout || help.stderr);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error.message);
    ssh.dispose();
  }
}

main();
