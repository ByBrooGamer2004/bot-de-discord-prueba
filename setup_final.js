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

    // 1. Apply doctor fix
    console.log('Applying doctor fixes...');
    const fix = await ssh.execCommand('openclaw doctor --fix 2>&1');
    console.log('Doctor fix:', fix.stdout || fix.stderr);

    // 2. Check auth profiles after fix
    const authDir = '/data/data/com.termux/files/home/.openclaw/agents/main/agent';
    const authCheck = await ssh.execCommand(`cat ${authDir}/auth-profiles.json 2>&1`);
    console.log('\nAuth profiles after fix:', authCheck.stdout);

    // 3. Check models status after fix
    const modelStatus = await ssh.execCommand('openclaw models status 2>&1');
    console.log('\nModel status:', modelStatus.stdout || modelStatus.stderr);

    // 4. Kill old PM2 openclaw, start with gateway run
    await ssh.execCommand('pm2 delete openclaw 2>/dev/null');
    
    // Use ecosystem file to pass env vars properly
    const ecosystem = `module.exports = {
  apps: [{
    name: 'openclaw',
    script: '/data/data/com.termux/files/usr/bin/openclaw',
    args: 'gateway run --force',
    env: {
      MOONSHOT_API_KEY: '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',
      OPENAI_API_KEY: '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',
      OPENAI_BASE_URL: 'https://integrate.api.nvidia.com/v1'
    }
  }]
};`;
    await ssh.execCommand(`cat > ~/ecosystem.config.js << 'EOF'
${ecosystem}
EOF`);

    console.log('\nStarting openclaw via ecosystem...');
    const start = await ssh.execCommand('pm2 start ~/ecosystem.config.js 2>&1');
    console.log('Start:', start.stdout || start.stderr);
    await ssh.execCommand('pm2 save');

    // 5. Wait and check
    await new Promise(r => setTimeout(r, 6000));
    await ssh.execCommand('pm2 flush');
    await new Promise(r => setTimeout(r, 3000));
    
    const logs = await ssh.execCommand('pm2 logs openclaw --lines 30 --nostream');
    console.log('\n--- LOGS ---');
    console.log(logs.stdout || logs.stderr);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error.message);
    ssh.dispose();
  }
}

main();
