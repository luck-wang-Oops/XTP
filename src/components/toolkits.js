'use strict';

const {
    BrowserWindow
} = require('electron');

module.exports = ToolKit;


function ToolKit() {
    return null;
}

ToolKit.prototype.onOk = function onOk(code, data) {
    return {
        no: 'OK',
        code: code,
        data: data
    };
};

ToolKit.prototype.onNo = function onNo() {

};

ToolKit.prototype.doGBKToUTF8 = function doGBKToUTF8() {

}

ToolKit.prototype.doDialog = function doDialogExt() {
    let _ModalURL = './src/app/pages/index.html';
    let xWin = new BrowserWindow({
        modal: true,
        icon: _ModalLogo,
        alwaysOnTop: true,
        skipTaskbar: true,
        useContentSize: true,
        autoHideMenuBar: true,
    });
    xWin.loadFile(_ModalURL);
    xWin.on('close', (e) => {
        return;
    });
}