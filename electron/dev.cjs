const { spawn } = require('child_process');
const path = require('path');

console.log('Iniciando entorno de desarrollo de escritorio...');

// Ejecutar el servidor de desarrollo de Vite
// Usamos shell: true para asegurar compatibilidad en sistemas Windows
const viteProcess = spawn('npx', ['vite'], { shell: true });

let electronStarted = false;

viteProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[Vite] ${output.trim()}`);

  // Cuando el servidor de desarrollo de Vite esté listo (busca la palabra 'Local:' o 'http://localhost:')
  if (!electronStarted && (output.includes('Local:') || output.includes('http://localhost:'))) {
    electronStarted = true;
    console.log('\n¡Servidor Vite listo! Iniciando ventana de Electron...');

    // Lanzar Electron apuntando a la configuración principal
    const electronProcess = spawn('npx', ['electron', 'electron/main.cjs'], {
      shell: true,
      stdio: 'inherit'
    });

    // Cuando se cierra la ventana de Electron, apagamos el servidor de Vite y terminamos
    electronProcess.on('close', (code) => {
      console.log(`Ventana de Electron cerrada (código ${code}). Finalizando servidor Vite...`);
      viteProcess.kill('SIGINT');
      process.exit(code);
    });
  }
});

viteProcess.stderr.on('data', (data) => {
  console.error(`[Vite Error] ${data}`);
});

viteProcess.on('close', (code) => {
  console.log(`Servidor Vite finalizado (código ${code})`);
});
