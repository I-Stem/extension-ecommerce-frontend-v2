 
 chrome.runtime.sendMessage({
            action: "consolelog",
            message: "Links"
        });
        
 //const productName = window.myVariable;  
 //const finalProductName = productName.substring(15, 40);
 const finalProductName = "2020 MacBook Air Laptop";
 
 chrome.runtime.sendMessage({
            action: "consolelog",
            message: finalProductName
        });
 
 chrome.runtime.sendMessage({
            action: "consolelog",
            message: document.documentElement.outerHTML
        });
 

const goodlinks = document.querySelectorAll('a.a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal');
//LAKI const goodlinks = document.querySelectorAll('a.a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal');

/* LAKI for (const element of goodlinks) {
  const link = element.href;
  const text = element.querySelector("span").textContent;
  
  chrome.runtime.sendMessage({
            action: "consolelog",
            message: link
   });
   
     chrome.runtime.sendMessage({
            action: "consolelog",
            message: text
   });

}*/

//chrome.runtime.sendMessage({
//            action: "consolelog",
//            message: goodlinks[0]
//   });

// LAKI goodlinks[0].click();

   chrome.runtime.sendMessage({
            action: "consolelog",
            message: goodlinks
        });

 for (const link of goodlinks) {

    /*chrome.runtime.sendMessage({
            action: "consolelog",
            message: "Text"
        });
    
      chrome.runtime.sendMessage({
            action: "consolelog",
            message: link.textContent
        });
        
       chrome.runtime.sendMessage({
            action: "consolelog",
            message: link.textContent.trim()
        });*/
        
        const productText = link.textContent.trim();

    if (productText.toLowerCase().includes(finalProductName.toLowerCase())) {
        chrome.runtime.sendMessage({
            action: "consolelog",
            message: "Found"
        });
        
        chrome.runtime.sendMessage({
            action: "consolelog",
            message: link.getAttribute('href')
        });
        
        link.click();
    }
  }


  const timestamp = Date.now();
  chrome.runtime.sendMessage({
      action: "consolelog",
      message: timestamp
  }); 


  function delay(milliseconds, callback) {
    setTimeout(callback, milliseconds);
  }
  
  // Usage example:
  delay(5000, function() {
    chrome.runtime.sendMessage({
        action: "consolelog",
        message: 'This message is shown after a 2-second delay'
    }); 
  });

const submitButtons = document.querySelectorAll('#add-to-cart-button');
// const submitButtons = document.querySelectorAll('#buy-now-button');

chrome.runtime.sendMessage({
    action: "consolelog",
    message: submitButtons
}); 

for (const submitButton of submitButtons) {
    submitButton.click();
}

const timestamp1 = Date.now();
chrome.runtime.sendMessage({
    action: "consolelog",
    message: timestamp1
}); 
  
  

  
//   const timestamp1 = Date.now();
//   chrome.runtime.sendMessage({
//       action: "consolelog",
//       message: timestamp1
//   });

//   const submitButtons = document.querySelectorAll('#add-to-cart-button');
// for (const submitButton of submitButtons) {
//     submitButton.click();
// }
  
// setTimeout(function() {
//   chrome.runtime.sendMessage({
//             action: "consolelog",
//             message: "Before submit XXXXXXX"
//         });  
// }, 5000);
  
// chrome.runtime.sendMessage({
//             action: "consolelog",
//             message: "Before submit"
//         });  
// setTimeout(function(){
// chrome.runtime.sendMessage({
//             action: "consolelog",
//             message: document
//         });
        
//         chrome.runtime.sendMessage({
//             action: "consolelog",
//             message: "SUBMIT"
//         });

// const submitButtons = document.querySelectorAll('#add-to-cart-button');
// for (const submitButton of submitButtons) {
//     submitButton.click();
// }


// }
// ,5000);

