/*
    model: {
        keywords: <Array of key/value pairs of type String> ex. [ { name: 'if', type: 'syntax' }, { name: 'else', type: 'syntax' }, { name: 'firstname', type: 'string' } ],
        dataTypes: <Array of key/value pairs> ex. [ { type: 'string', methods: [ 'tostring', 'toupper', 'tolower' ] }, { type: 'int', methods: [ 'tostring' ] } ]
    }
    
    keywords do not need a value for type as it will be checked against datatypes property when a period is pressed.
*/

function populateSelect(items, codeTextArea, withFocus) {
    var select = jQuery("<select id='matches'></select>").appendTo(jQuery("body"));
    
    jQuery.each(items, function () {
        select.get(0).options[select.get(0).options.length] = new Option(this, this);
    });
    select.attr('size', 3).bind('keyup', function (e) {
        if (e.keyCode == 13 || e.keyCode == 32) {
            codeTextArea.appendText(jQuery(this).val());
            jQuery(this).remove();
            codeTextArea.focus();
            selectText(codeTextArea, codeTextArea.valLength(), codeTextArea.valLength());
        }
    });
    
    if (withFocus) {
        select.focus();
    }
    
}

function clearSelectedText() {
    if (window.getSelection) {
        if (window.getSelection().empty) {  // Chrome
            window.getSelection().empty();
        } 
        else if (window.getSelection().removeAllRanges) {  // Firefox
            window.getSelection().removeAllRanges();
        }
    } 
    else if (document.selection) {  // IE
        document.selection.empty();
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
    self.val(valueLessLastWord + newWord);
    
    var start = valueLessLastWord.length + lastWord.length;                                                        // Set start of the highlight
    var end = self.valLength();                                                                                                    // Set end of the highlight
    
    selectText(self, start, end);                                                                                                    // Set the selected text to the remainder of the letters from what was actually input
    return self;
}

function evaluateTypes(self, lastWord, model) {
    var matches = [];
    
    for (var i in model.keywords) {
        var keyword = model.keywords[i];
        
        log('Keyword to be evaluated: ' + keyword.name);
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
    log('evaluateKeywords method was executed.');
    
    var keywords = [];
    for (var i in model.keywords) {
        keywords.push(model.keywords[i].name);
    }
    
    var matches = autoComplete(self, lastWord, keywords);
    if (matches.length > 1) {
        // TODO
        //populateSelect(matches, self, false);
    }
    
    return self;
}

function autoComplete(self, wordToMatch, keywords) {
    var matches = [];
    for (var i in keywords) {
        var keyword = keywords[i];
        
        log('Keyword to be evaluated: ' + keyword);
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
    var lastWord = getWord(self);
    log('Last Word: ' + lastWord);
    
    // Doesn't evaluate keywords on a space
    if (lastWord.length === 0) { return self;    }
    
    if (!forDataTypes) {
        // Evaluate model.keywords
        evaluateKeywords(self, lastWord, model);
    }
    else {
        // if returning matches length is greater then 0 then add the period
        if (evaluateTypes(self, lastWord, model).length > 0) {
            self.appendText('.');
        }
    }
    
    return self;
}

function getWord(elem) {
    var location = getCaret($(elem).get(0));
    
    // letters will be reversed
    var temp = "";
    for(var i = location; i >= 0; i--) {
        var val = elem.val();
        var letter = (val.length >= 0) ? val.charAt(i) : 0;
        if (letter.charCodeAt(0) === 32 || letter.charAt(0) === "\n" || letter.charAt(0) === "(") {
            break;
        }
        temp += letter;
    }
    
    // reverse the letters
    var word = reverseText(temp);
    
    return word;
}

function getCaret(el) { 
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

(function($) {
    $.fn.codeComplete = function (model) {
    
        model = $.extend({
            //keywords: [ { name: 'if', type: 'syntax' }, { name: 'else', type: 'syntax' }, { name: 'firstname', type: 'string' }, { name: 'age', type: 'int32' } ],
            //dataTypes: [ { type: 'string', methods: [ 'tostring', 'toupper', 'tolower' ] }, { type: 'int32', methods: [ 'tostring' ] } ]
        }, model);
        model.keywords.sort();
        
        this.data("model", model);
        
        this.bind("keyup", function(e) {
            log('Key ANSII Code: ' + e.keyCode);
            if (e.keyCode === 8) { return this; }
            
            return executeCodeCompletion($(this), model);
        });
        
        this.bind('keydown', function(e) {
            var self = $(this);
            
            // SpaceBar
            if (e.keyCode === 32) {
                log('Spacebar was pressed');
                selectText(self, self.valLength(), self.valLength());
            }
            
            // Enter
            if (e.keyCode === 13) {
                log('Enter was pressed');
                executeCodeCompletion($(this), model);
                $(this).appendText(" ");
            }
            
            // Period
            if (e.keyCode === 190) {
                log('Period was pressed');
                selectText(self, self.valLength(), self.valLength());
                executeCodeCompletion($(this), model, true);
            }
            
        });
        
        return this;
    };
    
    $.fn.appendText = function(text) {
        this.val(function(index, value) {
            return value + text;
        });
    };
    
    $.fn.valLength = function() {
        return this.val().length;
    }
})(jQuery);