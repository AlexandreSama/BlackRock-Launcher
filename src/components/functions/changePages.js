const electron = require('electron');
const app = electron.app;
const fs = require('fs')

let launcherPath = app.getPath('appData') + '\\BlackRockLauncher\\'

function GoToAccueilMC(mainWindow) {
    mainWindow.loadURL(`file://${__dirname}/../../views/accueil.html`)
}

function GoToMain(mainWindow) {
    mainWindow.loadURL(`file://${__dirname}/../../views/main.html`)
}

function GoToMCModList(mainWindow, launcherModsPath) {
    mainWindow.loadURL(`file://${__dirname}/../../views/modList.html`)
    mainWindow.webContents.once('dom-ready', () => {
        mainWindow.webContents.send('ModList', launcherModsPath)
    })
}

function GoToSettings(mainWindow) {
    mainWindow.loadURL(`file://${__dirname}/../../views/settings.html`)
}

function GoToSettingsMC(mainWindow) {
    mainWindow.loadURL(`file://${__dirname}/../../views/settings.html`)
}

async function saveAppID(AppID, launcherPath) {
    if (fs.existsSync(launcherPath + 'infos.json')) {
        let rawdata = fs.readFileSync(launcherPath + 'infos.json')

        let student = JSON.parse(rawdata);

        if (student.infos[0].appid === AppID) {
            return false
        } else {
            student.infos[0].appid = AppID
            let json = JSON.stringify(student)
            fs.writeFileSync(launcherPath + 'infos.json', json)
        }
    } else {
        let ID = {
            "infos": [{
                appid: ram
            }]
        }
        let datsa = JSON.stringify(ID)
        fs.writeFileSync(launcherPath + 'infos.json', datsa)
    }
}
module.exports = {
    GoToMCModList,
    GoToMain,
    GoToSettings,
    saveAppID,
    GoToSettingsMC,
    GoToAccueilMC
}