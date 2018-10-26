const LevelEditor = require('level-editor');
const FileSaver = require('file-saver');

class LevelEditorGUI {
  constructor(settings) {
    this.init(settings);
  }
  init(settings) {
    this.viewPortOffset = {
      x: 150,
      y: 50
    };
    this.zoom = 50;
    this.direction = 0;
    const defaultColors = {
      apple: '#dc0000',
      edges: '#db0855',
      flower: '#eaeaea',
      ground: '#181048',
      killer: '#080808',
      selectBox: '#ffffff',
      selection: '#ff7b2e',
      sky: '#3078bc',
      start: '#309c30',
      toolbar: '#131313'
    };
    this.colors = { ...defaultColors, ...settings.colors };
    this.drawAllEdges = false;
    this.editor = new LevelEditor();
    this.editor.newLevel();
    this.container = document.getElementById(
      settings.element || 'level-editor-gui'
    );
    this.canvas = document.createElement('canvas');
    this.wrapper = document.createElement('div');
    this.wrapper.style = 'position: relative;';
    this.canvas.tabIndex = 0;
    this.ctx = this.canvas.getContext('2d', {
      alpha: false
    });
    this.addEventListeners();
    this.resize();
    this.wrapper.appendChild(this.canvas);
    this.container.appendChild(this.wrapper);
    this.selection = {
      vertices: [],
      objects: [],
      pictures: []
    };
    if (settings.server) this.editor.connect(settings.server);

    this.tools = [
      {
        key: 'polygon',
        name: 'Polygon'
      },
      {
        key: 'select',
        name: 'Select'
      },
      {
        key: 'apple',
        name: 'Apple'
      },
      {
        key: 'killer',
        name: 'Killer'
      },
      {
        key: 'exit',
        name: 'Flower'
      },
      {
        key: 'join',
        name: 'Join',
        onClick: () => {
          this.dialog.style.cssText =
            'position:absolute;left:200px;top:100px;width:200px;height:100px;background:#ffffff;z-index:1000;padding:10px';
        }
      },
      {
        key: 'download',
        name: 'Download',
        onClick: () => {
          this.editor.createBinary().then(result => {
            FileSaver.saveAs(new Blob([result]), 'level.lev');
          });
        }
      }
    ];
    this.toolbarElements = [];
    if (!settings.hasOwnProperty('toolbar') || settings.toolbar)
      this.createToolbar();
    this.createDialog();
    this.animationLoop = window.requestAnimationFrame(() => {
      this.loop();
    });
    this.activateTool(this.tools[0]);
  }
  createDialog() {
    let el = document.createElement('div');
    this.dialog = el;
    el.style.cssText = 'display: none;';
    let input = document.createElement('input');
    el.appendChild(input);
    let joinButton = document.createElement('button');
    joinButton.innerHTML = 'join';
    let cancelButton = document.createElement('button');
    cancelButton.innerHTML = 'cancel';
    el.appendChild(joinButton);
    el.appendChild(cancelButton);

    joinButton.onclick = () => {
      this.editor.joinRoom(input.value);
      this.dialog.style.cssText = 'display:none';
    };
    cancelButton.onclick = () => {
      this.dialog.style.cssText = 'display:none';
    };
    this.wrapper.appendChild(el);
  }
  createToolbar() {
    this.toolbar = document.createElement('div');
    this.toolbar.style.cssText =
      'position: absolute;left: 0;top: 0;width: 100px;height: 100%;background: ' +
      this.colors.toolbar;
    this.toolbar.id = 'level-editor-gui-toolbar';
    this.tools.map(t => {
      const el = document.createElement('div');
      el.style.cssText = 'color: #fff;padding: 10px;';
      el.className =
        'level-editor-gui-toolbar-tool' +
        (this.activeTool === t.key ? ' active' : '');
      el.textContent = t.name;
      el.setAttribute('key', t.key);
      el.addEventListener('mousedown', () => {
        this.activateTool(t);
        t.onClick && t.onClick();
      });
      this.toolbarElements.push(el);
      this.toolbar.appendChild(el);
    });
    this.wrapper.appendChild(this.toolbar);
  }
  activateTool(tool) {
    this.activeTool = tool.key;
    this.toolbarElements.map(t => {
      t.className =
        'level-editor-gui-toolbar-tool' +
        (t.getAttribute('key') === tool.key ? ' active' : '');

      if (t.getAttribute('key') === tool.key) {
        t.style.cssText =
          'color: #000;background: #fff;padding: 10px; opacity: 0.8;';
      } else {
        t.style.cssText = 'color: #fff;padding: 10px; opacity: 0.8;';
      }
    });
  }
  mouseOnVertex(e) {
    let cv = this.getCloseVertex(e);
    if (cv.vertex) {
      this.av = this.editor.createVertex(
        this.xtovx(e.x),
        this.ytovy(e.y),
        cv.polygon,
        cv.vertex.id,
        this.direction
      );
      this.ap = cv.polygon;
      return true;
    }
    return false;
  }
  getCloseVertex(e) {
    let minDist = 10;
    let cv;
    let cp;
    this.editor.level.polygons.map(p => {
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
    };
  }
  getCloseObject(e) {
    let minDist = 10;
    let co;
    this.editor.level.objects.map(o => {
      let distance = Math.hypot(e.x - this.vxtox(o.x), e.y - this.vytoy(o.y));
      if (distance < minDist) {
        minDist = distance;
        co = o;
      }
    });
    return co;
  }
  zoom(e) {
    let delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));
    let mousePointX = this.xtovx(e.clientX);
    let mousePointY = this.ytovy(e.clientY);
    if (delta > 0) this.zoom *= 1.2;
    else this.zoom *= 0.8;

    this.viewPortOffset.x += e.clientX - this.vxtox(mousePointX);
    this.viewPortOffset.y += e.clientY - this.vytoy(mousePointY);
  }
  clearSelection() {
    this.selection.vertices = [];
    this.selection.objects = [];
  }
  addEventListeners() {
    window.addEventListener('resize', () => {
      this.resize();
    });
    this.canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
    });
    this.canvas.addEventListener(
      'mousewheel',
      e => {
        this.zoom(e);
      },
      false
    );
    this.canvas.addEventListener(
      'DOMMouseScroll',
      e => {
        this.zoom(e);
      },
      false
    );
    this.canvas.addEventListener('keydown', e => {
      let deletedPolygons = [];
      switch (e.keyCode) {
        case 16:
          this.drawAllEdges = !this.drawAllEdges;
          break;
        case 32:
          if (this.ap) {
            let i = this.direction === 1 ? -1 : 1;
            let index = this.editor.findVertexIndex(this.av.id, this.ap) + i;
            let ci = this.av.id;
            this.direction = this.direction === 0 ? 1 : 0;
            this.av = this.editor.createVertex(
              this.av.x,
              this.av.y,
              this.ap,
              this.ap.vertices[index].id,
              this.direction
            );
            this.editor.deleteVertex(this.ap, ci);
          }
          break;
        case 46:
          this.selection.vertices.map(v => {
            if (v.polygon.vertices.length > 3)
              this.editor.deleteVertex(v.polygon, v.vertex.id);
            else if (deletedPolygons.indexOf(v.polygon.id) < 0) {
              this.editor.deletePolygon(v.polygon.id);
              deletedPolygons.push(v.polygon.id);
            }
          });
          this.selection.objects.map(o => {
            this.editor.deleteObject(o.id);
          });
          this.clearSelection();
          break;
      }
    });
    this.canvas.addEventListener('mouseup', e => {
      switch (e.button) {
        case 0:
          this.drag = false;
          if (this.activeTool === 'select') {
            this.ap = null;
            this.av = null;
            this.dragMove = false;

            if (this.dragSelectStart && this.dragSelectEnd) {
              const vxStart = this.xtovx(this.dragSelectStart.x);
              const vxEnd = this.xtovx(this.dragSelectEnd.x);
              const vyStart = this.ytovy(this.dragSelectStart.y);
              const vyEnd = this.ytovy(this.dragSelectEnd.y);
              this.editor.level.polygons.map(p => {
                p.vertices.map(v => {
                  if (
                    ((v.x > vxStart && v.x < vxEnd) ||
                      (v.x < vxStart && v.x > vxEnd)) &&
                    ((v.y > vyStart && v.y < vyEnd) ||
                      (v.y < vyStart && v.y > vyEnd))
                  ) {
                    this.handleVertexSelection(
                      {
                        polygon: p,
                        vertex: v
                      },
                      e,
                      true
                    );
                  }
                });
              });
              this.editor.level.objects.map(o => {
                if (
                  ((o.x > vxStart && o.x < vxEnd) ||
                    (o.x < vxStart && o.x > vxEnd)) &&
                  ((o.y > vyStart && o.y < vyEnd) ||
                    (o.y < vyStart && o.y > vyEnd))
                ) {
                  this.handleObjectSelection(o, e, true);
                }
              });
            }
            this.dragSelectEnd = null;
            this.dragSelectStart = null;
          }
          break;
        case 1:
          this.middleDrag = false;
          break;
      }
    });
    this.canvas.addEventListener('mousedown', e => {
      let boundingRect = this.canvas.getBoundingClientRect();
      let event = {
        x: e.clientX - boundingRect.x,
        y: e.clientY - boundingRect.y
      };
      switch (e.button) {
        case 0:
          this.drag = true;
          if (this.activeTool === 'polygon') {
            if (!this.ap) {
              /**
               * Create new polygon and start editing/adding vertices
               */
              if (!this.mouseOnVertex(event)) {
                this.ap = this.editor.createPolygon(
                  [
                    {
                      x: this.xtovx(event.x),
                      y: this.ytovy(event.y)
                    }
                  ],
                  false
                );
                this.av = this.editor.createVertex(
                  this.xtovx(event.x),
                  this.ytovy(event.y),
                  this.ap
                );
              }
            } else if (this.ap) {
              /**
               * Polygon editing active, add new vertex
               */
              this.av = this.editor.createVertex(
                this.xtovx(event.x),
                this.ytovy(event.y),
                this.ap,
                this.av.id,
                this.direction
              );
            }
          }

          if (this.activeTool === 'select') {
            let v = this.getCloseVertex(event);
            let o = this.getCloseObject(event);

            if (!v.vertex && !o && !e.ctrlKey) {
              this.clearSelection();
            }
            if (o) {
              this.handleObjectSelection(o, e);
              this.dragMove = true;
            }
            if (v.vertex) {
              this.handleVertexSelection(v, e);
              this.dragMove = true;
            }

            if (!this.dragMove) {
              this.dragSelectStart = event;
            }
          } else if (
            this.activeTool === 'apple' ||
            this.activeTool === 'killer' ||
            this.activeTool === 'exit'
          ) {
            this.editor.createObject(
              this.xtovx(event.x),
              this.ytovy(event.y),
              this.activeTool,
              'normal',
              0
            );
          }
          break;
        case 1:
          this.middleDrag = true;
          break;
        case 2:
          if (this.activeTool === 'polygon') {
            /**
             * Stop polygon editing, delete polygon if not enough vertices
             */
            if (this.ap) {
              if (this.ap.vertices.length < 4) {
                this.editor.deletePolygon(this.ap.id);
              } else {
                this.editor.deleteVertex(this.ap, this.av.id);
              }
              this.av = null;
              this.ap = null;
            }
          }
      }
    });

    this.canvas.addEventListener('mousemove', e => {
      let boundingRect = this.canvas.getBoundingClientRect();
      let event = {
        x: e.clientX - boundingRect.x,
        y: e.clientY - boundingRect.y
      };

      if (this.activeTool === 'polygon') {
        if (this.av) {
          this.editor.updateVertex(
            this.av,
            this.ap,
            this.xtovx(event.x),
            this.ytovy(event.y)
          );
        }
      }

      if (this.activeTool === 'select') {
        if (this.dragMove) {
          this.selection.vertices.map(v => {
            this.editor.updateVertex(
              v.vertex,
              v.polygon,
              this.xtovx(this.vxtox(v.vertex.x) + (event.x - this.preMouse.x)),
              this.ytovy(this.vytoy(v.vertex.y) + (event.y - this.preMouse.y))
            );
          });
          this.selection.objects.map(v => {
            this.editor.updateObject(
              v,
              this.xtovx(this.vxtox(v.x) + (event.x - this.preMouse.x)),
              this.ytovy(this.vytoy(v.y) + (event.y - this.preMouse.y))
            );
          });
        }
        if (this.drag) {
          this.dragSelectEnd = event;
        }
      }

      if (this.middleDrag && this.preMouse) {
        this.viewPortOffset.x += event.x - this.preMouse.x;
        this.viewPortOffset.y += event.y - this.preMouse.y;
      }

      this.preMouse = event;
    });
  }
  handleVertexSelection(v, e, multiselect) {
    let existing = this.selection.vertices.findIndex(ve => {
      return ve.vertex.id === v.vertex.id;
    });
    if (existing < 0) {
      if (e.ctrlKey || multiselect) this.selection.vertices.push(v);
      else {
        this.clearSelection();
        this.selection.vertices = [v];
      }
    } else {
      if (e.ctrlKey) this.selection.vertices.splice(existing, 1);
    }
  }
  handleObjectSelection(o, e, multiselect) {
    let existing = this.selection.objects.findIndex(oe => {
      return oe.id === o.id;
    });
    if (existing < 0) {
      if (e.ctrlKey || multiselect) this.selection.objects.push(o);
      else {
        this.clearSelection();
        this.selection.objects = [o];
      }
    } else {
      if (e.ctrlKey) this.selection.objects.splice(existing, 1);
    }
  }
  xtovx(x) {
    return (x - this.viewPortOffset.x) / this.zoom;
  }
  ytovy(y) {
    return (y - this.viewPortOffset.y) / this.zoom;
  }
  vxtox(vx) {
    return vx * this.zoom + this.viewPortOffset.x;
  }
  vytoy(vy) {
    return vy * this.zoom + this.viewPortOffset.y;
  }
  resize() {
    this.canvas.width = this.wrapper.width = this.container.offsetWidth;
    this.canvas.height = this.wrapper.height = this.container.offsetHeight;
  }
  newLevel() {
    this.editor.newLevel();
  }
  loop() {
    this.render();
    this.animationLoop = window.requestAnimationFrame(() => {
      this.loop();
    });
  }
  stopAnimationLoop() {
    window.cancelAnimationFrame(this.animationLoop);
  }
  render() {
    this.ctx.fillStyle = this.colors.ground;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = this.colors.sky;
    this.ctx.strokeStyle = this.colors.edges;
    this.ctx.save();
    this.ctx.translate(this.viewPortOffset.x, this.viewPortOffset.y);
    this.ctx.scale(this.zoom, this.zoom);
    this.ctx.beginPath();
    this.editor.level.polygons.map(p => {
      let d = p.vertices.slice(0);
      if (
        !this.drawAllEdges &&
        this.editor.shouldPolygonBeGround(p) !==
          this.editor.isPolygonClockwise(p)
      )
        d.reverse();

      d.map((v, i) => {
        if (i === 0) this.ctx.moveTo(v.x, v.y);
        else this.ctx.lineTo(v.x, v.y);
      });
      this.ctx.lineTo(d[0].x, d[0].y);
    });
    this.ctx.closePath();
    if (!this.drawAllEdges) {
      this.ctx.fill();
    }
    this.ctx.restore();

    if (this.drawAllEdges) {
      this.ctx.stroke();
    } else if (this.ap) {
      this.ctx.save();
      this.ctx.translate(this.viewPortOffset.x, this.viewPortOffset.y);
      this.ctx.scale(this.zoom, this.zoom);
      this.ctx.beginPath();
      this.ap.vertices.map((v, i) => {
        if (i === 0) this.ctx.moveTo(v.x, v.y);
        else this.ctx.lineTo(v.x, v.y);
      });
      this.ctx.closePath();
      this.ctx.restore();
      this.ctx.stroke();
    }

    this.editor.level.objects.map(o => {
      switch (o.type) {
        case 'apple':
          this.ctx.fillStyle = this.colors.apple;
          break;
        case 'killer':
          this.ctx.fillStyle = this.colors.killer;
          break;
        case 'start':
          this.ctx.fillStyle = this.colors.start;
          break;
        case 'exit':
          this.ctx.fillStyle = this.colors.flower;
          break;
      }
      this.ctx.save();
      this.ctx.translate(this.viewPortOffset.x, this.viewPortOffset.y);
      this.ctx.scale(this.zoom, this.zoom);
      this.ctx.beginPath();
      this.ctx.arc(o.x, o.y, 0.4, 0, 2 * Math.PI);
      this.ctx.closePath();
      this.ctx.restore();
      this.ctx.fill();
    });

    /**
     * Selection handles
     */
    this.ctx.save();
    this.ctx.translate(this.viewPortOffset.x, this.viewPortOffset.y);
    this.ctx.scale(this.zoom, this.zoom);
    this.ctx.fillStyle = this.colors.selection;
    this.selection.vertices.map(v => {
      this.ctx.fillRect(
        v.vertex.x - 2.5 / this.zoom,
        v.vertex.y - 2.5 / this.zoom,
        5 / this.zoom,
        5 / this.zoom
      );
    });
    this.selection.objects.map(v => {
      this.ctx.fillRect(
        v.x - 2.5 / this.zoom,
        v.y - 2.5 / this.zoom,
        5 / this.zoom,
        5 / this.zoom
      );
    });
    this.ctx.restore();

    if (this.dragSelectStart && this.dragSelectEnd) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = this.colors.selectBox;
      this.ctx.rect(
        this.dragSelectStart.x,
        this.dragSelectStart.y,
        this.dragSelectEnd.x - this.dragSelectStart.x,
        this.dragSelectEnd.y - this.dragSelectStart.y
      );
      this.ctx.closePath();
      this.ctx.stroke();
    }
  }
}

module.exports = LevelEditorGUI;
