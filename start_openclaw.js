const { NodeSSH } = require('c:\\Users\\Brayan\\Documents\\empanadas\\backend\\node_modules\\node-ssh');
const ssh = new NodeSSH();

async function main() {
  try {
    console.log('Conectando...');
    await ssh.connect({
      host: '192.168.1.150',
      username: 'u0_a143',
      password: 'Luca1618$',
      port: 8022,
      readyTimeout: 30000
    });
    console.log('¡Conectado!');

    // Delete old broken openclaw pm2 process
    await ssh.execCommand('pm2 delete openclaw 2>/dev/null');

    // Create config directory
    await ssh.execCommand('mkdir -p ~/.openclaw');

    // Create openclaw config with NVIDIA API + Kimi 2.6
    const config = JSON.stringify({
      "llm": {
        "provider": "openai-compatible",
        "model": "moonshotai/kimi-k2.6",
        "apiKey": "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",
        "baseUrl": "https://integrate.api.nvidia.com/v1"
      }
    }, null, 2);

    await ssh.execCommand(`echo '${config}' > ~/.openclaw/openclaw.json`);
    console.log('Config creado en ~/.openclaw/openclaw.json');

    // Check the config
    const cat = await ssh.execCommand('cat ~/.openclaw/openclaw.json');
    console.log(cat.stdout);

    // Start openclaw gateway with PM2
    console.log('Iniciando OpenClaw gateway con PM2...');
    const start = await ssh.execCommand('pm2 start openclaw --name "openclaw" -- gateway start 2>&1');
    console.log(start.stdout || start.stderr);

    await ssh.execCommand('pm2 save');

    // Wait a bit and check logs
    await new Promise(r => setTimeout(r, 3000));
    const logs = await ssh.execCommand('pm2 logs openclaw --lines 20 --nostream');
    console.log('--- LOGS ---');
    console.log(logs.stdout || logs.stderr);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error.message);
    ssh.dispose();
  }
}

main();
