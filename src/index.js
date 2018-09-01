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
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    this._canvas.addEventListener("mousedown", (e) => {
      switch (e.button) {
        case 0:
          if (!this._ap) {
            let polygonId = this._editor.createPolygon([{
              x: this.xtovx(e.clientX),
              y: this.ytovy(e.clientY)
            }], false);

            let vertexId = this._editor.createVertex(this.xtovx(e.clientX), this.ytovy(e.clientY), this._editor.findPolygon(polygonId));
            this._ap = this._editor.findPolygon(polygonId);
            this._av = this._editor.findVertex(vertexId, this._ap);
          } else {
            let vertexId = this._editor.createVertex(this.xtovx(e.clientX), this.ytovy(e.clientY), this._ap, this._av.id);
            this._av = this._editor.findVertex(vertexId, this._ap);
          }
          break;
        case 2:
          if (this._ap && this._av) {
            this._editor.deleteVertex(this._ap, this._av.id);
            this._av = null;
            this._ap = null;
          }
      }
    });

    this._canvas.addEventListener("mousemove", (e) => {
      if (this._av) {
        this._av.x = this.xtovx(e.clientX);
        this._av.y = this.ytovy(e.clientY);
      }
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
    let sum = 0;
    let v = vertices.slice(0);
    v.push({
      x: vertices[0].x,
      y: vertices[0].y
    });
    for (let i = 0; i < v.length - 1; i++) {
      let cur = v[i],
        next = v[i + 1];
      sum += (next.x - cur.x) * (next.y + cur.y)
    }
    return sum > 0
  }
  render() {
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._ctx.fillStyle = "#95a0a8";
    this._ctx.strokeStyle = "red";
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
      this._ctx.lineTo(d[0].x, d[0].y);
    });
    this._ctx.closePath();
    this._ctx.clip();
    this._ctx.fillRect(this._viewPortOffset.x * -1, this._viewPortOffset.y * -1, this._canvas.width, this._canvas.height);
    this._ctx.restore();
    this._ctx.stroke();
  }
}

module.exports = LevelEditorGUI;

let gui = new LevelEditorGUI();
gui.init();
gui.newLevel();

gui._editor.createPolygon([{
    x: 1,
    y: 1
  },
  {
    x: 1,
    y: 2
  },
  {
    x: 2,
    y: 2
  },
  {
    x: 2,
    y: 1
  }
], false);