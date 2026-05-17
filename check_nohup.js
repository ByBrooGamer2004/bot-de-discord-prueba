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

    // Check the latest logs from the nohup process
    const logs = await ssh.execCommand('tail -n 60 ~/openclaw_nohup.log');
    console.log('\n--- NOHUP LOGS (Recent Messages) ---');
    console.log(logs.stdout);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error.message);
    ssh.dispose();
  }
}

main();
