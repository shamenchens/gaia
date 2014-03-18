'use strict';

(function() {
  function init() {
    var appList = document.getElementById('app_list');

    AppList.init(function() {
      var linkList = document.createElement('ul');
      linkList.id = 'links';

      AppList.getAppEntries().forEach(function(entry) {
        linkList.appendChild(createLinkNode(entry));
      });

      document.getElementById('app_list_container').appendChild(linkList);
    });

    document.addEventListener('visibilitychange', function(evt) {
      if(document.visibilityState == 'visible') {
        appList.style.display = 'none';
      }
    });

    document.addEventListener('contextmenu', function(evt) {
      evt.preventDefault();
    });

    document.getElementById('app_list_open_button').addEventListener('click',
      function() {
        appList.style.display = 'block';
      }
    );

    document.getElementById('app_list_close_button').addEventListener('click',
      function() {
        appList.style.display = 'none';
      }
    );
  }

  function createLinkNode(entry) {
    var li = document.createElement('li');
    var link = document.createElement('a');
    var imgIcon = new Image();

    imgIcon.className = 'icon';
    imgIcon.src = '/style/images/default.png';
    link.href = entry.origin;
    link.className = 'app_link';
    link.dataset.origin = entry.origin;
    link.dataset.entry_point = entry.entry_point;
    link.appendChild(imgIcon);
    link.appendChild(document.createTextNode(entry.name));
    link.addEventListener('click', iconTapHandler);
    li.appendChild(link);

    AppList.getIconURL(entry.origin, entry.entry_point, function(url) {
      if (url) {
        imgIcon.src = url;
      }
    });

    return li;
  }

  function iconTapHandler(evt) {
    evt.preventDefault();
    AppList.launch(this.dataset.origin, this.dataset.entry_point);
  }

  window.addEventListener('load', init);
})();
