var canvas = document.getElementById("canvas");
var g2 = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 300;
g2.font = '20px "Fira Code", monospace';
g2.textBaseline = "top";
var cellWidth = 12;//g2.measureText("A").width;
function fillRect (x, y, width, height, color) {
    g2.fillStyle = color;
    g2.fillRect(x, y, width, height);
}
function drawText (x, y, text, color) {
    g2.fillStyle = color;
    g2.fillText(text, x, y);
}

function highlight1 (row, startCol) { //[1,2,->2,]
    var y = row * 20;
    var x = startCol * cellWidth;
    var width = edoc.lines[row].length - startCol;
    width *= cellWidth;
    fillRect(x, y, width, 20, "red")
}
function highlight2 (row, endCol) {//->[1,2,121||]
    var y = row * 20;
    var width = endCol * cellWidth;
    var x = endCol * cellWidth;
    fillRect(0, y, width, 20, "red")
}
function highlight (row) {
    var y = row * 20;
    var width = edoc.lines[row].length * cellWidth;
    fillRect(0, y, width, 20, "red")
}
function renderSelection () {
    var start = edoc.select.start;
    var end = edoc.select.end;
    if (start.lno == end.lno) {
        highlight2(start.lno, start.col);
    } else {
        var s1 = start.lno < end.lno ? start : end;
        var s2 = start.lno < end.lno ? end : start;
        highlight1(s1.lno, s1.col);
        highlight2(s2.lno, s2.col);
        for (var i = s1.lno + 1; i <= s2.lno - 1; i++) {
            highlight(i);
        }
    }

}
function main () {
    fillRect(0, 0, 700, 700, "black");
    if (edoc.selectionOn) {
        renderSelection();
    }
    for (var i = 0; i < edoc.lines.length; i++) {
        var text = edoc.lines[i].join("");
        drawText(0, i * 20, text, "white");
    }
    var now = Date.now();
    if (now - cursorLastRendered > 300) {
        cursorLastRendered = now;
        showCursor = !showCursor;
    }

    if (showCursor) {
        drawCursor();
    }
}

function drawCursor () {
    //console.log(cursorX,cursorY,edoc.col,edoc.lno)
    var x = edoc.col * cellWidth;
    var y = edoc.lno * 20;
    fillRect(x, y, 3, 20, "white");
}


setInterval(main, 10);


class TextEditDocument {
    constructor() {
        this.lines = [[]];
        this.lno = 0;
        this.col = 0;
        this.selectionOn = false;
        this.select = {
            start: {
                lno: 0,
                col: 0
            },
            end: {
                lno: 0,
                col: 0
            }
        };
        this.clipboard = null;
    }

    newLine () {
        if (this.reachedStartOfDoc()) {
            this.lines.splice(0, 0, []);
            this.lno = 1;
            this.col = 0;
        } else if (this.reachedEndOfDoc()) {
            this.lines.push([]);
            this.lno++;
            this.col = 0;
        } else if (this.reachedEndOfLine()) {
            this.lno++;
            this.lines.splice(this.lno, 0, []);
            this.col = 0;
        } else if (this.reachedStartOfLine()) {
            this.lines.splice(this.lno, 0, []);
            this.lno++;
            this.col = 0;
        } else {
            var leftout = this.lines[this.lno].splice(this.col);
            this.lno++;
            this.lines.splice(this.lno, 0, leftout);
            this.col = 0;
        }

    }
    reachedEndOfDoc () {
        console.log(this.lno, this.lines.length);
        return this.lno == this.lines.length - 1
            && this.col == this.lines[this.lno].length;
    }

    reachedStartOfDoc () {
        return this.lno == 0 && this.col == 0;
    }

    reachedEndOfLine () {
        return this.col == this.lines[this.lno].length;
    }
    reachedStartOfLine () {
        return this.col == 0;
    }
    putChar (c) {
        var currentLine = this.lines[this.lno];
        currentLine.splice(this.col, 0, [c])
        this.col++;
        this.selectionOn = false;
    }
    getLine (l) {
        return this.lines[l].join("");
    }


    moveRight (shiftKey) {
        this._updateSelectionBefore(shiftKey);
        this._moveRight();
        this._updateSelectionAfter(shiftKey);
    }

    _updateSelectionBefore (shiftKey) {
        if (shiftKey) {
            if (!this.selectionOn) {
                this.selectionOn = true;
                this.select.start.lno = this.lno;
                this.select.start.col = this.col;
                this.select.end.lno = this.lno;
                this.select.end.col = this.col;
            }
        } else {
            this.selectionOn = false;
        }
    }
    _updateSelectionAfter (shiftKey) {
        if (shiftKey) {
            if (this.selectionOn) {
                this.select.end.lno = this.lno;
                this.select.end.col = this.col;
            }
        } else {
            this.selectionOn = false;
        }
    }
    _moveRight () {
        if (this.reachedEndOfDoc()) {
            return;
        }
        if (this.reachedEndOfLine()) {
            this.lno++;
            this.col = 0;
            return;
        }
        this.col++;


    }

    moveLeft (shiftKey) {
        this._updateSelectionBefore(shiftKey);
        this._moveLeft();
        this._updateSelectionAfter(shiftKey);
    }

    _moveLeft () {
        if (this.reachedStartOfDoc()) {
            return;
        }
        if (this.reachedStartOfLine()) {
            this.lno--;
            this.col = this.lines[this.lno].length;
            return;
        }
        this.col--;
    }

    moveDown (shiftKey) {
        this._updateSelectionBefore(shiftKey);
        this._moveDown();
        this._updateSelectionAfter(shiftKey);
    }

    _moveDown () {
        if (this.lines.length - 1 == this.lno) {
            return;
        }
        this.lno++;
        this.col = Math.min(this.col, this.lines[this.lno].length);
    }

    moveUp (shiftKey) {
        this._updateSelectionBefore(shiftKey);
        this._moveUp();
        this._updateSelectionAfter(shiftKey);
    }

    _moveUp () {
        if (this.lno == 0) {
            return;
        }
        this.lno--;
        this.col = Math.min(this.col, this.lines[this.lno].length);
    }


    backspace () {
        if (this.reachedStartOfDoc()) {
            return;
        }
        if (this.reachedStartOfLine()) {
            var oldLineText = this.lines[this.lno];
            var oldLine = this.lno;
            this.lno--;
            this.col = this.lines[this.lno].length;
            this.lines[this.lno] = this.lines[this.lno].concat(oldLineText);
            this.lines.splice(oldLine, 1);
            return;
        }
        this.lines[this.lno].splice(this.col - 1, 1);
        this.col--;
    }
    deleteChar () {
        if (this.reachedEndOfDoc()) {
            return;
        }
        if (this.reachedEndOfLine()) {
            var temp = this.lines[this.lno + 1];
            this.lines[this.lno] = this.lines[this.lno].concat(temp);
            this.lines.splice(this.lno + 1, 1);
            return;
        }
        var currentLine = this.lines[this.lno];
        if (currentLine.length == 1 && this.col == 0) {
            currentLine.splice(0, 1);
            return;
        }
        this.lines[this.lno].splice(this.col, 1);
    }

    copyArray (arr, from, to) {
        var result = [];
        for (var i = from; i <= to; i++) {
            result.push(arr[i]);
        }
        return result;
    }
    getSelectedData () {

        var start = edoc.select.start;
        var end = edoc.select.end;
        if (start.lno == end.lno) {
            return [this.copyArray(this.lines[start.lno], 0, start.col)];
        } else {
            var result = [];
            var s1 = start.lno < end.lno ? start : end;
            var s2 = start.lno < end.lno ? end : start;
            var l1 = this.lines[s1.lno];
            //start from col
            result.push(this.copyArray(l, s1.start, l1.length - 1));
            for (var i = s1.lno + 1; i <= s2.lno - 1; i++) {
                var l = this.lines[i];
                result.push(this.copyArray(l, 0, l.length - 1))
            }
            //end at col
            result.push(this.copyArray(l, 0, s2.col));
            return result;
        }
    }
    cutSelection () {
        if (!this.selectionOn) return
        this.selectionOn = false;
        var start = edoc.select.start;
        var end = edoc.select.end;
        if (start.lno == end.lno) {
            var l = this.lines[start.lno]
            var deletedElements = l.splice(start.col,l.length);
            this.clipboard=[deletedElements.join("")];
        } else {
            var s1 = start.lno < end.lno ? start : end;
            var s2 = start.lno < end.lno ? end : start;
            var t = this.lines[s1.lno];
            var startLine = t.splice(s1.col, t.length);
            var endLine = this.lines[s2.lno].splice(0,s2.col);
            var result = [startLine];
            
            var diff = s2.lno - s1.lno;
            var deletedLines = this.lines.splice(s1.lno+1,diff);
            result = result.concat(deletedLines);
            result.push(endLine);
            this.clipboard =result.map(l=>l.join("")).join("\n");
        }
        console.log("cut clipbaord",this.clipboard);
    }

    copySelection () {
        if (!this.selectionOn) return
        this.selectionOn = false;
        var start = edoc.select.start;
        var end = edoc.select.end;
        if (start.lno == end.lno) {
            var l = this.lines[start.lno]
            var deletedElements = l.slice(start.col, l.length);
            this.clipboard = [deletedElements.join("")];
        } else {
            var s1 = start.lno < end.lno ? start : end;
            var s2 = start.lno < end.lno ? end : start;
            var t = this.lines[s1.lno];
            var startLine = t.slice(s1.col, t.length);
            var endLine = this.lines[s2.lno].slice(0, s2.col);
            var result = [startLine];

            var diff = s2.lno - s1.lno;
            var deletedLines = this.lines.slice(s1.lno + 1, diff);
            result = result.concat(deletedLines);
            result.push(endLine);
            this.clipboard = result.map(l => l.join("")).join("\n");
        }
        console.log("copy clipbaord", this.clipboard);
    }

    pasteSelection () {
        if (this.clipboard) {
            for(var i=0;i<this.clipboard.length;i++){
                var c = this.clipboard[i];
                if(c=='\n'){
                    this.newLine();
                }else{
                    this.putChar(c);
                }
            }
            this.clipboard=null;
        }
    }

}
var edoc = new TextEditDocument();
var keyPressed = new Array();
var cursorLastRendered = Date.now();
var showCursor = false;
var cursorX = 0;
var cursorY = 0;

document.addEventListener("keydown", function (e) {
    var shiftOn = e.shiftKey;
    var ctrlOn = e.ctrlKey;
    if (e.key == "Backspace") {
        cursorX--;
        edoc.backspace();
    } else if (e.key == "ArrowLeft") {
        edoc.moveLeft(shiftOn);
    } else if (e.key == "ArrowRight") {
        edoc.moveRight(shiftOn);
    } else if (e.key == "ArrowDown") {
        edoc.moveDown(shiftOn);
    } else if (e.key == "ArrowUp") {
        edoc.moveUp(shiftOn);
    } else if (e.key == "Delete") {
        edoc.deleteChar();
    } else if ((e.key == "x" || e.key === 'X') && ctrlOn) {
        edoc.cutSelection();
    } else if ((e.key == "v" || e.key === 'V') && ctrlOn) {
        edoc.pasteSelection();
    } else if ((e.key == "c" || e.key === 'C') && ctrlOn) {
        edoc.copySelection();
    } else if (e.key == "Enter") {
        cursorY++;
        cursorX = 0;
        edoc.newLine();
    } else {
        cursorX++;
        if (e.key.length == 1)
            edoc.putChar(e.key);
    }
});
 