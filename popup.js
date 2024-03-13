// import textToSpeech from "./content";

document.getElementById('start-recognition').addEventListener('click', async () => {
    // textToSpeech("Hi, I am Delta, how may I help you?");
    const activeTab = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });
    const activeTabId = activeTab[0].id;
    if (!window.myExtensionContentScriptInjected) {
        chrome.scripting.executeScript({
            target: {
                tabId: activeTabId
            },
            files: ["content.js"]
        });
        window.myExtensionContentScriptInjected = true; // Mark as injected
    }
});

function injectLink(speechText) {
    
    const activeTab = chrome.tabs.query({
        active: true,
        currentWindow: true
    });
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const activeTabId = tabs[0].id;
    chrome.scripting.executeScript({
        target: {
            tabId: activeTabId
        },
        files: ["links.js"]
        
    });
});
}
