
/*
	model: {
		keywords: <Array of key/value pairs of type String> ex. [ { name: 'if', type: 'syntax' }, { name: 'else', type: 'syntax' }, { name: 'firstname', type: 'string' } ],
		dataTypes: <Array of key/value pairs> ex. [ { type: 'string', methods: [ 'tostring', 'toupper', 'tolower' ] }, { type: 'int', methods: [ 'tostring' ] } ]
	}
	
	keywords do not need a value for type as it will be checked against datatypes property when a period is pressed.
*/

function selectText(element, start, end) {
	"use strict";
	if (element[0].createTextRange) {
		var selRange = element[0].createTextRange();
		selRange.collapse(true);
		selRange.moveStart('character', start);
		selRange.moveEnd('character', end);
		selRange.select();
	} else if (element[0].setSelectionRange) {
		element[0].setSelectionRange(start, end);
	} else if (element[0].selectionStart) {
		element[0].selectionStart = start;
		element[0].selectionEnd = end;
	}
	element.focus();
}

function log(message) {
	"use strict";
	if (console) {
		console.log(message);
	}
}

Array.prototype.contains = function (value) {
	for (var i in this) {
		if (this[i] === value)
			return true;
	}
	return false;
}

function replaceTextAndHighlight(self, lastWord, newWord) {
	var valueLessLastWord = self.val().substring(0, (self.val().length - lastWord.length));
	self.val(valueLessLastWord + newWord);
	
	var start = valueLessLastWord.length + lastWord.length;														// Set start of the highlight
	var end = self.val().length;																									// Set end of the highlight
	
	selectText(self, start, end);																									// Set the selected text to the remainder of the letters from what was actually input
	return self;
}

function evaluateKeywords(self, lastWord, model) {
	log('evaluateKeywords method was executed.');
	var matches = [];
	
	for (var i in model.keywords) {
		var keyword = model.keywords[i];
		
		log('Keyword to be evaluated: ' + keyword.name);
		if (typeof keyword.name === 'function') { continue; }
		
		var pattern = new RegExp('^' + lastWord);
		var isMatch = pattern.test(keyword.name);
		
		if (isMatch) {
			if (model.dataTypes.contains(keyword.type)) {
				// Checks the datatypes for match and then adds the methods to the matches array
				for (var x in model.dataTypes) {
					var dataType = model.dataTypes[x];
					var pattern = new RegExp('^' + lastWord);
					var isDataTypeMatch = pattern.test(dataType.type);
					if (isDataTypeMatch) {
						// TODO
					}
				}
			}
			else {
				// Ads keyword to the matches array
				matches.push(keyword.name);
			}
		}
	}
	
	if (matches.length > 0)
		replaceTextAndHighlight(self, lastWord, matches[0]);
	
	
	// Tracing only
	$("#matches").val('');
	for (var match in matches) {
		var val = $("#matches").val();
		if (typeof matches[match] === 'function') { continue; }
		$("#matches").val(val + '\n' + matches[match]);
	}
	
	return self;
}

function executeCodeCompletion(self, model) {
	var words = self.val().split(" ");
	var lastWord = words[words.length - 1];
	log('Last Word: ' + lastWord);
	
	if (lastWord.length === 0) { return self;	}																						// Doesn't evaluate keywords on a space
	
	// Evaluate model.keywords
	evaluateKeywords(self, lastWord, model);
	
	return self;
}

(function($) {
	$.fn.codeComplete = function (options) {
	
		options = $.extend({
			model: {
				keywords: [ { name: 'if', type: 'syntax' }, { name: 'else', type: 'syntax' }, { name: 'firstname', type: 'string' }, { name: 'age', type: 'int' } ],
				dataTypes: [ { type: 'string', methods: [ 'tostring', 'toupper', 'tolower' ] }, { type: 'int', methods: [ 'tostring' ] } ]
			}
		}, options);
		options.model.keywords.sort();
		
		this.data("model", options.model);
		
		this.bind("keyup", function(e) {
			log('Key ANSII Code: ' + e.keyCode);
			if (e.keyCode === 8) { return this; }
			
			return executeCodeCompletion($(this), options.model);
		});
		
		this.bind('keydown', function(e) {
			var self = $(this);
			
			// SpaceBar
			if (e.keyCode === 32) {
				log('Spacebar was pressed');
				selectText(self, self.val().length, self.val().length);
			}
			
			// Period
			if (e.keyCode === 190) {
				log('Period was pressed');
				executeCodeCompletion($(this), options.model);
			}
			
			// Enter
			if (e.keyCode === 13) {
				log('Enter was pressed');
				executeCodeCompletion($(this), options.model);
				$(this).val($(this).val() + " ");
			}
			
		});
		
		return this;
	};
})(jQuery);
