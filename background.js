chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  const { action, message } = request;

  if (action === "consolelog" || action === "consoleerror") {
    console[action === "consolelog" ? "log" : "error"](message);
  }

  if (action == "getCurrentTabURL") {
    console.log("Inside background getCurrentTabURL");

    const getURL = async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTabURL = tabs[0].url;
        sendResponse({ currentTabURL });
      } catch (error) {
        console.error('Error:', error);
      }
    }
    getURL();
    return true;
  }

  if (request.action === 'processPrice') {
    console.log("Inside background processPrice");
  
    const processPrice = async () => {
      try {
        const speechResult = request.speechResult;
        const itemsList = request.itemsArray;
  
        // Call the second API directly without capturing the screenshot
        const body = JSON.stringify({ speech_prompt: speechResult, itemsArray: itemsList });
        const data = await fetch('https://still-lowlands-42660-f33a7feb5e1b.herokuapp.com/price', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body 
        }).then(response => response.json());
        
        const speechText = data.result;
  
        // Send the response only after the API call is successful
        sendResponse({ speechText });
      } catch (error) {
        console.error('Error:', error);
        // Handle errors appropriately, e.g., send an error response
      }
    };
  
    processPrice();
    return true;
  }

if (request.action === 'processScreen') {
  console.log("Inside backgroundL ProcessScreen");


chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (imageUrl) => {
  try {
    if (chrome.runtime.lastError) {
      throw new Error('Error capturing screenshot: ' + chrome.runtime.lastError.message);
    }

    // Convert the data URL to a Blob and upload to ImgBB
    const blob = await fetch(imageUrl).then(res => res.blob());
    const formData = new FormData();
    formData.append('image', blob);
    formData.append('key', '7f6e15ba900a9760626037ab4946451c'); // Replace with your ImgBB API key
    const uploadedImageUrl = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData }).then(response => response.json()).then(result => result.data.url);

    // Call the second API with the uploaded image URL
    const body = JSON.stringify({ image_url: uploadedImageUrl, speech_prompt: ["delta what is on my screen?"] });
    const data = await fetch('https://still-lowlands-42660-f33a7feb5e1b.herokuapp.com/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).then(response => response.json());
    const speechText = data.result;

    // Send the response only after all API calls are successful
    sendResponse({ speechText });
  } catch (error) {
    console.error('Error:', error);
    // Handle errors appropriately, e.g., send an error response
  }
});
return true;
}
});
