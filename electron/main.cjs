const { app, BrowserWindow, session, dialog } = require('electron');
const path = require('path');

// Capturar errores no controlados en el proceso principal y mostrarlos en un diálogo nativo
process.on('uncaughtException', (error) => {
  dialog.showErrorBox('Error Crítico del Proceso Principal', error.stack || error.message);
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextBridge: true,
      sandbox: true
    },
    title: 'Planificador Calendario 2027'
  });

  // Ocultar barra de menú predeterminada para diseño limpio y premium
  mainWindow.setMenuBarVisibility(false);

  // Escuchar fallos de carga de la interfaz y mostrarlos en un cuadro de diálogo
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    dialog.showErrorBox(
      'Error de Carga de Interfaz',
      `No se pudo cargar el archivo del calendario.\nRuta: ${validatedURL}\nCódigo: ${errorCode}\nDescripción: ${errorDescription}`
    );
  });

  // Limpiar almacenamiento y caché para evitar secuestros de Service Workers anteriores de forma segura
  try {
    session.defaultSession.clearStorageData().catch(() => {});
  } catch (e) {
    // Silencioso en producción
  }

  // En desarrollo carga el servidor de Vite, en producción carga la compilación estática
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5182');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// Inicialización de la aplicación
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Salir cuando todas las ventanas estén cerradas (excepto en macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
