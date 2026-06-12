const BLUR_CLASS = "obscure-blur";
// TODO:
// check for main film page
// path includes: /film/
// but not: /reviews or /lists

async function runWhenPageReady() {
    if (document.querySelector(".rating-histogram")) {
        // const isBlockingShorts = await currentBrowser.storage.local
        //     .get("isActive")
        //     .then((result) => {
        //         return result.isActive ?? true;
        //     });

        // if (isBlockingShorts) {
        //     blockShorts();
        // }
        showRating(false);
        showFriendsActivity(false);
        showReviews(false);

        // TODO: histogram may be loaded before recent reviews!
        // setup mutation observer (histogram has highest prio since it is visible immediately without scrolling)
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

        showRevealButton(true);
    } else {
        setTimeout(runWhenPageReady, 50);
    }
}

(async () => {
    await runWhenPageReady();
})();

function showRating(show) {
    const hist = document.getElementsByClassName("rating-histogram")[0];
    if (!hist) {
        console.log("no hist");
        return;
    }

    const bars = hist.getElementsByClassName("column");
    const avg = hist.getElementsByClassName("averagerating tooltip")[0];

    if (show) {
        // apply blur to histogram and set all bars to 0.5
        hist.classList.remove(BLUR_CLASS);
        // restore cached value
        [...bars].forEach((bar) => {
            bar.style.setProperty("--value", bar.dataset["cachedValue"] ?? "0");
        });

        // restore average rating
        avg.innerText = avg.dataset["cachedAvg"] ?? "0.0";
    } else {
        hist.classList.add(BLUR_CLASS);
        [...bars].forEach((bar) => {
            if (!("cachedValue" in bar.dataset)) {
                // parse original histogram bar value from style property
                // and store for reversal when user wants to see histogram
                bar.dataset["cachedValue"] =
                    bar.style.getPropertyValue("--value");
            }
            bar.style.setProperty("--value", "0.5");
        });

        // store and obscure average
        avg.dataset["cachedAvg"] = avg.innerText;
        avg.innerText = "3.0";
    }
}

function showFriendsActivity(show) {
    // TODO: only blur out friends who actually watched (check for li nodes with .-rated pseudoclass)
    // children of ul avatar-list (child of activity-from-friends)
    // others may only have .-watchlisted

    const friendsActivityList = document.getElementsByClassName(
        "activity-from-friends",
    )[0];
    if (!friendsActivityList) return;
    const friendsActivity =
        friendsActivityList.getElementsByClassName("avatar-list")[0];

    const friendsRatings =
        friendsActivity.getElementsByClassName("rating -nano");

    if (show) {
        friendsActivity.classList.remove(BLUR_CLASS);

        [...friendsRatings].forEach((el) => {
            el.hidden = false;
            // el.classList.remove("rated-0");
            // el.classList.add(`rated-${el.dataset["cachedValue"] ?? "0"}`);
        });
    } else {
        friendsActivity.classList.add(BLUR_CLASS);

        [...friendsRatings].forEach((el) => {
            el.hidden = true;
            // if (!("cachedValue" in el.dataset)) {
            //     // extract rating and store
            //     const rating = el.className.substring(
            //         el.className.lastIndexOf("-"),
            //     );
            //     el.dataset["cachedValue"] = rating;
            // }

            // el.classList.remove(`rated-${rating}`);
            // el.classList.add("rated-0");
        });
    }
}

function showReviews(show) {
    // blur parent divs
    const reviewParents = document.getElementsByClassName("film-reviews");
    [...reviewParents].forEach((el) => {
        if (show) {
            el.classList.remove(BLUR_CLASS);
        } else {
            el.classList.add(BLUR_CLASS);
        }
    });

    // hide individual ratings
    [...reviewParents].forEach((el) => {
        const reviewStrips = el.getElementsByClassName(
            "content-reactions-strip",
        );
        [...reviewStrips].forEach((strip) => {
            if (show) {
                strip.hidden = false;
            } else {
                strip.hidden = true;
            }
        });
    });
    // set given stars to 5/5
}

function showRevealButton(show) {
    const unhideButton = document.querySelector(".unhide-button");

    // place a reveal button on top of each of the above obscured elements
    // i.e. play with z order on ratings curve etc.
    if (show) {
        unhideButton.hidden = false;
    } else {
        unhideButton.hidden = true;
    }
}
