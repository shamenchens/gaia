'use strict';

var CellBroadcastSystem = {

  _settingsDisabled: null,
  _settingsKey: 'ril.cellbroadcast.disabled',

  init: function cbs_init() {
    var self = this;
    if (navigator && navigator.mozCellBroadcast) {
      navigator.mozCellBroadcast.onreceived = this.show.bind(this);
    }

    var settings = window.navigator.mozSettings;
    var req = settings.createLock().get(this._settingsKey);
    req.onsuccess = function() {
      self._settingsDisabled = req.result[self._settingsKey];
    };

    settings.addObserver(this._settingsKey,
                         this.settingsChangedHandler.bind(this));
  },

  settingsChangedHandler: function cbs_settingsChangedHandler(event) {
    this._settingsDisabled = event.settingValue;

    if (this._settingsDisabled) {
      var evt = new CustomEvent('cellbroadcastmsgchanged', { detail: null });
      window.dispatchEvent(evt);
    }
  },

  show: function cbs_show(event) {

    console.log('@@ [CBS] show()');
    // XXX: check bug-926169
    // this is used to keep all tests passing while introducing multi-sim APIs
    var conn = window.navigator.mozMobileConnection ||
      window.navigator.mozMobileConnections &&
        window.navigator.mozMobileConnections[0];
    console.log('@@ [CBS] conn: ' + conn);

    var msg = event.message;
    console.log('@@ [CBS] message: ' + msg);
    console.log('@@ [CBS] message id: ' + msg.messageId);
    console.log('@@ [CBS] message body: ' + msg.body);
    console.log('@@ [CBS] message etws: ' + msg.etws);

    if (this._settingsDisabled) {
      console.log('@@ [CBS] CBS disabled: ' + this._settingsDisabled);
      return;
    }

    if (conn &&
        conn.voice.network.mcc === MobileOperator.BRAZIL_MCC &&
        msg.messageId === MobileOperator.BRAZIL_CELLBROADCAST_CHANNEL) {
      var evt = new CustomEvent('cellbroadcastmsgchanged',
        { detail: msg.body });
      window.dispatchEvent(evt);
      console.log('@@ [CBS] BRAZIL_MCC & BRAZIL_CELLBROADCAST_CHANNEL, cellbroadcastmsgchanged');
      return;
    }

    var body = msg.body;
    console.log('@@ [CBS] body: ' + body);

    // XXX: 'undefined' test until bug-1021177 lands
    if (msg.etws && (!body || (body == 'undefined'))) {
      body = navigator.mozL10n.get('cb-etws-warningType-' +
        (msg.etws.warningType ? msg.etws.warningType : 'other'));
      console.log('@@ [CBS]: XXX body: ' + body);
    }

    console.log('@@ [CBS] CarrierInfoNotifier.show: ' + body);
    CarrierInfoNotifier.show(body,
      navigator.mozL10n.get('cb-channel', { channel: msg.messageId }));
  }
};

CellBroadcastSystem.init();
