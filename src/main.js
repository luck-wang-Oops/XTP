//引入模块
const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  dialog,
  globalShortcut,
  shell
} = require('electron');
const _Path = require('path');

const WinName = 'XTP';
const WinURL = './src/index.html';
const WinIconPath =  _Path.join(__dirname, '/public/love.ico');

let Win = null;
let tray = null;
//创建窗口
function createWindow() {
  //创建窗口
  Win = new BrowserWindow({
    show: false,
    modal: true,
    autoHideMenuBar: true,
    backgroundColor: '#FFF',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: WinIconPath,
  });
  //最大化窗口
  Win.maximize();
  //显示窗口
  Win.show();
  //隐藏窗口
  // Win.hide();
  //加载应用主页
  Win.loadFile(WinURL);
  //监听主窗口
  Win.on('close', (e) => {
    e.preventDefault();
    dialog.showMessageBox(Win, {
      type: 'warning',
      title: '提示',
      message: '确定关闭窗口吗 ? 如需再次使用请点击任务栏托盘图标 !',
      buttons: ['取消', '关闭'],
      defaultId: 0,
    }).then((i) => {
      if (i.response !== 0 ) {
        Win.hide();
        Win.setSkipTaskbar(true);
      }
    });
  });
  //引入本地服务模块
  require('./app/apis.js');
}

//托盘设置
function createTray() {
  tray = new Tray(WinIconPath);
  tray.setToolTip(WinName);
  tray.setContextMenu(Menu.buildFromTemplate([{
      label: '显示隐藏',
      checked: true,
      click: () => {
        return Win.isVisible() ? Win.hide() : Win.show();
      },
    },
    {
      label: '关于我们',
      click: () => {
        shell.openExternal('http://localhost:9527');
      }
    },
    {
      label: '本地设置',
      click: () => {
        shell.openExternal('http://localhost:9527');
      }
    },
    {
      label: '退出程序',
      click: () => {
        if (Win !== null) {
          Win.destroy();
        }
        app.quit();
      }
    },
  ]));
  tray.on('click', () => {
    if (Win.isVisible()) {
      Win.hide();
      Win.setSkipTaskbar(true);
    } else {
      Win.show();
      Win.setSkipTaskbar(false);
    }
  });
}

//快捷键注册
function createShortcut() {
  globalShortcut.register('CommandOrControl+F12', () => {
    if (Win.webContents.isDevToolsOpened()) {
      Win.webContents.closeDevTools();
    } else {
      Win.webContents.openDevTools();
    }
  });
  globalShortcut.register('CommandOrControl+F5', () => {
    Win.reload();
  });
}

//初始化加载
app.on('ready', () => {
  createWindow();
  createTray();
  createShortcut();
});

//当所有界面关闭时
app.on('window-all-closed', () => {
  if (process.platform !== 'drawin') app.quit();
});

//再次激活时
app.on('activate', () => {
  if (Win === null) createWindow()
});

//窗口退出时
app.on('will-quit', () => {
  globalShortcut.unregister('CommandOrControl+F12')
});

//系统崩溃时
app.on('crashed', () => {
  new Promise(resolve => {
    //发送崩溃日志到后台服务器
    console.log('crashed is trigger!');
    resolve();
  }).then(() => {
    dialog.showMessageBox({
      type: 'error',
      title: '系统崩溃',
      message: '系统崩溃了，请联系管理员',
      buttons: ['重启', '退出']
    }).then((i) => {
      if (i.response === 0) {
        if (Win === null) {
          app.relaunch();
          app.exit(0);
        } else {
          BrowserWindow.getAllWindows().forEach((o) => {
            if (o.id !== Win.id) o.destroy();
          })
          Win.reload();
        }
      } else {
        app.quit();
      }
    })
  }).catch((e) => {
    console.log('crashed!!!!', e);
  });
});