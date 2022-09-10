const {
    Client,
    Authenticator
} = require('minecraft-launcher-core');
const fs = require('fs')
const AdmZip = require("adm-zip");
const Downloader = require("nodejs-file-downloader");
const launcher = new Client();
const path = require('path');
const msmc = require("msmc");
const fetch = require('node-fetch');


async function checkLauncherPaths(launcherPath, launcherJavaPath, launcherModsPath, event) {
    const arrayPath = [launcherPath, launcherModsPath, launcherJavaPath]

    arrayPath.forEach(element => {
        if (!fs.existsSync(element)) {
            fs.mkdir(element, (err) => {
                if (err) {
                    event.sender.send('error', err)
                }

            })
        } else {}
    })
    event.sender.send('finishFile')
}

async function checkForge(launcherPath, event) {

    fs.readFile(launcherPath + 'forge.jar', async (err, file) => {
        if (err) {
            const result = await downloadForge(launcherPath, event)
        } else {
            event.sender.send('forgeAlreadyDownload')
        }
    })
}

async function checkJava(launcherJavaPath, event) {
    const files = fs.readdirSync(launcherJavaPath)
    if (files.length == 0) {
        await downloadJava(launcherJavaPath, event)
    } else {
        event.sender.send('javaAlreadyDownloaded')
    }
}

async function checkMods(launcherPath, launcherModsPath, event) {

    let jsonMods = []
    let folderMods = []
    let i = 0

    fs.readdirSync(launcherModsPath).forEach(file => {
        folderMods.push(file)
    })

    let modsData = fs.readFileSync(launcherPath + "modsList.json")
    let jsonData = JSON.parse(modsData)

    await jsonData.forEach(element => {
        jsonMods.push(element.name)
    });

    let difference = jsonMods.filter(x => !folderMods.includes(x));

    if (difference.length >= 1) {

        let numberMods = difference.length
        for await (const element of difference) {
            const downloadMissedMods = new Downloader({
                url: "http://193.168.146.71/mods/" + element,
                directory: launcherModsPath,
                maxAttempts: 3
            })

            await downloadMissedMods.download()
            i++
            event.sender.send('MissedModsDownload', {
                numberMods
            })
        };

    }
}

async function downloadJava(launcherJavaPath, event) {
    const downloadJava = new Downloader({
        url: "http://193.168.146.71/java.zip",
        directory: launcherJavaPath
    })

    await downloadJava.download()

    const zip = new AdmZip(launcherJavaPath + 'java.zip')

    zip.extractAllTo(launcherJavaPath, true)

    fs.unlinkSync(launcherJavaPath + 'java.zip')

    event.sender.send('javaDownloaded', ('Java téléchargé avec succés'))
}

async function downloadForge(launcherPath, event) {
    const downloadForge = new Downloader({
        url: "http://193.168.146.71/forge.jar",
        directory: launcherPath
    })

    await downloadForge.download()

    event.sender.send('forgeDownloaded', ('Forge téléchargé avec succés'))
}

async function downloadModsList(launcherPath) {
    const downloadModsList = new Downloader({
        url: "http://193.168.146.71/modsList.json",
        directory: launcherPath,
    });

    await downloadModsList.download()

}

function searchObj(obj, query) {

    let ramValue

    for (var key in obj) {
        var value = obj[key];

        if (typeof value === 'object') {
            searchObj(value, query);
        }

        if (value === query) {
            ramValue = value
        } else {
            ramValue = undefined
        }

    }

    return ramValue

}

async function saveRam(ram, launcherPath) {
    console.log("Fonction appellé")

    if (fs.existsSync(launcherPath + 'infos.json')) {
        console.log("Il existe")
        let rawdata = fs.readFileSync(launcherPath + 'infos.json')

        let student = JSON.parse(rawdata);

        if (student.infos[0].ram === ram) {
            return false
        } else {
            student.infos[0].ram = ram
            let json = JSON.stringify(student)
            fs.writeFileSync(launcherPath + 'infos.json', json)
        }
    } else {
        let ID = {
            "infos": [{
                ram: ram
            }]
        }
        let datsa = JSON.stringify(ID)
        fs.writeFileSync(launcherPath + 'infos.json', datsa)
        console.log("Fichier Crée")
    }
}

async function launchGameWithMS(result, javaExePath, RootPath, mainWindow, event) {

    console.log(RootPath)
    console.log(javaExePath)
    fs.unlinkSync(RootPath + 'modsList.json')
    let opts

    console.log('test2')
    fs.readFile(RootPath + 'infos.json', (err, data) => {
        if (err) {
            console.log(err)
            opts = {
                clientPackage: null,
                authorization: msmc.getMCLC().getAuth(result),
                root: RootPath,
                forge: RootPath + "forge.jar",
                javaPath: path.join(javaExePath + 'bin\\java.exe'),
                version: {
                    number: "1.12.2",
                    type: "release"
                },
                memory: {
                    max: "6G",
                    min: "4G"
                }
            }
            launcher.launch(opts);
        }
        if(data){
            let student = JSON.parse(data);
            console.log(path.join(javaExePath + 'bin\\java.exe'))

            opts = {
                clientPackage: null,
                authorization: msmc.getMCLC().getAuth(result),
                root: RootPath,
                forge: RootPath + "forge.jar",
                // customArgs: [
                //     "-XX:+UnlockExperimentalVMOptions",
                //     "-XX:+UseG1GC",
                //     "-XX:G1NewSizePercent=20",
                //     "-XX:G1ReservePercent=20",
                //     "-XX:MaxGCPauseMillis=50",
                //     "-XX:G1HeapRegionSize=32M"
                // ],
                javaPath: path.join(javaExePath + 'bin\\java.exe'),
                version: {
                    number: "1.12.2",
                    type: "release"
                },
                memory: {
                    max: student.infos[0].ram,
                    min: "4G"
                }
            }
            launcher.launch({opts});
        }
    })

    launcher.on('progress', (e) => {
        console.log(e)
        let type = e.type
        let task = e.task
        let total = e.total
        event.sender.send('dataDownload', ({
            type,
            task,
            total
        }))
        console.log(e)
    })
    launcher.on('debug', (e) => {
        console.log(e)
        mainWindow.webContents.send('dataMc', {
            e
        })
    })
    launcher.on('data', (e) => {
        mainWindow.webContents.send('dataMcd', {
            e
        })
        mainWindow.hide()
    })
    launcher.on('close', (e) => {
        if (e !== 0) {
            console.log(e)
            mainWindow.show()
            event.sender.send('errorlaunch', (e))
        } else {
            mainWindow.show()
            event.sender.send('MinecraftOver')
        }
    })

}

async function launchGame(MSResult, launcherPath, launcherJavaPath, launcherModsPath, mainWindow, event) {
    await checkLauncherPaths(launcherPath, launcherJavaPath, launcherModsPath, event).then(async () => {
        console.log("Files Checked !")
        await checkForge(launcherPath, event).then(async () => {
            console.log('Forge Checked !')
            await checkJava(launcherJavaPath, event).then(async () => {
                console.log('Java Checked !')
                await checkMods(launcherPath, launcherModsPath, event).then(() => {
                    console.log('Mods Checked !')
                    launchGameWithMS(MSResult, launcherJavaPath, launcherPath, mainWindow, event)
                })
            })
        })
    })
}

module.exports = {
    saveRam,
    checkLauncherPaths,
    checkForge,
    checkJava,
    checkMods,
    downloadForge,
    downloadJava,
    downloadModsList,
    launchGameWithMS,
    searchObj,
    launchGame,
}