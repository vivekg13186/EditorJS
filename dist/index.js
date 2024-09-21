import { TextRender } from "./render.js";
import { EditDoc } from "./editor.js";
var render = new TextRender(document.getElementById("canvas"), 800, 400);
var doc = new EditDoc();
console.log(render, doc);
document.addEventListener("keydown", function (e) {
    var shiftOn = e.shiftKey;
    var ctrlOn = e.ctrlKey;
    if (e.key == "Backspace") {
        if (doc.selectionOn) {
            doc.deleteSelection();
        }
        else {
            doc.backspace();
        }
    }
    else if (e.key == "ArrowLeft") {
        doc.moveLeft(shiftOn);
    }
    else if (e.key == "ArrowRight") {
        doc.moveRight(shiftOn);
    }
    else if (e.key == "ArrowDown") {
        doc.moveDown(shiftOn);
    }
    else if (e.key == "ArrowUp") {
        doc.moveUp(shiftOn);
    }
    else if (e.key == "Delete") {
        if (doc.selectionOn) {
            doc.deleteSelection();
        }
        else {
            doc.deleteChar();
        }
    }
    else if ((e.key == "x" || e.key === "X") && ctrlOn) {
        doc.cutSelection();
    }
    else if ((e.key == "v" || e.key === "V") && ctrlOn) {
        doc.pasteSelection();
    }
    else if ((e.key == "c" || e.key === "C") && ctrlOn) {
        doc.copySelection();
    }
    else if (e.key == "Enter") {
        doc.newLine();
    }
    else {
        if (e.key.length == 1)
            doc.putChar(e.key);
    }
});
render.setDoc(doc);
doc.clipboard = "";
for (var i = 0; i < 100; i++) {
    doc.clipboard += `this is line ${i}\n`;
}
doc.pasteSelection();
doc.lno = 0;
doc.col = 0;
setInterval(function () {
    render.render();
}, 10);
//# sourceMappingURL=index.js.map