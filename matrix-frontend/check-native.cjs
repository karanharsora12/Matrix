const { execSync } = require('child_process');

if (process.platform === 'linux' && process.arch === 'x64') {
  let needsInstall = false;
  const packages = [
    '@tailwindcss/oxide-linux-x64-gnu',
    '@rolldown/binding-linux-x64-gnu',
    'lightningcss-linux-x64-gnu'
  ];

  for (const pkg of packages) {
    try {
      require.resolve(pkg);
    } catch {
      needsInstall = true;
      break;
    }
  }

  if (needsInstall) {
    console.log('[build] Installing Linux native bindings for Tailwind CSS and Vite...');
    try {
      execSync('npm install --no-save @tailwindcss/oxide-linux-x64-gnu @rolldown/binding-linux-x64-gnu lightningcss-linux-x64-gnu', {
        stdio: 'inherit'
      });
      console.log('[build] Linux native bindings installed successfully.');
    } catch (e) {
      console.warn('[build] Warning: automatic binding install encountered:', e.message);
    }
  }
}
