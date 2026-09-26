const { contextBridge, ipcRenderer } = require('electron');

// Exponer un conjunto limitado y seguro de APIs al frontend de React
contextBridge.exposeInMainWorld('electronAPI', {
  // Versiones del sistema
  getVersions: () => ({
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }),
  // Ejemplo de canal de comunicación bidireccional seguro (futuras extensiones)
  sendMessage: (channel, data) => {
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receiveMessage: (channel, func) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      // Deliberadamente eliminamos event para no exponer el ipcRenderer entero
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});
