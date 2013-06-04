window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
var fs = null;

jQuery.expr[':'].Contains = function(a,i,m){
    return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
};

$.fn.selectRange = function(start, end) {
	return this.each(function() {
		if(this.setSelectionRange) {
			this.focus();
			this.setSelectionRange(start, end);
		} else if(this.createTextRange) {
			var range = this.createTextRange();
			range.collapse(true);
			range.moveEnd('character', end);
			range.moveStart('character', start);
			range.select();
		}
	});
};

var version = '1.9';
var TOP = 0;
var LEFT = 0;

$(document).ready(function() {

	chrome.windows.getCurrent(function(window) {
		if (window.type == 'popup' || window.type == 'panel') {
			$('body').addClass('popout');
			$('#add-sticky_button').parent('li').tooltip({
				placement: 'bottom',
				title: 'New Note',
				trigger: 'hover'
			});
		}
	});
	
	$('.modal, .modal-body, .dropdown-menu').mousewheel(function(event, delta) {
		this.scrollTop -= (delta * 30);
		event.preventDefault();
	});
	
	$('a.dropdown-toggle[data-toggle="dropdown"]').bind('mousedown', function(e) {
		e.preventDefault();
		return false;
	});

	if (bgPage.getItem('note-cloud-sync') == 'true' && bgPage.oauth.hasToken()) {
		$('#sync-now').parent().removeClass('disabled');
	}
	
	if (bgPage.getItem('top-bar-hide') == 'true') {
		$('html').addClass('top-bar-hide');
	}
	
	$('[rel=tooltip]').tooltip({
		placement: 'bottom'
	});
	
	/* TOP BAR COLOR */
	
	if (bgPage.getItem('top-bar-color') != undefined) {
		$('.navbar-fixed-top').addClass(bgPage.getItem('top-bar-color'));
	}
	
	/* WHAT'S NEW */
	
	$('#whats-new-dialog').modal({
		show: false
	}).on('hidden', function() {
		bgPage.setItem('whatsnew-v' + version, 'clicked');
	});
	
	if (bgPage.getItem('whatsnew-v' + version) == undefined || bgPage.getItem('whatsnew-v' + version) != 'clicked') {
		$('#whats-new-dialog').modal('show');
	}
	
	$('body').css({
		'background-image': bgPage.getItem('body-sticky')
	});
	
	$('.navbar, .subnav, .modal').bind('dblclick', function(event) {
		event.stopPropagation();
	});
	
	if (bgPage.getItem('note-view')) {
		if (bgPage.getItem('note-view') == 'single') {
			$('#free-view, #grid-view').removeClass('set');
			$('#single-view').addClass('set');
			toggleSortable(false);
			toggleSingleView(true);
		} else if (bgPage.getItem('note-view') == 'grid') {
			$('#free-view, #single-view').removeClass('set');
			$('#grid-view').addClass('set');
			toggleSortable(true);
			toggleSingleView(false);
		} else {
			$('#free-view').addClass('set');
			$('#grid-view, #single-view').removeClass('set');
			toggleSortable(false);
			toggleSingleView(false);
		}
	}
	
	calcNoteCount();
	refreshNoteList();
	refreshTagList();
	
	getActiveTags();
	
	$('#note-filter-container').click(function(event) {
		event.stopPropagation();
	});
	
	$('#note-list li:not(.nav-header)').live({
		mousedown: function(e) {
			e.preventDefault();
			return false;
		},
		click:
			function() {
				var id = $(this).attr('class');
				bringNoteToFront($(this).attr('class'));
				if ($('#' + id).hasClass('collapse')) {
					$('#' + id + ' .iconic.minus').click();
				}
				$('#' + id + ' div.sticky-content').focus();
				if (parseInt($('#' + id).css('top')) < 0) {
					$('#' + id).css('top', $('body').css('margin-top'));
				}
				if (parseInt($('#' + id).css('left')) < 0) {
					$('#' + id).css('left', '10px');
				}
				$('#' + id).removeClass('specialhover');
			},
		mouseenter:
			function() {
				var id = $(this).attr('class');
				bringNoteToFront(id);
				$('#' + id).addClass('specialhover');
				$.scrollTo('#' + id, 200, {offset:{top:-40,left:0}});
			},
		mouseleave:
			function() {
				var id = $(this).attr('class');
				$('#' + id).removeClass('specialhover');
			}
		}
	);
	
	$('#add-sticky, #add-sticky_button').click(function() {
		$('html').dblclick();
	});
	
	$('#free-view').click(function() {
		$(this).addClass('set');
		$('#grid-view, #single-view').removeClass('set');
		bgPage.setItem('note-view', 'free');
		toggleSortable(false);
		toggleSingleView(false);
	});
	$('#grid-view').click(function() {
		$(this).addClass('set');
		$('#free-view, #single-view').removeClass('set');
		bgPage.setItem('note-view', 'grid');
		toggleSortable(true);
		toggleSingleView(false);
	});
	$('#single-view').click(function() {
		$(this).addClass('set');
		$('#free-view, #grid-view').removeClass('set');
		bgPage.setItem('note-view', 'single');
		toggleSortable(false);
		toggleSingleView(true);
	});
	
	$('#delete-all').click(function() {
		$('#delete-all-dialog').modal('show')
	});
	
	$('#clear-search').hide().click(function() {
		$('input#note-filter').val('').change();
		$(this).hide();
	});
	
	$('#starred').click(function() {
		if ($(this).parent().is('.active')) {
			$('body').removeClass('starfilter');
			$(this).parent().removeClass('active');
		} else {
			$('body').addClass('starfilter');
			$(this).parent().addClass('active');
		}
	});
	
	$('#save-as-default').click(function() {
		$('#options-dialog').modal('hide');
		
		var id = $('#options-dialog').attr('rel');
		var $note = $('#' + id);
		
		var notesettings = {
			notecolor: $note.css('background-color'),
			textcolor: $note.css('color'),
			font: $note.find('.sticky-content').css('font-family'),
			fontsize: parseInt($note.find('.sticky-content').css('font-size')),
			textwrap: $note.hasClass('textwrap-off') ? 'textwrap-off' : ''
		};
		
		//console.log(notesettings);
		bgPage.setDefaultNoteSettings(notesettings);
		
		$('#save-as-default-dialog').modal('show');
		
		return false;
	}).tooltip();
	
	/* DIALOGS */
	
	$('#delete-dialog .btn-danger').click(function() {
		deleteNote($('#delete-dialog').attr('rel'));
	});
	
	$('#delete-all-dialog .btn-danger').click(function() {
		$('.sticky').each(function() {
			deleteNote($(this).attr('id'));
		});
	});
	
	/* OPTIONS */
	
	$('input#options-notetitle').bind('keyup change', function() {
		var $this = $(this), id = $(this).parents('#options-dialog').attr('rel');
		$('#' + id).children('h1.sticky-title').text($this.val());
		saveNote(id);
	});
	
	$('ul#options-notecolor li').click(function() {
		var $this = $(this), id = $(this).parents('#options-dialog').attr('rel');
		$this.addClass('selected').siblings().removeClass('selected');
		$('#' + id).css('backgroundColor', $this.css('background-color'));
		saveNote(id);
	});
	
	$('#cp-content #swatch span').live('click', function() {
		var id = $('#options-dialog').attr('rel'),
			color = $(this).css('background-color');
		$('input#notecolor').val(getHexForRgb(color)).css({ 'background-color' : color, 'color' : '#000' });
		$('#' + id).css('background-color', color);
		$('#' + id).css('color', '#000');
		saveNote(id);
	});
	
	$('input#notecolor').bind('change blur', function(e) {
		$(this).css('background-color', $(this).val());
		
		var id = $('#options-dialog').attr('rel');
		$('#' + id).css('background-color', $('input#notecolor').css('background-color'));
		saveNote(id);
	});
	
	$('#cpnote-btn, #cptext-btn').popover({
		animation: false,
		placement: 'right',
		trigger: 'manual',
		content: '<div id="cp-content"></div>'
	});
	$('#cpnote-btn').hover(function() {
		if (!$(this).hasClass('active')) {
			$(this).tooltip('show');
		}
	}, function() {
		$(this).tooltip('hide');
	}).click(function() {
		var $this = $(this);
		
		if ($this.hasClass('active')) {
			$this.removeClass('active').popover('hide');
		} else {
			$('.popover').remove();
			$('#cptext-btn').removeClass('active');
			$this.addClass('active').tooltip('hide').popover('show');
			
			$('.popover').before($('<div class="popover-backdrop" />').click(function() {
				$(this).remove();
				$this.popover('hide').removeClass('active');
			}).mousewheel(function(event, delta) {
				event.preventDefault();
			}));
		}
		
		$('#cp-content').append(
			'<div class="tabbable">' +
			'<ul class="nav nav-tabs">' +
			'<li class="active"><a href="#picker" data-toggle="tab">Picker</a></li>' +
			'<li><a href="#swatch" data-toggle="tab">Swatch</a></li>' + 
			'</ul>' +
			'<div class="tab-content">' +
			
			'<div class="tab-pane active" id="picker"></div>' +
			'<div class="tab-pane" id="swatch"></div>' +
			
			'</div>' +
			'</div>'
		);
		
		$('#cp-content a[data-toggle="tab"]').on('shown', function (e) {
			// fix position
			$('.popover').css('top', $this.offset().top - ($('.popover').height() / 2) + ($this.height() / 2));
		});
		
		if ($('#cp-content #picker').length > 0) {
			$('#cp-content #picker').farbtastic('input#notecolor');
		}
		
		var cpList = '<ul class="thumbnails">'
			+ '<li class="span1"><a href="#" class="thumbnail"><span class="default"></span></a></li>'
			+ '<li class="span1"><a href="#" class="thumbnail"><span class="red"></span></a></li>'
			+ '<li class="span1"><a href="#" class="thumbnail"><span class="orange"></span></a></li>'
			+ '<li class="span1"><a href="#" class="thumbnail"><span class="yellow"></span></a></li>'
			+ '<li class="span1"><a href="#" class="thumbnail"><span class="green"></span></a></li>'
			+ '<li class="span1"><a href="#" class="thumbnail"><span class="blue"></span></a></li>'
			+ '<li class="span1"><a href="#" class="thumbnail"><span class="purple"></span></a></li>'
			+ '<li class="span1"><a href="#" class="thumbnail"><span class="gray"></span></a></li>'
			+ '</ul>';
		$('#cp-content #swatch').append(cpList);
		
		$('.popover').css('top', $this.offset().top - ($('.popover').height() / 2) + ($this.height() / 2));
	});
	$('#cptext-btn').hover(function() {
		if (!$(this).hasClass('active')) {
			$(this).tooltip('show');
		}
	}, function() {
		$(this).tooltip('hide');
	}).click(function() {
		var $this = $(this);
		
		if ($this.hasClass('active')) {
			$this.removeClass('active').popover('hide');
		} else {
			$('.popover').remove();
			$('#cpnote-btn').removeClass('active');
			$this.addClass('active').tooltip('hide').popover('show');
			
			$('.popover').before($('<div class="popover-backdrop" />').click(function() {
				$(this).remove();
				$this.popover('hide').removeClass('active');
			}));
		}
		
		if ($('#cp-content').length > 0) {
			$('#cp-content').farbtastic('input#textcolor');
		}
		
		$('.popover').css('top', $this.offset().top - ($('.popover').height() / 2) + ($this.height() / 2));
		
		$('.popover .close').unbind('click').bind('click', function() {
			$this.removeClass('active').popover('hide');
		});
	});
	
	$('input#textcolor').bind('blur change', function() {
		$(this).css('background-color', $(this).val());
		
		var id = $('#options-dialog').attr('rel');
		$('#' + id).css('color', $('input#textcolor').css('background-color'));
		saveNote(id);
	});
	
	$('#options-fontface')
	/*
	.selectmenu({
		style	: 'dropdown',
		maxHeight: 250
	})
	*/
	.change(function() {
		var $this = $(this), id = $(this).parents('#options-dialog').attr('rel'), font = this.value;
		$('#' + id).find('.sticky-content').css('font-family', font);
		saveNote(id);
	});
	
	$('#options-fontsize').change(function() {
		var $this = $(this), id = $(this).parents('#options-dialog').attr('rel');
		$('#' + id).children('.sticky-content').css('font-size', $this.val() + 'px');
		saveNote(id);
	});
	
	$('#options-textwrap').click(function() {
		var $this = $(this), id = $(this).parents('#options-dialog').attr('rel');
		if ($this.is(':checked')) {
			$('#' + id).addClass('textwrap-off');
			saveNote(id);
		} else {
			$('#' + id).removeClass('textwrap-off');
			saveNote(id);
		}
	});
	
	/* RESTORE NOTE */
	
	refreshUndoDisplay();
	
	$('#undo').click(function() {
		restoreNote();
		bgPage.removeItem('note-backup-obj');
		refreshUndoDisplay();
	});
	$('#undo-close').click(function() {
		bgPage.removeItem('note-backup-obj');
		refreshUndoDisplay();
	});
	
	/* VISUAL CONTROLS */
	
	if (bgPage.getItem('note-visual-controls') && bgPage.getItem('note-visual-controls') == 'true') {
		$('body').addClass('show-controls');
	}
	
	/* POP OUT/IN */
	
	$('#pop-out').click(function() {
		chrome.tabs.getCurrent(function(tab) {
			bgPage.createPanel(tab.id);
		});
		
		return false;
	});
	
	$('.pop-in').click(function() {
		chrome.windows.getCurrent(function(window) {
			chrome.tabs.create({
				url: 'main.html'
			}, function() {
				chrome.windows.remove(window.id);
			});
		});
	});
	
	/* SYNC */
	
	$('#sync-now').click(function() {
		// TODO
		console.log('sync');
		bgPage.sync();
	});
});

function getHexForRgb(rgbString) {
	var parts = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/); // parts now should be ["rgb(0, 70, 255", "0", "70", "255"]

	if (parts[0] != null) {
		delete(parts[0]);
	}
	
	for (var i = 1; i <= 3; ++i) {
	    parts[i] = parseInt(parts[i]).toString(16);
	    if (parts[i].length == 1) parts[i] = '0' + parts[i];
	}
	var hexString = '#' + parts.join(''); // "0070ff"
	
	return hexString
}

function restoreNote() {
	if (bgPage.getItem('note-backup-obj') != undefined) {
		var s = createNote(JSON.parse(bgPage.getItem('note-backup-obj')));
		saveNote(s.attr('id'));
	}
}

function saveNoteKeystroke(id) {
	var sticky = $('#' + id);
	var obj = JSON.parse(bgPage.getItem('sticky-' + sticky.attr('id')));
	
	if (obj != null) {
		obj.text = sticky.find('.sticky-content').html();
	}
	
	bgPage.setItem('sticky-' + obj.id, JSON.stringify(obj));
	parseTags();
}

function deleteNotePrompt(id) {
	if (bgPage.getItem('delete-prompt-skip') != 'true') {
		$('#delete-dialog').attr('rel', id).modal('show');
	} else {
		deleteNote(id);
	}
}

function deleteNote(id) {
	// backup note
	if (bgPage.getItem('note-backup') == 'true') {
		bgPage.setItem('note-backup-obj', bgPage.getItem('sticky-' + id));
	}
	
	bgPage.removeItem('sticky-' + id);
	$('#' + id).fadeOut(200, function () {
		$(this).remove();
		calcNoteCount();
		refreshNoteList();
		refreshTagList();
	});
	
	refreshUndoDisplay();
	cloudSave();
}

function refreshUndoDisplay() {
	if (bgPage.getItem('note-backup') == 'true' && bgPage.getItem('note-backup-obj') != undefined) {
		$('#undo-container').css('display', 'block');
	} else {
		$('#undo-container').hide();
	}
}

function setActiveTags() {
	var tagArr = new Array();
	$('#tags .btn-group span:first-child').each(function() {
		tagArr.push($(this).html());
	});
	bgPage.setItem('note-activetags', tagArr);
	cloudSave();
}

function getActiveTags() {
	if (bgPage.getItem('note-activetags')) {
		var tagArr = bgPage.getItem('note-activetags').split(',');
		for (var i = 0; i < tagArr.length; i++) {
			$('#tag-list li a[data-name="' + tagArr[i] + '"]').click();
		}
	}
}

function errorHandler(e) {
	var msg = '';
	
	switch (e.code) {
		case FileError.QUOTA_EXCEEDED_ERR:
		msg = 'QUOTA_EXCEEDED_ERR';
		break;
	case FileError.NOT_FOUND_ERR:
		msg = 'NOT_FOUND_ERR';
		break;
	case FileError.SECURITY_ERR:
		msg = 'SECURITY_ERR';
		break;
	case FileError.INVALID_MODIFICATION_ERR:
		msg = 'INVALID_MODIFICATION_ERR';
		break;
	case FileError.INVALID_STATE_ERR:
		msg = 'INVALID_STATE_ERR';
		break;
	default:
		msg = 'Unknown Error';
		break;
	};
}

function onInitFs(fs) {
	fs.root.getFile('log.txt', {create: true}, function(fileEntry) {

		fileEntry.createWriter(function(fileWriter) {

			fileWriter.onwriteend = function(e) {
				// console.log('Write completed.');
			};

			fileWriter.onerror = function(e) {
				// console.log('Write failed: ' + e.toString());
			};

			// Create a new Blob and write it to log.txt.
			var bb = new window.WebKitBlobBuilder(); // BlobBuilder()
			bb.append('Lorem Ipsum');
			fileWriter.write(bb.getBlob('application/octet-stream')); // text/plain
			
		}, errorHandler);
		
		// console.log(fileEntry.toURL());
		window.location = fileEntry.toURL();

	}, errorHandler);

}

function saveStickyFile(id) {
	//window.requestFileSystem(window.TEMPORARY, 1024*1024, onInitFs, errorHandler);
}

function printSticky(id) {
	setTimeout(function() {
		var w = $('#printframe')[0].contentWindow;
		var $s = $('#' + id);
		
		var title = '<h1 style="font-family: Helvetica, Arial, sans-serif;">' + $s.find('.sticky-title').html() + '</h1>';
		var text = $s.find('.sticky-content').html();
		var font = $s.find('.sticky-content').css('font-family');
		
		$('body', w.document).html(title + text).css('font-family', font);
		
		w.print();
	}, 1);
}

var STICKIES = (function () {
	var initStickies = function initStickies() {
		$('html').live({
			//'click'		: function() { $('.context-menu').hide(); },
			'dblclick'	: function(event) {
					  	TOP = event.pageY;
						LEFT = event.pageX;
						createSticky();
						
						$('.sticky:last-child .sticky-content').focus();
					  }
		});
		
		initStickies = null;
	},
	openStickies = function openStickies() {
		initStickies && initStickies();
		
		for (var i = 0; i < bgPage.getLSLength(); i++) {
			if (bgPage.getItemByKey(i).startsWith('sticky-')) {
				createSticky(JSON.parse(bgPage.getItem(bgPage.getItemByKey(i))));
			}
		}
		
		$('.sticky').sortElements(function(a, b){
			return parseInt($(a).attr('rel')) > parseInt($(b).attr('rel')) ? 1 : -1;
		});
	},
	createSticky = function createSticky(data) {
		
		var title = 'Note';
		var date = new Date();
		
		if (bgPage.getItem('note-title-type')) {
			
			if (bgPage.getItem('note-title-type') == 'text' 
					&& bgPage.getItem('note-title-text') 
					&& bgPage.getItem('note-title-text').length > 0) {
				title = bgPage.getItem('note-title-text');
			} else if (bgPage.getItem('note-title-type') == 'date') {
				title = date;
			} else if (bgPage.getItem('note-title-type') == 'timestamp') {
				title = + date;
			}
			
		}
		
		data = data || {
			id		: +date,
			top 		: TOP + 'px',
			left		: LEFT + 'px',
			title		: title,
			text		: '',
			notecolor	: bgPage.defaultNoteSettings.notecolor,
			font		: bgPage.defaultNoteSettings.font,
			fontsize	: bgPage.defaultNoteSettings.fontsize,
			textcolor	: bgPage.defaultNoteSettings.textcolor,
			width		: 200,
			height		: 188,
			textheight	: 140,
			collapse	: '',
			textwrap	: '',
			order		: 9999,
			lastsave	: +date,
			star		: '',
			lock		: '',
			textwrap	: bgPage.defaultNoteSettings.textwrap
		}
		
		return createNote(data);
	},
	saveSticky = function saveSticky() {
		var $this = $(this), sticky = ($this.hasClass('sticky-title') || $this.hasClass('sticky-content') || $this.hasClass('slider')) ? $this.parents('div.sticky'): $this;
		saveNote(sticky.attr('id'));
	}
	
	return {
		open	: openStickies,
		init	: initStickies,
		'new'	: createSticky
	};
}());

function toggleSingleView(bool) {
	if (bool) {
	
		$('html').addClass('single');
		//$('.sticky').removeClass('collapse');
		
		$('#free-view, #grid-view').removeClass('set');
		$('#single-view').addClass('set');
	
	} else {
	
		$('html').removeClass('single');
	
	}
}
