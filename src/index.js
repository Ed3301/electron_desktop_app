const path = require('path');
const os = require('os');
const fs = require('fs');
const resizeImg = require('resize-img');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, aboutWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: 'Image resizer',
    width: 800,
    height: 600,
    // icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    // resizable: isDev,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// Create About window
const createAboutWindow = () => {
  // Create the browser window.
  aboutWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });

  // and load the index.html of the app.
  aboutWindow.loadURL(`file://${__dirname}/about.html`);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  // Remove mainWindow from memory on close
  mainWindow.on('closed', () => (mainWindow = null));

  app.on('activate', () => {
    if(BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

//Resize the image
const resizeImage = async ({ imgPath, width, height, dest}) => {
  try {
    const newPath = await resizeImg(fs.readFileSync(imgPath), {
      width: +width,
      height: +height,
    });
    //Create filename
    const fileName = path.basename(imgPath);

    //Create destination folder if not exists
    if(!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }

    //Write file to dest folder
    fs.writeFileSync(path.join(dest, fileName), newPath);

    // Send success render
    mainWindow.webContents.send('image:done');
    // Open destination folder
    shell.openPath(dest);
  } catch (err) {
    console.log(err);
  }
}

// Respond to ipcRenderer resize
ipcMain.on('image:resize', (e, options) => {
  options.dest = path.join(os.homedir(), '/Desktop/imageresizer');
  resizeImage(options);
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

const menu = [
  {
    label: app.name,
    submenu: [{
      label: 'About',
      click: createAboutWindow
    }]
  },
  {
    role: 'fileMenu'
  },
  {
    label: 'help',
    submenu: [{
      label: 'About',
      click: createAboutWindow
    }]
  }
];