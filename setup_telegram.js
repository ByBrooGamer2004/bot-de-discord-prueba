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

    // 1. Run onboard with --accept-risk to create valid config
    console.log('Running onboard...');
    const onboard = await ssh.execCommand('openclaw onboard --non-interactive --accept-risk 2>&1');
    console.log('Onboard:', onboard.stdout || onboard.stderr);

    // 2. Set model via models auth
    console.log('\nSetting model auth for NVIDIA...');
    const authAdd = await ssh.execCommand('openclaw models auth --help 2>&1');
    console.log('Auth help:', authAdd.stdout);

    // 3. Try setting model directly
    console.log('\nSetting default model...');
    const setModel = await ssh.execCommand('openclaw models set moonshotai/kimi-k2.6 --base-url https://integrate.api.nvidia.com/v1 --api-key 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 2>&1');
    console.log('Set model:', setModel.stdout || setModel.stderr);

    // 4. Check config
    const config = await ssh.execCommand('cat ~/.openclaw/openclaw.json 2>&1');
    console.log('\nConfig:', config.stdout);

    // 5. Check model status
    const modelStatus = await ssh.execCommand('openclaw models status 2>&1');
    console.log('\nModel status:', modelStatus.stdout || modelStatus.stderr);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error.message);
    ssh.dispose();
  }
}

main();
