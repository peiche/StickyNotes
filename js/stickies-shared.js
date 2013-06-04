String.prototype.startsWith = function(str){
    return (this.indexOf(str) === 0);
};

jQuery.fn.mb_bringToFront= function(zIndexContext){
	var zi = 1;
	//var zlow = 9999;
	var $this = $(this);
	var els = zIndexContext && zIndexContext != 'auto' ? $(zIndexContext) : $('*');
	els.not('.pinned').each(function() {
		if ($(this).css('position') != 'static') {
			var cur = parseInt($(this).css('zIndex'));
			zi = cur > zi ? parseInt($(this).css('zIndex')) : zi;
			//zlow = cur < zlow ? parseInt($(this).css('zIndex')) : zlow;
		}
	});
	
	$this.not('.pinned').css('zIndex', zi + 1);
	
	return zi;
};

var bgPage = chrome.extension.getBackgroundPage();

var sanitize = new Sanitize({
	elements : [
		'a', 'b', 'blockquote', 'br', 'cite', 'dd', 'div', 'dl', 'dt', 'em',
		'i', 'img', 'li', 'ol', 'p', 'q', 'small', 'strike', 'strong', 'sub',
		'sup', 'u', 'ul', 'span'
	],
	attributes : {
		'a' : ['href'],
		'img' : ['src'],
		'div' : ['style'],
		'span' : ['style'],
		'blockquote': ['style']
	},
	add_attributes : {
		'a' : { 'rel' : 'nofollow' }
	},
	protocols : {
		'a' : { href : ['http', 'https', 'mailto', Sanitize.RELATIVE] }
	}
});

function createNote(data) {
	var $sticky = $('<div />', {
			'class'	: 'sticky ' + data.collapse + ' ' + data.textwrap + ' ' + data.star + ' ' + data.lock,
			'id'	: data.id,
			'rel'	: data.order
		})
		.append($('<h1 class="sticky-title">' + data.title + '</h1>')
			.click(function() {
				bringNoteToFront(data.id);
				
				// blur content field
				$('#' + data.id + ' .sticky-content').blur();
				
				// make sure to close open menus
				$('.dropdown, .dropup').removeClass('open');
			})
			.dblclick(function() {
				if (bgPage.getItem('title-dblclick') == 'settings') {
					if (!$(this).closest('.sticky').hasClass('lock')) {
						$(this).siblings('.iconic.cog').click();
					}
				} else {
					bringNoteToFront(data.id);
					$('#' + data.id).toggleClass('collapse');
					saveNote(data.id);
					$('.context-menu').hide();
				}
			})
		)
		.append($('<span />', {
			'class'	: 'iconic star',
			'title'	: 'Star Note',
			click	: function() {
				$(this).parents('.sticky').toggleClass('star');
				saveNote(data.id);
			}
		}))
		.append($('<span />', {
			'class'	: 'iconic unlocked',
			'title'	: 'Lock/Unlock Note',
			click	: function() {
				$(this).parents('.sticky').toggleClass('lock');
				saveNote(data.id);
			}
		}))
		.append($('<span />', {
			'class'	: 'iconic minus',
			'title'	: 'Collapse/Expand Note',
			click	: function() {
				bringNoteToFront(data.id);
				$(this).parents('.sticky').toggleClass('collapse');
				saveNote(data.id);
			}
		}))
		.append($('<span />', {
			'class'	: 'iconic cog',
			'title'	: 'Configure Note',
			click	: function() {
				var $this = $(this);
				bringNoteToFront(data.id);

				$('input#options-notetitle').val($this.parents('.sticky').find('h1.sticky-title').text());

				// destroy colorpicker
				$('.colorpicker').remove();
				$('input#notecolor')
					.val(getHexForRgb($this.parents('.sticky').css('background-color')))
					.css({
						backgroundColor	: $this.parents('.sticky').css('background-color')
					});
				$('input#textcolor')
					.val(getHexForRgb($this.parents('.sticky').css('color')))
					.css({
						backgroundColor	: $this.parents('.sticky').css('color')
					});
				$('select#options-fontface').val($this.parents('.sticky').find('.sticky-content').css('font-family'));
				
				var selectedFont = $('#options-fontface-button .ui-selectmenu-status').html();
				$('#options-fontface option').each(function() {
					if (this.selected) {
						selectedFont = $(this).html();
					}
				});
				
				$('#options-fontface-button .ui-selectmenu-status').html(selectedFont);
				$('input#options-fontsize').val(parseInt($this.parents('.sticky').find('.sticky-content').css('font-size')));
				
				$('input#options-textwrap').removeAttr('checked');
				if ($this.parents('.sticky').hasClass('textwrap-off')) {
					$('input#options-textwrap').attr('checked', 'checked');
				}
				
				//$('#options-dialog').attr('rel', data.id).dialog({ position : 'center' }).dialog('open');
				$('#options-dialog').attr('rel', data.id).modal('show')
				.on('shown', function() {
					$(this).scrollTop(0);
				})
				.on('hide', function() {
					parseTags();
					$('#cpnote-btn, #cptext-btn').removeClass('active').popover('hide');
				});
			}
		}))
		.append($('<span class="iconic x" title="Delete Note"></span>')
			.click(function () {
				bringNoteToFront(data.id);
				deleteNotePrompt(data.id);
		}))
		.append($('<div />', {
				'class' 	: 'sticky-content',
				html		: data.text,
				contentEditable	: true,
				focus: function(e) {
					handleControls(data.id);
				},
				blur: function(e) {
					handleControls(data.id);
					
					var $this = $(this);
					el = $this[0];
					$this.selectRange(el.selectionStart, el.selectionEnd);
					
					saveNote(data.id);
				},
				keydown: function(e) {
					/** CTRL+S inside note to strikethrough **
					// disabled because it conflicts with some special characters
					if (e.ctrlKey && e.keyCode == 83) {
						//saveStickyFile(data.id);
					  	document.execCommand('strikethrough', true, null);
					  	handleControls(data.id);
					  	return false;
					}
					*/
					
					// CTRL+P inside note to print just that note
					if (e.ctrlKey && e.keyCode == 80) {
						printSticky(data.id);
						return false;
					}
					
					// TAB and SHIFT+TAB to indent and outdent, respectively
					if (e.keyCode == 9) {
						if (e.shiftKey) {
							document.execCommand('outdent', true, null);
						} else {
							document.execCommand('indent', true, null);
						}
						handleControls(data.id);
						
						return false;
					}
					
					saveNoteKeystroke(data.id);
				},
				keyup: function(e) {
					handleControls(data.id);
				},
				mouseup: function(e) {
					handleControls(data.id);
				},
				click: function(e) {
					bringNoteToFront(data.id);
				}
			})
			.css({
				'font-family'	: data.font,
				'font-size'	: data.fontsize,
				'height'	: data.textheight
			})
			.mousewheel(function(event, delta) {
				this.scrollTop -= (delta * 30);
				event.preventDefault();
			})
			
		)
		.append($('<div class="sticky-controls navbar subnav" />')
			.append($('<div />')
				.mousewheel(function(event, delta) {
					this.scrollLeft -= (delta * 30);
					event.preventDefault();
				})
				.append($('<div />')
					.append($('<div class="btn-group pull-left" />')
						.append($('<a class="btn" rel="tooltip" title="Undo" data-placement="top"><i class="icon-repeat flip"></i></a>')
							.mousedown(function(e) {
								document.execCommand('undo', true, null);
								e.preventDefault();
								return false;
							})
						)
						.append($('<a class="btn" rel="tooltip" title="Redo" data-placement="top"><i class="icon-repeat"></i></a>')
							.mousedown(function(e) {
								document.execCommand('redo', true, null);
								e.preventDefault();
								return false;
							})
						)
					)
					.append($('<div class="btn-group pull-left"/>')
			
						.append($('<a class="btn" rel="tooltip" title="Bold" data-placement="top" data-id="bold"><i class="icon-bold"></i></a>') // <b>B</b>
							.mousedown(function(e) {
								document.execCommand('bold', true, null);
								e.preventDefault();
								handleControls(data.id);
								return false;
							})
						)
						.append($('<a class="btn" rel="tooltip" title="Italic" data-placement="top" data-id="italic"><i class="icon-italic"></i></a>') // <i>I</i>
							.mousedown(function(e) {
								document.execCommand('italic', true, null);
								e.preventDefault();
								handleControls(data.id);
								return false;
							})
						)
						.append($('<a class="btn" rel="tooltip" title="Underline" data-placement="top" data-id="underline"><u>U</u></a>')
							.mousedown(function(e) {
								document.execCommand('underline', true, null);
								e.preventDefault();
								handleControls(data.id);
								return false;
							})
						)
						.append($('<a class="btn" rel="tooltip" title="Strikethrough" data-placement="top" data-id="strikethrough"><s>S</s></a>')
							.mousedown(function(e) {
								document.execCommand('strikeThrough', true, null);
								e.preventDefault();
								handleControls(data.id);
								return false;
							})
						)
					
					)
					
					.append($('<div class="btn-group pull-left" />')
						.append($('<a class="btn" rel="tooltip" title="Left justify" data-placement="top" data-id="justify-left"><i class="icon-align-left"></i></a>')
							.mousedown(function(e) {
								document.execCommand('justifyLeft', true, null);
								e.preventDefault();
								handleControls(data.id);
								return false;
							})
						)
						.append($('<a class="btn" rel="tooltip" title="Center" data-placement="top" data-id="justify-center"><i class="icon-align-center"></i></a>')
							.mousedown(function(e) {
								document.execCommand('justifyCenter', true, null);
								e.preventDefault();
								handleControls(data.id);
								return false;
							})
						)
						.append($('<a class="btn" rel="tooltip" title="Right justify" data-placement="top" data-id="justify-right"><i class="icon-align-right"></i></a>')
							.mousedown(function(e) {
								document.execCommand('justifyRight', true, null);
								e.preventDefault();
								handleControls(data.id);
								return false;
							})
						)
					)
					
					.append($('<div class="btn-group pull-left" />')
					
						.append($('<a class="btn" rel="tooltip" title="Indent" data-placement="top"><i class="icon-indent-left"></i></a>')
							.mousedown(function(e) {
								document.execCommand('indent', true, null);
								e.preventDefault();
								return false;
							})
						)
						.append($('<a class="btn" rel="tooltip" title="Outdent" data-placement="top"><i class="icon-align-left"></i></a>')
							.mousedown(function(e) {
								document.execCommand('outdent', true, null);
								e.preventDefault();
								return false;
							})
						)
					
					)
					.append($('<div class="btn-group pull-left" />')
					
						.append($('<a class="btn" rel="tooltip" title="Superscript" data-placement="top" data-id="superscript"><sup>s</sup></a>')
							.mousedown(function(e) {
								document.execCommand('superscript', true, null);
								e.preventDefault();
								handleControls(data.id);
								return false;
							})
						)
						.append($('<a class="btn" rel="tooltip" title="Subscript" data-placement="top" data-id="subscript"><sub>s</sub></a>')
							.mousedown(function(e) {
								document.execCommand('subscript', true, null);
								e.preventDefault();
								handleControls(data.id);
								return false;
							})
						)
					
					)
					.append($('<div class="btn-group pull-left" />')
						.append($('<a class="btn pull-left" rel="tooltip" title="Bullet list" data-placement="top" data-id="list-unordered"><i class="icon-th-list"></i></a>')
							.mousedown(function(e) {
								document.execCommand('insertUnorderedList', true, null);
								e.preventDefault();
								handleControls(data.id);
								return false;
							})
						)
						/** no appropriate icon **
						.append($('<a class="btn pull-left" rel="tooltip" title="Numbered list" data-placement="top" data-id="list-ordered"><i class="icon-th-list"></i></a>')
							.mousedown(function(e) {
								document.execCommand('insertOrderedList', true, null);
								e.preventDefault();
								handleControls(data.id);
								return false;
							})
						)
						*/
					)
					
					/** do not show unless we can override Chrome's stupid print overlay **
					.append($('<a class="btn btn-mini" rel="tooltip" title="Print" data-placement="top"><i class="icon-print"></i></a>')
						.mousedown(function(e) {
							printSticky(data.id);
							e.preventDefault();
							return false;
						})
					)
					*/
					
					.append($('<div class="btn-group pull-left" />')
						.append($('<a class="btn pull-left" rel="tooltip" title="Clear formatting" data-placement="top"><i class="icon-remove-circle"></i></a>')
							.mousedown(function(e) {
								document.execCommand('removeFormat', true, null);
								document.execCommand('unlink', true, null);

								var $content = $(this).closest('.sticky-controls').siblings('.sticky-content');
								$content.find('*').each(function() {
									$(this).removeAttr('style');
								});

								e.preventDefault();
								return false;
							})
						)
					)
				)
			)
		)
		.resizable({
			minWidth	: 200,
			minHeight	: 188,
			handles		: 'e,w,s,se',
			alsoResize	: '#' + data.id + ' .sticky-content',
			cancel		: '.sticky.collapse',
			start		: function() {
						bringNoteToFront(data.id);
						toggleSortable(true);
					  },
			resize		: function () {
					  	toggleSortable(true);
					  },
			stop		: function() {
						toggleSortable(true);
						saveNote(data.id);
					  }
		})
		.draggable({
			handle		: '.sticky h1',
			stack		: '.sticky',
			start		: function() {
						//closeNoteList();
						//closeGearMenu();
					  },
			stop		: function() {
						var top = parseInt($('body').css('margin-top')) + 10;
						if (parseInt($(this).css('top')) < top) {
							$(this).animate({ top : top }, 100, function() {
								saveNote(data.id);
							});
						} else {
							saveNote(data.id);
						}
					  },
			cancel		: '.sticky-content, .sticky-controls, .button, .btn, input.edit .grid, .iconic',
			distance	: 0
		})
		.bind({
			dblclick	: function(event) {
						event.stopPropagation();
					  }
		})
		.css({
			position		: 'absolute',
			'top'			: parseInt(data.top) > 40 ? data.top : 40,
			'left'			: data.left,
			'display'		: 'none',
			'color'			: data.textcolor,
			'background-color'	: data.notecolor,
			'width'			: data.width,
			'height'		: data.height,
			'z-index'		: data.zindex
		})
		
		/*
		.contextMenu('context-menu-' + data.id, {
			'<i class="icon-cog"></i> Configure Note': {
				click: function(elem) {}, // todo
				hr: true
			},
			'Star': {
				click: function(e) {},
			},
			'Lock': {
				click: function(e) {},
				hr: true
			},
			'Collapse/Expand': {
				click: function(elem) {}, // todo
			},
			'Delete Note': {
				click: function(elem) {}, // todo
			}
		})
		*/
		
		
		.appendTo(document.body)
		.fadeIn(200);

	if (bgPage.getItem('note-view') && bgPage.getItem('note-view') == 'grid') {
		$sticky.addClass('grid').css({
			top		: 'auto',
			left		: 'auto',
			position	: 'relative'
		});
		toggleSortable(true);
	}
	
	
	if (bgPage.getItem('sticky-' + data.id) == null) {
		bringNoteToFront(data.id);
	}
	saveNote(data.id);
	
	return $sticky;
}

function saveNote(id) {
	var sticky = $('#' + id);
	var elem = null;
	if (document.getElementById(id) != null && 
			document.getElementById(id).getElementsByClassName('sticky-content') != null) {
		elem = document.getElementById(id).getElementsByClassName('sticky-content')[0];
		$(elem).html(sanitize.clean_node(elem));
	}
	
	var obj = JSON.parse(bgPage.getItem('sticky-' + sticky.attr('id')));

	if (obj != null) {
		// update
		obj.id			= sticky.attr('id');
		obj.title		= sticky.find('h1.sticky-title').text();
		obj.text		= sticky.find('.sticky-content').html();
		obj.textcolor		= sticky.css('color');
		obj.notecolor		= sticky.css('background-color');
		obj.font		= sticky.find('.sticky-content').css('font-family');
		obj.fontsize		= sticky.find('.sticky-content').css('font-size');
		obj.zindex		= sticky.css('z-index');
		
		if (!$('html').hasClass('single')) {
			obj.width		= sticky.css('width');
		}
		
		obj.order		= sticky.attr('rel');
		obj.lastsave		= + new Date();
		
		if (sticky.hasClass('star')) {
			obj.star = 'star';
		} else {
			obj.star = '';
		}
		if (sticky.hasClass('lock')) {
			obj.lock = 'lock';
		} else {
			obj.lock = '';
		}
		if (sticky.hasClass('collapse')) {
			obj.collapse = 'collapse';
			
		} else {
			if (!$('html').hasClass('single')) {
				obj.collapse = '';
				obj.height = sticky.css('height');
				obj.textheight = sticky.find('.sticky-content').css('height');
			}
		}
		
		if (sticky.hasClass('textwrap-off')) {
			obj.textwrap = 'textwrap-off';
		} else {
			obj.textwrap = '';
		}

		if (!sticky.hasClass('grid') && !$('html').hasClass('single')) {
			obj.top		= sticky.css('top');
			obj.left	= sticky.css('left');
		}

	} else {
		// new
		obj = {
			id		: sticky.attr('id'),
			top		: sticky.css('top'),
			left		: sticky.css('left'),
			title		: sticky.find('h1.sticky-title').html(),
			text		: sticky.find('.sticky-content').html(),
			textcolor	: sticky.css('color'),
			notecolor	: sticky.css('background-color'),
			font		: sticky.find('.sticky-content').css('font-family'),
			fontsize	: sticky.find('.sticky-content').css('font-size'),
			width		: sticky.css('width'),
			height		: sticky.css('height'),
			textheight	: sticky.find('.sticky-content').css('height'),
			collapse	: '',
			textwrap	: sticky.hasClass('textwrap-off') ? 'textwrap-off' : '',
			order		: sticky.attr('rel'),
			lastsave	: + new Date(),
			star		: '',
			lock		: '',
			zindex		: 0
		};
	}

	bgPage.setItem('sticky-' + obj.id, JSON.stringify(obj));
	calcNoteCount();
	
	cloudSave();
	
	refreshNoteList();
	refreshTagList();
	
	parseTags();
	
	//bgPage.setLastUpdateTime();
}

function cloudSave() {
	/*
	if (bgPage.getItem('note-cloud-sync') && bgPage.getItem('note-cloud-sync') == 'true') {
		$.ajax({
			url: '#',
			success: function() {
				//bgPage.sync();
			}
		})
	}
	*/
	
	//bgPage.console.log('cloud save');
}

function toggleSortable(bool) {
	if (bool) {
		if (bgPage.getItem('note-view') && bgPage.getItem('note-view') == 'grid') {
			$('.sticky').draggable('disable').addClass('grid').css({
				top		: 'auto',
				left		: 'auto',
				position	: 'relative'
			});
			$('body').sortable({
				items		: '.sticky.grid',
				handle		: 'h1.sticky-title',
				revert		: 100,
				tolerance	: 'pointer',
				update		: function() {
								var counter = 1;
								$('.sticky').each(function() {
									$(this).attr('rel', counter);
									counter++;
									saveNote($(this).attr('id'));
								});
							  }
			}).sortable('enable');
		}
	} else {
		$('body').sortable('disable');
		$('.sticky').draggable('enable').removeClass('grid').each(function() {
			var obj = JSON.parse(bgPage.getItem('sticky-' + $(this).attr('id')));
			$(this).css({
				top		: obj.top,
				left		: obj.left,
				position	: 'absolute'
			});
		});
	}
}

function bringNoteToFront(id) {
	// shamelessly ripped from jquery ui's draggable source
	var group = $.makeArray($('.sticky')).sort(function(a,b) {
		return (parseInt($(a).css('zIndex'), 10) || 0) - (parseInt($(b).css('zIndex'), 10) || 0);
	});
	
	if (!group.length) {
		return;
	}
	
	var min = parseInt(group[0].style.zIndex) || 0;
	$(group).each(function(i) {
		this.style.zIndex = min + i;
	});
	
	$('#' + id).css('zIndex', min + group.length);
	
	saveNoteOrder();
}

function saveNoteOrder() {
	$('.sticky').each(function(i) {
		var id = $(this).attr('id');
		var sticky = $('#' + id);
		var obj = JSON.parse(bgPage.getItem('sticky-' + sticky.attr('id')));

		if (obj != null) {
			obj.zindex = sticky.css('z-index');
			bgPage.setItem('sticky-' + obj.id, JSON.stringify(obj));
			//console.log(obj.title + ' // ' + obj.zindex);
		}
	});
	//console.log('-----------------');
}

function calcNoteCount() {
	$('#note-count').html(getNoteCount());
}

function getNoteCount() {
	var noteCount = 0;
	for (var i = 0; i < bgPage.getLSLength(); i++) {
			if (bgPage.getItemByKey(i).startsWith('sticky-')) {
				noteCount++;
			}
	}
	
	return noteCount;
}

function refreshNoteList() {
	$('#note-list').empty();

	$('.sticky:visible').each(function(index) {
		$('#note-list').append('<li class="' + $(this).prop('id') + '" rel="' + $(this).attr('rel') + '"><a href="#">' + $(this).find('h1').html() + '</a></li>')
	});
	$('#note-list li').sortElements(function(a, b){
		return parseInt($(a).attr('rel')) > parseInt($(b).attr('rel')) ? 1 : -1;
	});
	
	if ($('#note-list li').length == 0) {
		$('#note-list').append('<li class="nav-header">No notes</li>')
	}

	listFilter();
}

function listFilter() {
	var list = '#note-list';
	
	$('input#note-filter').change(function () {
		var filter = $(this).val();
		if (filter) {
			$('#clear-search').show();
			$('.sticky').addClass('showlist');
			
			if (bgPage.getItem('note-filter') == 'note') {
				$(list + ' li').each(function() {
					var idsShow = new Array(), idsHide = new Array(), f = filter.split(' ');
					for (var i = 0; i < f.length; i++) {
						if (f[i].length > 0) {
							var id = $(this).attr('class');
							if ($('#' + id).text().toLowerCase().indexOf(f[i].toLowerCase()) != -1) {
								idsShow.push(id);
							} else {
								idsHide.push(id);
							}
						}
					}
					for (var i = 0; i < idsShow.length; i++) {
						$('#' + idsShow[i]).addClass('filter');
						$(list + ' li.' + idsShow[i]).show();
					}
					for (var i = 0; i < idsHide.length; i++) {
						$('#' + idsHide[i]).removeClass('filter');
						$(list + ' li.' + idsHide[i]).hide();
					}
				});
			} else {
				$(list).find('li:not(:Contains(' + filter + '))').each(function() {
					var id = $(this).attr('class');
					$('#' + id).removeClass('filter');
				}).hide();
				$(list).find('li:Contains(' + filter + ')').each(function() {
					var id = $(this).attr('class');
					$('#' + id).addClass('filter');
				}).show();
			}
		} else {
			$('#clear-search').hide();
			$('.sticky').removeClass('showlist filter');
			$(list).find('li').show();
		}
		
		if ($('#note-list li:visible').length == 0) {
			//$('#note-list').append('<li class="nav-header">No notes</li>');
		} else {
			$('#note-list li.nav-header').remove();
		}
		
		//refreshNoteList();
		
		return false;
	}).keyup(function () {
		// fire the above change event after every letter
		$(this).change();
	});
}

function refreshTagList() {
	$('#tag-list').empty();
	
	var str = '';
	$('.sticky').each(function() {
		str += $(this).html();
	});
	
	var taglist = removeDuplicateElement(twttr.txt.extractHashtags(str));
	
	if (taglist.length > 0) {
		for (var i = 0; i < taglist.length; i++) {
			$('#tag-list').append($('<li></li>')
				.append($('<a href="#" data-name="' + taglist[i] + '">' + taglist[i] + '</a>')
					.mousedown(function(e) {
						e.preventDefault();
						return false;
					})
					.click(function() {
						$('body').addClass('tagfilter');
						$('.sticky').each(function() {
							if (parseInt($(this).css('top')) < 80) {
								//$(this).css('top', '80px');
								
								$(this).animate({ 'top': '80px' }, 200);
							}
						});
						
						var text = $(this).html();
						
						var exists = false;
						$('#tags span').each(function() {
							if ($(this).html() == text) {
								exists = true;
							}
						});
						
						if (!exists) {
							$('#tags').append(
								$('<div class="btn-group"></div>')
									.append($('<span class="btn btn-mini btn-success">' + text + '</span>')
										.click(function() {
											$(this).closest('.btn-group').siblings().remove();
											
											parseTags();
											setActiveTags();
											
										})
									)
									.append($('<span class="btn btn-mini btn-success">&times</span>')
										.click(function() {
											$(this).closest('.btn-group').remove();
											if ($('#tags .btn-group span:first-child').length == 0) {
												$('body').removeClass('tagfilter');
											}
											
											parseTags();
											setActiveTags();
										})
									)
							)
							
							parseTags();
						}
						
						setActiveTags();
					})
					.mouseenter(function() {
						var text = $(this).html();
						$('.sticky').each(function() {
							if ($(this).html().indexOf('#' + text) != -1) {
								$(this).addClass('specialhover');
								bringNoteToFront($(this).attr('id'));
							}
						});
						
					})
					.mouseleave(function() {
						$('.sticky').removeClass('specialhover');
					})
				)
			);
		}
	} else {
		$('#tag-list').append('<li class="nav-header">No tags</li>');
	}
	
	// todo
	$('#tag-list li').sortElements(function(a, b){
		return $(a).html() > $(b).html() ? 1 : -1;
	});
}

function parseTags() {
	$('.sticky').each(function() {
		var html = $(this).html();
		var x = true;

		$('#tags .btn-group span:first-child').each(function() {
			if (html.indexOf('#' + $(this).html()) == -1) {
				x = false;
			}
		});
		if (x) {
			$(this).closest('.sticky').addClass('tagged');
		} else {
			$(this).closest('.sticky').removeClass('tagged');
		}
		
		refreshNoteList();
	});
}

function removeDuplicateElement(arrayName) {
	var newArray = new Array();
	label: for (var i = 0; i < arrayName.length; i++) {  
		for (var j = 0; j < newArray.length; j++) {
			if (newArray[j] == arrayName[i]) {
				continue label;
			}
		}
		newArray[newArray.length] = arrayName[i];
	}
	return newArray;
}

function handleControls(id) {

	document.execCommand('insertBrOnReturn', true, null);
	document.execCommand('styleWithCSS', true, null);
	
	if (document.queryCommandState('bold')) {
		$('#' + id + ' .sticky-controls a[data-id="bold"]').addClass('active');
	} else {
		$('#' + id + ' .sticky-controls a[data-id="bold"]').removeClass('active');
	}
	
	if (document.queryCommandState('italic')) {
		$('#' + id + ' .sticky-controls a[data-id="italic"]').addClass('active');
	} else {
		$('#' + id + ' .sticky-controls a[data-id="italic"]').removeClass('active');
	}
	
	if (document.queryCommandState('underline')) {
		$('#' + id + ' .sticky-controls a[data-id="underline"]').addClass('active');
	} else {
		$('#' + id + ' .sticky-controls a[data-id="underline"]').removeClass('active');
	}
	
	if (document.queryCommandState('strikeThrough')) {
		$('#' + id + ' .sticky-controls a[data-id="strikethrough"]').addClass('active');
	} else {
		$('#' + id + ' .sticky-controls a[data-id="strikethrough"]').removeClass('active');
	}
	
	if (document.queryCommandState('superscript')) {
		$('#' + id + ' .sticky-controls a[data-id="superscript"]').addClass('active');
	} else {
		$('#' + id + ' .sticky-controls a[data-id="superscript"]').removeClass('active');
	}
	
	if (document.queryCommandState('subscript')) {
		$('#' + id + ' .sticky-controls a[data-id="subscript"]').addClass('active');
	} else {
		$('#' + id + ' .sticky-controls a[data-id="subscript"]').removeClass('active');
	}
	
	if (document.queryCommandValue('justifyCenter') == 'true') {
		$('#' + id + ' .sticky-controls a[data-id="justify-left"]').removeClass('active');
		$('#' + id + ' .sticky-controls a[data-id="justify-center"]').addClass('active');
		$('#' + id + ' .sticky-controls a[data-id="justify-right"]').removeClass('active');
	} else if (document.queryCommandValue('justifyRight') == 'true') {
		$('#' + id + ' .sticky-controls a[data-id="justify-left"]').removeClass('active');
		$('#' + id + ' .sticky-controls a[data-id="justify-center"]').removeClass('active');
		$('#' + id + ' .sticky-controls a[data-id="justify-right"]').addClass('active');
	} else { // justifyLeft
		$('#' + id + ' .sticky-controls a[data-id="justify-left"]').addClass('active');
		$('#' + id + ' .sticky-controls a[data-id="justify-center"]').removeClass('active');
		$('#' + id + ' .sticky-controls a[data-id="justify-right"]').removeClass('active');
	}
	
	if (document.queryCommandState('insertUnorderedList')) {
		$('#' + id + ' .sticky-controls a[data-id="list-unordered"]').addClass('active');
		$('#' + id + ' .sticky-controls a[data-id="list-ordered"]').removeClass('active');
	} else if (document.queryCommandState('insertOrderedList')) {
		$('#' + id + ' .sticky-controls a[data-id="list-unordered"]').removeClass('active');
		$('#' + id + ' .sticky-controls a[data-id="list-ordered"]').addClass('active');
	} else {
		$('#' + id + ' .sticky-controls a[data-id="list-unordered"]').removeClass('active');
		$('#' + id + ' .sticky-controls a[data-id="list-ordered"]').removeClass('active');
	}
}
