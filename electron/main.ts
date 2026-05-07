import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron'
import { resolve } from 'path'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 550,
    resizable: false,
    maximizable: false,
    icon: resolve(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(resolve(__dirname, '../dist/index.html'))
  }

  mainWindow.on('close', (event) => {
    event.preventDefault()
    mainWindow?.hide()
  })
}

const createTray = () => {
  const icon = nativeImage.createFromPath(resolve(__dirname, '../public/icon.png'))
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示', click: () => mainWindow?.show() },
    { label: '退出', click: () => {
      app.quit()
    }}
  ])
  
  tray.setToolTip('番茄时钟')
  tray.setContextMenu(contextMenu)
  
  tray.on('click', () => {
    mainWindow?.show()
  })
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})