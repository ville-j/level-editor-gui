const LevelEditor = require("level-editor");

class LevelEditorGUI {
  init() {
    this._viewPortOffset = {
      x: 50,
      y: 50
    }
    this._zoom = 50;
    this._direction = 0;
    this._strokeColor = "#db0855";
    this._drawAllEdges = true;
    this._editor = new LevelEditor();
    this._container = document.getElementById("level-editor-gui");
    this._canvas = document.createElement("canvas");
    this._canvas.tabIndex = 0;
    this._ctx = this._canvas.getContext("2d", {
      alpha: true
    });
    this.addEventListeners();
    this.resizeCanvas();

    this._container.appendChild(this._canvas);
    window.requestAnimationFrame(() => {
      this.loop();
    });

    this._editor.connect();
  }
  mouseOnVertex(e) {
    let minDist = 10;
    let cv;
    let cp;
    this._editor.level.polygons.map(p => {
      p.vertices.map(v => {
        let distance = Math.hypot(e.clientX - this.vxtox(v.x), e.clientY - this.vytoy(v.y));
        if (distance < minDist && !this._ap) {
          minDist = distance;
          cv = v;
          cp = p;
        }
      });
    });
    if (cv) {
      this._av = this._editor.createVertex(this.xtovx(e.clientX), this.ytovy(e.clientY), cp, cv.id, this._direction);
      this._ap = cp;
      return true;
    }
    return false;
  }
  zoom(e) {
    let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    let mousePointX = this.xtovx(e.clientX);
    let mousePointY = this.ytovy(e.clientY);
    if (delta > 0)
      this._zoom *= 1.2;
    else
      this._zoom *= 0.8;

    this._viewPortOffset.x += e.clientX - this.vxtox(mousePointX);
    this._viewPortOffset.y += e.clientY - this.vytoy(mousePointY);
  }
  addEventListeners() {
    this._canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    this._canvas.addEventListener("mousewheel", (e) => {
      this.zoom(e);
    }, false);
    this._canvas.addEventListener("DOMMouseScroll", (e) => {
      this.zoom(e);
    }, false);
    this._canvas.addEventListener("keydown", (e) => {
      switch (e.keyCode) {
        case 16:
          this._drawAllEdges = !this._drawAllEdges;
          break;
        case 32:
          if (this._ap) {
            let i = this._direction === 1 ? -1 : 1;
            let index = this._editor.findVertexIndex(this._av.id, this._ap) + i;
            let ci = this._av.id;
            this._direction = this._direction === 0 ? 1 : 0;
            this._av = this._editor.createVertex(this._av.x, this._av.y, this._ap, this._ap.vertices[index].id, this._direction);
            this._editor.deleteVertex(this._ap, ci);
          }
          break;
      }
    });
    this._canvas.addEventListener("mouseup", (e) => {
      switch (e.button) {
        case 1:
          this._middleDrag = false;
          break;
      }
    });
    this._canvas.addEventListener("mousedown", (e) => {
      switch (e.button) {
        case 0:
          if (!this._ap) {
            /**
             * Create new polygon and start editing/adding vertices
             */
            if (!this.mouseOnVertex(e)) {
              this._ap = this._editor.createPolygon([{
                x: this.xtovx(e.clientX),
                y: this.ytovy(e.clientY)
              }], false);
              this._av = this._editor.createVertex(this.xtovx(e.clientX), this.ytovy(e.clientY), this._ap);
            }
          } else if (this._ap) {
            /**
             * Polygon editing active, add new vertex
             */
            this._av = this._editor.createVertex(this.xtovx(e.clientX), this.ytovy(e.clientY), this._ap, this._av.id, this._direction);
          }
          break;
        case 1:
          this._middleDrag = true;
          break;
        case 2:
          /**
           * Stop polygon editing, delete polygon if not enough vertices
           */
          if (this._ap) {
            if (this._ap.vertices.length < 4) {
              this._editor.deletePolygon(this._ap.id);
            } else {
              this._editor.deleteVertex(this._ap, this._av.id);
            }
            this._av = null;
            this._ap = null;
          }
      }
    });

    this._canvas.addEventListener("mousemove", (e) => {
      if (this._av) {
        this._editor.updateVertex(this._av, this._ap, this.xtovx(e.clientX), this.ytovy(e.clientY));
      }
      if (this._middleDrag && this._preMouse) {
        this._viewPortOffset.x += e.clientX - this._preMouse.clientX;
        this._viewPortOffset.y += e.clientY - this._preMouse.clientY;
      }

      this._preMouse = e;
    });
  }
  xtovx(x) {
    return (x - this._viewPortOffset.x) / this._zoom;
  }
  ytovy(y) {
    return (y - this._viewPortOffset.y) / this._zoom;
  }
  vxtox(vx) {
    return vx * this._zoom + this._viewPortOffset.x;
  }
  vytoy(vy) {
    return vy * this._zoom + this._viewPortOffset.y;
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
    this._ctx.fillStyle = "#e2e2e2";
    this._ctx.strokeStyle = this._strokeColor;
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
    if (!this._drawAllEdges) {
      this._ctx.fill();
    }
    this._ctx.restore();

    if (this._drawAllEdges) {
      this._ctx.stroke();
    } else if (this._ap) {
      this._ctx.save();
      this._ctx.translate(this._viewPortOffset.x, this._viewPortOffset.y);
      this._ctx.scale(this._zoom, this._zoom);
      this._ctx.beginPath();
      this._ap.vertices.map((v, i) => {
        if (i === 0)
          this._ctx.moveTo(v.x, v.y);
        else
          this._ctx.lineTo(v.x, v.y);
      });
      this._ctx.closePath();
      this._ctx.restore();
      this._ctx.stroke();
    }
  }
}

module.exports = LevelEditorGUI;

let gui = new LevelEditorGUI();
gui.init();
gui.newLevel();