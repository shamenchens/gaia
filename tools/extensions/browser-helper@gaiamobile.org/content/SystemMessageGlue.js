/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
const Cm = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

function SystemMessageGlue() {
}

SystemMessageGlue.prototype = {
  openApp: function(aPageURL, aManifestURL, aType, aTarget, aShowApp,
                    aOnlyShowApp, aExtra) {
    let payload = { url: aPageURL,
                    manifestURL: aManifestURL,
                    isActivity: (aType == "activity"),
                    target: aTarget,
                    showApp: aShowApp,
                    onlyShowApp: aOnlyShowApp,
                    expectingSystemMessage: true,
                    extra: aExtra };

    // |SystemAppProxy| will queue "open-app" events for non-activity system
    // messages without actually sending them until the system app is ready.
    SystemAppProxy._sendCustomEvent("open-app", payload, (aType == "activity"));
  },

  classID: Components.ID("{2846f034-e614-11e3-93cd-74d02b97e723}"),

  QueryInterface: XPCOMUtils.generateQI([Ci.nsISystemMessageGlue])
};

let instance = null;
let newFactory = {
  createInstance: function(outer, iid) {
    if (outer)
     throw Components.results.NS_ERROR_NO_AGGREGATION;
    if (instance === null)
      instance = new SystemMessageGlue();
    instance.QueryInterface(iid);
    return instance.QueryInterface(iid);
  },
  lockFactory: function(aLock) {
     throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
  },
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIFactory])
};
let contract = '@mozilla.org/dom/messages/system-message-glue;1';
Cm.registerFactory(Components.ID('{2846f034-e614-11e3-93cd-74d02b97e723}'), '', contract, newFactory);
