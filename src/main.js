/* ==== Includes ==== */
var R = require('ramda');
var app = require('app');
var ipc = require('ipc');
var browserWindow = require('browser-window');
var globalShortcut = require('global-shortcut');
var dialog = require('dialog');
var modelDiff = require('./diffTools/modelDiff');

/* ==== Initial Application Setup ==== */
// Maintain the BrowserWindow object as a global so it isn't garbage collected.
var mainWindow = null;

// Mac's dont quit. byah.
app.on('window-all-closed', function() {
  if (process.platform != 'darwin')
    app.quit();
});

// Do initialization stuff
app.on('ready', function() {
  mainWindow = new browserWindow({
    width: 800,
    height: 600,
    title: "PIM Model Reporter"
  });

  mainWindow.loadUrl('file://' + __dirname + '/ui/index.html');

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  globalShortcut.register('ctrl+alt+i',
    mainWindow.toggleDevTools.bind(mainWindow)
  );
});


/* ==== IPC Handlers ==== */
var appState = {
  previousModelFilePath: "",
  currentModelFilePath: ""
}
var modelSelectionDialogOptions = {
    'title': "Select Model File",
    'filters': [
      {
        'name': 'Model Files',
        'extensions': ['xml']
      }
    ],
    'multiSelections': false
};

ipc.on('openPreviousModelDialog', function (event) {
  dialog.showOpenDialog(mainWindow, modelSelectionDialogOptions,
    function (filePaths) {
      appState.previousModelFilePath = R.head(filePaths);
      event.sender.send('selectedPreviousModel', appState.previousModelFilePath);
    });
});

ipc.on('openCurrentModelDialog', function (event) {
  dialog.showOpenDialog(mainWindow, modelSelectionDialogOptions,
  function (filePaths) {
    appState.currentModelFilePath = R.head(filePaths);
    event.sender.send('selectedCurrentModel', appState.currentModelFilePath);
  });
});

ipc.on('performDiff', function (event) {
  modelDiff.diffModels(appState.previousModelFilePath, appState.currentModelFilePath)
    .then(
      event.sender.send.bind(event.sender, 'returnDiffResults')
    );
});
