// ==UserScript==
// @name         Auto Register & Submit
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Autofills registration fields, loads captcha, waits for captcha input, submits the form, logs out (or restarts on captcha error), then clicks “Зарегистрироваться” to restart the process. Retries clicking every 100ms if not found.
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
        if (input) {
            input.value = value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Repeatedly attempts to get and click an element.
    async function retryClick(getElementFn, description) {
        while (true) {
            const element = getElementFn();
            if (element) {
                element.click();
                console.log("Clicked " + description);
                return;
            }
            // Log a message if desired, then wait 100ms before retrying.
            console.log(description + " not found, retrying in 100ms...");
            await sleep(100);
        }
    }

    async function autoRegister() {
        // Fill registration fields with random data.
        const randomName = getRandomString(10);
        const randomEmail = getRandomEmail();
        const randomPassword = getRandomString(6);
        fillInput('input[name="name"].reginput', randomName);
        fillInput('input[name="email"].reginput', randomEmail);
        fillInput('input[name="password"].reginput', randomPassword);
        fillInput('input[name="confirmpassword"].reginput', randomPassword);
        console.log("Autofilled registration fields.");

        // Click the captcha load button.
        await retryClick(
            () => document.querySelector('span[role="button"][title="Загрузить капчу"].modallink'),
            "captcha load button"
        );

        await sleep(1600);

        // Click the submit button.
        await retryClick(
            () => document.querySelector('button[type="submit"]'),
            "submit button"
        );

        await sleep(3200);

        // Check if a captcha error message appears.
        const errorElem = document.querySelector('p.errormessage');
        if (errorElem && errorElem.textContent.includes("Вы неправильно решили капчу")) {
            console.log("Captcha error detected, restarting process.");
            await sleep(100);
            autoRegister();
            return;
        }

        // Click the logout button.
        await retryClick(
            () => [...document.querySelectorAll('button')].find(btn => btn.textContent.includes("Log Out")),
            "logout button"
        );
        accountCount++;
        console.log("Clicked logout button. Account #" + accountCount + " created.");

        await sleep(2000);

        // Click the "Зарегистрироваться" button to restart.
        await retryClick(
            () => [...document.querySelectorAll('button')].find(btn => btn.textContent.includes("Зарегистрироваться")),
            "'Зарегистрироваться' button"
        );

        await sleep(1000);

        // Restart the process.
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
