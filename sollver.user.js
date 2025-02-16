// ==UserScript==
// @name         PixelPlanet (and clones) Captcha Solver
// @namespace    vermei_and_nof
// @version      1.12
// @description  Solve PixelPlanet and clones captchas automatically (Supported: pixmap, pixelya, pixworld, pixuniverse, pixelworldgame, pxgame, pixelplanet, pixelverse)
// @match        *://*.pixuniverse.fun/*
// @match        *://*.pixmap.fun/*
// @match        *://*.pixelya.fun/*
// @match        *://*.pixworld.net/*
// @match        *://*.pixelworldgame.xyz/*
// @match        *://*.pxgame.xyz/*
// @match        *://*.fuckyouarkeros.fun/*
// @match        *://*.pixelplanet.fun/*
// @match        *://*.pixverse.fun/*
// @match        *://*.pixelroyal.fun/*
// @grant        none
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    const site = window.location.host;
    // Set the default AI endpoint, then override if needed:
    let aiLink = 'https://fuururuny-pixmap-captcha.hf.space/gradio_api/call/predict';
    if (site.includes('pixuniverse.fun') || site.includes('pixelworldgame.xyz')) {
        aiLink = 'https://fuururuny-pixuniverse-captcha.hf.space/gradio_api/call/predict';
    } else if (site.includes('pixelplanet.fun') || site.includes('fuckyouarkeros.fun')) {
        aiLink = 'https://fuururuny-pixelplanet-captcha.hf.space/gradio_api/call/predict';
    }
    const isPixWorld = site.includes('pixworld.net');

    // Helper: sleep for ms milliseconds.
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Helper: fetch the SVG data from a URL.
    async function fetchSvg(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error('Error fetching SVG, status:', response.status);
                return null;
            }
            return await response.text();
        } catch (error) {
            console.error('Fetch error (SVG):', error);
            return null;
        }
    }

    // Solve captchas for sites other than pixworld.net.
    async function solveCaptcha() {
        const captchaElement = document.querySelector('img[alt="CAPTCHA"]');
        if (!captchaElement) return;
        const url = captchaElement.src;
        const svgData = await fetchSvg(url);
        if (!svgData) return;

        // Clean up the SVG so that the AI model can better read it.
        const cleanedSvg = svgData
            .replace(/stroke="#?[\S]+"/, 'stroke="black"')
            .replace(/stroke-width: \d+;/, 'stroke-width: 4;')
            .replace(/fill="#?[\S]+"/, 'fill="#FFFFFF"')
            .replace(/fill="rgba\(240, 240, 240, 0.9\)"/, 'fill="#FFFFFF"')
            .replace(/fill="rgba\(0, 0, 0, 0.7\)"/, 'fill="rgba(0, 0, 0, 0)"');

        try {
            const postData = { data: [cleanedSvg] };
            const res = await fetch(aiLink, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });
            if (!res.ok) {
                console.error('Error posting SVG, status:', res.status);
                return;
            }
            const json = await res.json();
            const eventID = json.event_id;
            const res2 = await fetch(`${aiLink}/${eventID}`, { method: 'GET' });
            if (!res2.ok) {
                console.error('Error getting event result, status:', res2.status);
                return;
            }
            const text = await res2.text();
            const match = text.match(/"([^"]+)"/);
            if (!match) {
                console.error('No answer found in response');
                return;
            }
            const answer = match[1];
            console.log('Captcha answer:', answer);
            const captchaField = document.querySelector("input[name='captcha']");
            if (captchaField) {
                captchaField.value = answer;
            }
            // If a captcha alert is shown, click the submit button.
            if (document.querySelector('.Alert, .CaptchaAlert')) {
                const submitButton = document.querySelector('button[type="submit"]');
                if (submitButton) submitButton.click();
            }
        } catch (error) {
            console.error('Error solving captcha:', error);
        }
    }

    // For PixWorld sites.
    async function getNewPWCaptcha() {
        try {
            const response = await fetch('https://api.henrixounez.com/pixworld/captcha.png');
            if (!response.ok) {
                console.error('Error fetching PW captcha, status:', response.status);
                return null;
            }
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error in getNewPWCaptcha:', error);
            return null;
        }
    }

    async function PWSolveCaptcha() {
        await sleep(100);
        const base64str = await getNewPWCaptcha();
        if (!base64str) return;

        // Known "nocaptcha" base64 string – if the result matches, then do nothing.
        const nocaptcha = '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';

        if (base64str === nocaptcha) {
            console.log("Timeout or no captcha found");
            return;
        }

        try {
            const postData = { data: [base64str] };
            const res = await fetch('https://fuururuny-pixworld-captcha.hf.space/gradio_api/call/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });
            if (!res.ok) {
                console.error('Error posting PW captcha, status:', res.status);
                return;
            }
            const json = await res.json();
            const eventID = json.event_id;
            const res2 = await fetch(`https://fuururuny-pixworld-captcha.hf.space/gradio_api/call/predict/${eventID}`, { method: 'GET' });
            if (!res2.ok) {
                console.error('Error fetching PW captcha answer, status:', res2.status);
                return;
            }
            const text = await res2.text();
            const match = text.match(/"([^"]+)"/);
            if (!match) {
                console.error('No answer found in PW captcha response');
                return;
            }
            const answer = match[1];
            console.log('PW Captcha answer:', answer);
            // Send the answer for verification.
            await fetch('https://api.henrixounez.com/pixworld/captcha/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: answer })
            });
            // Click the (assumed) submit element.
            const submitElem = document.querySelector('#__next > div:nth-child(1) > div > div > div:nth-child(1) > div:nth-child(2)');
            if (submitElem) submitElem.click();
        } catch (error) {
            console.error('Error solving PW captcha:', error);
        }
    }

    // MutationObserver: when an element with alt="CAPTCHA" has its src attribute changed, run the proper solver.
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                const target = mutation.target;
                if (target && typeof target.getAttribute === 'function' && target.getAttribute('alt') === 'CAPTCHA') {
                    if (isPixWorld) {
                        PWSolveCaptcha();
                    } else {
                        solveCaptcha();
                    }
                }
            }
        });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
})();
