
/*
	model: {
		keywords: <Array of String values>,
		dataTypes: <Array of key/value pairs> ex. [ { type: 'string', methods: [ 'tostring', 'toupper', 'tolower' ] }, { type: 'int', methods: [ 'tostring' ] } ],
		members: <Array of key/value pairs of type String> ex. [ { name: 'firstname', type: 'string' } ]
	}
*/


(function($) {
	$.fn.codeComplete = function(options) {
	
		options = $.extend({
			model: {
				keywords: [ 'if', 'else', 'orelse', 'and', 'not' ],
				dataTypes: [ { type: 'string', methods: [ 'tostring', 'toupper', 'tolower' ] }, { type: 'int', methods: [ 'tostring' ] } ],
				members: [ { name: 'firstname', type: 'string' } ]
			}
		}, options);
		options.model.keywords.sort();
		
		this.data("model", options.model);
		
		this.bind("keyup", function(e) {
			log('----------------------------- Begin KeyUp Event Handler -----------------------------');
			log('Key ANSII Code: ' + e.keyCode);
			if (e.keyCode === 8) return this;
			
			return executeCodeCompletion($(this), options.model);
			
			log('----------------------------- End KeyUp Event Handler -----------------------------');
		});
		
		this.bind('keydown', function(e) {
			var self = $(this);
			
			// SpaceBar
			if (e.keyCode == 32) {
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

function executeCodeCompletion(self, model) {
	var words = self.val().split(" ");
	var lastWord = words[words.length - 1];
	log('Last Word: ' + lastWord);
	
	if (lastWord.length === 0) return self;																							// Doesn't evaluate keywords on a space
	
	// Evaluate model.keywords
	evaluateKeywords(self, lastWord, model.keywords);
	
	// Evaluate model.members
	evaluateMembers(self, lastWord, model);
	
	// Evaluate model.dataTypes
	
	return self;
}

function evaluateMembers(self, lastWord, model) {
	var members = [];
	for (var i in model.members) {
		members.push(model.members[i].name);
	}
	
	for (var i in members) {
		if (typeof members[i] === 'function') continue;
		
		var pattern = new RegExp('^' + lastWord);
		var isMatch = pattern.test(members[i]);
		
		if (isMatch) {
			log('Keyword matched with: ' + members[i]);
			replaceTextAndHighlight(self, lastWord, members[i]);
		}
	}
	
	return self;
}

function evaluateKeywords(self, lastWord, keywords) {
	for (var i in keywords) {
		if (typeof keywords[i] === 'function') continue;
		
		var pattern = new RegExp('^' + lastWord);
		var isMatch = pattern.test(keywords[i]);
		
		if (isMatch) {
			log('Keyword matched with: ' + keywords[i]);
			replaceTextAndHighlight(self, lastWord, keywords[i]);
		}
	}
	
	return self;
}

function replaceTextAndHighlight(self, lastWord, newWord) {
	var valueLessLastWord = self.val().substring(0, (self.val().length - lastWord.length));
	self.val(valueLessLastWord + newWord);
	
	var start = valueLessLastWord.length + lastWord.length;														// Set start of the highlight
	var end = self.val().length;																									// Set end of the highlight
	
	selectText(self, start, end);																									// Set the selected text to the remainder of the letters from what was actually input
	return self;
}

function selectText(element, start, end) {
	if( element[0].createTextRange ) {
		var selRange = element[0].createTextRange();
		selRange.collapse(true);
		selRange.moveStart('character', start);
		selRange.moveEnd('character', end);
		selRange.select();
	} else if( element[0].setSelectionRange ) {
		element[0].setSelectionRange(start, end);
	} else if(element[0].selectionStart ) {
		element[0].selectionStart = start;
		element[0].selectionEnd = end;
	}
	element.focus();
}

function log(message) {
	if (console)
		console.log(message);
}

Array.prototype.contains = function(value) {
	for (var i in this) {
		if (this[i] === value)
			return true;
	}
	return false;
}