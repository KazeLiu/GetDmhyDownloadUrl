// ==UserScript==
// @name         一键获取动漫花园下载磁链
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  一键获取动漫花园下载磁链!
// @author       Kaze
// @match        https://share.dmhy.org/*
// @icon         https://share.dmhy.org/favicon.ico
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';
    let addDom = {
        hasStyle: false,
        init() {
            if (!this.hasStyle) {
                this.addDialog();
            }
            getInfo.getUrls();
        },
        addDialog() {
            let height = document.documentElement.clientHeight;
            let styleElement = document.createElement('style');
            styleElement.type = 'text/css';
            styleElement.innerHTML = `
           .kaze-dialog {
                position: fixed;
                width: 100vw;
                height: ${height}px;
                background-color: #23aee5b7;
                left: 0;
                top: 0;
                display: flex;
                flex-direction: column;
                justify-content: space-around;
                align-content: center;
                flex-wrap: nowrap;
                align-items: center;
           }
           .kaze-dialog .kaze-dialog-input{
                width: 90vw;
                height: 70%;
           }
           .kaze-dialog .kaze-dialog-title{
            top: 5vh;
            color: #000;
            width: 100%;
            font-size: 25px;
            text-align: center;
           }`;
            document.getElementsByTagName('body')[0].appendChild(styleElement);
            let dialogDiv = document.createElement('div');
            dialogDiv.innerHTML = `<div class="kaze-dialog">
                    <div class="kaze-dialog-title">ctrl + a 全选文字自行复制</div>
                    <textarea class="kaze-dialog-input" placeholder="如果不小心全部删除，按 ctrl + z 撤回"></textarea>
                    <button class="kaze-dialog-close">关闭</button>
                </div>`
            document.getElementsByTagName('body')[0].appendChild(dialogDiv)
            dialogDiv.querySelector(".kaze-dialog-close").addEventListener('click', _ => {
                getInfo.showDialog(false)
            })
            this.hasStyle = true;
        },
        createInitBtn() {
            let btnDiv = document.createElement('span');
            btnDiv.innerHTML = `&nbsp;|&nbsp;获取本页全部种子链接`
            btnDiv.style.cursor = "pointer"
            document.querySelector('.headerright .links').append(btnDiv)
            btnDiv.addEventListener('click', () => {
                this.init();
            })
        }
    }
    let getInfo = {
        getUrls() {
            let urls = []
            document.querySelectorAll('.download-arrow').forEach(item =>
                urls.push(item.getAttribute('href'))
            );
            document.getElementsByClassName('kaze-dialog-input')[0].value = urls.join('\r\n');
            this.showDialog(true);
        },
        showDialog(isShow) {
            document.querySelector('.kaze-dialog').style.display = isShow ? 'flex' : 'none'
        },
    }
    addDom.createInitBtn();
})();