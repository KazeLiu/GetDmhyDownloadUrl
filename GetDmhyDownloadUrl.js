// ==UserScript==
// @name         一键获取动漫花园下载磁链
// @namespace    http://tampermonkey.net/
// @version      0.1.11
// @description  一键获取动漫花园下载磁链!
// @author       Kaze
// @match        https://share.dmhy.org/*
// @match        https://dmhy.anoneko.com/*
// @icon         https://share.dmhy.org/favicon.ico
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      localhost
// @connect      *
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';
    let base = {
        addStyle(id, css) {
            const doc = document;
            const styleDom = doc.getElementById(id);
            if (styleDom) {
                return;
            }
            const style = doc.createElement('style');
            style.rel = 'stylesheet';
            style.id = id;
            style.innerHTML = css;
            doc.getElementsByTagName('head')[0].appendChild(style);
        },
        isType(obj) {
            return Object.prototype.toString.call(obj).replace(/^\[object (.+)\]$/, '$1').toLowerCase();
        },
        post(url, data, headers, type) {
            if (this.isType(data) === 'object') {
                data = JSON.stringify(data);
            }
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "POST", url, headers, data,
                    responseType: type || 'json',
                    onload: (res) => {
                        type === 'blob' ? resolve(res) : resolve(res.response || res.responseText);
                    },
                    onerror: (err) => {
                        reject(err);
                    },
                });
            });
        },

        get(url, headers, type, extra) {
            return new Promise((resolve, reject) => {
                let requestObj = GM_xmlhttpRequest({
                    method: "GET", url, headers,
                    responseType: type || 'json',
                    onload: (res) => {
                    },
                    onerror: (err) => {
                        reject(err);
                    },
                });
            });
        },

        getValue(name, defValue) {
            let data = GM_getValue(name);
            if ((data === null || data === undefined) && (defValue != null || defValue !== undefined)) {
                return "defValue"
            }
            return data
        },

        setValue(name, value) {
            GM_setValue(name, value);
        },

        async sendLinkToRPC(filename, link) {
            let rpc = {
                domain: base.getValue('setting-host'),
                port: base.getValue('setting-port'),
                path: base.getValue('setting-path'),
                token: base.getValue('setting-key'),
                dir: base.getValue('setting-savePath'),
            };

            let url = `${rpc.domain}:${rpc.port}${rpc.path}`;
            let rpcData = {
                id: new Date().getTime(),
                jsonrpc: '2.0',
                method: 'aria2.addUri',
                params: [`token:${rpc.token}`, [link], {
                    dir: rpc.dir,
                    out: filename,
                    header: [`User-Agent: ${navigator.userAgent}`]
                }]
            };
            try {
                let res = await base.post(url, rpcData, {"User-Agent": navigator.userAgent}, '');
                if (res.result) return 'success';
                return 'fail';
            } catch (e) {
                console.error(e)
                return 'fail';
            }
        },
    }
    let mainDom = {
        init() {
            if (document.querySelector('.kaze-dialog') == null) {
                this.addMainDialog();
            }
            getInfo.getUrls();

        },
        addMainDialog() {
            let height = document.documentElement.clientHeight;
            let css = `
                .kaze-dialog { position: fixed; width: 100vw; height: ${height}px; background-color: #23ade5; left: 0; top: 0; display: flex; flex-direction: column; justify-content: space-evenly; align-content: center; flex-wrap: nowrap; align-items: center; z-index: 20; }
                .kaze-dialog .kaze-dialog-title { color: #fff; width: 100%; font-size: 25px; text-align: center; }
                .kaze-dialog .kaze-dialog-subtitle { font-size: 15px; color: #fff; }
                .kaze-dialog .kaze-dialog-input { width: 99%; height: 100px; overflow: auto; }
                .kaze-dialog .kaze-dialog-value { width: 90%; margin: 0 auto; color: #247; border: 1px solid #247; background: #CDF; padding: 0px 8px 8px; }
                .kaze-dialog .quick_search_info { margin: 5px auto }
                .kaze-dialog .kaze-dialog-checkbox-content{ display: flex; margin: 0 auto; flex-direction: column; width: 90%; border: 1px solid #247; background: #CDF; padding:10px 8px 5px 8px; align-items: flex-start; }
                .kaze-dialog .kaze-dialog-checkbox { height: 50vh; overflow: auto; width: 100%; font-size: 16px; margin: 10px 0 0 0; }
                .kaze-dialog .kaze-dialog-checkbox>div { margin: 4px auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .kaze-dialog .kaze-dialog-checkbox label { margin-left: 2px }
                .kaze-dialog .kaze-dialog-button-area, 
                .kaze-dialog .kaze-dialog-checkbox-select { display: flex }
                .kaze-button { margin-right:10px; padding: 10px;  border:  rgb(82,110,250) 1px solid; background-color: rgb(82,110,250); color: white;  border-radius: 4px; cursor: pointer; }
                .kaze-button:hover { background-color: #23ade5; border: #fff 1px solid;}
               `;
            base.addStyle('kaze-main-dialog', css);
            let dialogDiv = document.createElement('div');
            dialogDiv.innerHTML = `<div class="kaze-dialog">
                       <div class="kaze-dialog-title-content">
                            <div class="kaze-dialog-title">可以只获取勾选的种子地址；请使用 ctrl+a 或者 command+a 全选文字自行复制</div>
                            <a class="kaze-dialog-subtitle" target="_blank" href='https://github.com/KazeLiu/GetDmhyDownloadUrl' >去Github查看项目或提建议(issues)</a>
                       </div>
                        <div class="kaze-dialog-checkbox-content">
                            <div class="kaze-dialog-checkbox-select">
                                <button class="kaze-dialog-select-all  kaze-button">全选</button>
                                <button class="kaze-dialog-not-select-all  kaze-button">全不选</button>
                            </div>
                            <div class="kaze-dialog-checkbox"></div>
                        </div>
                        <div class="kaze-dialog-value">
                            <div class="quick_search_info">当前选中了X项目</div>
                            <textarea class="kaze-dialog-input" placeholder="如果不小心全部删除，按 ctrl + z 或者 command + z 撤回"></textarea>
                        </div>
                        <div class="kaze-dialog-button-area">
                        <button class="kaze-dialog-copy kaze-button">一键复制</button>
                        <button class="kaze-dialog-push kaze-button">一键推送</button>
                        <button class="kaze-dialog-setting kaze-button">设置</button>
                        <button class="kaze-dialog-close kaze-button">关闭</button></div>
                    </div>`
            document.getElementsByTagName('body')[0].appendChild(dialogDiv)
            dialogDiv.querySelector(".kaze-dialog-close").addEventListener('click', _ => {
                getInfo.showDialog(false)
                // 删除莫名其妙出现的div
                document.querySelector("div[style^='pointer-events: none; visibility: hidden; position: absolute; box-sizing: border-box;']").remove();
            })
            dialogDiv.querySelector(".kaze-dialog-copy").addEventListener('click', _ => {
                mainDom.copy()
            })
            dialogDiv.querySelector(".kaze-dialog-push").addEventListener('click', _ => {
                if (document.querySelector('.kaze-push-background') == null) {
                    push.createPushClass();
                    push.createPushDom();
                } else {
                    push.showPush(true)
                }
            })
            dialogDiv.querySelector(".kaze-dialog-setting").addEventListener('click', _ => {
                if (document.querySelector('.kaze-setting-background') == null) {
                    setting.createSettingClass();
                    setting.createSettingDom();
                } else {
                    setting.showSetting(true);
                }
            })
            dialogDiv.querySelector(".kaze-dialog-select-all").addEventListener('click', _ => {
                let checkboxList = document.querySelectorAll(".kaze-dialog .kaze-dialog-checkbox input[type='checkbox']")
                checkboxList.forEach(item => {
                    item.checked = true;
                })
                getInfo.getUrlsInCheckbox()
            })
            dialogDiv.querySelector(".kaze-dialog-not-select-all").addEventListener('click', _ => {
                let checkboxList = document.querySelectorAll(".kaze-dialog .kaze-dialog-checkbox input[type='checkbox']")
                checkboxList.forEach(item => {
                    item.checked = false;
                })
                getInfo.getUrlsInCheckbox()
            })
        },
        createInitBtn() {
            let btnDiv = document.createElement('span');
            btnDiv.innerHTML = `&nbsp;|&nbsp;获取本页种子链接`
            btnDiv.style.cursor = "pointer"
            document.querySelector('.headerright .links').append(btnDiv)
            btnDiv.addEventListener('click', () => {
                this.init();
            })
        },
        initCheckBoxEvent() {
            document.querySelector(".kaze-dialog .kaze-dialog-checkbox").addEventListener('change', (e) => {
                getInfo.getUrlsInCheckbox();
            })
        },
        copy() {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(document.querySelector('.kaze-dialog-input').value);
                document.querySelector(".kaze-dialog-copy").innerText = "已复制";
            } else {
                alert('很遗憾，浏览器不支持这个api')
            }
        }
    }
    let getInfo = {
        urlList: [],
        getUrls() {
            document.querySelector(".kaze-dialog .kaze-dialog-checkbox").innerHTML = null;
            let checkDiv = document.createElement("div")
            document.querySelectorAll('#topic_list tbody tr').forEach((item, index) => {
                let url = item.querySelector(".download-arrow").getAttribute('href');
                let name = item.querySelector(".title>a").innerText
                let temp = document.createElement("div")
                temp.innerHTML = `
                        <input type="checkbox" id="check_${index}" checked="true" data-url="${url}" data-name="${name}" onclick="getInfo.getUrlsInCheckbox()">
                        <label title="${name}" for="check_${index}">${name}</label>`
                checkDiv.append(temp)
            });
            document.querySelector(".kaze-dialog .kaze-dialog-checkbox").append(...checkDiv.children);
            mainDom.initCheckBoxEvent();
            this.getUrlsInCheckbox();
            this.showDialog(true);
        },
        showDialog(isShow) {
            document.querySelector('.kaze-dialog').style.display = isShow ? 'flex' : 'none'
        },
        getUrlsInCheckbox() {
            let checkboxList = document.querySelectorAll(".kaze-dialog .kaze-dialog-checkbox input[type='checkbox']:checked")
            document.querySelector('.quick_search_info').innerHTML = `当前选中了${checkboxList.length}项`
            getInfo.urlList = [];
            checkboxList.forEach(item => {
                getInfo.urlList.push(item.dataset)
            })
            document.querySelector('.kaze-dialog-input').value = getInfo.urlList.map(x => x.url).join('\r\n');
        }
    }
    let setting = {
        showSetting(isShow) {
            document.querySelector('.kaze-setting-background').style.display = isShow ? 'block' : 'none'
        },
        createSettingClass() {
            let css = `
                .kaze-setting-background{ width: 100vw; height: 100vh; position: fixed; background: rgba(0,0,0,0.3);} 
                .kaze-setting-area{ width: 450px; padding: 20px; background: #fff; transform: translateX(-50%); left: 50vw; position: absolute; top: 150px; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);}
                .kaze-setting-form {}
                .kaze-form-group {margin-bottom: 10px;}
                .kaze-label { display: block; margin-bottom: 5px; }
                .kaze-select, .kaze-input { width: 100%; padding: 8px; box-sizing: border-box; }
        `
            base.addStyle('kaze-main-setting', css);
        },
        createSettingDom() {
            let proTypeOption = "";
            ['Windows CMD', 'Windows PowerShell', 'Linux 终端', 'Linux Shell', 'MacOS 终端'].forEach(item => {
                proTypeOption += `<option value="${item}" ${base.getValue('setting-terminal') === item ? 'selected' : ''}>${item}</option>`
            });
            let dialogDiv = document.createElement('div');
            dialogDiv.classList.add("kaze-setting-background");
            dialogDiv.innerHTML = `
                                <div  class="kaze-setting-area">
                                   <form class="kaze-setting-form" id="setting-form">
                                      <div class="kaze-form-group">
                                        <label class="kaze-label" for="kaze-setting-program">使用的程序</label>
                                        <select class="kaze-select" id="kaze-setting-program" name="program">
                                          <option value="PRC" ${base.getValue('setting-program') === 'PRC' ? 'selected' : ''}>PRC</option>
                                          <option value="qBittorrent" ${base.getValue('setting-program') === 'qBittorrent' ? 'selected' : ''}>qBittorrent</option>
                                        </select>
                                      </div>
                                    
                                      <div class="kaze-form-group">
                                        <label class="kaze-label" for="host">PRC主机</label>
                                        <input class="kaze-input" type="text" name="host" value="${base.getValue('setting-host')}">
                                      </div>
                                    
                                      <div class="kaze-form-group">
                                        <label class="kaze-label" for="port">RPC端口</label>
                                        <input class="kaze-input" type="text" name="port" value="${base.getValue('setting-port', 6800)}">
                                      </div>
                                    
                                      <div class="kaze-form-group">
                                        <label class="kaze-label" for="path">RPC路径</label>
                                        <input class="kaze-input" type="text" name="path" value="${base.getValue('setting-path', '/jsonrpc')}">
                                      </div>
                                    
                                      <div class="kaze-form-group">
                                        <label class="kaze-label" for="key">RPC密钥</label>
                                        <input class="kaze-input" type="text" name="key" value="${base.getValue('setting-key')}">
                                      </div>
                                    
                                      <div class="kaze-form-group">
                                        <label class="kaze-label" for="savePath">保存路径</label>
                                        <input class="kaze-input" type="text" name="savePath" value="${base.getValue('setting-savePath')}">
                                      </div>
                                    
                                      <div class="kaze-form-group">
                                        <label class="kaze-label" for="kaze-setting-terminal">PRC终端类型</label>
                                        <select class="kaze-select" id="kaze-setting-terminal" name="terminal">
                                            ${proTypeOption}
                                        </select>
                                      </div>
                                    
                                      <button class="kaze-setting-button kaze-button" type="button">保存</button>
                                      <button class="kaze-setting-close-button kaze-button" type="button">关闭</button>
                                    </form>
                                </div>`
            document.querySelector('.kaze-dialog').appendChild(dialogDiv)
            document.querySelector('.kaze-setting-button').addEventListener('click', () => {
                setting.saveSetting()
            })
            document.querySelector('.kaze-setting-close-button').addEventListener('click', () => {
                setting.showSetting(false)
            })
        },
        saveSetting() {
            let form = document.getElementById('setting-form');
            let formData = new FormData(form);
            formData.forEach(function (value, key) {
                console.log(key + ": " + value);
                base.setValue('setting-' + key, value)
            });
        }
    }
    let push = {
        showPush(isShow) {
            document.querySelector('.kaze-push-background').style.display = isShow ? 'block' : 'none'
        },
        createPushClass() {
            let css = `
                .kaze-push-background{ width: 100vw; height: 100vh; position: fixed; background: rgba(0,0,0,0.3);} 
                .kaze-push-area { width: 650px;height:600px; padding: 20px; background: #fff; transform: translateX(-50%); left: 50vw; position: absolute; top: 150px; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);display: flex; flex-direction: column; flex-wrap: nowrap; align-items: flex-start; }
                .kaze-push-head-btn-area{display: flex; align-items: center; align-content: center; justify-content: space-between; width: 100%;}
                .kaze-push-all-btn{ flex:1;text-align:center}
                .kaze-push-list{height: calc(100% - 30px); overflow: auto; width: 100%; margin: 10px 0;}
                .kaze-push-btn { width: 100%; height:26px;line-height:26px;padding: 0 10px;margin-bottom:5px; box-sizing: border-box; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; cursor: pointer; background-color: #23ade5; color: white; border: none; border-radius: 4px; transition: background-color 0.3s ease-in-out;}
                .kaze-push-btn:hover { background-color: #1c87c9;  }
                .kaze-push-btn:disabled { background-color: #dcdcdc; color: #808080; cursor: not-allowed; }
                .kaze-push-btn.error { background-color: red; color: #fff; }
                .kaze-push-btn.success { background-color: green; color: #fff; }
                .kaze-push-btn.loading { background-color: yellow; color: #fff; }
        `
            base.addStyle('kaze-main-push', css);
        },
        createPushDom() {
            let pushListHtml = "";
            getInfo.urlList.forEach(item => {
                pushListHtml += `<div class="kaze-push-btn" data-url="${item.url}" title="单独推送 - ${item.name}">${item.name}</div>`
            });
            let dialogDiv = document.createElement('div');
            dialogDiv.classList.add("kaze-push-background");
            dialogDiv.innerHTML = `
                  <div class="kaze-push-area">
                   <div class="kaze-push-head-btn-area">
                      <div class="kaze-push-all-btn kaze-button">全部推送</div>
                      <div class="kaze-push-close-btn kaze-button">关闭窗口</div>
                   </div>
                    <div class="kaze-push-list">
                    ${pushListHtml}
                    </div>
                  </div>
                `;
            document.querySelector('.kaze-dialog').appendChild(dialogDiv)
            document.querySelector('.kaze-push-all-btn').addEventListener('click', () => {
                let all = document.querySelectorAll('.kaze-push-btn');
                all[0].click();
                // all.forEach(item => {
                //     item.click();
                // })
            })
            document.querySelector('.kaze-push-btn').addEventListener('click', (e) => {
                push.pushData(e.currentTarget, {name: e.currentTarget.innerHTML, link: e.currentTarget.dataset.url});
            })
            document.querySelector('.kaze-push-close-btn').addEventListener('click', () => {
                push.showPush(false);
            })
        },
        pushData(dom, {name, link}) {
            dom.classList.remove('error');
            dom.classList.remove('success');
            dom.classList.add('loading');
            base.sendLinkToRPC(name, link).then(res => {
                if (res === "fail") {
                    dom.classList.remove('loading');
                    dom.classList.add('error');
                }
                if (res === "success") {
                    dom.classList.remove('loading');
                    dom.classList.add('success');
                }
            })
        }
    }
    mainDom.createInitBtn();
})();
