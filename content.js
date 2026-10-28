const REVEAL_KEY = "reveal";

async function initRatings() {
    if (document.querySelector(".rating-histogram")) {
        // ratings are hidden by default (via css)
        if (await shouldShowRatings()) {
            showRating(true);
            return;
        }

        const unhideButton = document.createElement("div");
        unhideButton.classList.add("unhide-button");
        unhideButton.innerText = "Reveal Ratings";
        document
            .querySelector(".ratings-histogram-chart")
            .appendChild(unhideButton);

        unhideButton.addEventListener("click", () => {
            showRating(true);
            showFriendsActivity(true);
            showReviews(true);
            showRevealButton(false);
        });
    } else {
        setTimeout(initRatings, 100);
    }
}
(async () => {
    await initRatings();
})();

async function initReviews() {
    const reviewsParent = document.querySelector(".film-recent-reviews");
    if (reviewsParent) {
        // for all already present .film-reviews sections, set visibility
        showReviews(await shouldShowRatings());

        // if there are some sections not yet loaded, attach observer
        if (reviewsParent.querySelector(".csi.js-csi,.csi.loading-csi")) {
            // attach observer to react to dynamically loaded review sections
            const observer = new MutationObserver(async () => {
                showReviews(await shouldShowRatings());
            });
            observer.observe(reviewsParent, { childList: true });
        }
    } else {
        setTimeout(initReviews, 500);
    }
}
(async () => {
    await initReviews();
})();

// activity from friends may be empty for this film, which we can't really check, so simply retry a few times
async function initFriendsActivity(retries) {
    const friendsActivityList = document.querySelector(
        ".activity-from-friends",
    );
    if (friendsActivityList) {
        showFriendsActivity(await shouldShowRatings());
    } else if (retries > 0) {
        setTimeout(initFriendsActivity, 1000, retries - 1);
    }
}
(async () => {
    await initFriendsActivity(10);
})();

// Watched state may arrive later.
async function initWatchedStateObserver() {
    // wait until watch button has loaded
    const watchButton = document.querySelector(".action.-watch");
    if (!watchButton) {
        setTimeout(initWatchedStateObserver, 500);
        return;
    }

    // if already on, show all and finish
    // note initWatchedStateObserver is only called if auto-reveal is active
    if (watchButton.classList.contains("-on")) {
        showAll();
        return;
    }

    // if not already on, add mutation observer (state may be delivered later or clicked by the user)
    const observer = new MutationObserver(() => {
        if (watchButton.classList.contains("-on")) {
            showAll();
        }
    });
    observer.observe(watchButton, { attributeFilter: ["class"] });
}
(async () => {
    const showWhenWatched = await browser.storage.local
        .get("watchedActive")
        .then((result) => {
            return result.watchedActive ?? true;
        });
    // if user did not configure to auto-reveal on watched, nothing more to do
    if (!showWhenWatched) return;

    await initWatchedStateObserver();
})();

function reveal(element, show) {
    if (show) {
        element.dataset[REVEAL_KEY] = "";
    } else {
        delete element.dataset[REVEAL_KEY];
    }
}

async function shouldShowRatings() {
    const isActive = await browser.storage.local
        .get("globalActive")
        .then((result) => {
            return result.globalActive ?? true;
        });
    if (!isActive) return true;

    const showWhenWatched = await browser.storage.local
        .get("watchedActive")
        .then((result) => {
            return result.watchedActive ?? true;
        });
    return showWhenWatched && hasWatchedFilm();
}

function hasWatchedFilm() {
    const watchButton = document.querySelector("[data-is-watched]");
    if (watchButton && watchButton.dataset["isWatched"] === "true") {
        return true;
    }

    return false;
}

function showRating(show) {
    const histChart = document.getElementsByClassName("rating-histogram")[0];
    if (!histChart) return;

    // bar values are overwritten by style
    reveal(histChart, show);

    const avg = histChart.getElementsByClassName("averagerating tooltip")[0];
    if (!avg) return;

    if (show) {
        avg.innerText = avg.dataset["cachedAvg"] ?? avg.innerText;
    } else {
        // store and obscure average
        avg.dataset["cachedAvg"] = avg.innerText;
        avg.innerText = "3.0";
    }
}

function showFriendsActivity(show) {
    const friendsActivityList = document.getElementsByClassName(
        "activity-from-friends",
    )[0];
    if (!friendsActivityList) return;

    reveal(friendsActivityList, show);
}

function showReviews(show) {
    const reviewParents = document.getElementsByClassName("film-reviews");

    // ratings/like are hidden by style
    [...reviewParents].forEach((el) => reveal(el, show));
}

function showRevealButton(show) {
    const unhideButton = document.querySelector(".unhide-button");
    if (unhideButton) unhideButton.hidden = !show;
}

function showAll() {
    showRating(true);
    showFriendsActivity(true);
    showReviews(true);
    showRevealButton(false);
}
