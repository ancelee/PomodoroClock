"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
let mainWindow = null;
let tray = null;
const createWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
        width: 450,
        height: 550,
        resizable: false,
        maximizable: false,
        icon: (0, path_1.resolve)(__dirname, '../public/icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile((0, path_1.resolve)(__dirname, '../dist/index.html'));
    }
    mainWindow.on('close', (event) => {
        event.preventDefault();
        mainWindow?.hide();
    });
};
const createTray = () => {
    const icon = electron_1.nativeImage.createFromPath((0, path_1.resolve)(__dirname, '../public/icon.png'));
    tray = new electron_1.Tray(icon);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        { label: '显示', click: () => mainWindow?.show() },
        { label: '退出', click: () => {
                electron_1.app.quit();
            } }
    ]);
    tray.setToolTip('番茄时钟');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        mainWindow?.show();
    });
};
electron_1.app.whenReady().then(() => {
    createWindow();
    createTray();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
