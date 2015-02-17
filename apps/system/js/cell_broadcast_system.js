'use strict';
/* global CarrierInfoNotifier */
/* global MobileOperator */

var CellBroadcastSystem = {

  _settingsDisabled: [],
  _settingsKey: 'ril.cellbroadcast.disabled',

  init: function cbs_init() {
    var self = this;
    if (navigator && navigator.mozCellBroadcast) {
      navigator.mozCellBroadcast.onreceived = this.show.bind(this);
    }

    var defaultSetting = [false, false];
    SettingsCache.observe(this._settingsKey, defaultSetting,
      function onCellbroadcastDisabledChanged(value) {
        self._settingsDisabled = value;

        if (self._hasCBSDisabled()) {
          var evt = new CustomEvent('cellbroadcastmsgchanged', { detail: null });
          window.dispatchEvent(evt);
        }
      });
  },

  show: function cbs_show(event) {
    // XXX: check bug-926169
    // this is used to keep all tests passing while introducing multi-sim APIs
    var msg = event.message;
    var serviceId = msg.serviceId || 0;
    var conn = window.navigator.mozMobileConnections[serviceId];

    if (conn &&
        conn.voice.network.mcc === MobileOperator.BRAZIL_MCC &&
        msg.messageId === MobileOperator.BRAZIL_CELLBROADCAST_CHANNEL) {
      var evt = new CustomEvent('cellbroadcastmsgchanged',
        { detail: msg.body });
      window.dispatchEvent(evt);
      return;
    }

    var body = msg.body;

    // XXX: 'undefined' test until bug-1021177 lands
    if (msg.etws && (!body || (body == 'undefined'))) {
      body = navigator.mozL10n.get('cb-etws-warningType-' +
        (msg.etws.warningType ? msg.etws.warningType : 'other'));
    }

    CarrierInfoNotifier.show(body,
      navigator.mozL10n.get('cb-channel', { channel: msg.messageId }));
  },

  _hasCBSDisabled: function cbs__hasCBSDisabled() {
    var index =
      this._settingsDisabled.findIndex(disabled => (disabled === true));
    return (index >= 0);
  }
};

CellBroadcastSystem.init();
