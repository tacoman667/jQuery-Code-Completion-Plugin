(function($) {
	$.fn.code = function(options) {
	
		options = $.extend({
			keywords: [ "if" , "else" , "orelse" , 'firstname' , 'firstname.tostring']
		}, options);
		options.keywords.sort();
		
		this.data("keywords", options.keywords);
		
		this.bind("keyup", function(e) {
			log('----------------------------- Begin KeyUp Event Handler -----------------------------');
			log('Key ANSII Code: ' + e.keyCode);
			if (e.keyCode === 8) return this;
			
			return replaceAndHighlightText($(this), options.keywords);
			
			log('----------------------------- End KeyUp Event Handler -----------------------------');
		});
		
		this.bind('keydown', function(e) {
			var self = $(this);
			
			// 32 == SpaceBar
			if (e.keyCode == 32) {
				log('Spacebar was pressed');
				selectText(self, self.val().length, self.val().length); // Puts the cursor at the end of the input area
				return this;
			}
			
			if (e.keyCode === 190) {
				log('Period was pressed');
				return replaceAndHighlightText($(this), options.keywords);
			}
		});
		
		return this;
	};
})(jQuery);

function replaceAndHighlightText(self, keywords) {
	var words = self.val().split(" ");
	var lastWord = words[words.length - 1];
	log('Last Word: ' + lastWord);
	
	if (lastWord.length === 0) return self;		// Doesn't evaluate keywords on a space
	for (var i = 0; i < keywords.length; i++) {
		var pattern = new RegExp('^' + lastWord);
		var isMatch = pattern.test(keywords[i]);
		
		if (isMatch) {
			log('Keyword matched with: ' + keywords[i]);
			
			var valueLessLastWord = self.val().substring(0, (self.val().length - lastWord.length));
			self.val(valueLessLastWord + keywords[i]);
			
			var start = valueLessLastWord.length + lastWord.length;														// Set start of the highlight
			var end = self.val().length;																									// Set end of the highlight
			
			selectText(self, start, end);																									// Set the selected text to the remainder of the letters from what was actually input
			return self;
		}
	}
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

$(document).ready(function() {
	jQuery("#source").code();
});