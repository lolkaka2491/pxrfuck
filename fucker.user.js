// ==UserScript==
// @name         Auto Register & Submit
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Автозаполнение регистрационных полей (если они пустые) и последовательное нажатие кнопок: captcha load, затем через 800мс submit, затем logout, captcha load и 'Зарегистрироваться' с задержкой 100мс между кликами.
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    let accountCount = 0;

    // Возвращает случайную строку заданной длины.
    function getRandomString(length) {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    // Возвращает случайный email.
    function getRandomEmail() {
        return getRandomString(8) + "@gmail.com";
    }

    // Заполняет input, указанный селектором, если он пустой.
    function fillInput(selector, value) {
        const input = document.querySelector(selector);
        if (input && !input.value) {
            input.value = value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
        }
    }

    // Задержка (sleep) в мс.
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Пытается нажать элемент (один раз). Если элемент найден – нажимает и ждёт delay мс.
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
        // Автозаполнение регистрационных полей только если они пустые.
        fillInput('input[name="name"].reginput', getRandomString(10));
        fillInput('input[name="email"].reginput', getRandomEmail());
        const randomPassword = getRandomString(6);
        fillInput('input[name="password"].reginput', randomPassword);
        fillInput('input[name="confirmpassword"].reginput', randomPassword);
        console.log("Проверка и автозаполнение регистрационных полей (только если пустые)");

        // Нажимаем кнопку загрузки капчи (один раз).
        let captchaLoaded = false;
        const captchaLoadBtn = document.querySelector('span[role="button"][title="Загрузить капчу"].modallink');
        if (captchaLoadBtn) {
            captchaLoadBtn.click();
            captchaLoaded = true;
            console.log("Clicked captcha load button");
        } else {
            console.log("captcha load button not found");
        }
        // Если капча нажата – ждем 800 мс, иначе 100 мс.
        if (captchaLoaded) {
            await sleep(900);
        } else {
            await sleep(200);
        }

        // Нажимаем кнопку submit (один раз).
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.click();
            console.log("Clicked submit button");
        } else {
            console.log("submit button not found");
        }
        // Ждем завершения отправки формы.
        await sleep(2200);

        // Если обнаружена ошибка капчи, перезапускаем процесс.
        const errorElem = document.querySelector('p.errormessage');
        if (errorElem && errorElem.textContent.includes("Вы неправильно решили капчу")) {
            console.log("Captcha error detected, restarting process.");
            await sleep(100);
            autoRegister();
            return;
        }

        // Последовательно нажимаем оставшиеся кнопки (каждая один раз) с задержкой 100 мс между ними.
        await clickIfExists(
            () => [...document.querySelectorAll('button')].find(btn => btn.textContent.includes("Log Out")),
            "logout button",
            100
        );

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
        console.log("Account #" + accountCount + " created.");

        await sleep(2000);
        // Перезапуск процесса.
        autoRegister();
    }

    // Создаем маленькую перетаскиваемую кнопку для старта autoRegister.
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
