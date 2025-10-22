// ==UserScript==
// @name         YouTube Grid Row Controller
// @namespace    https://github.com/HageFX-78
// @version      0.6
// @description  Adds simple buttons to control items per row on Youtube's home feed, works for shorts and news sections too. Buttons can be hidden if needed.
// @author       HageFX78
// @license      MIT
// @match        *://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @downloadURL  https://github.com/HageFX-78/YouTube-Grid-Row-Controller/raw/refs/heads/main/YTGridRowControl.user.js
// @updateURL    https://github.com/HageFX-78/YouTube-Grid-Row-Controller/raw/refs/heads/main/YTGridRowControl.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    // Configurable options
    const embedInChips = true; // Only applies to the one that is attached to the categories bar, set false if you have another script that removes the bar
    const hideControls = false; // set true to hide UI controls, it will use the default values instead

    const transparentButtons = false; // set true to make the buttons transparent and less intrusive, only applies if hideControls is false

    const defaultSettingValue = {
        // Default values mainly used when if you want to hide the buttons, change the values to your liking
        content: 4,
        news: 5,
        shorts: 6,
    };

    let currentSettingValues = {
        content: GM_getValue('itemPerRow', defaultSettingValue.content),
        news: GM_getValue('newsPerRow', defaultSettingValue.news),
        shorts: GM_getValue('shortsPerRow', defaultSettingValue.shorts),
    };

    // Styles
    const style = (css) => {
        const el = document.createElement('style');
        el.textContent = css;
        document.head.appendChild(el);
        return el;
    };

    style(`
		${hideControls ? '' : '#chips-content{width: 92% !important;}'}

		.justify-left-custom {
			justify-content: left !important;
		}
        .justify-center-custom {
			justify-content: center !important;
		}

        ytd-rich-item-renderer[rendered-from-rich-grid][is-in-first-column] {
            margin-left: calc(var(--ytd-rich-grid-item-margin) / 2) !important;
        }
		
		ytd-rich-item-renderer[hidden][is-responsive-grid], [is-slim-media]{
			display: block !important;
		}

		ytd-rich-item-renderer{
			margin-bottom: var(--ytd-rich-grid-row-margin) !important;
		}

		.button-container.ytd-rich-shelf-renderer {
			display: none !important;
		}
		
		#dismissible.ytd-rich-shelf-renderer {
			padding-bottom: 0 !important;
			border-bottom: none !important;
		}
            
        #selected-chip-content{
            width: 0% !important;
        }

        ytd-feed-filter-chip-bar-renderer[frosted-glass-mode=with-chipbar] #chips-wrapper.ytd-feed-filter-chip-bar-renderer {
            flex-direction: row;
        }
		.itemPerRowControl {
            display: flex;
            justify-content: right;
            align-items: center;

            z-index: 2025;
            flex: 1;         
            gap: 10px;
            box-sizing: border-box;
            user-select: none;
			${embedInChips ? 'width: 8%;' : ''};
        }

        .itemPerRowControl button {

            border: none;
            color: var(--yt-spec-text-primary);
            background-color:${transparentButtons ? 'transparent' : 'var(--yt-spec-badge-chip-background)'};
            font-size: 24px;
            
            text-align: center;
            display: inline-block;

            height: 30px;
            aspect-ratio: 1/1;
            border-radius: 50%;
        }

        .itemPerRowControl button:hover {
            background-color: var(--yt-spec-button-chip-background-hover);
            cursor: pointer;
        }
	`);

    const dynamicStyle = style('');

    function updatePageLayout() {
        dynamicStyle.textContent = `
			ytd-rich-grid-renderer {
				--ytd-rich-grid-items-per-row: ${hideControls ? defaultSettingValue.content : currentSettingValues.content} !important;
			}
			ytd-rich-shelf-renderer:not([is-shorts]) {
				--ytd-rich-grid-items-per-row: ${hideControls ? defaultSettingValue.news : currentSettingValues.news} !important;
			}
			ytd-rich-shelf-renderer[is-shorts] {
				--ytd-rich-grid-slim-items-per-row: ${hideControls ? defaultSettingValue.shorts : currentSettingValues.shorts} !important;
                --ytd-rich-grid-items-per-row: ${hideControls ? defaultSettingValue.shorts : currentSettingValues.shorts} !important;
			}
		`;
    }

    function saveValues() {
        GM_setValue('itemPerRow', currentSettingValues.content);
        GM_setValue('newsPerRow', currentSettingValues.news);
        GM_setValue('shortsPerRow', currentSettingValues.shorts);
    }

    function updateAndSave() {
        updatePageLayout();
        saveValues();
    }

    function waitForElement(baseQuery, selector) {
        return new Promise((resolve) => {
            const observer = new MutationObserver(() => {
                const el = baseQuery.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });

            observer.observe(baseQuery, { childList: true, subtree: true });
        });
    }

    function watchMainContent(container) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(({ addedNodes }) => {
                for (let node of addedNodes) {
                    if (node.nodeType === 1 && node.matches('ytd-rich-section-renderer')) {
                        const ref = node.querySelector('#menu-container');
                        const hasControlDiv = node.querySelector('.itemPerRowControl') !== null;
                        const isShorts = node.querySelector('[is-shorts]') !== null;

                        if (hasControlDiv) continue; // Skip if already exists

                        createControlDiv(ref, isShorts ? 'shorts' : 'news', true);
                    }
                }
            });
        });

        observer.observe(container, { childList: true, subtree: true });
    }

    function createControlDiv(target, type, insertBefore = false) {
        const controlDiv = document.createElement('div');
        controlDiv.classList.add('style-scope', 'ytd-rich-grid-renderer', 'itemPerRowControl');

        ['-', '+'].forEach((symbol) => {
            const btn = document.createElement('button');
            btn.innerText = symbol;
            btn.addEventListener('click', () => {
                if (symbol === '+') {
                    currentSettingValues[type]++;
                    console.log(currentSettingValues[type]);
                } else if (currentSettingValues[type] > 1) {
                    currentSettingValues[type]--;
                }
                updateAndSave();
            });
            controlDiv.appendChild(btn);
        });

        if (insertBefore) target.parentNode.insertBefore(controlDiv, target);
        else target.appendChild(controlDiv);

        if (type == 'content') controlDiv.classList.add('justify-left-custom');
    }

    function init(queryStartLocation) {
        updatePageLayout();

        if (hideControls) return;

        waitForElement(queryStartLocation, '#chips-wrapper').then((el) => createControlDiv(el, 'content'));

        // Start watching for newly loaded sections
        waitForElement(queryStartLocation, '#contents.ytd-rich-grid-renderer').then(watchMainContent);

        // Cleanup after init
        window.removeEventListener('yt-navigate-finish', handlePageContentChanged);
    }

    // Workaround when reloaded on creator's home page and going back to main page will hide the buttons
    let firstLoad = true;
    function handlePageContentChanged() {
        if (location.href.endsWith('youtube.com/')) {
            let browseElements = document.querySelectorAll('ytd-browse');

            if (firstLoad || browseElements.length <= 1) {
                init(browseElements[0]);
            } else {
                // If reloaded on creator's home page, second ytd-browse will be the main page
                init(browseElements[1]);
            }
        }
        firstLoad = false;
    }

    // ----------------------------------- Main Execution -----------------------------------

    window.addEventListener('yt-navigate-finish', handlePageContentChanged);
})();
