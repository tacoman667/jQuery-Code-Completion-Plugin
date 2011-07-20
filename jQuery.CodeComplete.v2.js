/*
    model: {
        keywords: <Array of key/value pairs of type String> ex. [ { name: 'if', type: 'syntax' }, { name: 'else', type: 'syntax' }, { name: 'firstname', type: 'string' } ],
        dataTypes: <Array of key/value pairs> ex. [ { type: 'string', methods: [ 'tostring', 'toupper', 'tolower' ] }, { type: 'int', methods: [ 'tostring' ] } ]
    }
    
    keywords do not need a value for type as it will be checked against datatypes property when a period is pressed.
*/

function populateSelect(items, codeTextArea, withFocus) {
    var select = jQuery("<select id='matches'></select>").appendTo(jQuery("body"));
    select.offset({ 
		top: codeTextArea.offset().top, 
		left: codeTextArea.offset().left + codeTextArea.width()
	});
	
    jQuery.each(items, function () {
        select.get(0).options[select.get(0).options.length] = new Option(this, this);
    });
    select.attr('size', 3).bind('keyup mouseup', function (e) {
        if (e.keyCode == 13 || e.keyCode == 32) {
            codeTextArea.appendText(jQuery(this).val());  // TODO make this insert at cursor instead of the end of the textarea.val()
            jQuery(this).remove();
            codeTextArea.focus();
            selectText(codeTextArea, codeTextArea.valLength(), codeTextArea.valLength());
        }
    });
    
    if (withFocus) {
        select.focus();
    }
    
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

Array.prototype.contains = function (value) {
    for (var i in this) {
        if (this[i].type) { // This is to test the dataType array
            if (this[i].type === value)
                return true;
        }
        else {
            if (this[i] === value)
                return true;
        }
    }
    return false;
}

function replaceTextAndHighlight(self, lastWord, newWord) {
    var valueLessLastWord = self.val().substring(0, (self.valLength() - lastWord.length));
    self.appendText(newWord.replace(lastWord, ''));  // TODO make this insert at cursor instead of the end of the textarea.val()
    
    var start = valueLessLastWord.length + lastWord.length;                                                        // Set start of the highlight
    var end = self.valLength();                                                                                                    // Set end of the highlight
    
    selectText(self, start, end);                                                                                                    // Set the selected text to the remainder of the letters from what was actually input
    return self;
}

function evaluateTypes(self, lastWord, model) {
    var matches = [];
    
    for (var i in model.keywords) {
        var keyword = model.keywords[i];
        
        if (typeof keyword.name === 'function') { continue; }
        
        var pattern = new RegExp('^' + lastWord);
        var isMatch = pattern.test(keyword.name);
        
        if (isMatch) {
            // Checks the datatypes for match and then adds the methods to the matches array
            for (var x in model.dataTypes) {
                var dataType = model.dataTypes[x];
                var isDataTypeMatch = keyword.type === dataType.type;
                if (isDataTypeMatch) {
                    for (var y in dataType.methods) {
                        var method = dataType.methods[y];
                        if (typeof method === 'function') { continue; }
                        matches.push(method);
                    }
                }
            }
        }
    }
    
    //autoComplete(self, lastWord, matches);
    
    if (matches.length > 0) {
        populateSelect(matches, self, true);
    }
    
    return matches;
}

function evaluateKeywords(self, lastWord, model) {
    var keywords = [];
    for (var i in model.keywords) {
        keywords.push(model.keywords[i].name);
    }
    
    var matches = autoComplete(self, lastWord, keywords);
    if (matches.length > 1) {
        // TODO
        populateSelect(matches, self, false);
    }
    
    return self;
}

function autoComplete(self, wordToMatch, keywords) {
    var matches = [];
    for (var i in keywords) {
        var keyword = keywords[i];
        if (typeof keyword === 'function') { continue; }
        
        var pattern = new RegExp('^' + wordToMatch);
        var isMatch = pattern.test(keyword);
        
        if (isMatch) {
            matches.push(keyword);
        }
    }
    
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
    for(var i = location; i >= 0; i--) {
        var val = elem.val();
        var letter = (val.length >= 0) ? val.charAt(i) : 0;
        if (letter.charCodeAt(0) === 32 || letter.charAt(0) === "\n" || letter.charAt(0) === "(" || letter.charAt(0) === ")") {
            break;
        }
		if (letter.charAt(0) === ".") { continue; }
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
  } else if (document.selection) { 
    el.focus(); 

    var r = document.selection.createRange(); 
    if (r == null) { 
      return 0; 
    } 

    var re = el.createTextRange(), 
        rc = re.duplicate(); 
    re.moveToBookmark(r.getBookmark()); 
    rc.setEndPoint('EndToStart', re); 

    return rc.text.length; 
  }  
  return 0; 
}

function reverseText(text) {
    var word = "";
    for(var i = text.length - 1; i > -1; i--) {
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
					selectText(self, self.valLength(), self.valLength());
					break;
			}
            
        });
        
        return this;
    };
    
    $.fn.appendText = function(text) {
		insertAtCursor(this.get(0), text);
		var location = getCaret(this);
		selectText(this, location + text.length, location + text.length);
    };
    
    $.fn.valLength = function() {
        return this.val().length;
    }
})(jQuery);