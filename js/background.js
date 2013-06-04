var gdoc;

// default note settings
var originalNoteSettings = {
	notecolor: '#ffffcc',
	textcolor: '#333333',
	font: 'Helvetica,\'Helvetica Nueue\'',
	fontsize: 16,
	textwrap: '' // textwrap-off
};
var defaultNoteSettings = JSON.parse(getItem('note-defaultsettings')) || originalNoteSettings;

function setDefaultNoteSettings(settings) {
	defaultNoteSettings = settings;
	setItem('note-defaultsettings', JSON.stringify(settings));
}

function setItem(name, value) {
	localStorage.setItem(name, value);
}

function getItem(name) {
	return localStorage.getItem(name);
}

function getItemByKey(i) {
	return localStorage.key(i);
}

function removeItem(name) {
	localStorage.removeItem(name);
}

function stringifiedLS() {
	return JSON.stringify(localStorage);
}

function getLSLength() {
	return localStorage.length;
}

function importData(s) {
	var j = JSON.parse(s);
	
	$.each(j, function(i, n) {
		setItem(i, n);
	});
}

function createPanel(tabId) {
	if (getItem('note-popup') == 'true') {
		chrome.windows.create({
			url: '/main.html#pop',
			type: 'panel',
			focused: true,
			width: 335,
			height: 430
		}, function(window) {
			if (tabId > 0) {
				chrome.tabs.remove(tabId);
			}
		});
	} else if (tabId == 0) {
		chrome.tabs.create({
			url: '/main.html'
		});
	}
}

function setLastUpdateTime() {
	setItem('lastUpdateTime', +new Date());
}

function clearLastUpdateTime() {
	setItem('lastUpdateTime', 0);
}

setInterval(function() {
	sync();
}, SYNC_INTERVAL);

function updateStickyTab() {
	chrome.windows.getAll({'populate': true}, function(windows) {
		var openWindow = true;
		var counter = 0;
		for (var i = 0; i < windows.length; i++) {
			var tabs = windows[i].tabs;
			for (var j = 0; j < tabs.length; j++) {
				var tab = tabs[j];

				if (tab.url.indexOf(chrome.extension.getURL('')) != -1) {
					counter++;
					openWindow = false;
					if (counter == 1) {
						chrome.tabs.update(tab.id, { 'active': true }, function(tab) {});
					} else {
						chrome.tabs.remove(tab.id);
					}
				}
			}
		}
		if (openWindow) {
			createPanel(0);
		}
	});
}
