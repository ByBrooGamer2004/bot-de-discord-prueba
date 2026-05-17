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
    const logs = await ssh.execCommand('pm2 logs openclaw --lines 25 --nostream');
    console.log(logs.stdout || logs.stderr);
    ssh.dispose();
  } catch (err) {
    console.error(err);
    ssh.dispose();
  }
}
main();
