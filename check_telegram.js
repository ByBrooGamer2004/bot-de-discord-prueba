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

    // Check if Telegram is actually enabled in the database
    console.log('Checking Telegram channel config...');
    const config = await ssh.execCommand('cat ~/.openclaw/openclaw.json | grep telegram -A 4 -B 2');
    console.log(config.stdout);

    // Turn on DEBUG logs for everything to see why Telegram isn't receiving messages
    console.log('\nRestarting with full debug...');
    await ssh.execCommand('pm2 delete openclaw 2>/dev/null');
    
    const ecosystem = `module.exports = {
  apps: [{
    name: 'openclaw',
    script: '/data/data/com.termux/files/usr/bin/openclaw',
    args: 'gateway run --force',
    env: {
      OPENCLAW_DEBUG: '1',
      MOONSHOT_API_KEY: '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',
      OPENAI_API_KEY: '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',
      OPENAI_BASE_URL: 'https://integrate.api.nvidia.com/v1'
    }
  }]
};`;
    await ssh.execCommand(`cat > ~/ecosystem.config.js << 'EOF'
${ecosystem}
EOF`);

    await ssh.execCommand('pm2 start ~/ecosystem.config.js');
    await ssh.execCommand('pm2 flush');
    
    console.log('Waiting 35 seconds for Gateway to fully boot in Termux...');
    await new Promise(r => setTimeout(r, 35000));

    console.log('Checking recent logs for telegram...');
    const logs = await ssh.execCommand('pm2 logs openclaw --lines 50 --nostream');
    console.log(logs.stdout || logs.stderr);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error.message);
    ssh.dispose();
  }
}

main();
