// ==UserScript==
// @name         pxr fuck
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  pxr fuck
// @match        *://pixelroyal.fun/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    let accountCount = 0;

    function getRandomString(length) {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    function getRandomEmail() {
        return getRandomString(8) + "@gmail.com";
    }

    function fillInput(selector, value) {
        const input = document.querySelector(selector);
        if (input && !input.value) {
            input.value = value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function clickIfExists(getElementFn, description, delay = 100) {
        const element = getElementFn();
        if (element) {
            element.click();
            console.log("Clicked " + description);
        } else {
            console.log(description + " not found");
        }
        await sleep(delay);
    }

    async function autoRegister() {
        fillInput('input[name="name"].reginput', getRandomString(10));
        fillInput('input[name="email"].reginput', getRandomEmail());
        const randomPassword = getRandomString(6);
        fillInput('input[name="password"].reginput', randomPassword);
        fillInput('input[name="confirmpassword"].reginput', randomPassword);
        console.log("Проверка и автозаполнение регистрационных полей (только если пустые)");

        let captchaLoaded = false;
        const captchaLoadBtn = document.querySelector('span[role="button"][title="Загрузить капчу"].modallink');
        if (captchaLoadBtn) {
            captchaLoadBtn.click();
            captchaLoaded = true;
            console.log("Clicked captcha load button");
        } else {
            console.log("captcha load button not found");
        }
        await sleep(captchaLoaded ? 900 : 1500);

        async function waitForCaptchaAndSubmit() {
            const captchaInput = document.querySelector('input[name="captcha"][placeholder="Введите символы"]');
            const submitBtn = document.querySelector('button[type="submit"]');
            if (!captchaInput || !submitBtn) {
                console.log("Captcha input or submit button not found");
                return;
            }
            while (!captchaInput.value || submitBtn.textContent === "...") {
                await sleep(200);
            }
            submitBtn.click();
            console.log("Clicked submit button");
        }

        await waitForCaptchaAndSubmit();
        await sleep(2200);

        const errorElem = document.querySelector('p.errormessage');
        if (errorElem && errorElem.textContent.includes("Вы неправильно решили капчу")) {
            console.log("Captcha error detected, restarting process.");
            await sleep(100);
            autoRegister();
            return;
        }

        await clickIfExists(() => [...document.querySelectorAll('button')].find(btn => btn.textContent.includes("Log Out")), "logout button", 100);
        await clickIfExists(() => document.querySelector('span[role="button"][title="Загрузить капчу"].modallink'), "captcha load button", 100);
        await clickIfExists(() => [...document.querySelectorAll('button')].find(btn => btn.textContent.includes("Зарегистрироваться")), "'Зарегистрироваться' button", 100);

        accountCount++;
        console.log("Account #" + accountCount + " created.");
        await sleep(2000);
        autoRegister();
    }

    function createUI() {
        const ui = document.createElement("div");
        ui.style.position = "fixed";
        ui.style.left = "10px";
        ui.style.top = "10px";
        ui.style.padding = "10px";
        ui.style.backgroundColor = "white";
        ui.style.border = "1px solid black";
        ui.style.zIndex = "99999";
        ui.style.cursor = "move";

        const btn = document.createElement("button");
        btn.textContent = "Auto Register";
        btn.style.padding = "5px";
        btn.style.cursor = "pointer";
        btn.addEventListener("click", function(e) {
            e.stopPropagation();
            autoRegister();
        });
        ui.appendChild(btn);
        document.body.appendChild(ui);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createUI);
    } else {
        createUI();
    }
})();
