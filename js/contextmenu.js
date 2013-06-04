/** NOTE FUNCTIONS **/

var TOP = 0;
var LEFT = 0;

function noteMe(title, text) {
	
	var date = new Date();

	var data = {
		id		: +date,
		top 		: TOP + 'px',
		left		: LEFT + 'px',
		title		: title,
		text		: text,
		notecolor	: '#ffc',
		font		: 'Helvetica,\'Helvetica Nueue\'',
		fontsize	: 16,
		width		: 200,
		height		: 188,
		textheight	: 140,
		collapse	: '',
		textwrap	: '',
		order		: 9999,
		lastsave	: +date,
		star		: '',
		lock		: ''
	}
	
	var s = createNote(data);
	saveNote(s.attr('id'));
	
	chrome.windows.getAll({'populate': true}, function(arr) {
		for (var i = 0; i < arr.length; i++) {
			var tabs = arr[i].tabs;
			for (var j = 0; j < tabs.length; j++) {
				var tab = tabs[j];
				
				if (tab.url.indexOf(chrome.extension.getURL('')) != -1) {
					chrome.tabs.reload(tab.id);
					chrome.tabs.update(tab.id, { 'active': true }, function(tab) {});
				}
			}
		}
	});
	
}
function pageClick(info, tab) {
	noteMe(tab.title, tab.url);
}
function selectionClick(info, tab) {
	noteMe('Selection from ' + tab.title, info.selectionText.replace(/\n/g, '<br />'));
}
function linkClick(info, tab) {
	noteMe('Link from ' + tab.title, info.linkUrl);
}
function imageClick(info, tab) {
	noteMe('Image from ' + tab.title, '<img src="' + info.srcUrl + '" />');
}

/** CONTEXT MENUS **/

if (localStorage['note-context-menu'] == 'true') {
	var contexts = [ 'all', 'page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio' ];
	var parent = chrome.contextMenus.create({
		'title'		: 'Sticky Notes',
		'contexts'	: contexts
	});
	
	chrome.contextMenus.create({
		'title': 'Open Sticky Notes',
		'parentId': parent,
		'contexts': contexts,
		'onclick': function(info, tab) {
			updateStickyTab();
		}
	});
	chrome.contextMenus.create({
		'type': 'separator',
		'parentId': parent,
		'contexts': [ 'all' ]
	});
	
	chrome.contextMenus.create({
		'title'		: 'Save page',
		'parentId'	: parent,
		'contexts'	: [ 'all' ],
		'onclick'	: pageClick
	});
	chrome.contextMenus.create({
		'title'		: 'Save selection',
		'parentId'	: parent,
		'contexts'	: [ 'selection' ],
		'onclick'	: selectionClick
	});
	chrome.contextMenus.create({
		'title'		: 'Save link',
		'parentId'	: parent,
		'contexts'	: [ 'link' ],
		'onclick'	: linkClick
	});
	chrome.contextMenus.create({
		'title': 'Save image',
		'parentId': parent,
		'contexts': [ 'image' ],
		'onclick': imageClick
	});
}