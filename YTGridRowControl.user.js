// ==UserScript==
// @name         YouTube Grid Row Controller
// @namespace    https://github.com/HageFX-78
// @version      0.1
// @description  Add simple buttons to control items per row on Youtube's homepage grid, default is 4
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
	"use strict";

	// If you have another script that disables or remove yt chips set this to false, true by default
	let embedInChips = true;
	// If you want to hide the controls/UI set this to true, false by default
	let hideControls = false;
	// This will be used if hideControls is true, 4 by default. Setting will affect the count when hideControls is true
	let defaultItemsPerRow = 4;

	// Changing this will not effect the script, use the buttons to change it
	let itemsPerRow = GM_getValue("itemsPerRow", defaultItemsPerRow);

	const overrideStyle = document.createElement("style");
	const staticOverrideStyle = document.createElement("style");
	const chipsStyle = document.createElement("style");
	const noChipsStyle = document.createElement("style");

	chipsStyle.textContent = `
        
        #right-arrow {
            right: 10% !important;
        }

        #chips-wrapper {
            justify-content: left !important;
        }
        #chips-content{
            width: 90% !important;
        }

        #itemPerRowControl {
            display: flex;
            justify-content: center;
            align-items: center;

            flex: 1;         
            gap: 10px;
            box-sizing: border-box;
            user-select: none;
        }

    `;

	noChipsStyle.textContent = `
        
        #itemPerRowControl {
            display: flex;
            justify-content: right;
            align-items: center;
            margin: 0;
            padding: 0 60px;

            width: 100%;
            gap: 10px;
            box-sizing: border-box;
            user-select: none;
        }
    `;

	staticOverrideStyle.textContent = `

        ytd-rich-item-renderer[rendered-from-rich-grid][is-in-first-column] {
            margin-left: calc(var(--ytd-rich-grid-item-margin) / 2) !important;
        }

        #itemPerRowControl button {
            background-color: #f1f1f1;
            border: none;
            color: white;
            background-color:var(--yt-spec-badge-chip-background);
            font-size: 24px;
            
            text-align: center;
            display: inline-block;


            height: 30px;
            aspect-ratio: 1/1;
            border-radius: 50%;
        }

        #itemPerRowControl button:hover {
            background-color: var(--yt-spec-button-chip-background-hover);
            cursor: pointer;
        }
    `;

	overrideStyle.textContent = `
        ytd-rich-grid-renderer { --ytd-rich-grid-items-per-row: ${
			hideControls ? defaultItemsPerRow : itemsPerRow
		} !important; }
    `;

	document.head.appendChild(staticOverrideStyle);
	document.head.appendChild(overrideStyle);

	if (hideControls) {
		return;
	}

	if (embedInChips) {
		document.head.appendChild(chipsStyle);
		waitForElement("#chips-wrapper").then((element) => {
			createControlDiv(element);
		});
	} else {
		document.head.appendChild(noChipsStyle);
		waitForElement("#contents").then((element) => {
			createControlDiv(element);
		});
	}

	//-------------------------------------------- Functions --------------------------------------------------
	function waitForElement(selector) {
		return new Promise((resolve) => {
			const observer = new MutationObserver((mutations, observer) => {
				const element = document.querySelector(selector);
				if (element) {
					observer.disconnect();
					resolve(element);
				}
			});

			observer.observe(document.body, {
				childList: true,
				subtree: true,
			});
		});
	}

	function updateItemPerRow() {
		overrideStyle.textContent = `
            ytd-rich-grid-renderer { --ytd-rich-grid-items-per-row: ${itemsPerRow} !important; }`;
		GM_setValue("itemsPerRow", itemsPerRow); // Save the value
	}

	function createControlDiv(insertTarget) {
		let controlDiv = document.createElement("div");
		controlDiv.id = "itemPerRowControl";
		controlDiv.classList.add("style-scope", "ytd-rich-grid-renderer");

		// Control
		let addItemPerRow = document.createElement("button");
		addItemPerRow.innerText = "+";
		addItemPerRow.addEventListener("click", () => {
			itemsPerRow++;
			updateItemPerRow();
		});

		let minusItemPerRow = document.createElement("button");
		minusItemPerRow.innerText = "-";
		minusItemPerRow.addEventListener("click", () => {
			if (itemsPerRow > 1) {
				itemsPerRow--;
				updateItemPerRow();
			}
		});

		controlDiv.appendChild(minusItemPerRow);
		controlDiv.appendChild(addItemPerRow);

		if (embedInChips) {
			insertTarget.appendChild(controlDiv);
		} else {
			insertTarget.parentNode.insertBefore(controlDiv, insertTarget);
		}
	}
})();
