
// The AudibleWindows class has dictionary/object that keeps track of the currently audible windows. 
// Each key in the object is a window ID and its value is a set of ID's of the currently audible tabs.
// As long as the size of a set is greater than zero, then its corresponding window is considered audible.
// Otherwise, the window is considered not audible and no icon is displayed on the window title.

class AudibleWindows{
    
    audibleWindows = Object();
    audibilityFilter = {properties: ["audible"]}  // filer is used to invoke the listener only for the specified 'audible' property
    
    constructor(){
        // in callbacks, the 'this' keyword is bound to the calling/higher-order function context.
        // so adding a listener normally would have 'this' in the callback bound to the Window object, not the class instance.
        // to get around it, we explicitly bind the callback function to the current context i.e this object
        // where bellow, bind() returns a new function with a new context and, those are passed on immediately as callbacks.
        browser.tabs.onUpdated.addListener(this.handleUpdated.bind(this), this.audibilityFilter);
        browser.tabs.onRemoved.addListener(this.handleRemoved.bind(this));
        browser.tabs.onDetached.addListener(this.handleDetached.bind(this));
    };

    removeAudible(tabId, windowId){
        console.log(this.audibleWindows);
        console.log("removing")
        console.log(windowId)
        console.log(tabId)
        this.audibleWindows[windowId].delete(tabId);
        if (this.audibleWindows[windowId].size == 0){            // if the window has no other audible tabs
            delete this.audibleWindows[windowId]                 // then remove window from audibleWindows
            browser.windows.update(                              // and remove speaker icon from the window title
                windowId,
                {titlePreface: ""}
            );
        }
    };
    
    handleUpdated(tabId, changeInfo, tabInfo) {
        console.log("updating")
        console.log(this.audibleWindows)
        let WID = tabInfo.windowId;
        if (changeInfo.audible){                                // if the detected change was a tab becoming audible
            if (!this.audibleWindows.hasOwnProperty(WID)){      // then check if its corresponding window exists in audibleWindows
                this.audibleWindows[WID] = new Set([tabId]);    // if not then add the window to the list and add the audible tab to it
                console.log("created audible window/tab")
                console.log(this.audibleWindows)
            }
            else{                                               // but if the window exists then just add the tab to it
                this.audibleWindows[WID].add(tabId);
            }
            browser.windows.update(                             // and update the window title to indicate that it is audible
                WID,
                {titlePreface: "🔊 "}
            );
        }
        else{                                                   // if the detected change was a tab becoming inaudible 
            this.removeAudible(tabId, WID);                     // then remove the tab and the window if it has no other tabs
        }
  }
  
    handleRemoved(tabId, removeInfo) {                          // handle the case of tab removal as opposed to audio being paused
        console.log("removed tab")
        let WID = removeInfo.windowId;
        if (removeInfo.isWindowClosing){                        // if window is closing, just remove it from audibleWindows 
            delete this.audibleWindows[WID]; 
        }
        else{                                                   // but if window is not closing, again remove tab/window
            this.removeAudible(tabId, WID);
        }  
  }
    
    handleDetached(tabId, detachInfo) {                         // only need to deal with the old window. The new window is taken care of by the onUpdated callback
        console.log("detached tab")
        let WID = detachInfo.oldWindowId;
        if (this.audibleWindows.hasOwnProperty(WID)){
            this.removeAudible(tabId, WID)
        }
    }
}
  
new AudibleWindows()



