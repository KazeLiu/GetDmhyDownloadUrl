// ==UserScript==
// @name         一键获取动漫花园下载磁链
// @namespace    http://tampermonkey.net/
// @version      0.1.5
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
                background-color: #23ade5;
                left: 0;
                top: 0;
                display: flex;
                flex-direction: column;
                justify-content: space-around;
                align-content: center;
                flex-wrap: nowrap;
                align-items: center;
                z-index:20;
           }
           .kaze-dialog .kaze-dialog-input{
                width: 99%;
                height: 200px;
                overflow:auto;
           }

           .kaze-dialog .kaze-dialog-value{
                width:90%;
                margin:0 auto;
                color: #247;
                border: 1px solid #247;
                background: #CDF;
                padding: 0px 8px 8px;
           }

           .kaze-dialog .quick_search_info{
                margin:5px auto
           }

           .kaze-dialog .kaze-dialog-title{
                position:absolute;
                top: 2vh;
                color: #fff;
                width: 100%;
                font-size: 25px;
                text-align: center;
           }
           
           .kaze-dialog .kaze-dialog-checkbox{
                height: 50vh;
                overflow: auto;
                width: 90%;
                margin: 50px auto 0;
                padding: 8px;
                border: 1px solid #247;
                background: #CDF;
                font-size: 16px;
           }
           .kaze-dialog .kaze-dialog-checkbox>div{
                margin:4px auto
           }

           .kaze-dialog .kaze-dialog-checkbox label{
                margin-left: 2px
           }
           .kaze-dialog .kaze-dialog-button-area{
                display:flex
           }
           .kaze-dialog .kaze-dialog-button-area .kaze-dialog-close,.kaze-dialog .kaze-dialog-button-area .kaze-dialog-copy {
                width: 80px;
                height: 30px;
                margin:auto 10px;
           }
           `;
            document.getElementsByTagName('body')[0].appendChild(styleElement);

            let dialogDiv = document.createElement('div');
            dialogDiv.innerHTML = `<div class="kaze-dialog">
                    <div class="kaze-dialog-title">可以只获取勾选的种子地址；请使用 ctrl+a 或者 command+a 全选文字自行复制</div>
                    <div class="kaze-dialog-checkbox"></div>
                    <div class="kaze-dialog-value">
                        <div class="quick_search_info">当前选中了X项目</div>
                        <textarea class="kaze-dialog-input" placeholder="如果不小心全部删除，按 ctrl + z 或者 command + z 撤回"></textarea>
                        
                    </div>
                    <div class="kaze-dialog-button-area"><button class="kaze-dialog-copy">一键复制</button> <button class="kaze-dialog-close">关闭</button></div>
                </div>`
            document.getElementsByTagName('body')[0].appendChild(dialogDiv)
            dialogDiv.querySelector(".kaze-dialog-close").addEventListener('click', _ => {
                getInfo.showDialog(false)
                // 删除莫名其妙出现的div
                document.querySelector("div[style^='pointer-events: none; visibility: hidden; position: absolute; box-sizing: border-box;']").remove();
            })
            dialogDiv.querySelector(".kaze-dialog-copy").addEventListener('click', _ => {
                addDom.copy()
            })
            this.hasStyle = true;
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
        initChckBoxEvent() {
            document.querySelector(".kaze-dialog .kaze-dialog-checkbox").addEventListener('change', (e) => {
                getInfo.getUrlsInCheckbox();
            })
        },
        copy(){
            if (navigator.clipboard) {
                navigator.clipboard.writeText(document.querySelector('.kaze-dialog-input').value);
                document.querySelector(".kaze-dialog-copy").innerText ="已复制";
            }else{
                alert('很遗憾，浏览器不支持这个api')
            }
        }
    }
    let getInfo = {
        getUrls() {
            document.querySelector(".kaze-dialog .kaze-dialog-checkbox").innerHTML = null;
            let checkDiv = document.createElement("div")
            document.querySelectorAll('#topic_list tbody tr').forEach((item, index) => {
                let url = item.querySelector(".download-arrow").getAttribute('href');
                let name = item.querySelector(".title>a").innerText
                let temp = document.createElement("div")
                temp.innerHTML = `
                    <input type="checkbox" id="check_${index}" checked="true" data-url="${url}" onclick="getInfo.getUrlsInCheckbox()">
                    <label for="check_${index}">${name}</label>`
                checkDiv.append(temp)
            });
            document.querySelector(".kaze-dialog .kaze-dialog-checkbox").append(...checkDiv.children);
            addDom.initChckBoxEvent();
            this.getUrlsInCheckbox();
            this.showDialog(true);
        },
        showDialog(isShow) {
            document.querySelector('.kaze-dialog').style.display = isShow ? 'flex' : 'none'
        },
        getUrlsInCheckbox() {
            let checkboxList = document.querySelectorAll(".kaze-dialog .kaze-dialog-checkbox input[type='checkbox']:checked")
            document.querySelector('.quick_search_info').innerHTML=`当前选中了${checkboxList.length}项`
            let urls = [];
            checkboxList.forEach(item => {
                urls.push(item.dataset.url)
            })
            document.querySelector('.kaze-dialog-input').value = urls.join('\r\n');
        }
    }
    addDom.createInitBtn();
})();
