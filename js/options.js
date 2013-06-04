var bgPage = chrome.extension.getBackgroundPage();

String.prototype.startsWith = function(str){
    return (this.indexOf(str) === 0);
}

// set up random selector
jQuery.jQueryRandom = 0;
jQuery.extend(jQuery.expr[":"],
{
    random: function(a, i, m, r) {
        if (i == 0) {
            jQuery.jQueryRandom = Math.floor(Math.random() * r.length);
        };
        return i == jQuery.jQueryRandom;
    }
});

$(document).ready(function() {
	
	$('[rel="popover"]').popover();
	
	if (bgPage.getItem('body-sticky')) {
		$('.background-list span').each(function() {
			if ($(this).css('background-image').indexOf(bgPage.getItem('body-sticky')) != -1) {
			$(this).parent().addClass('active');
			}
		});
	}
	
	$('.modal, .modal-body').mousewheel(function(event, delta) {
		this.scrollTop -= (delta * 30);
		event.preventDefault();
	});
	
	$('.subnav a').click(function() {
		var href = $(this).attr('href');
		
		if ($(this).closest('li').is(':first-child')) {
			$('body').scrollTop($(href).offset().top - 110);
		} else {
			$('body').scrollTop($(href).offset().top);
		}
		
		$(this).parent().addClass('active').siblings().removeClass('active');
		
		return false;
	});
	
	if (bgPage.getItem('bg-custom') != undefined && bgPage.getItem('bg-custom') == 'true') {
		var bg = bgPage.getItem('body-sticky');
		bg = bg.substring(4, bg.length - 1);
		$('#background-path').val(bg);
	}
	
	if (bgPage.getItem('top-bar-color') != undefined) {
		$('.top-bar-color ' + '#' + bgPage.getItem('top-bar-color')).addClass('active');
	} else {
		$('.top-bar-color #navbar-inverse').addClass('active');
	}
	
	if (bgPage.getItem('title-dblclick') == 'settings') {
		$('#title-double-click').val('settings');
	}
	
	if (bgPage.getItem('delete-prompt-skip') == undefined || bgPage.getItem('delete-prompt-skip') == 'false') {
		$('#delete-prompt').attr('checked', true);
	}
	
	if (bgPage.getItem('note-backup') == 'true') {
		$('#note-backup').attr('checked', true);
	}
	
	if (bgPage.getItem('note-filter') == 'note') {
		$('#note-filter').attr('checked', true);
	}
	
	if (bgPage.getItem('note-context-menu') == 'true') {
		$('#context-menu').attr('checked', true);
	}
	
	if (bgPage.getItem('note-context-menu-switch') == 'true') {
		$('#context-menu-switch').attr('checked', true);
	}
	
	if (bgPage.getItem('note-visual-controls') == 'true') {
		$('#visual-controls').attr('checked', true);
	}
	
	if (bgPage.getItem('note-title-type')) {
		$('#note-title-type').val(bgPage.getItem('note-title-type'));
		if (bgPage.getItem('note-title-type') != 'text') {
			$('#note-title-text').addClass('disabled');
		}
	}
	if (bgPage.getItem('note-title-text')) {
		$('#note-title-text').val(bgPage.getItem('note-title-text'));
	}
	
	if (bgPage.getItem('top-bar-hide') == 'true') {
		$('#top-bar-hide').attr('checked', true);
	}
	
	if (bgPage.getItem('note-popup') == 'true') {
		$('#popup').attr('checked', true);
	}
	
	/** CLICK EVENTS **/

	$('.background-list li:not(.option) a').click(function() {
		$('.background-list a').removeClass('active');
		$(this).addClass('active');
		bgPage.setItem('body-sticky', $(this).children('span').css('background-image'));
		bgPage.setItem('bg-custom', 'false');
		$('#background-path').val('');
		
		$('#modal-bg-more').modal('hide');
		$('#modal-bg-message').modal('show');
		
		return false;
	});
	$('a#random-bg').unbind('click').click(function() {
		$('.background-list li.bg:random').children('a').click();
		
		return false;
	});
	
	$('#background-update').click(function() {
		$('.background-list a').removeClass('active');
		var bg = $('#background-path').val();
		if (bg != '' && bg.length > 0) {
			bgPage.setItem('body-sticky', 'url(' + bg + ')');
			bgPage.setItem('bg-custom', 'true');
			$('html').css('background-image', bgPage.getItem('body-sticky'));
		}
		
		$('#modal-bg-message').modal('show');
	});
	
	$('.top-bar-color a').click(function() {
		$('.top-bar-color a').removeClass('active');
		$(this).addClass('active');
		bgPage.setItem('top-bar-color', $(this).attr('id'));
		
		return false;
	});
	
	$('#title-double-click').change(function() {
		if ($(this).val() == 'settings') {
			bgPage.setItem('title-dblclick', 'settings');
		} else {
			bgPage.setItem('title-dblclick', 'collapse');
		}
	});
	
	$('#note-backup').click(function() {
		if (this.checked) {
			bgPage.setItem('note-backup', 'true');
		} else {
			bgPage.setItem('note-backup', 'false');
			bgPage.removeItem('note-backup-obj');
		}
	});
			
	
	$('#delete-prompt').click(function() {
		if (this.checked) {
			bgPage.setItem('delete-prompt-skip', 'false');
		} else {
			bgPage.setItem('delete-prompt-skip', 'true');
		}
	});
	
	$('#note-filter').click(function() {
		if (this.checked) {
			bgPage.setItem('note-filter', 'note');
		} else {
			bgPage.setItem('note-filter', 'title');
		}
	});
	
	$('#context-menu').click(function() {
		if (this.checked) {
			bgPage.setItem('note-context-menu', 'true');
		} else {
			bgPage.setItem('note-context-menu', 'false');
		}
	});
	
	$('#context-menu-switch').click(function() {
		if (this.checked) {
			bgPage.setItem('note-context-menu-switch', 'true');
		} else {
			bgPage.setItem('note-context-menu-switch', 'false');
		}
	});
	
	$('#visual-controls').click(function() {
		if (this.checked) {
			bgPage.setItem('note-visual-controls', 'true');
		} else {
			bgPage.setItem('note-visual-controls', 'false');
		}
	});
	
	$('#note-title-type').change(function() {
		if ($(this).val() == 'text') {
			$('#note-title-text').removeClass('hide');
		} else {
			$('#note-title-text').addClass('hide');
		}
		bgPage.setItem('note-title-type', $(this).val());
	});
	$('#note-title-text').change(function() {
		bgPage.setItem('note-title-text', $(this).val());
	});
	
	$('#top-bar-hide').click(function() {
		if (this.checked) {
			bgPage.setItem('top-bar-hide', 'true');
		} else {
			bgPage.setItem('top-bar-hide', 'false');
		}
	});
	
	$('#import').click(function() {
		$('#textarea-import, #import-forreals').removeClass('hide');
		return false;
	});
	$('#import-forreals').click(function() {
		if ($('#textarea-import').val().length > 0) {
			bgPage.importData($('#textarea-import').val());
			location = 'main.html';
		} else {
			$('#modal-import-message').modal('show');
		}
		return false;
	});
	$('#export').click(function() {
		$('#textarea-export').val(bgPage.stringifiedLS()).removeClass('hide').select().focus();
		return false;
	});
	
	$('#modal-reset-note .btn-danger').click(function() {
		$('#modal-reset-note').modal('hide');
		
		// to do
		bgPage.setDefaultNoteSettings(bgPage.originalNoteSettings);
		
		$('#modal-reset-note-success').modal('show');
	});
	
	$('#popup').click(function() {
		if (this.checked) {
			bgPage.setItem('note-popup', 'true');
		} else {
			bgPage.setItem('note-popup', 'false');
		}
	});
});

