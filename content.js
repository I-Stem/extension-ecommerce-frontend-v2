customLogger("Content.js started");

var currentHostname = window.location.hostname;
getVisitCount();

var flag = true;

if (flag) {
    getMediaPermission();
}

async function getMediaPermission() {
    flag = false;
    navigator.mediaDevices.getUserMedia({
        audio: true
    })
    .then(async stream => {
        customLogger("Microphone permission granted");
        customLogger("Started Listening:");

        // const resp = await sendMessageToBackground({ action: "getCurrentTabURL" });
        // const message = "Current Tab URL: " + resp.currentTabURL;
        // customLogger(message);
        // weburl = resp.currentTabURL;

        if (currentHostname.includes("amazon")){
            textToSpeech("Hi Lakshya, you are now viewing the Amazon webpage. You can address me as Delta");
        } else if (currentHostname.includes("doordash")) {
            textToSpeech("Hi Lakshya, you are now viewing the DoorDash webpage. You can address me as Delta");
        }

        startRecognition();
        // processScreen();
        // processPrice("delta the price is $500, 3.5 stars minimum rating and 1 week of delivery time");
    });
}

async function startRecognition() {

    try{
        recognition = new(window.webkitSpeechRecognition || window.SpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.continuous = true; // Set to true to keep listening even after a result is returned
        recognition.interimResults = true;
        
        let commandBuffer = [];
        let isListeningForCommand = false;
        let result = "";

        recognition.onresult = function(event) {
            
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript.trim();

            if (transcript.toLowerCase().includes('delta')) {
                customLogger("Delta found in speech");
                isListeningForCommand = true;
                commandBuffer = []; // Clear the buffer to start a new command
                
                if (isListeningForCommand) {
                    commandBuffer.push(transcript);
                }
            
                if (event.results[current].isFinal) {
                    if (isListeningForCommand) {
                        result = commandBuffer;
                        customLogger("Final speech transcript:");
                        customLogger(result[0]);
                        performAction(result);
                        isListeningForCommand = false; // Reset listening state
                        commandBuffer = []; // Clear the command buffer
                    }
                    }
            }
            
        };
        
        recognition.onstart = function(event) {
            customLogger("Recog start");
        };

        recognition.onerror = function(event) {
            customLogger(event.error);
        };

        recognition.onend = function() {
            customLogger("Speech recognition ended");
            customLogger('Speech recognition started again');
            recognition.start();
        };
        recognition.start();
    } catch(err) {
        customError('Error accessing microphone:');
        customError(err);
        customError(err.message);
        customError(err.name);
    }

}

async function performAction(result) {

    customLogger("Inside function: performAction");
    
    if (result[0].includes('screen')) {
        customLogger("Screen word found in speech");
        processScreen();
    }

    if (result[0].includes('search')) {
        customLogger("Search word found in speech");

        const indexAfterSearch = result[0].indexOf("search") + "search ".length;
        const textAfterSearch = result[0].substring(indexAfterSearch);
        performSearch(textAfterSearch);
    }
    
    if (result[0].includes('price')) {
        customLogger("Price word found in speech");
    
        const indexAfterDelta = result[0].indexOf("delta") + "delta ".length;
        const metricText = result[0].substring(indexAfterDelta);
        var itemsList = getItemsList();
        const response = await sendMessageToBackground({ action: "processPrice", speechResult: metricText, itemsArray: itemsList });
        const productName = response.speechText;
        customLogger(productName);
        if (productName.toLowerCase().includes("the website does")){
            textToSpeech(productName);
        } else {
            clickOnProduct(productName);
        }
        
    }

    if (result[0].includes('cart')) {
        customLogger("Cart word found in speech");
        clickOnAddCart();
    }

    if (result[0].includes('checkout') || result[0].includes('check out')) {
        customLogger("Checkout word found in speech");
        clickOnProceedToCheckout();
    }

    if (result[0].includes('review')) {
        customLogger("Review word found in speech");
        getTopReview();
    }

    if (result[0].includes('warranty')) {
        customLogger("Warranty word found in speech");
        clickOnNoWarranty();
    }
}

function performSearch(textAfterSearch) {

    customLogger("Inside performSearch");

    const searchBars = document.querySelectorAll('input[type="search"], input[type="text"]');

    for (const searchBar of searchBars) {
        searchBar.click();
        searchBar.value = textAfterSearch;

        const searchButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
        for (const searchButton of searchButtons) {
            if (searchButton.form === searchBar.form) { // Ensure the button belongs to the same form as the search bar
                searchButton.click();
                break;
            }
        }
        break;
    }

    askPriceMetrics();
}

function askPriceMetrics() {
    customLogger("Inside Function: askPriceMetrics");

    let instructions = "Please tell your pricing budget, the review threshold and expected delivery date";
    textToSpeech(instructions);
}

function processPrice() {
    customLogger("Inside Function: processPrice");
    var itemList = getItemsList();
    customLogger(itemList);
    // sendMessageToBackground({ action: "processPrice",  speechResult: result})
    // .then(resp => {
    //     customLogger("Received resp");
    //     customLogger(resp);
    //     const productName = resp.speechText;
    //     customLogger(productName);
    //     clickOnProduct(productName);
    // });
}

function getItemsList() {
    customLogger("Inside Function: getItemsList");
    // const itemElements = document.querySelectorAll('div.sg-col-20-of-24[data-asin]');
    const itemElements = document.querySelectorAll('[data-component-type="s-search-result"]');

    // Initialize an empty array to store the extracted objects
    const items = [];

    // Iterate over each item element
    itemElements.forEach(itemElement => {
        // Extract name, price, and rating
        const nameElement = itemElement.querySelector('h2.a-size-mini > a');
        const name = nameElement ? nameElement.textContent.trim() : 'N/A';

        const priceElement = itemElement.querySelector('div.a-row.a-size-base > div.a-row > a > span.a-price > span.a-offscreen');
        const price = priceElement ? priceElement.textContent.trim() : 'N/A';

        const ratingElement = itemElement.querySelector('div.a-row.a-size-small > span > span');
        const rating = ratingElement ? ratingElement.textContent.trim() : 'N/A';

        // Create an object with the extracted details and push it to the items array
        items.push({ name, price, rating });
    });
    customLogger(items);

    // Return the array of extracted objects
    return items;
}

function processScreen() {
    customLogger("Inside function: processScreen");
    sendMessageToBackground({ action: "processScreen" })
    .then(resp => {
        customLogger("Received resp");
        textToSpeech(resp.speechText);
    });
}

function textToSpeech(message) {
    customLogger("Inside function: textToSpeech");
    customLogger(message);

    if ('speechSynthesis' in window) {
        const instructionsObj = new SpeechSynthesisUtterance(message);
        instructionsObj.lang = 'en-US';
        instructionsObj.volume = 1;
        instructionsObj.rate = 1;

        window.speechSynthesis.speak(instructionsObj);
    }
}

function customLogger(result) {
    chrome.runtime.sendMessage({
        action: "consolelog",
        message: result
    });
}

function customError(result) {
    chrome.runtime.sendMessage({
        action: "consoleerror",
        message: result
    });
}

function sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, function(response) {
            resolve(response);
        });
    });
}

function clickOnProduct(productName){
    const timestamp0 = Date.now();
        customLogger("TS0");
        customLogger(timestamp0);

    customLogger("Inside function: clickOnProduct");

    const goodlinks = document.querySelectorAll('a.a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal');

    customLogger(goodlinks);

    for (const link of goodlinks) { 
        const productText = link.textContent.trim();
        customLogger(productText);

        if (productText.toLowerCase().includes(productName.toLowerCase())) {

            customLogger("Product found");
            customLogger(link.getAttribute('href'));  
            link.click();
            break;
        }
    }
    const message = "You are now viewing the product page for " + productName;
    textToSpeech(message);
}

function clickOnAddCart() {
    customLogger("Inside function: clickOnAddCart");
    const addToCartButtons = document.querySelectorAll('#add-to-cart-button, input.a-button-input[type="submit"][aria-labelledby="freshAddToCartButton-announce"]');
    customLogger(addToCartButtons);
    for (const submitButton of addToCartButtons) {
            submitButton.click();
            break;
        }
    const element = document.querySelector('input.a-button-input[type="submit"][aria-labelledby="attachSiNoCoverage-announce"]');

    if (element) {
        console.log('Warranty banner is present on the webpage.');
        textToSpeech("Would you like to add warranty to your product?")
    } else {
        console.log('Warranty banner is not present on the webpage.');
        textToSpeech("Would you like to proceed to checkout?");
    }
        
    customLogger("Exiting function: clickOnAddCart");
}

function clickOnNoWarranty() {
    customLogger("Inside function: clickOnNoWarranty");
    const element = document.querySelector('input.a-button-input[type="submit"][aria-labelledby="attachSiNoCoverage-announce"]');
    element.click();
    textToSpeech("Would you like to proceed to checkout?");
}

// function clickOnBuyNow() {
//     const timestamp3 = Date.now();
//         customLogger("TS3");
//         customLogger(timestam3);
//     customLogger("Inside function: clickOnBuyNow");
//     const addToBuyNowButton = document.querySelector('#buy-now-button');
//     addToBuyNowButton.click();
// }

function clickOnProceedToCheckout() {
    customLogger("Inside function: clickOnProceedToCheckout");
    const proceedToCheckoutButtons = document.querySelectorAll('input[name="proceedToRetailCheckout"][data-feature-id="proceed-to-checkout-action"]');

    
    customLogger(proceedToCheckoutButtons);
    for (const submitButton of proceedToCheckoutButtons) {
            submitButton.click();
            break;
        }
    customLogger("Exiting function: clickOnProceedToCheckout");
}

function getTopReview() {
    customLogger("Inside function: getTopReview");
    const parentElement = document.getElementById("cm-cr-dp-review-list");
    const firstChildElement = parentElement.firstElementChild;

    customLogger(firstChildElement);

    const starRatingElement = firstChildElement.querySelector("[data-hook='review-star-rating']");
    const starRating = starRatingElement.querySelector(".a-icon-alt").textContent.trim();

    const profileNameElement = firstChildElement.querySelector("[data-hook='genome-widget'] .a-profile-name");
    const profileName = profileNameElement.textContent.trim();

    const reviewDateElement = firstChildElement.querySelector("[data-hook='review-date']");
    const reviewDateText = reviewDateElement.textContent.trim();

    const reviewContentElement = firstChildElement.querySelector("[data-hook='review-title']");
    const reviewContent = reviewContentElement.textContent.trim();
    const reviewTitle = reviewContent.split('\n').filter(line => line.trim().length > 0).join('\n');
    const [reviewRating, reviewTitleText] = reviewTitle.split('\n');


    const message = profileName + " " + reviewDateText + ". The rating is " + reviewRating + " and the review title is " + reviewTitleText;
    customLogger(message);

    textToSpeech(message);
}

// function clickWithDelay(func, timeout = 0) {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         func();
//         resolve();
//       }, timeout);
//     });
//    }

function getVisitCount() {
    customLogger("The current URL: " + currentHostname);

    var visitCountKey = 'visitCount_' + currentHostname;

    // Check if the website has been visited before
    if(localStorage.getItem(visitCountKey)) {
        // If yes, increment the count
        var count = parseInt(localStorage.getItem(visitCountKey));
        count++;
        localStorage.setItem(visitCountKey, count);
    } else {
        // If no, set the count to 1
        localStorage.setItem(visitCountKey, 1);
    }

    customLogger('You have visited ' + currentHostname + ' ' + localStorage.getItem(visitCountKey) + ' times.');
}