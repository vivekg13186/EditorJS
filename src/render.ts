import {
  Editor_BG,
  Editor_Current_Line_BG,
  Editor_Gutter,
  Editor_Gutter_Text,
  Editor_Selection_Color,
  Editor_Text,
} from "./colors.js";
import { EditDoc } from "./editor.js";

export class TextRender {
  canvas: HTMLCanvasElement;
  g2: CanvasRenderingContext2D | null;
  cellWidth: number = 0;
  cellHeight: number;
  scrollY = 0;
  edoc: EditDoc | null = null;
  cursorLastRendered: number = 0;
  showCursor: boolean = false;
  linesToRender: number = 0;
  gutterWidth: number = 0;
  getWidth() {
    return this.canvas.width;
  }
  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.g2 = canvas.getContext("2d", { alpha: false });

    canvas.width = width;
    canvas.height = height;
    this.cellHeight = 14;
    if (this.g2) {
      this.g2.font = this.cellHeight + "px code";
      this.g2.textBaseline = "top";
      this.g2.textRendering = "geometricPrecision";
      this.cellWidth = this.g2.measureText("Z").width;
    }
  }
  setDoc(t: EditDoc) {
    this.edoc = t;
  }
  fillRect(x: number, y: number, width: number, height: number, color: string) {
    if (this.g2) {
      this.g2.fillStyle = color;
      this.g2.fillRect(x, y, width, height);
    }
  }
  drawText(x: number, y: number, text: string, color: string) {
    if (this.g2) {
      this.g2.fillStyle = color;
      this.g2.fillText(text, x, y);
    }
  }

  highlight1(row: number, startCol: number) {
    if (this.edoc) {
      row = row - this.scrollY;
      var y = row * this.cellHeight;
      var x = startCol * this.cellWidth;
      var width = this.edoc.lines[row].length - startCol;
      width *= this.cellWidth;
      this.fillRect(x, y, width, this.cellHeight, Editor_Selection_Color);
    }
  }
  highlight2(row: number, endCol: number) {
    row = row - this.scrollY;
    var y = row * this.cellHeight;
    var width = endCol * this.cellWidth;
    var x = endCol * this.cellWidth;
    this.fillRect(0, y, width, this.cellHeight, Editor_Selection_Color);
  }
  highlight(row: number) {
    if (this.edoc) {
      row = row - this.scrollY;
      var y = row * this.cellHeight;
      var width = this.edoc.lines[row].length * this.cellWidth;
      this.fillRect(0, y, width, this.cellHeight, Editor_Selection_Color);
    }
  }
  highlightStartEnd(row: number, start: number, end: number) {
    row = row - this.scrollY;
    var y = row * this.cellHeight;
    var x = start * this.cellWidth;
    var width = (end - start) * this.cellWidth;
    this.fillRect(x, y, width, this.cellHeight, Editor_Selection_Color);
  }
  renderSelection() {
    if (this.edoc) {
      var start = this.edoc.select.start;
      var end = this.edoc.select.end;
      if (start.lno == end.lno) {
        var endC = Math.max(start.col, end.col);
        var startC = Math.min(start.col, end.col);
        console.log(startC, endC);
        this.highlightStartEnd(start.lno, startC, endC);
      } else {
        var s1 = start.lno < end.lno ? start : end;
        var s2 = start.lno < end.lno ? end : start;
        this.highlight1(s1.lno, s1.col);
        this.highlight2(s2.lno, s2.col);
        for (var i = s1.lno + 1; i <= s2.lno - 1; i++) {
          this.highlight(i);
        }
      }
    }
  }

  renderTextArea() {
    if (this.edoc) {
      var screenX = 0;
      for (var i = this.scrollY; i < this.linesToRender; i++) {
        var text = this.edoc.lines[i].join("");
        this.drawText(0, screenX * this.cellHeight, text, Editor_Text);
        screenX++;
      }
    }
  }
  computePos() {
    if (this.edoc) {
      this.gutterWidth = this.cellWidth * 5;
      var minY = this.scrollY + 3;
      var totalRows = this.canvas.height / this.cellHeight;
      var maxY = this.scrollY + totalRows - 3;
      if (this.edoc.lno < minY) {
        this.scrollY--;
        if (this.scrollY < 0) this.scrollY = 0;
      }
      if (this.edoc.lno > maxY) {
        this.scrollY++;
      }

      this.linesToRender = this.scrollY + totalRows;
      if (this.linesToRender > this.edoc.lines.length) {
        this.linesToRender = this.edoc.lines.length;
      }

      this.updateEText("start.lno", this.edoc.select.start.lno+"");
      this.updateEText("start.col", this.edoc.select.start.col + "");
       this.updateEText("end.lno", this.edoc.select.end.lno + "");
       this.updateEText("end.col", this.edoc.select.end.col + "");
       this.updateEText("lno", this.edoc.lno + "");
       this.updateEText("col", this.edoc.col + "");
    }
  }

  updateEText(id:string,text:string){
    var e = document.getElementById(id);
    if(e){
      e.innerHTML =text;
    }
  }
  renderCursor() {
    var now = Date.now();
    if (now - this.cursorLastRendered > 300) {
      this.cursorLastRendered = now;
      this.showCursor = !this.showCursor;
    }

    if (this.showCursor) {
      this.drawCursor();
    }
  }
  getHeight() {
    return this.canvas.height;
  }
  renderGutter() {
    var noOfScreenRows = this.getHeight() / this.cellHeight;
    this.fillRect(0, 0, this.gutterWidth, this.getHeight(), Editor_Gutter);
    for (var i = 0; i < noOfScreenRows; i++) {
      var lnt = String(i + 1 + this.scrollY);
      this.drawText(0, i * this.cellHeight, lnt, Editor_Gutter_Text);
    }
  }

  render() {
    if (this.edoc) {
      this.computePos();
      this.fillRect(0, 0, this.getWidth(), 700, Editor_BG);
      var X = this.edoc.lno - this.scrollY;
      this.fillRect(
        0,
        X * this.cellHeight,
        this.getWidth(),
        this.cellHeight,
        Editor_Current_Line_BG
      );
      this.renderGutter();
      this.g2?.save();
      this.g2?.translate(this.gutterWidth, 0);
      if (this.edoc.selectionOn) {
        this.renderSelection();
      }
      this.renderTextArea();
      this.renderCursor();

      this.g2?.restore();
    }
  }

  drawCursor() {
    if (this.edoc) {
      var dy = this.edoc.lno - this.scrollY;
      var x = this.edoc.col * this.cellWidth;
      var y = dy * this.cellHeight;
      this.fillRect(x, y, 3, this.cellHeight, Editor_Text);
    }
  }
}
