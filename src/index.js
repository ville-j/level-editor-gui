const LevelEditor = require("level-editor");

class LevelEditorGUI {
  init() {
    this._viewPortOffset = {
      x: 50,
      y: 50
    }
    this._zoom = 50;
    this._editor = new LevelEditor();
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
    window.requestAnimationFrame(() => {
      this.loop();
    });
    this.render();
  }
  pointInPolygon(x, y, vertices) {
    let inside = false;
    for (var i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      var xi = vertices[i].x,
        yi = vertices[i].y;
      var xj = vertices[j].x,
        yj = vertices[j].y;

      var intersect = ((yi > y) != (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }
  isGround(p) {
    let i = 0;
    this._editor.level.polygons.map(pp => {
      if (pp.id !== p.id) {
        if (this.pointInPolygon(p.vertices[0].x, p.vertices[0].y, pp.vertices))
          i++;
      }
    });
    return i % 2 !== 0;
  }
  isClockwise(vertices) {
    var sum = 0
    for (var i = 0; i < vertices.length - 1; i++) {
      var cur = vertices[i],
        next = vertices[i + 1]
      sum += (next.x - cur.x) * (next.y + cur.y)
    }
    return sum > 0
  }
  render() {
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._ctx.fillStyle = "#95a0a8";
    this._ctx.save();
    this._ctx.translate(this._viewPortOffset.x, this._viewPortOffset.y);
    this._ctx.scale(this._zoom, this._zoom);
    this._ctx.beginPath();
    this._editor.level.polygons.map(p => {
      let d = p.vertices.slice(0);
      if (this.isGround(p) !== this.isClockwise(p.vertices))
        d.reverse();

      d.map((v, i) => {
        if (i === 0)
          this._ctx.moveTo(v.x, v.y);
        else
          this._ctx.lineTo(v.x, v.y);
      });
      this._ctx.lineTo(p.vertices[0].x, p.vertices[0].y);
    });
    this._ctx.closePath();
    this._ctx.clip();
    this._ctx.fillRect(this._viewPortOffset.x * -1, this._viewPortOffset.y * -1, this._canvas.width, this._canvas.height);
    this._ctx.restore();
  }
}

module.exports = LevelEditorGUI;

let gui = new LevelEditorGUI();
gui.init();
gui.newLevel();