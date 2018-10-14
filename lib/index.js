"use strict";

require("core-js/modules/es6.object.define-property");

require("core-js/modules/es6.array.fill");

require("core-js/modules/es6.array.find-index");

require("core-js/modules/es6.array.index-of");

require("core-js/modules/es6.math.hypot");

require("core-js/modules/es6.function.name");

require("core-js/modules/es6.array.map");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var LevelEditor = require("level-editor");

var FileSaver = require("file-saver");

var LevelEditorGUI =
/*#__PURE__*/
function () {
  function LevelEditorGUI(settings) {
    _classCallCheck(this, LevelEditorGUI);

    this.init(settings);
  }

  _createClass(LevelEditorGUI, [{
    key: "init",
    value: function init(settings) {
      var _this = this;

      this._viewPortOffset = {
        x: 50,
        y: 50
      };
      this._zoom = 50;
      this._direction = 0;
      this._strokeColor = "#db0855";
      this._drawAllEdges = true;
      this._editor = new LevelEditor();

      this._editor.newLevel();

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
      if (settings.server) this._editor.connect(settings.server);
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
      }, {
        key: "join",
        name: "Join",
        onClick: function onClick() {
          _this._dialog.style.cssText = "position:absolute;left:200px;top:100px;width:200px;height:100px;background:#ffffff;z-index:1000;padding:10px";
        }
      }, {
        key: "download",
        name: "Download",
        onClick: function onClick() {
          _this._editor.createBinary().then(function (result) {
            FileSaver.saveAs(new Blob([result]), "level.lev");
          });
        }
      }];
      this._activeTool = "polygon";
      this.createToolbar();
      this.createDialog();
      this._animationLoop = window.requestAnimationFrame(function () {
        _this.loop();
      });
    }
  }, {
    key: "createDialog",
    value: function createDialog() {
      var _this2 = this;

      var el = document.createElement("div");
      this._dialog = el;
      el.style.cssText = "display: none;";
      var input = document.createElement("input");
      el.appendChild(input);
      var joinButton = document.createElement("button");
      joinButton.innerHTML = "join";
      var cancelButton = document.createElement("button");
      cancelButton.innerHTML = "cancel";
      el.appendChild(joinButton);
      el.appendChild(cancelButton);

      joinButton.onclick = function () {
        _this2._editor.joinRoom(input.value);

        _this2._dialog.style.cssText = "display:none";
      };

      cancelButton.onclick = function () {
        _this2._dialog.style.cssText = "display:none";
      };

      this._wrapper.appendChild(el);
    }
  }, {
    key: "createToolbar",
    value: function createToolbar() {
      var _this3 = this;

      this._toolbar = document.createElement("div");
      this._toolbar.style.cssText = "position: absolute;left: 0;top: 0;width: 100px;height: 100%;background: #241633;";
      this._toolbar.id = "level-editor-gui-toolbar";
      this._toolbarElements = [];

      this._tools.map(function (t) {
        var el = document.createElement("div");
        el.style.cssText = "color: #fff;padding: 10px;";
        el.className = "level-editor-gui-toolbar-tool" + (_this3._activeTool === t.key ? " active" : "");
        el.textContent = t.name;
        el.setAttribute("key", t.key);
        el.addEventListener("mousedown", function () {
          _this3.activateTool(t);

          t.onClick && t.onClick();
        });

        _this3._toolbarElements.push(el);

        _this3._toolbar.appendChild(el);
      });

      this._wrapper.appendChild(this._toolbar);
    }
  }, {
    key: "activateTool",
    value: function activateTool(tool) {
      this._activeTool = tool.key;

      this._toolbarElements.map(function (t) {
        t.className = "level-editor-gui-toolbar-tool" + (t.getAttribute("key") === tool.key ? " active" : "");

        if (t.getAttribute("key") === tool.key) {
          t.style.cssText = "color: #000;background: #fff;padding: 10px;";
        } else {
          t.style.cssText = "color: #fff;padding: 10px;";
        }
      });
    }
  }, {
    key: "mouseOnVertex",
    value: function mouseOnVertex(e) {
      var cv = this.getCloseVertex(e);

      if (cv.vertex) {
        this._av = this._editor.createVertex(this.xtovx(e.x), this.ytovy(e.y), cv.polygon, cv.vertex.id, this._direction);
        this._ap = cv.polygon;
        return true;
      }

      return false;
    }
  }, {
    key: "getCloseVertex",
    value: function getCloseVertex(e) {
      var _this4 = this;

      var minDist = 10;
      var cv;
      var cp;

      this._editor.level.polygons.map(function (p) {
        p.vertices.map(function (v) {
          var distance = Math.hypot(e.x - _this4.vxtox(v.x), e.y - _this4.vytoy(v.y));

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
  }, {
    key: "getCloseObject",
    value: function getCloseObject(e) {
      var _this5 = this;

      var minDist = 10;
      var co;

      this._editor.level.objects.map(function (o) {
        var distance = Math.hypot(e.x - _this5.vxtox(o.x), e.y - _this5.vytoy(o.y));

        if (distance < minDist) {
          minDist = distance;
          co = o;
        }
      });

      return co;
    }
  }, {
    key: "zoom",
    value: function zoom(e) {
      var delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));
      var mousePointX = this.xtovx(e.clientX);
      var mousePointY = this.ytovy(e.clientY);
      if (delta > 0) this._zoom *= 1.2;else this._zoom *= 0.8;
      this._viewPortOffset.x += e.clientX - this.vxtox(mousePointX);
      this._viewPortOffset.y += e.clientY - this.vytoy(mousePointY);
    }
  }, {
    key: "clearSelection",
    value: function clearSelection() {
      this._selection.vertices = [];
      this._selection.objects = [];
    }
  }, {
    key: "addEventListeners",
    value: function addEventListeners() {
      var _this6 = this;

      window.addEventListener("resize", function () {
        _this6.resize();
      });

      this._canvas.addEventListener("contextmenu", function (e) {
        e.preventDefault();
      });

      this._canvas.addEventListener("mousewheel", function (e) {
        _this6.zoom(e);
      }, false);

      this._canvas.addEventListener("DOMMouseScroll", function (e) {
        _this6.zoom(e);
      }, false);

      this._canvas.addEventListener("keydown", function (e) {
        switch (e.keyCode) {
          case 16:
            _this6._drawAllEdges = !_this6._drawAllEdges;
            break;

          case 32:
            if (_this6._ap) {
              var i = _this6._direction === 1 ? -1 : 1;
              var index = _this6._editor.findVertexIndex(_this6._av.id, _this6._ap) + i;
              var ci = _this6._av.id;
              _this6._direction = _this6._direction === 0 ? 1 : 0;
              _this6._av = _this6._editor.createVertex(_this6._av.x, _this6._av.y, _this6._ap, _this6._ap.vertices[index].id, _this6._direction);

              _this6._editor.deleteVertex(_this6._ap, ci);
            }

            break;

          case 46:
            var deletedPolygons = [];

            _this6._selection.vertices.map(function (v) {
              if (v.polygon.vertices.length > 3) _this6._editor.deleteVertex(v.polygon, v.vertex.id);else if (deletedPolygons.indexOf(v.polygon.id) < 0) {
                _this6._editor.deletePolygon(v.polygon.id);

                deletedPolygons.push(v.polygon.id);
              }
            });

            _this6._selection.objects.map(function (o) {
              _this6._editor.deleteObject(o.id);
            });

            _this6.clearSelection();

            break;
        }
      });

      this._canvas.addEventListener("mouseup", function (e) {
        switch (e.button) {
          case 0:
            _this6._drag = false;

            if (_this6._activeTool === "select") {
              _this6._ap = null;
              _this6._av = null;
              _this6._dragMove = false;

              if (_this6._dragSelectStart && _this6._dragSelectEnd) {
                var vxStart = _this6.xtovx(_this6._dragSelectStart.x);

                var vxEnd = _this6.xtovx(_this6._dragSelectEnd.x);

                var vyStart = _this6.ytovy(_this6._dragSelectStart.y);

                var vyEnd = _this6.ytovy(_this6._dragSelectEnd.y);

                _this6._editor.level.polygons.map(function (p) {
                  p.vertices.map(function (v) {
                    if (v.x > vxStart && v.x < vxEnd && v.y > vyStart && v.y < vyEnd) {
                      _this6.handleVertexSelection({
                        polygon: p,
                        vertex: v
                      }, e, true);
                    }
                  });
                });

                _this6._editor.level.objects.map(function (o) {
                  if (o.x > vxStart && o.x < vxEnd && o.y > vyStart && o.y < vyEnd) {
                    _this6.handleObjectSelection(o, e, true);
                  }
                });
              }

              _this6._dragSelectEnd = null;
              _this6._dragSelectStart = null;
            }

            break;

          case 1:
            _this6._middleDrag = false;
            break;
        }
      });

      this._canvas.addEventListener("mousedown", function (e) {
        var boundingRect = _this6._canvas.getBoundingClientRect();

        var event = {
          x: e.clientX - boundingRect.x,
          y: e.clientY - boundingRect.y
        };

        switch (e.button) {
          case 0:
            _this6._drag = true;

            if (_this6._activeTool === "polygon") {
              if (!_this6._ap) {
                /**
                 * Create new polygon and start editing/adding vertices
                 */
                if (!_this6.mouseOnVertex(event)) {
                  _this6._ap = _this6._editor.createPolygon([{
                    x: _this6.xtovx(event.x),
                    y: _this6.ytovy(event.y)
                  }], false);
                  _this6._av = _this6._editor.createVertex(_this6.xtovx(event.x), _this6.ytovy(event.y), _this6._ap);
                }
              } else if (_this6._ap) {
                /**
                 * Polygon editing active, add new vertex
                 */
                _this6._av = _this6._editor.createVertex(_this6.xtovx(event.x), _this6.ytovy(event.y), _this6._ap, _this6._av.id, _this6._direction);
              }
            }

            if (_this6._activeTool === "select") {
              var v = _this6.getCloseVertex(event);

              var o = _this6.getCloseObject(event);

              if (!v.vertex && !o && !e.ctrlKey) {
                _this6.clearSelection();
              }

              if (o) {
                _this6.handleObjectSelection(o, e);

                _this6._dragMove = true;
              }

              if (v.vertex) {
                _this6.handleVertexSelection(v, e);

                _this6._dragMove = true;
              }

              if (!_this6._dragMove) {
                _this6._dragSelectStart = event;
              }
            } else if (_this6._activeTool === "apple" || _this6._activeTool === "killer" || _this6._activeTool === "exit") {
              _this6._editor.createObject(_this6.xtovx(event.x), _this6.ytovy(event.y), _this6._activeTool, "normal", 0);
            }

            break;

          case 1:
            _this6._middleDrag = true;
            break;

          case 2:
            if (_this6._activeTool === "polygon") {
              /**
               * Stop polygon editing, delete polygon if not enough vertices
               */
              if (_this6._ap) {
                if (_this6._ap.vertices.length < 4) {
                  _this6._editor.deletePolygon(_this6._ap.id);
                } else {
                  _this6._editor.deleteVertex(_this6._ap, _this6._av.id);
                }

                _this6._av = null;
                _this6._ap = null;
              }
            }

        }
      });

      this._canvas.addEventListener("mousemove", function (e) {
        var boundingRect = _this6._canvas.getBoundingClientRect();

        var event = {
          x: e.clientX - boundingRect.x,
          y: e.clientY - boundingRect.y
        };

        if (_this6._activeTool === "polygon") {
          if (_this6._av) {
            _this6._editor.updateVertex(_this6._av, _this6._ap, _this6.xtovx(event.x), _this6.ytovy(event.y));
          }
        }

        if (_this6._activeTool === "select") {
          if (_this6._dragMove) {
            _this6._selection.vertices.map(function (v) {
              _this6._editor.updateVertex(v.vertex, v.polygon, _this6.xtovx(_this6.vxtox(v.vertex.x) + (event.x - _this6._preMouse.x)), _this6.ytovy(_this6.vytoy(v.vertex.y) + (event.y - _this6._preMouse.y)));
            });

            _this6._selection.objects.map(function (v) {
              _this6._editor.updateObject(v, _this6.xtovx(_this6.vxtox(v.x) + (event.x - _this6._preMouse.x)), _this6.ytovy(_this6.vytoy(v.y) + (event.y - _this6._preMouse.y)));
            });
          }

          if (_this6._drag) {
            _this6._dragSelectEnd = event;
          }
        }

        if (_this6._middleDrag && _this6._preMouse) {
          _this6._viewPortOffset.x += event.x - _this6._preMouse.x;
          _this6._viewPortOffset.y += event.y - _this6._preMouse.y;
        }

        _this6._preMouse = event;
      });
    }
  }, {
    key: "handleVertexSelection",
    value: function handleVertexSelection(v, e, multiselect) {
      var existing = this._selection.vertices.findIndex(function (ve) {
        return ve.vertex.id === v.vertex.id;
      });

      if (existing < 0) {
        if (e.ctrlKey || multiselect) this._selection.vertices.push(v);else {
          this.clearSelection();
          this._selection.vertices = [v];
        }
      } else {
        if (e.ctrlKey) this._selection.vertices.splice(existing, 1);
      }
    }
  }, {
    key: "handleObjectSelection",
    value: function handleObjectSelection(o, e, multiselect) {
      var existing = this._selection.objects.findIndex(function (oe) {
        return oe.id === o.id;
      });

      if (existing < 0) {
        if (e.ctrlKey || multiselect) this._selection.objects.push(o);else {
          this.clearSelection();
          this._selection.objects = [o];
        }
      } else {
        if (e.ctrlKey) this._selection.objects.splice(existing, 1);
      }
    }
  }, {
    key: "xtovx",
    value: function xtovx(x) {
      return (x - this._viewPortOffset.x) / this._zoom;
    }
  }, {
    key: "ytovy",
    value: function ytovy(y) {
      return (y - this._viewPortOffset.y) / this._zoom;
    }
  }, {
    key: "vxtox",
    value: function vxtox(vx) {
      return vx * this._zoom + this._viewPortOffset.x;
    }
  }, {
    key: "vytoy",
    value: function vytoy(vy) {
      return vy * this._zoom + this._viewPortOffset.y;
    }
  }, {
    key: "resize",
    value: function resize() {
      this._canvas.width = this._wrapper.width = this._container.offsetWidth;
      this._canvas.height = this._wrapper.height = this._container.offsetHeight;
    }
  }, {
    key: "newLevel",
    value: function newLevel() {
      this._editor.newLevel();
    }
  }, {
    key: "loop",
    value: function loop() {
      var _this7 = this;

      this.render();
      this._animationLoop = window.requestAnimationFrame(function () {
        _this7.loop();
      });
    }
  }, {
    key: "stopAnimationLoop",
    value: function stopAnimationLoop() {
      window.cancelAnimationFrame(this._animationLoop);
    }
  }, {
    key: "pointInPolygon",
    value: function pointInPolygon(x, y, vertices) {
      var inside = false;

      for (var i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        var xi = vertices[i].x,
            yi = vertices[i].y;
        var xj = vertices[j].x,
            yj = vertices[j].y;
        var intersect = yi > y != yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }

      return inside;
    }
  }, {
    key: "isGround",
    value: function isGround(p) {
      var _this8 = this;

      var i = 0;

      this._editor.level.polygons.map(function (pp) {
        if (pp.id !== p.id) {
          if (_this8.pointInPolygon(p.vertices[0].x, p.vertices[0].y, pp.vertices)) i++;
        }
      });

      return i % 2 !== 0;
    }
  }, {
    key: "isClockwise",
    value: function isClockwise(vertices) {
      var sum = 0;
      var v = vertices.slice(0);
      v.push({
        x: vertices[0].x,
        y: vertices[0].y
      });

      for (var i = 0; i < v.length - 1; i++) {
        var cur = v[i],
            next = v[i + 1];
        sum += (next.x - cur.x) * (next.y + cur.y);
      }

      return sum > 0;
    }
  }, {
    key: "render",
    value: function render() {
      var _this9 = this;

      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

      this._ctx.fillStyle = "#f2f2f2";
      this._ctx.strokeStyle = this._strokeColor;

      this._ctx.save();

      this._ctx.translate(this._viewPortOffset.x, this._viewPortOffset.y);

      this._ctx.scale(this._zoom, this._zoom);

      this._ctx.beginPath();

      this._editor.level.polygons.map(function (p) {
        var d = p.vertices.slice(0);
        if (_this9.isGround(p) !== _this9.isClockwise(p.vertices)) d.reverse();
        d.map(function (v, i) {
          if (i === 0) _this9._ctx.moveTo(v.x, v.y);else _this9._ctx.lineTo(v.x, v.y);
        });

        _this9._ctx.lineTo(d[0].x, d[0].y);
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

        this._ap.vertices.map(function (v, i) {
          if (i === 0) _this9._ctx.moveTo(v.x, v.y);else _this9._ctx.lineTo(v.x, v.y);
        });

        this._ctx.closePath();

        this._ctx.restore();

        this._ctx.stroke();
      }

      this._editor.level.objects.map(function (o) {
        switch (o.type) {
          case "apple":
            _this9._ctx.strokeStyle = "#dd0404";
            break;

          case "killer":
            _this9._ctx.strokeStyle = "#8d0ad3";
            break;

          case "start":
            _this9._ctx.strokeStyle = "#0b6b08";
            break;

          case "exit":
            _this9._ctx.strokeStyle = "#ffffff";
            break;
        }

        _this9._ctx.save();

        _this9._ctx.translate(_this9._viewPortOffset.x, _this9._viewPortOffset.y);

        _this9._ctx.scale(_this9._zoom, _this9._zoom);

        _this9._ctx.beginPath();

        _this9._ctx.arc(o.x, o.y, 0.4, 0, 2 * Math.PI);

        _this9._ctx.closePath();

        _this9._ctx.restore();

        _this9._ctx.stroke();
      });
      /**
       * Selection handles
       */


      this._ctx.save();

      this._ctx.translate(this._viewPortOffset.x, this._viewPortOffset.y);

      this._ctx.scale(this._zoom, this._zoom);

      this._ctx.fillStyle = "#fff";

      this._selection.vertices.map(function (v) {
        _this9._ctx.fillRect(v.vertex.x - 2.5 / _this9._zoom, v.vertex.y - 2.5 / _this9._zoom, 5 / _this9._zoom, 5 / _this9._zoom);
      });

      this._selection.objects.map(function (v) {
        _this9._ctx.fillRect(v.x - 2.5 / _this9._zoom, v.y - 2.5 / _this9._zoom, 5 / _this9._zoom, 5 / _this9._zoom);
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
  }]);

  return LevelEditorGUI;
}();

module.exports = LevelEditorGUI;