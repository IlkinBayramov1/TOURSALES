const { spawn, execSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

// Clean lingering ports before starting dev servers
const portsToFree = [5173, 5174, 5175];
if (isWin) {
  portsToFree.forEach((port) => {
    try {
      const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const lines = output.trim().split('\n');
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && Number(pid) !== process.pid) {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`\x1b[33m➜ Köhnə proses təmizləndi (Port ${port}, PID ${pid})\x1b[0m`);
          } catch (e) {}
        }
      });
    } catch (e) {
      // Port is already free, nothing to kill
    }
  });
}

console.log('\n\x1b[36m%s\x1b[0m', '➜ TOURSALES - 2026 SaaS İnkişaf Mühiti başladılır...');
console.log('\x1b[32m%s\x1b[0m', '➜ Bütün portallar tək əsas qapıya (5173) inteqrasiya edildi:');
console.log('  ➜ \x1b[1m\x1b[34mƏsas Giriş (Web):\x1b[0m     http://localhost:5173/');
console.log('  ➜ \x1b[1m\x1b[33mVendor Paneli:\x1b[0m        http://localhost:5173/vendor/');
console.log('  ➜ \x1b[1m\x1b[35mAdmin Paneli:\x1b[0m         http://localhost:5173/admin/');
console.log('\x1b[90m%s\x1b[0m\n', '(Bütün portallar birbaşa 5173 üzərindən açılmalıdır)\n');

const child = spawn(
  npxCmd,
  [
    'concurrently',
    '-k',
    '-p', '[{name}]',
    '-n', 'VENDOR,ADMIN,WEB',
    '-c', 'yellow,magenta,cyan',
    'npm:dev:vendor',
    'npm:dev:admin',
    'npm:dev:web',
  ],
  {
    cwd: rootDir,
    shell: true,
    stdio: 'inherit',
  }
);

child.on('exit', (code) => {
  process.exit(code || 0);
});
