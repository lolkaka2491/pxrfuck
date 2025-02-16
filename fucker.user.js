// ==UserScript==
// @name         Auto Register & Submit
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Autofills registration fields, loads captcha, submits the form, logs out, then clicks “Зарегистрироваться” to restart the process. Logs account count upon logout.
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

    async function autoRegister() {
        const randomName = getRandomString(10);
        const randomEmail = getRandomEmail();
        const randomPassword = getRandomString(6);
        fillInput('input[name="name"].reginput', randomName);
        fillInput('input[name="email"].reginput', randomEmail);
        fillInput('input[name="password"].reginput', randomPassword);
        fillInput('input[name="confirmpassword"].reginput', randomPassword);
        console.log("Autofilled registration fields.");

        const captchaButton = document.querySelector('span[role="button"][title="Загрузить капчу"].modallink');
        if (captchaButton) {
            captchaButton.click();
            console.log("Clicked captcha load button.");
        } else {
            console.log("Captcha load button not found.");
        }

        await sleep(1000);

        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.click();
            console.log("Clicked submit button.");
        } else {
            console.log("Submit button not found.");
        }

        await sleep(3800);

        const logoutButton = [...document.querySelectorAll('button')].find(btn => btn.textContent.includes("Log Out"));
        if (logoutButton) {
            logoutButton.click();
            accountCount++;
            console.log("Clicked logout button. Account #" + accountCount + " created.");
        } else {
            console.log("Logout button not found.");
        }

        await sleep(2000);

        // Find and click the "Зарегистрироваться" button to restart the process
        const registrationButton = [...document.querySelectorAll('button')].find(btn => btn.textContent.includes("Зарегистрироваться"));
        if (registrationButton) {
            registrationButton.click();
            console.log("Clicked 'Зарегистрироваться' button.");
        } else {
            console.log("'Зарегистрироваться' button not found.");
        }

        await sleep(1000);

        autoRegister(); // Restart the process
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
