const { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;
let tray;

const isDev = process.env.NODE_ENV === 'development';

// ============ AUTO-UPDATER SETUP ============
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function setupAutoUpdater() {
  if (isDev) return; // Don't check for updates in dev mode

  // Check for updates on startup
  autoUpdater.checkForUpdates();

  // Check for updates every 30 minutes
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 30 * 60 * 1000);

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Доступно обновление',
      message: `Доступна новая версия HARDY (${info.version}).\n\nХотите скачать и установить?`,
      buttons: ['Скачать', 'Позже'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
        showUpdateProgress();
      }
    });
  });

  autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
  });

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow) {
      mainWindow.setProgressBar(progress.percent / 100);
      mainWindow.webContents.executeJavaScript(`
        console.log('Download progress: ${Math.round(progress.percent)}%');
      `);
    }
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.setProgressBar(-1); // Remove progress bar
    
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Обновление готово',
      message: 'Обновление скачано. Приложение перезапустится для установки.',
      buttons: ['Перезапустить сейчас', 'Позже'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        app.isQuitting = true;
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
  });
}

function showUpdateProgress() {
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript(`
      const toast = document.createElement('div');
      toast.id = 'update-toast';
      toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#1a1a2e;color:white;padding:16px 24px;border-radius:8px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
      toast.innerHTML = '⬇️ Загрузка обновления...';
      document.body.appendChild(toast);
    `);
  }
}

function checkForUpdatesManually() {
  autoUpdater.checkForUpdates().then((result) => {
    if (!result || !result.updateInfo) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Обновления',
        message: 'У вас установлена последняя версия HARDY.',
        buttons: ['OK']
      });
    }
  });
}

// ============ WINDOW SETUP ============
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/images/hardy-logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: true,
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0f',
    show: false,
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../public/images/hardy-logo.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Открыть HARDY',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'Юридический помощник (Ctrl+Shift+H)',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.executeJavaScript(`
          window.dispatchEvent(new CustomEvent('open-hardy-bot'));
        `);
      }
    },
    { type: 'separator' },
    {
      label: 'Проверить обновления',
      click: () => {
        checkForUpdatesManually();
      }
    },
    { type: 'separator' },
    {
      label: 'Выход',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('HARDY Кодексы');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

function registerGlobalShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.executeJavaScript(`
        window.dispatchEvent(new CustomEvent('open-hardy-bot'));
      `);
    }
  });
}

// ============ APP LIFECYCLE ============
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerGlobalShortcuts();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
