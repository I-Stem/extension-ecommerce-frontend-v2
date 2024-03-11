customLogger("Content.js started");

var currentHostname = window.location.hostname;
getVisitCount();

var flag = true;
//for doordash filter
let filterToggle = false;
let foodText = "";
let currentIndexOfItem = 0;
let searchWindow;

if (flag) {
  getMediaPermission();
}

async function getMediaPermission() {
  flag = false;
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
    })
    .then(async (stream) => {
      customLogger("Microphone permission granted");
      customLogger("Started Listening:");

      // const resp = await sendMessageToBackground({ action: "getCurrentTabURL" });
      // const message = "Current Tab URL: " + resp.currentTabURL;
      // customLogger(message);
      // weburl = resp.currentTabURL;

      if (currentHostname.includes("amazon")) {
        textToSpeech(
          "Hi Lakshya, you are now viewing the Amazon webpage. You can address me as Delta"
        );
      } else if (currentHostname.includes("doordash")) {
        textToSpeech(
          "Hi Lakshya, you are now viewing the DoorDash webpage. You can address me as Delta"
        );

        // to display the top 5 items
        currentIndexOfItem = 0;

        var currentUrl = window.location.href;
        customLogger(currentUrl);
        if (currentUrl.includes("event_type=search")) {
          var startIndex =
            currentUrl.indexOf("https://www.doordash.com/search/") +
            "https://www.doordash.com/search/".length;
          var endIndex = currentUrl.indexOf("/?event_type=search");
          // var len = endIndex-startIndex;
          const text = currentUrl.substring(startIndex, endIndex);
          customLogger(text);
          textToSpeech("Hi there, showing search results for");
          textToSpeech(text);
          filterOptions();
          // window.onload = await listItems();
        } else if (currentUrl.includes("www.doordash.com/store")) {
          var store = currentUrl.split("/")[4];
          customLogger(store);
          textToSpeech("hi there you are now viewing");
          textToSpeech(store);
          window.onload = performMenuSearch();
        }
      }

      startRecognition();
      // processScreen();
      // processPrice("delta the price is $500, 3.5 stars minimum rating and 1 week of delivery time");
    });
}

async function listItems() {
  var itemList = await getItemsList();
  itemList.sort((a, b) => b.rating - a.rating);
  customLogger(itemList);
  // itemList.forEach((item)=> {
  //     textToSpeech(item.name);
  //     textToSpeech("rating ");
  //     textToSpeech(item.rating);
  //     textToSpeech("delivery time ");
  //     textToSpeech(item.deliveryTime);
  // });

  return itemList;
}

async function startRecognition() {
  try {
    recognition = new (window.webkitSpeechRecognition ||
      window.SpeechRecognition)();
    recognition.lang = "en-US";
    recognition.continuous = true; // Set to true to keep listening even after a result is returned
    recognition.interimResults = true;

    let commandBuffer = [];
    let isListeningForCommand = false;
    let result = "";

    recognition.onresult = async function (event) {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript.trim();

      if (transcript.toLowerCase().includes("delta")) {
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
            await performAction(result);
            isListeningForCommand = false; // Reset listening state
            commandBuffer = []; // Clear the command buffer
          }
        }
      }
    };

    recognition.onstart = function (event) {
      customLogger("Recog start");
    };

    recognition.onerror = function (event) {
      customLogger(event.error);
    };

    recognition.onend = function () {
      customLogger("Speech recognition ended");
      customLogger("Speech recognition started again");
      recognition.start();
    };
    recognition.start();
  } catch (err) {
    customError("Error accessing microphone:");
    customError(err);
    customError(err.message);
    customError(err.name);
  }
}

async function performAction(result) {
  customLogger("Inside function: performAction");

  if (result[0].includes("screen")) {
    customLogger("Screen word found in speech");
    processScreen();
  }

  if (result[0].includes("search")) {
    customLogger("Search word found in speech");
    const indexAfterSearch =
      (await result[0].indexOf("search")) + "search ".length;
    const textAfterSearch = await result[0].substring(indexAfterSearch);
    customLogger("hello brother");
    customLogger(textAfterSearch);
    await performSearch(textAfterSearch);
  }

  if (result[0].includes("price") && !filterToggle) {
    customLogger("Price word found in speech");

    const indexAfterDelta = result[0].indexOf("delta") + "delta ".length;
    const metricText = result[0].substring(indexAfterDelta);
    var itemsList = getItemsList();
    const response = await sendMessageToBackground({
      action: "processPrice",
      speechResult: metricText,
      itemsArray: itemsList,
    });
    const productName = response.speechText;
    customLogger(productName);
    if (productName.toLowerCase().includes("the website does")) {
      textToSpeech(productName);
    } else {
      clickOnProduct(productName);
    }
  }

  if (result[0].includes("cart")) {
    customLogger("Cart word found in speech");
    clickOnAddCart(result[0]);
  }

  if (result[0].includes("checkout") || (result[0].includes("check") && result[0].includes("out"))) {
    customLogger("Checkout word found in speech");
    clickOnProceedToCheckout();
  }

  if (result[0].includes("review")) {
    customLogger("Review word found in speech");
    getTopReview();
  }

  if (result[0].includes("warranty")) {
    customLogger("Warranty word found in speech");
    clickOnNoWarranty();
  }

  //for Doordash website
  if(result[0].match("list") && result[0].match("items")) {
    customLogger("list item word found in speech");
    await listTheItemsOnScreen();
  }
  if (result[0].includes("find")) {
    customLogger("Find word found in speech");
    customLogger(result[0]);
    const indexAfterFind = (await result[0].indexOf("find")) + "find ".length;
    const textAfterFind = await result[0].substring(indexAfterFind);
    customLogger(textAfterFind);
    foodText = textAfterFind;
    foodText = foodText.toLowerCase();
    await performFind(textAfterFind);
  }
  if (
    (result[0].includes("low") ||
      result[0].includes("medium") ||
      result[0].includes("high") ||
      result[0].includes("costly")) &&
    filterToggle
  ) {
    priceFilter(result[0]);
  }
  if (result[0].includes("filter")) {
    customLogger("filter word found in speech");
    customLogger(result[0]);
    if (result[0].includes("offers")) {
      performFilter("offers");
    } else if (result[0].includes("rating")) {
      performFilter("rating");
    } else if (result[0].includes("delivery under 30 minutes")) {
      performFilter("delivery under 30 minutes");
    } else if (result[0].includes("price")) {
      performFilter("price");
    } else if (result[0].includes("dash")) {
      performFilter("dashpass");
    } 
  }
  if (result[0].includes("select")) {
    customLogger("select word found in speech");
    var storeIndex = (await result[0].indexOf("select")) + "select ".length;
    var storeName = await result[0].substring(storeIndex);
    customLogger(storeName);
    selectItem(storeName);
  }
  if(result[0].includes("add") && result[0].includes("order")) {
    customLogger("add & order word found in speech"); 
    addonToOrder(result[0]);
  }
  if(result[0].match("show") && result[0].match("more")) {
    await listTheItemsOnScreen();
  }
}

async function addonToOrder(str) {
  
  var words = str.split(' ');
    words.filter((word)=> {
      return (word != 'Delta' && word != 'add' && word != 'order' && word != 'to')
    });
    customLogger(words);
    const sideOptions = querySelectorAll('div.Stack__StyledStack-sc-vzfcgq-0');
    sideOptions.forEach((option)=> {
      const optionName = option.querySelector('h3.styles__TextElement-sc-3qedjx-0').textContent.trim();
      
  });
}


//performfilter on /search/store
function filterOptions() {
  textToSpeech("There are the following filter options available");
  textToSpeech(
    "By offers      by rating over 4.5     by delivery under 30 minutes    by price      and by DashPass"
  );
  textToSpeech("what filter would you like to use");
}

async function performFilter(str) {
  filterToggle = true;
  var filterElements = document.querySelectorAll(
    '[data-anchor-id="LegoHomePageFilter"] button, [data-anchor-id="LegoHomePageFilter"] [role="button"]'
  );
  customLogger(filterElements);
  if (str === "offers") filterElements[0].click();
  else if (str === "rating") filterElements[1].click();
  else if (str === "delivery under 30 minutes") filterElements[3].click();
  else if (str === "price") {
    filterElements[4].click();
    textToSpeech("select the filter : low medium high costly");
  } else filterElements[5].click();
  // filterElements[2].click();
  // await listItems();
}

async function listTheItemsOnScreen(){
  var itemList = await getItemsList();
  textToSpeech("Showing the top 5 results");
  textToSpeech("The result is sorted by rating from high to low");
  itemList.sort((a, b) => b.rating - a.rating);
  // customLogger(itemList);
  let i;
  for(i = currentIndexOfItem ; (i < itemList.length && i < currentIndexOfItem+5); i++) {
    let item = itemList[i];
    customLogger(item);
    textToSpeech(item.name);
    textToSpeech("rating ");
    textToSpeech(item.rating);
    textToSpeech("delivery time ");
    textToSpeech(item.deliveryTime);
  }
  //update the current index of item on screen
  currentIndexOfItem = i;
  // itemList.forEach((item)=> {
  //     textToSpeech(item.name);
  //     textToSpeech("rating ");
  //     textToSpeech(item.rating);
  //     textToSpeech("delivery time ");
  //     textToSpeech(item.deliveryTime);
  // });
  customLogger("exiting the listTheITemsOnScreen function");
}


async function performMenuSearch() {
  var menuItems = document.querySelectorAll("div.sc-f9492ecc-2 > div");
  let flag = 0;
  for (var item of menuItems) {
    var nameElement = item.querySelector("h2");
    var name = (name = nameElement ? nameElement.textContent.trim() : "N/A");
    name = name.toLowerCase();
    if (name.includes(foodText)) {
      customLogger("clicked selected item");
      item.querySelector()
      flag = 1;
      break;
    }
  }
  if (flag == 0) {
    for (var item of menuItems) {
      var nameElement = item.querySelector("h2");
      var name = (name = nameElement ? nameElement.textContent.trim() : "N/A");
      if (name.includes("most ordered")) {
        customLogger("clicked most ordered");
        flag = 1;
        item.click();
        break;
      }
    }
  }
  customLogger(flag);
  //menu audio
  window.onload =await menuAudio();
}

//to speak back the menu in a store
async function menuAudio() {
  textToSpeech("The items available on menu are");
  var menuItems = document.querySelectorAll('[data-anchor-id="MenuItem"]');
  menuItems.forEach((item) => {
    var nameElement = item.querySelector(
      '[data-telemetry-id="storeMenuItem.title"]'
    );
    var name = nameElement ? nameElement.textContent : "N/A";
    customLogger(name);
    textToSpeech(name);
  });
  textToSpeech("What would you like to order");
}

async function performFind(textAfterFind) {
  const searchBar = document.querySelector('input[type="text"], .idveBz'); // Adjust selector if necessary

  if (searchBar) {
    searchBar.focus();
    searchBar.value = textAfterFind;

    // Trigger input event to simulate typing
    const event = new Event("input", { bubbles: true });
    customLogger("input event1");
    searchBar.dispatchEvent(event);
    customLogger("input event2");

    // Simulate Enter press after a delay
    setTimeout(() => {
      //customLogger("Dispatching Enter");
      // const enterEvent = new KeyboardEvent('keydown', {
      //     key: 'Enter',
      //     code: 'Enter',
      //     bubbles: true,
      //     cancelable: true,
      // });
      // searchBar.dispatchEvent(enterEvent);
      // searchBar.dispatchEvent(enterEvent);
      // searchBar.closest('form').submit();
      // customLogger("form submitted");
      customLogger("Navigating to: " + textAfterFind);
      searchWindow = window.location.assign(
        "https://doordash.com/search/store/" +
          textAfterFind +
          "/?event_type=search"
      );
    }, 5000);
  }
}

async function performSearch(textAfterSearch) {
  customLogger("Inside performSearch");

  const searchBars = document.querySelectorAll(
    'input[type="search"], input[type="text"]'
  );

  for (const searchBar of searchBars) {
    searchBar.click();
    searchBar.value = textAfterSearch;
    const searchButtons = document.querySelectorAll(
      'button[type="submit"], input[type="submit"]'
    );
    for (const searchButton of searchButtons) {
      if (searchButton.form === searchBar.form) {
        // Ensure the button belongs to the same form as the search bar
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

  let instructions =
    "Please tell your pricing budget, the review threshold and expected delivery date";
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

//select store(DoorDash)
async function selectItem(store) {
  customLogger("inside selectItem function");
  // var storeName = toString(store);
  customLogger(store);
  // customLogger(storeName);
  const itemElements = document.querySelectorAll(
    '[data-anchor-id="StoreLayoutListContainer"] > div'
  );
  customLogger(itemElements);
  customLogger(itemElements.length);

  for (var itemElement of itemElements) {
    var nameElement = itemElement.querySelector(
      'div > [data-telemetry-id="store.name"]'
    );
    var name = nameElement ? nameElement.textContent.trim() : "N/A";
    customLogger("name");
    customLogger(name);
    name = name.toLowerCase();
    store = store.toLowerCase();
    let storeArray = store.split(' ');
    let storeFlag = 1;
    for(let item of storeArray) {
      if(name.match(item) === null)
        storeFlag = 0;
    }
    if (storeFlag) {
      var anchorElement = itemElement.querySelector(
        'a.sc-db8c6f48-0,[aria-labelledby="store-info-418108"]'
      );
      customLogger(anchorElement);
      var url = anchorElement.href;
      customLogger(url);
      const storeWindow = window.open(url);
      storeWindow.close();
      break;
    } else {
      customLogger("name did not match");
    }
  }
}

async function getItemsList() {
  customLogger("Inside Function: getItemsList");
  // const itemElements = document.querySelectorAll('div.sg-col-20-of-24[data-asin]');
  const itemElements = document.querySelectorAll(
    '[data-component-type="s-search-result"],[data-anchor-id="StoreLayoutListContainer"] > div > a+div'
  );
  customLogger(itemElements);
  console.log(typeof itemElements);
  // Initialize an empty array to store the extracted objects
  const items = [];
  customLogger(currentHostname);

  //amazon
  if (currentHostname.includes("amazon")) {
    // Iterate over each item element
    itemElements.forEach((itemElement) => {
      // Extract name, price, and rating
      const nameElement = itemElement.querySelector("h2.a-size-mini > a");
      const name = nameElement ? nameElement.textContent.trim() : "N/A";

      const priceElement = itemElement.querySelector(
        "div.a-row.a-size-base > div.a-row > a > span.a-price > span.a-offscreen"
      );
      const price = priceElement ? priceElement.textContent.trim() : "N/A";

      const ratingElement = itemElement.querySelector(
        "div.a-row.a-size-small > span > span"
      );
      const rating = ratingElement ? ratingElement.textContent.trim() : "N/A";

      // Create an object with the extracted details and push it to the items array
      items.push({ name, price, rating });
    });
  } else if (currentHostname.includes("doordash")) {
    customLogger("inside else");
    itemElements.forEach((itemElement) => {
      // Extract name, price, and rating
      // customLogger("inside foreach");
      const nameElement = itemElement.querySelector(
        'div > [data-telemetry-id="store.name"]'
      );
      // customLogger(nameElement);
      const name = nameElement ? nameElement.textContent.trim() : "N/A";
      // customLogger(name);
      const timeElement = itemElement.querySelector(
        "div.InlineChildren__StyledInlineChildren-sc-6r2tfo-0 > div+span+div+span+div"
      );
      const deliveryTime = timeElement ? timeElement.textContent.trim() : "N/A";

      const ratingElement = itemElement.querySelector(
        "div.InlineChildren__StyledInlineChildren-sc-6r2tfo-0 > div > span"
      );
      const rating = ratingElement ? ratingElement.textContent.trim() : "N/A";

      // Create an object with the extracted details and push it to the items array
      if (deliveryTime != "Closed") {
        items.push({ name, deliveryTime, rating });
      }
    });
  }
  // customLogger("inside the getItems function");
  customLogger(items);

  // Return the array of extracted objects
  return items;
}

function processScreen() {
  customLogger("Inside function: processScreen");
  sendMessageToBackground({ action: "processScreen" }).then((resp) => {
    customLogger("Received resp");
    textToSpeech(resp.speechText);
  });
}

function textToSpeech(message) {
  customLogger("Inside function: textToSpeech");
  customLogger(message);

  if ("speechSynthesis" in window) {
    const instructionsObj = new SpeechSynthesisUtterance(message);
    instructionsObj.lang = "en-US";
    instructionsObj.volume = 1;
    instructionsObj.rate = 1;

    window.speechSynthesis.speak(instructionsObj);
  }
}

function customLogger(result) {
  chrome.runtime.sendMessage({
    action: "consolelog",
    message: result,
  });
}

function customError(result) {
  chrome.runtime.sendMessage({
    action: "consoleerror",
    message: result,
  });
}

function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, function (response) {
      resolve(response);
    });
  });
}

function clickOnProduct(productName) {
  const timestamp0 = Date.now();
  customLogger("TS0");
  customLogger(timestamp0);

  customLogger("Inside function: clickOnProduct");

  const goodlinks = document.querySelectorAll(
    "a.a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal"
  );

  customLogger(goodlinks);

  for (const link of goodlinks) {
    const productText = link.textContent.trim();
    customLogger(productText);

    if (productText.toLowerCase().includes(productName.toLowerCase())) {
      customLogger("Product found");
      customLogger(link.getAttribute("href"));
      link.click();
      break;
    }
  }
  const message = "You are now viewing the product page for " + productName;
  textToSpeech(message);
}

function clickOnAddCart(audioText) {
  customLogger("Inside function: clickOnAddCart");
  customLogger(currentHostname);
  //amazon
  if (currentHostname.includes("amazon")) {
    const addToCartButtons = document.querySelectorAll(
      '#add-to-cart-button, input.a-button-input[type="submit"][aria-labelledby="freshAddToCartButton-announce"]'
    );
    customLogger(addToCartButtons);
    for (const submitButton of addToCartButtons) {
      submitButton.click();
      break;
    }
    const element = document.querySelector(
      'input.a-button-input[type="submit"][aria-labelledby="attachSiNoCoverage-announce"]'
    );

    if (element) {
      console.log("Warranty banner is present on the webpage.");
      textToSpeech("Would you like to add warranty to your product?");
    } else {
      console.log("Warranty banner is not present on the webpage.");
      textToSpeech("Would you like to proceed to checkout?");
    }
  } else if(currentHostname.includes("doordash")) {  //doordash

        var words = audioText.split(' ');
        customLogger(words);
        var item = 'huhaa';
        words = words.filter((word)=> {
         return (word != 'Delta' && word!= 'cart' && word != 'add' && word != 'to')  
        });
        customLogger(words);
        item = item.toLowerCase();
        customLogger("item");
        customLogger(item);
        customLogger(typeof item);
        var menuItems = document.querySelectorAll('[data-anchor-id="MenuItem"]');
        customLogger(menuItems.length);
        for(var menuItem of menuItems){
          customLogger("inside for");
          var nameElement = menuItem.querySelector(
            '[data-telemetry-id="storeMenuItem.title"]'
          );
          var name = nameElement ? nameElement.textContent : "N/A";
          name = name.toLowerCase();
          customLogger(name);
          var matchFlag=1;
          words.forEach((word)=> {
            if(name.toLowerCase().match(word.toLowerCase()) === null)
              matchFlag=0;
          });
          if(matchFlag) {
            customLogger("Match found");
            const addToCartButton = menuItem.querySelector('[aria-label="Add item to cart"]');
            addToCartButton.click();
            textToSpeech(`Adding ${name} to cart`);
            setTimeout(()=> {

              const addToCart = document.querySelector('#prism-modal-footer [data-anchor-id="AddToCartButton"]');
              addToCart.click();
              const addToCartSpan = addToCart.querySelector('span.styles__TextElement-sc-3qedjx-0');
              const addToCartText = addToCartSpan.textContent.trim();
              customLogger(addToCartText);
              if(addToCartText.match("Required"))
                makeRequiredSelections();

            },3000);
            break;
          }
        }

    
  }

  customLogger("Exiting function: clickOnAddCart");
}

async function makeRequiredSelections() {
  textToSpeech("make add ons to your order");
  const sideOptions = querySelectorAll('div.Stack__StyledStack-sc-vzfcgq-0');
  sideOptions.forEach((option)=> {
    const optionName = option.querySelector('h3.styles__TextElement-sc-3qedjx-0').textContent.trim();
    textToSpeech(optionName);
  });
}


function clickOnNoWarranty() {
  customLogger("Inside function: clickOnNoWarranty");
  const element = document.querySelector(
    'input.a-button-input[type="submit"][aria-labelledby="attachSiNoCoverage-announce"]'
  );
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

  //amazon
  if(currentHostname.includes("amazon")) {
    const proceedToCheckoutButtons = document.querySelectorAll(
      'input[name="proceedToRetailCheckout"][data-feature-id="proceed-to-checkout-action"]'
    );
  
    customLogger(proceedToCheckoutButtons);
    for (const submitButton of proceedToCheckoutButtons) {
      submitButton.click();
      break;
    }
  } else if(currentHostname.includes("doordash")) {
      const proceedToCheckoutButtons = document.querySelector('[data-testid="OrderCartIconButton"]');
      proceedToCheckoutButtons.click();
      setTimeout(()=>{
        const checkOutButton = document.querySelector('[data-anchor-id="CheckoutButton"]');
        checkOutButton.click();
        setTimeout(()=>{
          const placeOrderButton = document.querySelector('[data-anchor-id="PlaceOrderButton"]');
          placeOrderButton.click();
        });
      },1000);
  }
  
  customLogger("Exiting function: clickOnProceedToCheckout");
}

function getTopReview() {
  customLogger("Inside function: getTopReview");
  const parentElement = document.getElementById("cm-cr-dp-review-list");
  const firstChildElement = parentElement.firstElementChild;

  customLogger(firstChildElement);

  const starRatingElement = firstChildElement.querySelector(
    "[data-hook='review-star-rating']"
  );
  const starRating = starRatingElement
    .querySelector(".a-icon-alt")
    .textContent.trim();

  const profileNameElement = firstChildElement.querySelector(
    "[data-hook='genome-widget'] .a-profile-name"
  );
  const profileName = profileNameElement.textContent.trim();

  const reviewDateElement = firstChildElement.querySelector(
    "[data-hook='review-date']"
  );
  const reviewDateText = reviewDateElement.textContent.trim();

  const reviewContentElement = firstChildElement.querySelector(
    "[data-hook='review-title']"
  );
  const reviewContent = reviewContentElement.textContent.trim();
  const reviewTitle = reviewContent
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .join("\n");
  const [reviewRating, reviewTitleText] = reviewTitle.split("\n");

  const message =
    profileName +
    " " +
    reviewDateText +
    ". The rating is " +
    reviewRating +
    " and the review title is " +
    reviewTitleText;
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

  var visitCountKey = "visitCount_" + currentHostname;

  // Check if the website has been visited before
  if (localStorage.getItem(visitCountKey)) {
    // If yes, increment the count
    var count = parseInt(localStorage.getItem(visitCountKey));
    count++;
    localStorage.setItem(visitCountKey, count);
  } else {
    // If no, set the count to 1
    localStorage.setItem(visitCountKey, 1);
  }

  customLogger(
    "You have visited " +
      currentHostname +
      " " +
      localStorage.getItem(visitCountKey) +
      " times."
  );
}
