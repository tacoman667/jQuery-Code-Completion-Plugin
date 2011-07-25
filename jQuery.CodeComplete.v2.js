/*
    model: {
        keywords: <Array of key/value pairs of type String> ex. [ { name: 'if', type: 'syntax' }, { name: 'else', type: 'syntax' }, { name: 'firstname', type: 'string' } ],
        dataTypes: <Array of key/value pairs> ex. [ { type: 'string', methods: [ 'tostring', 'toupper', 'tolower' ] }, { type: 'int', methods: [ 'tostring' ] } ]
    }
    
    keywords do not need a value for type as it will be checked against datatypes property when a period is pressed.
*/

function populateSelect(items, codeTextArea, withFocus) {
    var select = jQuery("<select id='matches'></select>").css("position", "absolute").appendTo(jQuery("body"));
    positionSelectObject(select, codeTextArea);
	
    jQuery.each(items, function () {
        select.get(0).options[select.get(0).options.length] = new Option(this, this);
    });
	
	select.attr('size', 3).bind('keyup', function (e) {
		if (e.keyCode == 13 || e.keyCode == 32) {
			commitSelectOptionToTextElement($(this), codeTextArea);
        }
    });
	
	select.bind("change", function() {
		// TODO need to allow selection for non-datatypes
		//commitSelectOptionToTextElement($(this), codeTextArea);
	});
	
	select.bind("keydown", function(e) {
		// Stop backspace from going to previous page in browser history
		if (e.keyCode === 8) { e.preventDefault(); }
	});
    
    if (withFocus) {
        select.focus();
    }
    
}

function positionSelectObject(select, codeTextArea) {
	var range;
	var left;
	var top;
	
	if (codeTextArea.get(0).createTextRange) {
		range = document.selection.createRange();
		var rect = range.getClientRects()[range.getClientRects().length - 1];
		top = rect.bottom;
		left = rect.left;
	}
	else {
		range = document.getSelection();
		left = codeTextArea.offset().left + codeTextArea.width();
		top = codeTextArea.offset().top;
	}
	
	log('Left: ' + left + ' - Top:' + top);
	select.offset({ 
		top: top, 
		left: left
	});
}

function commitSelectOptionToTextElement(self, codeTextArea) {
	self.remove();
	codeTextArea.appendText(self.val()).focus();
	selectText(codeTextArea, getCaret(codeTextArea) + self.val().length, getCaret(codeTextArea) + self.val().length); // puts cursor at the end of the selected value
}

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

function replaceTextAndHighlight(self, lastWord, newWord) {
    self.appendText(newWord.replace(lastWord, ''));
    
	var start = getCaret(self) - (newWord.length - lastWord.length);  // Set start of the highlight
    var end = start + (newWord.length - lastWord.length);  // Set end of the highlight
    
    selectText(self, start, end);  // Set the selected text to the remainder of the letters from what was actually input
    return self;
}

function evaluateTypes(self, lastWord, model) {
    var matches = [];
    
    jQuery.each(model.keywords, function() {
		var keyword = this;
        if (typeof keyword.name === 'function') { return; }
        
        var pattern = new RegExp('^' + lastWord);
        var isMatch = pattern.test(keyword.name);
        
        if (isMatch) {
            // Checks the datatypes for match and then adds the methods to the matches array
            jQuery.each(model.dataTypes, function() {
                var dataType = this;
                var isDataTypeMatch = keyword.type === dataType.type;
                if (isDataTypeMatch) {
                   jQuery.each(dataType.methods, function() {
                        var method = this;
                        if (typeof method === 'function') { return; }
						var tempObj = new Object();
						var i = matches.length; 
						while(i--)
						{
							tempObj[matches[i]]='';
						}
                        if (!(method in tempObj)) { matches.push(method); }
                    });
                }
            });
        }
    });
    
	if (matches.length > 0) {
		populateSelect(matches, self, true);
	}
	
    return matches;
}

function evaluateKeywords(self, lastWord, model) {
    var keywords = [];
    jQuery.each(model.keywords, function() {
        keywords.push(this.name);
    });
    
    var matches = autoComplete(self, lastWord, keywords);
    if (matches.length > 1) {
        // TODO
        populateSelect(matches, self, false);
    }
    
    return self;
}

function autoComplete(self, wordToMatch, keywords) {
    var matches = new Array();
    jQuery.each(keywords, function() {
        if (typeof this === 'function') { return; }
        
        var pattern = new RegExp('^' + wordToMatch);
        var isMatch = pattern.test(this);
        
        if (isMatch) {
            matches.push(this);
        }
    });
    
    if (matches.length > 0) {
        replaceTextAndHighlight(self, wordToMatch, matches[0]);
    }
    
    return matches;
}

function executeCodeCompletion(self, model, forDataTypes) {
    var lastWord = getWord(self)
	
    // Doesn't evaluate keywords on a space
    if (lastWord.length === 0) { return self;    }
    
    if (!forDataTypes) {
        // Evaluate model.keywords
        evaluateKeywords(self, lastWord, model);
    }
    else {
		evaluateTypes(self, lastWord, model);
    }
    
    return self;
}

function getWord(elem) {
    var location = getCaret(elem);
    
    // letters will be reversed
    var temp = "";
	var i = location; 
	while (i--) {
		var val = elem.val();
        var letter = (val.length >= 0) ? val.charAt(i) : 0;
        if (letter.charCodeAt(0) === 32 || letter.charAt(0) === "\n" || letter.charAt(0) === "(") {
            break;
        }
		if (letter.charAt(0) === "." || letter.charAt(0) === ")") { continue; }
        temp += letter;
	}
    
    // reverse the letters
    var word = reverseText(temp);
    
    return word;
}

function getCaret(elem) { 
	var el = $(elem).get(0);
  
	if (el.selectionStart) { 
		return el.selectionStart; 
	} 
	else if (document.selection) { 
		// Set focus on the element
       el.focus ();
       // To get cursor position, get empty selection range
       var oSel = document.selection.createRange ();
       // Move selection start to 0 position
       oSel.moveStart ('character', -el.value.length);
       // The caret position is selection length
       return oSel.text.length;
	}  
	return 0; 
}

function reverseText(text) {
    var word = "";
	var i = text.length;
	while (i--) {
		word += text[i];
	}
    return word;
}

function insertAtCursor(myField, myValue) {
	//IE support
	if (document.selection) {
		myField.focus();
		sel = document.selection.createRange();
		sel.text = myValue;
	}
	//MOZILLA/NETSCAPE support
	else if (myField.selectionStart || myField.selectionStart == '0') {
		var startPos = myField.selectionStart;
		var endPos = myField.selectionEnd;
		myField.value = myField.value.substring(0, startPos)
					  + myValue
					  + myField.value.substring(endPos, myField.value.length);
	} else {
		myField.value += myValue;
	}
}

(function($) {
    $.fn.codeComplete = function (model) {
    
        model = $.extend({
            //keywords: [ { name: 'if', type: 'syntax' }, { name: 'else', type: 'syntax' }, { name: 'firstname', type: 'string' }, { name: 'age', type: 'int32' } ],
            //dataTypes: [ { type: 'string', methods: [ 'tostring', 'toupper', 'tolower' ] }, { type: 'int32', methods: [ 'tostring' ] } ]
        }, model);
        
		// Sort all the keyword names ascending
        model.keywords.sort(function(a, b) { 
			if (a.name === b.name) { return 0; }
			return (a.name < b.name) ? -1 : 1; 
		});
		
        this.bind("keyup", function(e) {
			var self = $(this);
            log('Key ANSII Code: ' + e.keyCode);
			
			switch (e.keyCode) {
				case 8: // Backspace
				case 13: // Enter
				case 37:  // Left Arrow
				case 38:  // Top Arrow
				case 39:  // Right Arrow
				case 40:  // Bottom Arrow
				case 16:  // SHIFT
				case 17:  // ALT
				case 18:  // CTRL
					e.preventDefault();
					break;
				case 190: // Period
					executeCodeCompletion(self, model, true);
					break;
				default:
					executeCodeCompletion(self, model);
			}
        });
        
        this.bind('keydown', function(e) {
            var self = $(this);
			
			// Removes dropdown if present
			jQuery("#matches").remove();
            
			switch (e.keyCode) {
				case 13: // Enter
				case 32: // Spacebar
				case 190: // Period
					self.moveToEndOfSelectedText();
					break;
			}
            
        });
        
        return this;
    };
    
    $.fn.appendText = function(text) {
		insertAtCursor(this.get(0), text);
		return this;
    };
    
    $.fn.valLength = function() {
        return this.val().length;
    };
	
	$.fn.moveToEndOfSelectedText = function() {
		var el = $(this).get(0);
		if (el.selectionEnd) { // Chrome
			el.selectionStart = el.selectionEnd; 
		} 
		else if (document.selection) {  // IE
			var range = document.selection.createRange();
			range.collapse(false);
			range.select();
		}
		return this;
	};
})(jQuery);