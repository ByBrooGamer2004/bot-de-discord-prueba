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

    // 1. Set the model to use the OpenAI provider so it respects OPENAI_BASE_URL
    console.log('Updating primary model to use OpenAI provider...');
    const configUpdate = await ssh.execCommand('openclaw config set agents.defaults.model.primary "openai/moonshotai/kimi-k2.6"');
    console.log(configUpdate.stdout || configUpdate.stderr);

    // 2. Restart PM2 to apply changes
    console.log('\nRestarting PM2 openclaw...');
    await ssh.execCommand('pm2 restart openclaw');
    await ssh.execCommand('pm2 save');
    
    ssh.dispose();
  } catch (error) {
    console.error('Error:', error.message);
    ssh.dispose();
  }
}

main();
