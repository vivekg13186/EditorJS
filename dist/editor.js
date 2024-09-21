export class EditDoc {
    constructor() {
        this.lines = [[]];
        this.lno = 0;
        this.col = 0;
        this.selectionOn = false;
        this.select = {
            start: {
                lno: 0,
                col: 0,
            },
            end: {
                lno: 0,
                col: 0,
            },
        };
        this.clipboard = null;
    }
    newLine() {
        if (this.reachedStartOfDoc()) {
            this.lines.splice(0, 0, []);
            this.lno = 1;
            this.col = 0;
        }
        else if (this.reachedEndOfDoc()) {
            this.lines.push([]);
            this.lno++;
            this.col = 0;
        }
        else if (this.reachedEndOfLine()) {
            this.lno++;
            this.lines.splice(this.lno, 0, []);
            this.col = 0;
        }
        else if (this.reachedStartOfLine()) {
            this.lines.splice(this.lno, 0, []);
            this.lno++;
            this.col = 0;
        }
        else {
            var leftout = this.lines[this.lno].splice(this.col);
            this.lno++;
            this.lines.splice(this.lno, 0, leftout);
            this.col = 0;
        }
    }
    reachedEndOfDoc() {
        return (this.lno == this.lines.length - 1 &&
            this.col == this.lines[this.lno].length);
    }
    reachedStartOfDoc() {
        return this.lno == 0 && this.col == 0;
    }
    reachedEndOfLine() {
        return this.col == this.lines[this.lno].length + 1;
    }
    reachedStartOfLine() {
        return this.col == 0;
    }
    putChar(c) {
        var currentLine = this.lines[this.lno];
        currentLine.splice(this.col, 0, c);
        this.col++;
        this.selectionOn = false;
    }
    getLine(l) {
        return this.lines[l].join("");
    }
    moveRight(shiftKey) {
        this._updateSelectionBefore(shiftKey);
        this._moveRight();
        this._updateSelectionAfter(shiftKey);
    }
    _updateSelectionBefore(shiftKey) {
        if (shiftKey) {
            if (!this.selectionOn) {
                this.selectionOn = true;
                this.select.start.lno = this.lno;
                this.select.start.col = this.col;
                this.select.end.lno = this.lno;
                this.select.end.col = this.col;
            }
        }
        else {
            this.selectionOn = false;
        }
    }
    _updateSelectionAfter(shiftKey) {
        if (shiftKey) {
            if (this.selectionOn) {
                this.select.end.lno = this.lno;
                this.select.end.col = this.col;
            }
        }
        else {
            this.selectionOn = false;
        }
    }
    _moveRight() {
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
    moveLeft(shiftKey) {
        this._updateSelectionBefore(shiftKey);
        this._moveLeft();
        this._updateSelectionAfter(shiftKey);
    }
    _moveLeft() {
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
    moveDown(shiftKey) {
        this._updateSelectionBefore(shiftKey);
        this._moveDown();
        this._updateSelectionAfter(shiftKey);
    }
    _moveDown() {
        if (this.lines.length - 1 == this.lno) {
            return;
        }
        this.lno++;
        this.col = Math.min(this.col, this.lines[this.lno].length);
    }
    moveUp(shiftKey) {
        this._updateSelectionBefore(shiftKey);
        this._moveUp();
        this._updateSelectionAfter(shiftKey);
    }
    _moveUp() {
        if (this.lno == 0) {
            return;
        }
        this.lno--;
        this.col = Math.min(this.col, this.lines[this.lno].length);
    }
    backspace() {
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
            this.col++;
            return;
        }
        this.lines[this.lno].splice(this.col + 1, 1);
        this.col--;
    }
    deleteChar() {
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
    copyArray(arr, from, to) {
        var result = [];
        for (var i = from; i <= to; i++) {
            result.push(arr[i]);
        }
        return result;
    }
    cutSelection() {
        if (!this.selectionOn)
            return;
        this.selectionOn = false;
        var start = this.select.start;
        var end = this.select.end;
        if (end.col == 0) {
            end.lno--;
            end.lno = Math.max(end.lno, 0);
        }
        if (start.lno == end.lno) {
            var l = this.lines[start.lno];
            var minCol = Math.min(start.col, end.col);
            var deletedElements = l.splice(minCol, l.length);
            this.clipboard = deletedElements.join("");
        }
        else {
            var s1 = start.lno < end.lno ? start : end;
            var s2 = start.lno < end.lno ? end : start;
            var t = this.lines[s1.lno];
            var startLine = t.splice(s1.col, t.length);
            var endLine = this.lines[s2.lno].splice(0, s2.col);
            var result = [startLine];
            var diff = s2.lno - s1.lno;
            var deletedLines = this.lines.splice(s1.lno + 1, diff);
            result = result.concat(deletedLines);
            result.push(endLine);
            this.clipboard = result.map((l) => l.join("")).join("\n");
        }
        this.lno = start.lno < end.lno ? start.lno : end.lno;
        this.col = this.lines[this.lno].length;
    }
    deleteSelection() {
        this.selectionOn = false;
        var temp = this.clipboard;
        this.cutSelection();
        this.clipboard = temp;
    }
    copySelection() {
        if (!this.selectionOn)
            return;
        this.selectionOn = false;
        var start = this.select.start;
        var end = this.select.end;
        if (end.col == 0) {
            end.lno--;
            end.lno = Math.max(end.lno, 0);
        }
        if (start.lno == end.lno) {
            var l = this.lines[start.lno];
            var deletedElements = l.slice(start.col, l.length);
            this.clipboard = deletedElements.join("");
        }
        else {
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
            this.clipboard = result.map((l) => l.join("")).join("\n");
        }
        console.log("copy clipbaord", this.clipboard);
    }
    pasteSelection() {
        if (this.clipboard) {
            for (var i = 0; i < this.clipboard.length; i++) {
                var c = this.clipboard[i];
                if (c == "\n") {
                    this.newLine();
                }
                else {
                    this.putChar(c);
                }
            }
            this.clipboard = null;
        }
    }
}
//# sourceMappingURL=editor.js.map