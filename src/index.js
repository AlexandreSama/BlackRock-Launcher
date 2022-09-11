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
const rpc = require("discord-rpc");
const client = new rpc.Client({
  transport: 'ipc'
});
const log = require('electron-log');
const notifier = require('node-notifier');
const process = require('process');
const { shell } = require('electron');
const { launchMC, writeRamToFile, checkLauncherPaths } = require('./components/functions/functions');
const remoteMain = require('@electron/remote/main')

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info"
autoUpdater.logger.transports.file.resolvePath = () => path.join(app.getPath('appData'), 'BlackrockLauncher/logs/main.log')

log.info('App starting...');
remoteMain.initialize()

client.login({
  clientId: '653960332489785384'
}).catch((reason) => {
  log.error('[Discord-RPC] Error : ' + reason)
});
client.on('ready', () => {
  log.info('Your presence works now check your discord profile :D')
  client.request('SET_ACTIVITY', {
    pid: process.pid,
    activity: {
      details: "Fais joujou avec la science !",
      state: "Crée avec les génies du RP",
      assets: {
        large_image: "blackrockrp",
        large_text: "Créer par les mecs de chez Académie Rochenoir",
        small_image: "minecraftblackrock",
        small_text: "Perdu entre une action RP",
      },
      buttons: [{
          label: "Notre Discord",
          url: "https://discord.gg/9GgV4hmq"
        },
        {
          label: "Télécharge moi",
          url: "https://github.com/AlexandreSama/BlackRock-Launcher/releases/download/v0.0.1-r3/blackrock-launcher-Setup-0.0.1-r3.exe"
        },
      ]
    }
  })
})
//All Called Functions

let paths = [
  app.getPath('appData') + '\\BlackrockLauncher\\', 
  app.getPath('appData') + '\\BlackrockLauncher\\mods\\', 
  app.getPath('appData') + '\\BlackrockLauncher\\java\\'
]
let responseUpdate
let MSResult
let mainWindow

/**
 * It takes a string as an argument and logs it to the console.
 * @param text - The text to be displayed in the status bar.
 */
 function sendStatusToWindow(text) {
  log.info(text);
}

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
    icon: __dirname + '/logo.ico',
  }); // on définit une taille pour notre fenêtre
  mainWindow.removeMenu()
  mainWindow.loadURL(`file://${__dirname}/views/login.html`); // on doit charger un chemin absolu
  remoteMain.enable(mainWindow.webContents)

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const tray = new Tray(__dirname + '/logo.ico')
  tray.setToolTip('Blackrock Launcher')
  tray.on('click', () => {
      mainWindow.show()
  })
}

app.on('ready', function() {
  createWindow()
  autoUpdater.checkForUpdatesAndNotify()
});

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

// Updates Parts

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', {
    version: app.getVersion()
  });
});

/* Listening for an update-not-available event and then sending a message to the window. */
autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})

/* Listening for an update-not-available event and then sending a message to the window. */
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
})

/* A listener for the autoUpdater. It listens for an error and then sends the error to the window. */
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
})

/* Showing a notification to the user when an update is available. */
autoUpdater.on('update-available', () => {
  sendStatusToWindow('Update available.');
  notifier.notify({
      title: 'Mise a jour est disponible !',
      message: 'Une mise a jour est disponible ! Voulez-vous la télécharger et l\'installer ?',
      actions: ['Oui', 'Non'],
      wait: true
  },
  function (err, response, metadata) {
      responseUpdate = response
  })
})

/* Listening for an update-downloaded event and then sending a message to the window. */
autoUpdater.on('update-downloaded', () => {
  sendStatusToWindow('Update Téléchargé !')
  sendStatusToWindow(responseUpdate)
  if(responseUpdate == "oui"){
      autoUpdater.quitAndInstall(true, true)
  }
})

/* A function that is called when the user clicks on the login button. */
ipcMain.on('loginMS', (event, data) => {
  msmc.fastLaunch('raw', (update) => {

  }).then(result => {
      if (msmc.errorCheck(result)) {
          console.log(result.reason)
          return;
      }
      MSResult = result
      console.log('testas')
      console.log(paths[0] + 'infos.json') 
      fs.readFile(paths[0] + 'infos.json', (err, data) => {
          if(data == undefined){
              mainWindow.loadURL(`file://${__dirname}/../src/views/main.html`)
              mainWindow.webContents.once('dom-ready', () => {
                  mainWindow.webContents.send('loginSuccessWithoutRam', (result.profile))
              });
          }else{
              let datas = JSON.parse(data)
              mainWindow.loadURL(`file://${__dirname}/../src/views/main.html`)
              mainWindow.webContents.once('dom-ready', () => {
                  mainWindow.webContents.send('loginSuccessWithRam', [result.profile, datas.ram])
              })
          }
      })
  })

  checkLauncherPaths(paths[0], paths[2], paths[1], event)
})

/* Saving the ram to a file. */
ipcMain.on('saveRam', (event, data) => {
  let ram = data + "G"
  writeRamToFile(ram, paths[0] + 'infos.json')
})

/* Listening for the playMC event from the renderer process. */
ipcMain.on('playMC', (event, data) => {
  fs.readFile(paths[0] + 'infos.json', (err, data) => {
      let ram = JSON.parse(data)
      console.log(ram.ram)
      launchMC(ram.ram, MSResult, paths[0], paths[1], paths[2], event, mainWindow)
  })
})

ipcMain.on('GoToSettings', (event, data) => {
  mainWindow.loadURL(`file://${__dirname}/../src/views/param.html`)
  mainWindow.webContents.once('dom-ready', () => {
      mainWindow.webContents.send('UserDataFromMain', data)
  })
})

ipcMain.on('GoToMain', (event, data) => {
  console.log(data)
  mainWindow.loadURL(`file://${__dirname}/../src/views/main.html`)
  mainWindow.webContents.once('dom-ready', () => {
      mainWindow.webContents.send('UserDataFromSettings', data)
  })
})

ipcMain.on('openLogFile', (event, data) => {
  let path = app.getPath('appData') + '\\BlackrockLauncher\\logs\\main.log'
  shell.openPath(path)
})

ipcMain.on('openLauncherFolder', (event, data) => {
  shell.openPath(paths[0])
})