const {
    BrowserWindow,
    dialog
} = require('electron');

const _express = require('express');
const _ffi = require('ffi-napi');
const _ref = require('ref-napi');
const _fsx = require('fs');
const _icv = require('iconv-lite');
const _path = require('path');
const _ToolKit = require('../components/toolkits')

var MedModule = null;
var _MedPath = _path.join(__dirname, '../public/external/sso/MedInterface_All.dll');

_fsx.access(_MedPath, function (e) {
    if (e) {
        console.log('DLLNotExist:' + _MedPath);
    } else {
        _MedDLL = new _ffi.Library(_MedPath, {
            'f_AnalysisQrCode': [
                'int', ['string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string'],
            ],
        });
        MedModule = {
            onAnalysisQrCode: function (hcode, bizoption, termid, ocode, oname) {
                var xdata = Buffer.alloc(2048);
                var xcode = Buffer.alloc(100);
                var xchnl = Buffer.alloc(100);
                var i = _MedDLL.f_AnalysisQrCode(hcode, bizoption, termid, ocode, oname, '', '', xdata, xcode, xchnl);
                xdata = onGBKToUTF8(xdata);
                xcode = onGBKToUTF8(xcode);
                xchnl = onGBKToUTF8(xchnl);
                if (i < 0) {
                    return onNo(xdata, i.toString());
                } else {
                    return onOk({
                        xdata: xdata,
                        xcode: xcode,
                        xchid: xchnl
                    }, i.toString());
                }
            }
        };
    }
});

var app = _express();
app.use(_express.json());
const _ModalURL = './src/app/pages/index.html';
const _ModalLogo = _path.join(__dirname, '../public/love.ico');

app.all('*', function (req, res, next) {
    console.dir('url:' + req.originalUrl);
    if (req.method != 'GET') {
        console.dir('req:' + JSON.stringify(req.body));
    }
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "content-type");
    res.header("Content-Type", "application/json;charset=utf-8");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

//GET触发:http://localhost:9527
app.get('/', (req, res) => {
    //创建Modal窗
    let xWin = new BrowserWindow({
        modal: true,
        icon: _ModalLogo,
        alwaysOnTop: true,
        skipTaskbar: true,
        useContentSize: true,
        autoHideMenuBar: true,
    });
    //加载页面
    xWin.loadFile(_ModalURL);
    //页面关闭时回传
    xWin.on('close', (e) => {
        res.send('hello world!');
    });
});

//GET运行医保DLL:http://localhost:9527/api/med/invoke?args1=111&args2=222
app.get('/api/med/invoke', (req, res) => {
    if (MedModule == null) {
        res.json(onNo('医保实例为空,无法调用！'));
    } else {
        let x = MedModule.onAnalysisQrCode(req.query.args1, req.query.args2, req.query.args3, req.query.args4, req.query.args5);
        res.json(x);
    }
});

app.listen(9527);

function onOk(data, code = '1000') {
    return {
        no: 'OK',
        code: code,
        data: data
    };
}

function onNo(data, code = '9999') {
    return {
        no: 'NO',
        code: code,
        data: data
    };
}

function onGBKToUTF8(v) {
    if (v == null) {
        return v;
    }
    return _icv.decode(Buffer.from(v), 'gbk').replaceAll('\u0000', '');
};