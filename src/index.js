const LevelEditor = require("level-editor");
const FileSaver = require('file-saver');

class LevelEditorGUI {
  init(settings) {
    this._viewPortOffset = {
      x: 50,
      y: 50
    }
    this._zoom = 50;
    this._direction = 0;
    this._strokeColor = "#db0855";
    this._drawAllEdges = true;
    this._editor = new LevelEditor();
    this._container = document.getElementById(settings.element || "level-editor-gui");
    this._canvas = document.createElement("canvas");
    this._wrapper = document.createElement("div");
    this._wrapper.style = "position: relative;";
    this._canvas.tabIndex = 0;
    this._ctx = this._canvas.getContext("2d", {
      alpha: true
    });
    this.addEventListeners();
    this.resize();
    this._wrapper.appendChild(this._canvas);
    this._container.appendChild(this._wrapper);
    this._selection = {
      vertices: [],
      objects: [],
      pictures: []
    };
    window.requestAnimationFrame(() => {
      this.loop();
    });
    if (settings.server)
      this._editor.connect(settings.server);

    this._tools = [{
        key: "polygon",
        name: "Polygon"
      }, {
        key: "select",
        name: "Select"
      }, {
        key: "apple",
        name: "Apple"
      }, {
        key: "killer",
        name: "Killer"
      }, {
        key: "exit",
        name: "Flower"
      },
      {
        key: "join",
        name: "Join",
        onClick: () => {
          this._editor.joinRoom('tset');
        }
      }, {
        key: "download",
        name: "Download",
        onClick: () => {
          this._editor.createBinary().then(result => {
            FileSaver.saveAs(new Blob([result]), "test.lev");
          });
        }
      }
    ];
    this._activeTool = "polygon";
    this.createToolbar();
  }
  createToolbar() {
    this._toolbar = document.createElement("div");
    this._toolbar.id = "level-editor-gui-toolbar";
    this._toolbarElements = [];
    this._tools.map(t => {
      const el = document.createElement("div");
      el.className = "level-editor-gui-toolbar-tool" + (this._activeTool === t.key ? " active" : "");
      el.textContent = t.name;
      el.setAttribute("key", t.key);
      el.addEventListener("mousedown", () => {
        this.activateTool(t);
        t.onClick && t.onClick();
      });
      this._toolbarElements.push(el);
      this._toolbar.appendChild(el);
    });
    this._wrapper.appendChild(this._toolbar);
  }
  activateTool(tool) {
    this._activeTool = tool.key;
    this._toolbarElements.map(t => {
      t.className = "level-editor-gui-toolbar-tool" + (t.getAttribute("key") === tool.key ? " active" : "");
    });
  }
  mouseOnVertex(e) {
    let cv = this.getCloseVertex(e);
    if (cv.vertex) {
      this._av = this._editor.createVertex(this.xtovx(e.x), this.ytovy(e.y), cv.polygon, cv.vertex.id, this._direction);
      this._ap = cv.polygon;
      return true;
    }
    return false;
  }
  getCloseVertex(e) {
    let minDist = 10;
    let cv;
    let cp;
    this._editor.level.polygons.map(p => {
      p.vertices.map(v => {
        let distance = Math.hypot(e.x - this.vxtox(v.x), e.y - this.vytoy(v.y));
        if (distance < minDist) {
          minDist = distance;
          cv = v;
          cp = p;
        }
      });
    });
    return {
      polygon: cp,
      vertex: cv
    }
  }
  getCloseObject(e) {
    let minDist = 10;
    let co;
    this._editor.level.objects.map(o => {
      let distance = Math.hypot(e.x - this.vxtox(o.x), e.y - this.vytoy(o.y));
      if (distance < minDist) {
        minDist = distance;
        co = o;
      }
    });
    return co;
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
  clearSelection() {
    this._selection.vertices = [];
    this._selection.objects = [];
  }
  addEventListeners() {
    window.addEventListener('resize', () => {
      this.resize();
    });
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
        case 46:
          let deletedPolygons = [];
          this._selection.vertices.map(v => {
            if (v.polygon.vertices.length > 3)
              this._editor.deleteVertex(v.polygon, v.vertex.id);
            else if (deletedPolygons.indexOf(v.polygon.id) < 0) {
              this._editor.deletePolygon(v.polygon.id);
              deletedPolygons.push(v.polygon.id);
            }
          });
          this._selection.objects.map(o => {
            this._editor.deleteObject(o.id);
          });
          this.clearSelection();
          break;
      }
    });
    this._canvas.addEventListener("mouseup", (e) => {
      switch (e.button) {
        case 0:
          this._drag = false;
          if (this._activeTool === "select") {
            this._ap = null;
            this._av = null;
            this._dragMove = false;

            if (this._dragSelectStart && this._dragSelectEnd) {
              const vxStart = this.xtovx(this._dragSelectStart.x);
              const vxEnd = this.xtovx(this._dragSelectEnd.x);
              const vyStart = this.ytovy(this._dragSelectStart.y);
              const vyEnd = this.ytovy(this._dragSelectEnd.y);
              this._editor.level.polygons.map(p => {
                p.vertices.map(v => {
                  if (v.x > vxStart && v.x < vxEnd && v.y > vyStart && v.y < vyEnd) {
                    this.handleVertexSelection({
                      polygon: p,
                      vertex: v
                    }, e, true);
                  }
                });
              });
              this._editor.level.objects.map(o => {
                if (o.x > vxStart && o.x < vxEnd && o.y > vyStart && o.y < vyEnd) {
                  this.handleObjectSelection(o, e, true);
                }
              });
            }
            this._dragSelectEnd = null;
            this._dragSelectStart = null;
          }
          break;
        case 1:
          this._middleDrag = false;
          break;
      }
    });
    this._canvas.addEventListener("mousedown", (e) => {
      let boundingRect = this._canvas.getBoundingClientRect();
      let event = {
        x: e.clientX - boundingRect.x,
        y: e.clientY - boundingRect.y
      }
      switch (e.button) {
        case 0:
          this._drag = true;
          if (this._activeTool === "polygon") {
            if (!this._ap) {
              /**
               * Create new polygon and start editing/adding vertices
               */
              if (!this.mouseOnVertex(event)) {
                this._ap = this._editor.createPolygon([{
                  x: this.xtovx(event.x),
                  y: this.ytovy(event.y)
                }], false);
                this._av = this._editor.createVertex(this.xtovx(event.x), this.ytovy(event.y), this._ap);
              }
            } else if (this._ap) {
              /**
               * Polygon editing active, add new vertex
               */
              this._av = this._editor.createVertex(this.xtovx(event.x), this.ytovy(event.y), this._ap, this._av.id, this._direction);
            }
          }

          if (this._activeTool === "select") {
            let v = this.getCloseVertex(event);
            let o = this.getCloseObject(event);

            if (!v.vertex && !o && !e.ctrlKey) {
              this.clearSelection();
            }
            if (o) {
              this.handleObjectSelection(o, e);
              this._dragMove = true;
            }
            if (v.vertex) {
              this.handleVertexSelection(v, e);
              this._dragMove = true;
            }

            if (!this._dragMove) {
              this._dragSelectStart = event;
            }
          } else if (this._activeTool === "apple" || this._activeTool === "killer" || this._activeTool === "exit") {
            this._editor.createObject(this.xtovx(event.x), this.ytovy(event.y), this._activeTool, "normal", 0);
          }
          break;
        case 1:
          this._middleDrag = true;
          break;
        case 2:
          if (this._activeTool === "polygon") {
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
      }
    });

    this._canvas.addEventListener("mousemove", (e) => {
      let boundingRect = this._canvas.getBoundingClientRect();
      let event = {
        x: e.clientX - boundingRect.x,
        y: e.clientY - boundingRect.y
      }

      if (this._activeTool === "polygon") {
        if (this._av) {
          this._editor.updateVertex(this._av, this._ap, this.xtovx(event.x), this.ytovy(event.y));
        }
      }

      if (this._activeTool === "select") {
        if (this._dragMove) {
          this._selection.vertices.map(v => {
            this._editor.updateVertex(v.vertex, v.polygon, this.xtovx(this.vxtox(v.vertex.x) + (event.x - this._preMouse.x)), this.ytovy(this.vytoy(v.vertex.y) + (event.y - this._preMouse.y)));
          });
          this._selection.objects.map(v => {
            this._editor.updateObject(v, this.xtovx(this.vxtox(v.x) + (event.x - this._preMouse.x)), this.ytovy(this.vytoy(v.y) + (event.y - this._preMouse.y)));
          });
        }
        if (this._drag) {
          this._dragSelectEnd = event;
        }
      }

      if (this._middleDrag && this._preMouse) {
        this._viewPortOffset.x += event.x - this._preMouse.x;
        this._viewPortOffset.y += event.y - this._preMouse.y;
      }

      this._preMouse = event;
    });
  }
  handleVertexSelection(v, e, multiselect) {
    let existing = this._selection.vertices.findIndex(ve => {
      return ve.vertex.id === v.vertex.id;
    });
    if (existing < 0) {
      if (e.ctrlKey || multiselect)
        this._selection.vertices.push(v);
      else {
        this.clearSelection();
        this._selection.vertices = [v];
      }
    } else {
      if (e.ctrlKey)
        this._selection.vertices.splice(existing, 1);
    }
  }
  handleObjectSelection(o, e, multiselect) {
    let existing = this._selection.objects.findIndex(oe => {
      return oe.id === o.id;
    });
    if (existing < 0) {
      if (e.ctrlKey || multiselect)
        this._selection.objects.push(o);
      else {
        this.clearSelection();
        this._selection.objects = [o];
      }
    } else {
      if (e.ctrlKey)
        this._selection.objects.splice(existing, 1);
    }
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
  resize() {
    this._canvas.width = this._wrapper.width = this._container.offsetWidth;
    this._canvas.height = this._wrapper.height = this._container.offsetHeight;
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
    this._ctx.fillStyle = "#f2f2f2";
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

    this._editor.level.objects.map(o => {
      switch (o.type) {
        case 'apple':
          this._ctx.strokeStyle = "#dd0404";
          break;
        case 'killer':
          this._ctx.strokeStyle = "#8d0ad3";
          break;
        case 'start':
          this._ctx.strokeStyle = "#0b6b08";
          break;
        case 'exit':
          this._ctx.strokeStyle = "#ffffff";
          break;
      }
      this._ctx.save();
      this._ctx.translate(this._viewPortOffset.x, this._viewPortOffset.y);
      this._ctx.scale(this._zoom, this._zoom);
      this._ctx.beginPath();
      this._ctx.arc(o.x, o.y, 0.4, 0, 2 * Math.PI);
      this._ctx.closePath();
      this._ctx.restore();
      this._ctx.stroke();
    });

    /**
     * Selection handles
     */
    this._ctx.save();
    this._ctx.translate(this._viewPortOffset.x, this._viewPortOffset.y);
    this._ctx.scale(this._zoom, this._zoom);
    this._ctx.fillStyle = "#fff";
    this._selection.vertices.map(v => {
      this._ctx.fillRect(v.vertex.x - 2.5 / this._zoom, v.vertex.y - 2.5 / this._zoom, 5 / this._zoom, 5 / this._zoom);
    });
    this._selection.objects.map(v => {
      this._ctx.fillRect(v.x - 2.5 / this._zoom, v.y - 2.5 / this._zoom, 5 / this._zoom, 5 / this._zoom);
    });
    this._ctx.restore();

    if (this._dragSelectStart && this._dragSelectEnd) {
      this._ctx.beginPath();
      this._ctx.strokeStyle = "#ffffff";
      this._ctx.rect(this._dragSelectStart.x, this._dragSelectStart.y, this._dragSelectEnd.x - this._dragSelectStart.x, this._dragSelectEnd.y - this._dragSelectStart.y);
      this._ctx.closePath();
      this._ctx.stroke();
    }
  }
}

module.exports = LevelEditorGUI;

LEG = function (settings) {
  const leg = new LevelEditorGUI();
  leg.init(settings);
  return leg;
}