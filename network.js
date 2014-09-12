"use strict";
var plugin = {
    pluginObj: document.getElementById('pluginID'),
    autoSave: function(data, title, path) {
        return this.pluginObj.AutoSave(data, title, path);
    },
    openSavePath: function(path) {
        this.pluginObj.OpenSavePath(path);
    },
    getDefaultSavePath: function() {
        return this.pluginObj.GetDefaultSavePath();
    },
    saveToClipboard: function(data) {
        var regexp = /^data:image/i;

        if (!regexp.test(data)) {
            if (!regexp.test(screenshot.imgData)) {
                return false;
            }
            data = screenshot.imgData;
        }

        return this.pluginObj.SaveToClipboard(data);
    },
    captureScreen: function() {
        this.pluginObj.CaptureScreen();
    },
    setMessage: function() {
        var ok = 'Ok';
        var cancel = 'Cancel';
        var tipMessage = 'Drag and Capture Screen (Press Esc to Exit)';
        if (this.pluginObj.SetMessage)
            this.pluginObj.SetMessage(ok, cancel, tipMessage);
    },
    setHotKey: function(keyCode) {
        return this.pluginObj.SetHotKey(keyCode);
    },
    disableScreenCaptureHotKey: function() {
        return this.pluginObj.DisableHotKey();
    },
    getViewPortWidth: function() {
        try {
            return this.pluginObj.GetViewPortWidth();
        } catch (e) {
            return null;
        }
    }
};






var screenshot = {
    path: 'filesystem:chrome-extension://' + chrome.i18n.getMessage("@@extension_id") + '/temporary/',
    generated: false,
    newwholepage: true,
    enableNpapi: false,
    imgData: null,

    selectedOptionFunction: function(callback) {
        chrome.tabs.executeScript(null, {file: "js/consentNimbus.js"}, function() {
            callback();
        });
    },

    detectOS: function() {
//        return /Win||Linux/.test(window.navigator.platform) && !/CrOS/.test(window.navigator.userAgent);
        return screenshot.enableNpapi;
    },

    createMenu: function() {
        var root = chrome.contextMenus.create({
            "title": chrome.i18n.getMessage("appName"),
            "contexts": ["all"]
        });

        chrome.contextMenus.create({
            title: chrome.i18n.getMessage("popupBtnVisible"),
            contexts: ["all"],
            parentId: root,
            onclick: function() {
                screenshot.captureVisible()
            }
        });

        chrome.contextMenus.create({
            title: chrome.i18n.getMessage("popupBtnArea"),
            contexts: ["all"],
            parentId: root,
            onclick: function() {
                screenshot.captureSelected()
            }
        });

        chrome.contextMenus.create({
            title: chrome.i18n.getMessage("popupBtnScroll"),
            contexts: ["all"],
            parentId: root,
            onclick: function() {
                screenshot.scrollSelected()
            }
        });

        chrome.contextMenus.create({
            title: chrome.i18n.getMessage("popupBtnEntire"),
            contexts: ["all"],
            parentId: root,
            onclick: function() {
                screenshot.captureEntire()
            }
        });

        if (screenshot.detectOS()) {
            chrome.contextMenus.create({
                title: chrome.i18n.getMessage("popupBtnWindow"),
                contexts: ["all"],
                parentId: root,
                onclick: function() {
                    screenshot.captureWindow()
                }
            });
        }

        chrome.contextMenus.create({
            title: "separator",
            type: "separator",
            contexts: ["all"],
            parentId: root
        });

        chrome.contextMenus.create({
            title: chrome.i18n.getMessage("popupBtnOptions"),
            contexts: ["all"],
            parentId: root,
            onclick: function() {
                chrome.tabs.create({url: 'options.html'}, function(tab) {
                });
            }
        });


    },
    openPage: function(url) {
        chrome.tabs.create({url: url}, function(tab) {
        });
    },
    captureEntire: function() {
        var screencanvas = {};

        function sendScrollMessage(tab) {
            screenshot.newwholepage = true;
            screencanvas = {};

            if (scrollToCrop == true) {
                chrome.tabs.sendRequest(tab.id, {msg: 'scrollPage', 'scrollToCrop': true, 'xs': xs, 'ys': ys, 'ws': ws, 'hs': hs }, function(response) {
                });
            } else {
                chrome.tabs.sendRequest(tab.id, {msg: 'scrollPage', 'scrollToCrop': false}, function(response) {
                });
            }
        }

        if (!screenshot.generated) {
            screenshot.generated = true;
            chrome.extension.onRequest.addListener(function(request, sender, callback) {
                var fn = {'capturePage': capturePage,
                    'openPage': openPage}[request.msg];
                if (fn) {
                    fn(request, sender, callback);
                }
            });
        }

        function capturePage(data, sender, callback) {
            var z = data.devicePixelRatio || 1;
            var canvas;
            if (screenshot.newwholepage) {
                screenshot.newwholepage = false;
                canvas = document.createElement('canvas');
                canvas.width = Math.round(data.totalWidth * z);
                canvas.height = Math.round(data.totalHeight * z);
                screencanvas.canvas = canvas;
                screencanvas.ctx = canvas.getContext('2d');
            }

            chrome.tabs.captureVisibleTab(null, {format: 'png', quality: 100}, function(dataURI) {
                if (dataURI) {
                    var image = new Image();
                    image.onload = function() {
                        screencanvas.ctx.drawImage(image, Math.round(data.x * z), Math.round(data.y * z), Math.round(data.width * z), Math.round(data.height * z));
                        callback(true);
                    };
                    image.src = dataURI;
                }
            });
        }

        function openPage(data) {
            var z = data.devicePixelRatio || 1;

            var dataurl = screencanvas.canvas.toDataURL();
            var name = 'screencapture.png';
            if (scrollToCrop == true) {
                scrollToCrop = false;
                var fonData = screencanvas.ctx.getImageData(Math.round(data.x * z), Math.round(data.y * z), Math.round(data.w * z), Math.round(data.h * z));

                screencanvas.canvas.width = Math.round(data.w * z);
                screencanvas.canvas.height = Math.round(data.h * z);
                screencanvas.ctx.width = Math.round(data.w * z);
                screencanvas.ctx.height = Math.round(data.h * z);

                screencanvas.ctx.putImageData(fonData, 0, 0);

                if (localStorage.format === 'bmp') {
                    dataurl = Canvas2Image.convertToBmp(fonData);
                } else {
                    dataurl = screencanvas.canvas.toDataURL('image/' + localStorage.format);
                }

                name = Date.now() + 'screencapture.' + localStorage.format;
            }

            screenshot.createBlob(dataurl, name, function() {
                localStorage.imgdata = screenshot.path + name;
                if (saveScroll == true) {
                    saveScroll = false;
                    pathImg = localStorage.imgdata;
                    saveImg(pathImg);
                } else {
                    screenshot.createEditPage();
                }
            });
        }

        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.executeScript(tab.id, {file: "js/page.js"}, function() {
                sendScrollMessage(tab);
            });
        });

    },
    setScreenName: function() {
        var contentURL = '';
        var name = '';
        localStorage.screenname = 'screenshot-by-nimbus';

        chrome.tabs.getSelected(null, function(tab) {
            contentURL = tab.url;
            localStorage.pageinfo = JSON.stringify({'url': tab.url, 'title': tab.title});

            name = contentURL.split('?')[0].split('#')[0];
            if (name) {
                name = name.replace(/^https?:\/\//, '').replace(/[^A-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^[_\-]+/, '').replace(/[_\-]+$/, '');
                localStorage.screenname = 'screenshot-by-nimbus-' + name + '';
            }
        });

    },
    

    captureVisible: function() {
        chrome.tabs.captureVisibleTab(null, {format: 'png', quality: 100}, function(img) {

            localStorage.imgdata = img;
            screenshot.createEditPage();

        });
    },
    captureWindow: function() {
        if (screenshot.detectOS()) {
            localStorage["timeout"] = setTimeout(function match() {
                plugin.captureScreen();
            }, 300);
        }
    },

    createBlob: function(dataURI, name, callback) {
        screenshot.imgData = dataURI;
        var byteString = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        var blob = new Blob([ab], {type: mimeString});

        function onwriteend() {
//            window.open('filesystem:chrome-extension://' + chrome.i18n.getMessage("@@extension_id") + '/temporary/' + name);
            if (callback) callback(blob.size);
        }

        function errorHandler() {
            console.log('uh-oh');
        }

        window.webkitRequestFileSystem(TEMPORARY, 1024 * 1024, function(fs) {
            fs.root.getFile(name, {create: true}, function(fileEntry) {
                fileEntry.createWriter(function(fileWriter) {
                    fileWriter.onwriteend = onwriteend;
                    fileWriter.write(blob);
                }, errorHandler);
            }, errorHandler);
        }, errorHandler);

    },

    createBlank: function() {

        var canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 800;

        var ctx = canvas.getContext('2d');

        ctx.fillStyle = "#FFF";
        ctx.fillRect(0, 0, 800, 800);

        localStorage.imgdata = canvas.toDataURL();
        screenshot.createEditPage('blank');
    },
    createEditPage: function(params) {
        var option = params || localStorage.enableEdit;
//        localStorage.nimbusdone = !!(done === true);
        if (option != 'copy') {
            screenshot.setScreenName();
            chrome.tabs.create({url: 'edit.html' + ((option == 'edit') ? '' : ('?' + option))}, function(tab) {
            });
        } else {
            screenshot.copyToClipboard(localStorage.imgdata);
        }
    },
    init: function() {
        screenshot.createMenu();

        try {
            plugin.setMessage();
            var savePath = plugin.getDefaultSavePath();
            console.log(savePath);
            screenshot.enableNpapi = true;
        } catch (e) {
            console.log(e);
            screenshot.enableNpapi = false;
        }

    },
    copyToClipboard: function(img) {

        var text = chrome.i18n.getMessage("notificationCopy");
        if (!screenshot.enableNpapi || !plugin.saveToClipboard(img)) {
            text = chrome.i18n.getMessage("notificationWrong");
        }

        var notification = webkitNotifications.createNotification('favicon.png', chrome.i18n.getMessage("appName"), text);
        notification.show();
        window.setTimeout(function() {
            notification.cancel();
        }, 5000);
    }
};


chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.msg == 'cut') {

        localStorage.imgdata = request.img;
        screenshot.createEditPage();

    } else if (request.msg === 'copytoclipboard') {
        screenshot.copyToClipboard(request.img)
    } else if (request.msg === 'sendtonimbus') {
        localStorage.imgdata = request.img;
        screenshot.createEditPage('nimbus');
    } else if (request.msg === 'openpage') {
        screenshot.openPage(request.url);
    } else if (request.msg === 'getformat') {
        sendResponse(localStorage.format);
    }

});