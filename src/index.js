const Editor = require("level-editor");

class EditorGUI {
  init() {
    this._viewPortOffset = {
      x: 50,
      y: 50
    }
    this._zoom = 50;
    this._editor = new Editor();
    this._container = document.getElementById("level-editor-gui");
    this._canvas = document.createElement("canvas");
    this._ctx = this._canvas.getContext("2d", {
      alpha: true
    });
    this.addEventListeners();
    this.resizeCanvas();

    this._container.appendChild(this._canvas);
    window.requestAnimationFrame(() => {
      this.loop();
    });
  }
  addEventListeners() {
    this._canvas.addEventListener("mousedown", (e) => {
      let pol = this._editor.level.polygons[0];
      this._editor.createVertex(this.xtovx(e.clientX), this.ytovy(e.clientY), pol);
    });
  }
  xtovx(x) {
    return (x - this._viewPortOffset.x) / this._zoom;
  }
  ytovy(y) {
    return (y - this._viewPortOffset.y) / this._zoom;
  }
  resizeCanvas() {
    this._canvas.width = this._container.offsetWidth;
    this._canvas.height = this._container.offsetHeight;
  }
  newLevel() {
    this._editor.newLevel();
  }
  loop() {
    this.render();
    window.requestAnimationFrame(() => {
      this.loop();
    });
  }
  render() {
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._ctx.strokeStyle = "#b349ff";
    this._ctx.lineWidth = .8;
    this._ctx.save();
    this._ctx.translate(this._viewPortOffset.x, this._viewPortOffset.y);
    this._ctx.scale(this._zoom, this._zoom);

    this._editor.level.polygons.map(p => {

      this._ctx.beginPath();

      p.vertices.map((v, i) => {
        if (i === 0)
          this._ctx.moveTo(v.x, v.y);
        else
          this._ctx.lineTo(v.x, v.y);
      });

      this._ctx.closePath();
    });
    this._ctx.restore();
    this._ctx.stroke();
  }
}

module.exports = EditorGUI;

let gui = new EditorGUI();
gui.init();
gui.newLevel();