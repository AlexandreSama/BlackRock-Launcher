const electron = require('electron');
const Tray = electron.Tray
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const ipcMain = electron.ipcMain
const fs = require('fs')
const {
  autoUpdater
} = require('electron-updater');
const request = require('request');
const msmc = require("msmc");
const fetch = require('node-fetch');
const mysql = require('mysql2')
const ConfigVps = require('./config.json')
const remoteMain = require('@electron/remote/main')
const rpc = require("discord-rpc");
const client = new rpc.Client({
  transport: 'ipc'
});

let launcherPath = app.getPath('appData') + '\\BlackRockLauncher\\'
let launcherModsPath = app.getPath('appData') + '\\BlackRockLauncher\\mods\\'
let launcherJavaPath = app.getPath('appData') + '\\BlackRockLauncher\\Java\\'

client.login({
  clientId: '653960332489785384'
}).catch(console.error);
client.on('ready', () => {
  console.log('Your presence works now check your discord profile :D')
  client.request('SET_ACTIVITY', {
    pid: process.pid,
    activity: {
      details: "Voyage a travers les portails",
      state: "Made with Discord-RPC",
      assets: {
        large_image: "portal",
        large_text: "Voyage a travers les portails",
        small_image: "fusee",
        small_text: "Enfile sa tenue de cosmonaute",
      },
      buttons: [{
          label: "Notre Discord",
          url: "https://discord.gg/8mH6nw7H"
        },
        {
          label: "Télécharge moi",
          url: "https://github.com/AlexandreSama/Portal/releases/download/v1.0.0-r7/portal-Setup-1.0.0-r7.exe"
        },
      ]
    }
  })
})

remoteMain.initialize()
//All Called Functions

const functionsPages = require('./components/functions/ChangePages')
const Minecraft = require('./components/functions/Functions')
const process = require('process');
let MSResult

let mainWindow

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 1800,
    height: 1200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    frame: true,
    icon: __dirname + '/logo.ico'
  }); // on définit une taille pour notre fenêtre

  mainWindow.loadURL(`file://${__dirname}/views/login.html`); // on doit charger un chemin absolu
  remoteMain.enable(mainWindow.webContents)

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  //Quand la page est prête a être chargé
  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify()
    let options = {
      url: "https://api.github.com/repos/AlexandreSama/Portal/releases",
      headers: {
        'user-agent': 'node.js',
        'Content-Type': 'application/json'
      }
    }
    request(options, function (error, response, body) {
      if (error) {
        console.log(error)
      }
      mainWindow.webContents.send('githubReleaseData', JSON.parse(body))
    })
    let appIcon = __dirname + '/logo.ico'
    let tray = new Tray(appIcon)
  })
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// fs.readdir(data, 'utf8', (err, files) => {
//   var tbodyRef = document.getElementById('ModTable').getElementsByTagName('tbody')[0]
//   files.forEach(element => {
//       var newRow = tbodyRef.insertRow();

//       // Insert a cell at the end of the row
//       var newCell = newRow.insertCell();

//       // Append a text node to the cell
//       var newText = document.createTextNode(element);
//       newCell.appendChild(newText);
//   })
// })

// Updates Parts

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', {
    version: app.getVersion()
  });
});

autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available')
})

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded')
})

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall()
})

//Pages Parts

ipcMain.on('GoToMinecraft', (event, data) => {
  functionsPages.GoToMinecraftLogin(mainWindow)
})

ipcMain.on('GoToMain', (event, data) => {
  functionsPages.GoToMain(mainWindow)
})

ipcMain.on('GoToAccueilMC', (event, data) => {
  functionsPages.GoToAccueilMC(mainWindow)
})

ipcMain.on('GoToSettings', (event, data) => {
  functionsPages.GoToSettings(mainWindow)
})

ipcMain.on('GoToSettingsMC', (event, data) => {
  functionsPages.GoToSettingsMC(mainWindow)
})

ipcMain.on('SaveAppID', (event, data) => {
  functionsPages.saveAppID(data, launcherPath)
})

// Minecraft Parts

ipcMain.on('loginMS', (event, data) => {
  msmc.fastLaunch("raw", (update) => {

  }).then(result => {
    if (msmc.errorCheck(result)) {
      console.log(result.reason)
      return;
    }
    result.profile
    MSResult = result
    mainWindow.loadURL(`file://${__dirname}/../src/views/accueil.html`)
    let Data = fs.readFileSync(launcherPath + 'infos.json')
    let DataJson = JSON.parse(Data)
    let ram = DataJson.infos[0].ram
    mainWindow.webContents.once('dom-ready', () => {
      mainWindow.webContents.send('MSData', result.profile)
      mainWindow.webContents.send('DataRam', ram)
    })
  })
  Minecraft.downloadModsList(launcherPath)
})

ipcMain.on('GoToModList', (event, data) => {
  functionsPages.GoToMCModList(mainWindow, launcherModsPath)
})

ipcMain.on('Play', (event, data) => {
  Minecraft.launchGame(MSResult, launcherPath, launcherJavaPath, launcherModsPath, mainWindow, event)
})
ipcMain.on('saveID', (event, data) => {
  Minecraft.saveID(launcherPath, data.email)
})

ipcMain.on('SaveRam', (event, data) => {
  Minecraft.saveRam(data, launcherPath)
})
