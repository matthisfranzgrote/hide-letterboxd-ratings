document
    .querySelector("#global-toggle")
    .addEventListener("change", async (event) => {
        const globalActive = event.target.checked;
        browser.storage.local.set({ globalActive: globalActive });
        toggleIconColor(globalActive);
        document.querySelector("#watched-container").inert = !globalActive;
        await reloadPage();
    });

document
    .querySelector("#watched-toggle")
    .addEventListener("change", async (event) => {
        browser.storage.local.set({ watchedActive: event.target.checked });
        await reloadPage();
    });

(async () => {
    const globalToggleState = await browser.storage.local
        .get("globalActive")
        .then((result) => {
            return result.globalActive ?? true;
        });
    document.querySelector("#global-toggle").checked = globalToggleState;

    // disable input on "reveal when watched" button
    document.querySelector("#watched-container").inert = !globalToggleState;

    const watchedToggleState = await browser.storage.local
        .get("watchedActive")
        .then((result) => {
            return result.watchedActive ?? true;
        });
    document.querySelector("#watched-toggle").checked = watchedToggleState;

    toggleIconColor(globalToggleState);
})();

function toggleIconColor(active) {
    if (active) {
        browser.action.setIcon({
            path: {
                16: "../images/icon_16.png",
                32: "../images/icon_32.png",
                48: "../images/icon_48.png",
                128: "../images/icon_128.png",
            },
        });
    } else {
        // TODO: set alternative icon
        browser.action.setIcon({
            path: {
                16: "../images/icon_16_gray.png",
                32: "../images/icon_32_gray.png",
                48: "../images/icon_48_gray.png",
                128: "../images/icon_128_gray.png",
            },
        });
    }
}

async function reloadPage() {
    const tab = await browser.tabs.query({
        active: true,
        lastFocusedWindow: true,
    });
    if (!tab[0].url.includes("/film/")) return;

    browser.scripting.executeScript({
        target: { tabId: tab[0].id, allFrames: true },
        func: () => window.location.reload(),
    });
}
