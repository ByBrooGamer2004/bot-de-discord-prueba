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

    // Find the latest openclaw log file explicitly matching the most recent timestamp
    const cmd = `ls -tr /data/data/com.termux/files/usr/tmp/openclaw-*/openclaw-*.log | tail -n 1`;
    const findLog = await ssh.execCommand(cmd);
    const logPath = findLog.stdout.trim();
    
    if (logPath) {
      console.log('Reading:', logPath);
      // Grab the last 150 lines and grep for telegram/moonshot/error
      const grepLog = await ssh.execCommand(`cat ${logPath} | grep -iE 'telegram|moonshot|error|exception' | tail -n 50`);
      console.log(grepLog.stdout);
      
      console.log('\n--- END OF LOG ---');
      const tail = await ssh.execCommand(`tail -n 20 ${logPath}`);
      console.log(tail.stdout);
    } else {
      console.log('No logs found.');
    }

    ssh.dispose();
  } catch (error) {
    console.error('Error:', error.message);
    ssh.dispose();
  }
}

main();
