const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';

// 5173, 5174, 5175 portlarında ilişib qalmış köhnə prosesləri tək əmrlə təmizləyirik
if (isWin) {
  try {
    const output = execSync('netstat -ano | findstr "LISTENING" | findstr ":5173 :5174 :5175"', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const pids = new Set();
    output.trim().split('\n').forEach((line) => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && Number(pid) !== process.pid) {
        pids.add(pid);
      }
    });
    pids.forEach((pid) => {
      try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch (e) {}
    });
  } catch (e) {
    // Portlar artıq azaddır
  }
}

(async () => {
  const startTime = Date.now();
  const { createServer } = await import('vite');

  try {
    // 3 portalı tək prosesdə paralel olaraq başladırıq (npx və çoxqat npm proseslərini ləğv edir)
    const [webServer, vendorServer, adminServer] = await Promise.all([
      createServer({
        root: path.resolve(rootDir, 'apps/web'),
        configFile: path.resolve(rootDir, 'apps/web/vite.config.ts'),
        logLevel: 'warn',
        server: { clearScreen: false },
      }),
      createServer({
        root: path.resolve(rootDir, 'apps/vendor'),
        configFile: path.resolve(rootDir, 'apps/vendor/vite.config.ts'),
        logLevel: 'warn',
        server: { clearScreen: false },
      }),
      createServer({
        root: path.resolve(rootDir, 'apps/admin'),
        configFile: path.resolve(rootDir, 'apps/admin/vite.config.ts'),
        logLevel: 'warn',
        server: { clearScreen: false },
      }),
    ]);

    await Promise.all([
      webServer.listen(),
      vendorServer.listen(),
      adminServer.listen(),
    ]);

    const durationMs = Date.now() - startTime;

    console.log('\n\x1b[36m%s\x1b[0m \x1b[90m(%sms)\x1b[0m', '➜ TOURSALES — Portallar Aktivdir', durationMs);
    console.log('  ➜ \x1b[1m\x1b[34mWeb Portal:\x1b[0m     http://127.0.0.1:5173/');
    console.log('  ➜ \x1b[1m\x1b[33mVendor Portalı:\x1b[0m  http://127.0.0.1:5173/vendor/');
    console.log('  ➜ \x1b[1m\x1b[35mAdmin Portalı:\x1b[0m   http://127.0.0.1:5173/admin/\n');

    // Graceful Shutdown
    const shutdown = async () => {
      console.log('\n\x1b[33m➜ Serverlər dayandırılır...\x1b[0m');
      await Promise.all([
        webServer.close(),
        vendorServer.close(),
        adminServer.close(),
      ]);
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('\x1b[31m[XƏTA] Serverləri başlatmaq mümkün olmadı:\x1b[0m', err);
    process.exit(1);
  }
})();
