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
    console.log('Connected!');

    // Create boot directory
    await ssh.execCommand('mkdir -p ~/.termux/boot');

    // Create boot script
    const script = [
      '#!/data/data/com.termux/files/usr/bin/sh',
      'termux-wake-lock',
      'sshd',
      'pm2 resurrect'
    ].join('\n');

    await ssh.execCommand(`printf '%s\\n' '${script}' > ~/.termux/boot/start.sh`);
    await ssh.execCommand('chmod +x ~/.termux/boot/start.sh');

    // Verify
    const check = await ssh.execCommand('cat ~/.termux/boot/start.sh');
    console.log('Boot script created:');
    console.log(check.stdout);

    // Save current PM2 processes so resurrect knows what to start
    const save = await ssh.execCommand('pm2 save');
    console.log(save.stdout || save.stderr);
    console.log('Done! On reboot, sshd and PM2 will start automatically.');

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error);
    ssh.dispose();
  }
}

main();
