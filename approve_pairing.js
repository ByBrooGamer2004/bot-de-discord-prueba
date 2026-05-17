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

    // Approve the pairing code
    console.log('Approving pairing...');
    const approve = await ssh.execCommand('openclaw pairing approve telegram AQ4DQMPX');
    console.log(approve.stdout || approve.stderr);

    // Also set the user as the owner of the bot
    console.log('\nSetting user as owner...');
    const owner = await ssh.execCommand('openclaw config set commands.ownerAllowFrom \'["telegram:8529797541"]\'');
    console.log(owner.stdout || owner.stderr);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error.message);
    ssh.dispose();
  }
}

main();
