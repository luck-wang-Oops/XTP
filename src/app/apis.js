const {
    BrowserWindow,
} = require('electron');

const _express = require('express');
const _ffi = require('ffi-napi');
const _fsx = require('fs');
const _path = require('path');
const _iconv = require('iconv-lite');

var MedModule = null;
var _MedPath = _path.join(__dirname, '../public/extern/sso/MedInterface_All.dll');

console.log('_MedPath = ' + _MedPath);

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

var IdsModule = null;
var _IdsPath = _path.join(__dirname, '../public/extern/dev/widapi.dll');

console.log('_IdsPath = ' + _IdsPath);

_fsx.access(_IdsPath, function (e) {
    if (e) {
        console.log('DLLNotExist:' + _IdsPath);
    } else {
        _IdsDLL = _ffi.Library(_IdsPath, {
            'InitComm': [
                'int', ['int'],
            ],
        });
        IdsModule = {
            onInitComm: function (iPort) {
                var i = _IdsDLL.InitComm(iPort);
                if (i < 0) {
                    return onNo('?????????????????????????????????', i.toString());
                } else {
                    return onOk({
                        xdata: '?????????????????????????????????',
                        xcode: xcode
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

//GET??????:http://localhost:9527
app.get('/', (req, res) => {
    //??????Modal???
    let xWin = new BrowserWindow({
        modal: true,
        icon: _ModalLogo,
        alwaysOnTop: true,
        skipTaskbar: true,
        useContentSize: true,
        autoHideMenuBar: true,
    });
    //????????????
    xWin.loadFile(_ModalURL);
    //?????????????????????
    xWin.on('close', (e) => {
        res.send('hello world!');
    });
});

//GET????????????DLL:http://localhost:9527/api/med/invoke?args1=111&args2=222
app.get('/api/med/invoke', (req, res) => {
    if (MedModule == null) {
        res.json(onNo('??????????????????,???????????????'));
    } else {
        let x = MedModule.onAnalysisQrCode(req.query.args1, req.query.args2, req.query.args3, req.query.args4, req.query.args5);
        res.json(x);
    }
});


//GET????????????DLL:http://localhost:9527/api/ids/invoke?i=1001
app.get('/api/ids/invoke', (req, res) => {
    if (IdsModule == null) {
        res.json(onNo('??????????????????????????????,???????????????'));
    } else {
        let x = IdsModule.onInitComm(req.i);
        res.json(x);
    }
});

//??????9527??????
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
    return _iconv.decode(Buffer.from(v), 'gbk').replaceAll('\u0000', '');
};