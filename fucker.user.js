// ==UserScript==
// @name         Auto Register & Submit
// @namespace    http://tampermonkey.net/
// @version      1.9.1
// @description  pxrfuck
// @match        *://*/*
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

    async function waitForCaptchaText() {
        let captchaInput;
        while (true) {
            captchaInput = document.querySelector('input[name="captcha"]');
            if (captchaInput && captchaInput.value.trim() !== "") {
                console.log("Обнаружен текст капчи: " + captchaInput.value);
                break;
            }
            await sleep(100);
        }
    }

    async function waitForLogoutButton() {
        let logoutBtn;
        while (true) {
            logoutBtn = [...document.querySelectorAll('button')].find(btn => btn.textContent.includes("Log Out"));
            if (logoutBtn) {
                console.log("Найдена кнопка Log Out");
                break;
            }
            await sleep(100);
        }
        logoutBtn.click();
        console.log("Нажата кнопка Log Out");
        await sleep(100);
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
        // Автозаполнение регистрационных полей, если они пустые.
        fillInput('input[name="name"].reginput', getRandomString(10));
        fillInput('input[name="email"].reginput', getRandomEmail());
        const randomPassword = getRandomString(6);
        fillInput('input[name="password"].reginput', randomPassword);
        fillInput('input[name="confirmpassword"].reginput', randomPassword);
        console.log("Проверка и автозаполнение регистрационных полей (если пустые)");

        let captchaLoaded = false;
        const captchaLoadBtn = document.querySelector('span[role="button"][title="Загрузить капчу"].modallink');
        if (captchaLoadBtn) {
            captchaLoadBtn.click();
            captchaLoaded = true;
            console.log("Нажата кнопка загрузки капчи");
        } else {
            console.log("Кнопка загрузки капчи не найдена");
        }

        await waitForCaptchaText();

        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.click();
            console.log("Нажата кнопка submit");
        } else {
            console.log("Кнопка submit не найдена");
        }

        await sleep(2200);

        const errorElem = document.querySelector('p.errormessage');
        if (errorElem && errorElem.textContent.includes("Вы неправильно решили капчу")) {
            console.log("Обнаружена ошибка капчи, перезапуск процесса.");
            await sleep(100);
            autoRegister();
            return;
        }

        await waitForLogoutButton();

        await clickIfExists(
            () => document.querySelector('span[role="button"][title="Загрузить капчу"].modallink'),
            "captcha load button",
            100
        );

        await clickIfExists(
            () => [...document.querySelectorAll('button')].find(btn => btn.textContent.includes("Зарегистрироваться")),
            "'Зарегистрироваться' button",
            100
        );

        accountCount++;
        console.log("Аккаунт #" + accountCount + " создан.");

        await sleep(2000);
        // Перезапуск процесса.
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

        let isDragging = false, offsetX, offsetY;
        ui.addEventListener("mousedown", (e) => {
            if (e.target.tagName.toLowerCase() === "button") return;
            isDragging = true;
            offsetX = e.clientX - ui.getBoundingClientRect().left;
            offsetY = e.clientY - ui.getBoundingClientRect().top;
            ui.style.position = "absolute";
        });
        document.addEventListener("mousemove", (e) => {
            if (isDragging) {
                ui.style.left = `${e.clientX - offsetX}px`;
                ui.style.top = `${e.clientY - offsetY}px`;
            }
        });
        document.addEventListener("mouseup", () => {
            isDragging = false;
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createUI);
    } else {
        createUI();
    }
})();
