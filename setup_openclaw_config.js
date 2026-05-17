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

    // First run setup to create baseline config
    console.log('Running openclaw setup...');
    const setup = await ssh.execCommand('openclaw setup --non-interactive 2>&1');
    console.log(setup.stdout || setup.stderr);

    // Configure the LLM model via CLI
    console.log('\nConfiguring model...');
    const modelSet = await ssh.execCommand('openclaw config set llm.provider openai-compatible 2>&1');
    console.log(modelSet.stdout || modelSet.stderr);
    
    await ssh.execCommand('openclaw config set llm.model moonshotai/kimi-k2.6 2>&1');
    await ssh.execCommand('openclaw config set llm.apiKey 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 2>&1');
    await ssh.execCommand('openclaw config set llm.baseUrl https://integrate.api.nvidia.com/v1 2>&1');
    console.log('Model configured.');

    // Check channels help
    console.log('\nChecking channels help...');
    const channelsHelp = await ssh.execCommand('openclaw channels add --help 2>&1');
    console.log(channelsHelp.stdout);

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error.message);
    ssh.dispose();
  }
}

main();
