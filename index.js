// Electron entry point for packaging
// electron-builder sometimes expects package.json "main" to point to index.js.
// We delegate to our actual main process file.

require('./electron/main.js');
