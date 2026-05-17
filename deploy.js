const { NodeSSH } = require('c:\\Users\\Brayan\\Documents\\empanadas\\backend\\node_modules\\node-ssh');
const ssh = new NodeSSH();
const path = require('path');

async function main() {
  try {
    console.log('Connecting to SSH (Redmi 7A)...');
    await ssh.connect({
      host: '192.168.1.150',
      username: 'u0_a143',
      password: 'Luca1618$',
      port: 8022
    });
    console.log('Connected!');

    console.log('Uploading discord-bot directory...');
    const localPath = 'c:\\Users\\Brayan\\Downloads\\discord-bot-roles\\discord-bot-roles';
    const remotePath = './discord-bot';
    
    await ssh.putDirectory(localPath, remotePath, {
      recursive: true,
      concurrency: 10,
      validate: function(itemPath) {
        const baseName = path.basename(itemPath);
        return !['.git', 'deploy.js'].includes(baseName) && !baseName.endsWith('.log');
      }
    });
    console.log('Upload complete.');

    console.log('Running npm install on VPS...');
    await ssh.execCommand('npm install', { cwd: remotePath });
    console.log('Dependencies installed.');

    console.log('Restarting PM2 for Discord Bot...');
    await ssh.execCommand('pm2 restart discord-bot || pm2 start index.js --name discord-bot', { cwd: remotePath });
    
    // Clear logs to see fresh output
    await ssh.execCommand('pm2 flush');
    
    setTimeout(async () => {
      const logs = await ssh.execCommand('pm2 logs discord-bot --lines 15 --nostream', { cwd: remotePath });
      console.log('--- PM2 LOGS ---');
      console.log(logs.stdout || logs.stderr);
      ssh.dispose();
      console.log('Deployment complete!');
    }, 2000);
  } catch (error) {
    console.error('Error during deployment:', error);
    ssh.dispose();
  }
}

main();
