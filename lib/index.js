"use strict";

require("core-js/modules/es6.array.for-each");

require("core-js/modules/es6.array.filter");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.array.iterator");

require("core-js/modules/es6.object.keys");

require("core-js/modules/es6.object.define-property");

require("core-js/modules/es6.array.fill");

require("core-js/modules/es6.array.find-index");

require("core-js/modules/es6.array.index-of");

require("core-js/modules/es6.math.hypot");

require("core-js/modules/es6.function.name");

require("core-js/modules/es6.array.map");

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var LevelEditor = require('level-editor');

var FileSaver = require('file-saver');

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

      this.viewPortOffset = {
        x: 150,
        y: 50
      };
      this.zoom = 50;
      this.direction = 0;
      var defaultColors = {
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
      this.colors = _objectSpread({}, defaultColors, settings.colors);
      this.drawAllEdges = false;
      this.editor = new LevelEditor();
      this.editor.newLevel();
      this.container = document.getElementById(settings.element || 'level-editor-gui');
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
      this.tools = [{
        key: 'polygon',
        name: 'Polygon'
      }, {
        key: 'select',
        name: 'Select'
      }, {
        key: 'apple',
        name: 'Apple'
      }, {
        key: 'killer',
        name: 'Killer'
      }, {
        key: 'exit',
        name: 'Flower'
      }, {
        key: 'join',
        name: 'Join',
        onClick: function onClick() {
          _this.dialog.style.cssText = 'position:absolute;left:200px;top:100px;width:200px;height:100px;background:#ffffff;z-index:1000;padding:10px';
        }
      }, {
        key: 'download',
        name: 'Download',
        onClick: function onClick() {
          _this.editor.createBinary().then(function (result) {
            FileSaver.saveAs(new Blob([result]), 'level.lev');
          });
        }
      }];
      this.toolbarElements = [];
      if (!settings.hasOwnProperty('toolbar') || settings.toolbar) this.createToolbar();
      this.createDialog();
      this.animationLoop = window.requestAnimationFrame(function () {
        _this.loop();
      });
      this.activateTool(this.tools[0]);
    }
  }, {
    key: "createDialog",
    value: function createDialog() {
      var _this2 = this;

      var el = document.createElement('div');
      this.dialog = el;
      el.style.cssText = 'display: none;';
      var input = document.createElement('input');
      el.appendChild(input);
      var joinButton = document.createElement('button');
      joinButton.innerHTML = 'join';
      var cancelButton = document.createElement('button');
      cancelButton.innerHTML = 'cancel';
      el.appendChild(joinButton);
      el.appendChild(cancelButton);

      joinButton.onclick = function () {
        _this2.editor.joinRoom(input.value);

        _this2.dialog.style.cssText = 'display:none';
      };

      cancelButton.onclick = function () {
        _this2.dialog.style.cssText = 'display:none';
      };

      this.wrapper.appendChild(el);
    }
  }, {
    key: "createToolbar",
    value: function createToolbar() {
      var _this3 = this;

      this.toolbar = document.createElement('div');
      this.toolbar.style.cssText = 'position: absolute;left: 0;top: 0;width: 100px;height: 100%;background: ' + this.colors.toolbar;
      this.toolbar.id = 'level-editor-gui-toolbar';
      this.tools.map(function (t) {
        var el = document.createElement('div');
        el.style.cssText = 'color: #fff;padding: 10px;';
        el.className = 'level-editor-gui-toolbar-tool' + (_this3.activeTool === t.key ? ' active' : '');
        el.textContent = t.name;
        el.setAttribute('key', t.key);
        el.addEventListener('mousedown', function () {
          _this3.activateTool(t);

          t.onClick && t.onClick();
        });

        _this3.toolbarElements.push(el);

        _this3.toolbar.appendChild(el);
      });
      this.wrapper.appendChild(this.toolbar);
    }
  }, {
    key: "activateTool",
    value: function activateTool(tool) {
      this.activeTool = tool.key;
      this.toolbarElements.map(function (t) {
        t.className = 'level-editor-gui-toolbar-tool' + (t.getAttribute('key') === tool.key ? ' active' : '');

        if (t.getAttribute('key') === tool.key) {
          t.style.cssText = 'color: #000;background: #fff;padding: 10px; opacity: 0.8;';
        } else {
          t.style.cssText = 'color: #fff;padding: 10px; opacity: 0.8;';
        }
      });
    }
  }, {
    key: "mouseOnVertex",
    value: function mouseOnVertex(e) {
      var cv = this.getCloseVertex(e);

      if (cv.vertex) {
        this.av = this.editor.createVertex(this.xtovx(e.x), this.ytovy(e.y), cv.polygon, cv.vertex.id, this.direction);
        this.ap = cv.polygon;
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
      this.editor.level.polygons.map(function (p) {
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
      this.editor.level.objects.map(function (o) {
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
      if (delta > 0) this.zoom *= 1.2;else this.zoom *= 0.8;
      this.viewPortOffset.x += e.clientX - this.vxtox(mousePointX);
      this.viewPortOffset.y += e.clientY - this.vytoy(mousePointY);
    }
  }, {
    key: "clearSelection",
    value: function clearSelection() {
      this.selection.vertices = [];
      this.selection.objects = [];
    }
  }, {
    key: "addEventListeners",
    value: function addEventListeners() {
      var _this6 = this;

      window.addEventListener('resize', function () {
        _this6.resize();
      });
      this.canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
      });
      this.canvas.addEventListener('mousewheel', function (e) {
        _this6.zoom(e);
      }, false);
      this.canvas.addEventListener('DOMMouseScroll', function (e) {
        _this6.zoom(e);
      }, false);
      this.canvas.addEventListener('keydown', function (e) {
        var deletedPolygons = [];

        switch (e.keyCode) {
          case 16:
            _this6.drawAllEdges = !_this6.drawAllEdges;
            break;

          case 32:
            if (_this6.ap) {
              var i = _this6.direction === 1 ? -1 : 1;
              var index = _this6.editor.findVertexIndex(_this6.av.id, _this6.ap) + i;
              var ci = _this6.av.id;
              _this6.direction = _this6.direction === 0 ? 1 : 0;
              _this6.av = _this6.editor.createVertex(_this6.av.x, _this6.av.y, _this6.ap, _this6.ap.vertices[index].id, _this6.direction);

              _this6.editor.deleteVertex(_this6.ap, ci);
            }

            break;

          case 46:
            _this6.selection.vertices.map(function (v) {
              if (v.polygon.vertices.length > 3) _this6.editor.deleteVertex(v.polygon, v.vertex.id);else if (deletedPolygons.indexOf(v.polygon.id) < 0) {
                _this6.editor.deletePolygon(v.polygon.id);

                deletedPolygons.push(v.polygon.id);
              }
            });

            _this6.selection.objects.map(function (o) {
              _this6.editor.deleteObject(o.id);
            });

            _this6.clearSelection();

            break;
        }
      });
      this.canvas.addEventListener('mouseup', function (e) {
        switch (e.button) {
          case 0:
            _this6.drag = false;

            if (_this6.activeTool === 'select') {
              _this6.ap = null;
              _this6.av = null;
              _this6.dragMove = false;

              if (_this6.dragSelectStart && _this6.dragSelectEnd) {
                var vxStart = _this6.xtovx(_this6.dragSelectStart.x);

                var vxEnd = _this6.xtovx(_this6.dragSelectEnd.x);

                var vyStart = _this6.ytovy(_this6.dragSelectStart.y);

                var vyEnd = _this6.ytovy(_this6.dragSelectEnd.y);

                _this6.editor.level.polygons.map(function (p) {
                  p.vertices.map(function (v) {
                    if ((v.x > vxStart && v.x < vxEnd || v.x < vxStart && v.x > vxEnd) && (v.y > vyStart && v.y < vyEnd || v.y < vyStart && v.y > vyEnd)) {
                      _this6.handleVertexSelection({
                        polygon: p,
                        vertex: v
                      }, e, true);
                    }
                  });
                });

                _this6.editor.level.objects.map(function (o) {
                  if ((o.x > vxStart && o.x < vxEnd || o.x < vxStart && o.x > vxEnd) && (o.y > vyStart && o.y < vyEnd || o.y < vyStart && o.y > vyEnd)) {
                    _this6.handleObjectSelection(o, e, true);
                  }
                });
              }

              _this6.dragSelectEnd = null;
              _this6.dragSelectStart = null;
            }

            break;

          case 1:
            _this6.middleDrag = false;
            break;
        }
      });
      this.canvas.addEventListener('mousedown', function (e) {
        var boundingRect = _this6.canvas.getBoundingClientRect();

        var event = {
          x: e.clientX - boundingRect.x,
          y: e.clientY - boundingRect.y
        };

        switch (e.button) {
          case 0:
            _this6.drag = true;

            if (_this6.activeTool === 'polygon') {
              if (!_this6.ap) {
                /**
                 * Create new polygon and start editing/adding vertices
                 */
                if (!_this6.mouseOnVertex(event)) {
                  _this6.ap = _this6.editor.createPolygon([{
                    x: _this6.xtovx(event.x),
                    y: _this6.ytovy(event.y)
                  }], false);
                  _this6.av = _this6.editor.createVertex(_this6.xtovx(event.x), _this6.ytovy(event.y), _this6.ap);
                }
              } else if (_this6.ap) {
                /**
                 * Polygon editing active, add new vertex
                 */
                _this6.av = _this6.editor.createVertex(_this6.xtovx(event.x), _this6.ytovy(event.y), _this6.ap, _this6.av.id, _this6.direction);
              }
            }

            if (_this6.activeTool === 'select') {
              var v = _this6.getCloseVertex(event);

              var o = _this6.getCloseObject(event);

              if (!v.vertex && !o && !e.ctrlKey) {
                _this6.clearSelection();
              }

              if (o) {
                _this6.handleObjectSelection(o, e);

                _this6.dragMove = true;
              }

              if (v.vertex) {
                _this6.handleVertexSelection(v, e);

                _this6.dragMove = true;
              }

              if (!_this6.dragMove) {
                _this6.dragSelectStart = event;
              }
            } else if (_this6.activeTool === 'apple' || _this6.activeTool === 'killer' || _this6.activeTool === 'exit') {
              _this6.editor.createObject(_this6.xtovx(event.x), _this6.ytovy(event.y), _this6.activeTool, 'normal', 0);
            }

            break;

          case 1:
            _this6.middleDrag = true;
            break;

          case 2:
            if (_this6.activeTool === 'polygon') {
              /**
               * Stop polygon editing, delete polygon if not enough vertices
               */
              if (_this6.ap) {
                if (_this6.ap.vertices.length < 4) {
                  _this6.editor.deletePolygon(_this6.ap.id);
                } else {
                  _this6.editor.deleteVertex(_this6.ap, _this6.av.id);
                }

                _this6.av = null;
                _this6.ap = null;
              }
            }

        }
      });
      this.canvas.addEventListener('mousemove', function (e) {
        var boundingRect = _this6.canvas.getBoundingClientRect();

        var event = {
          x: e.clientX - boundingRect.x,
          y: e.clientY - boundingRect.y
        };

        if (_this6.activeTool === 'polygon') {
          if (_this6.av) {
            _this6.editor.updateVertex(_this6.av, _this6.ap, _this6.xtovx(event.x), _this6.ytovy(event.y));
          }
        }

        if (_this6.activeTool === 'select') {
          if (_this6.dragMove) {
            _this6.selection.vertices.map(function (v) {
              _this6.editor.updateVertex(v.vertex, v.polygon, _this6.xtovx(_this6.vxtox(v.vertex.x) + (event.x - _this6.preMouse.x)), _this6.ytovy(_this6.vytoy(v.vertex.y) + (event.y - _this6.preMouse.y)));
            });

            _this6.selection.objects.map(function (v) {
              _this6.editor.updateObject(v, _this6.xtovx(_this6.vxtox(v.x) + (event.x - _this6.preMouse.x)), _this6.ytovy(_this6.vytoy(v.y) + (event.y - _this6.preMouse.y)));
            });
          }

          if (_this6.drag) {
            _this6.dragSelectEnd = event;
          }
        }

        if (_this6.middleDrag && _this6.preMouse) {
          _this6.viewPortOffset.x += event.x - _this6.preMouse.x;
          _this6.viewPortOffset.y += event.y - _this6.preMouse.y;
        }

        _this6.preMouse = event;
      });
    }
  }, {
    key: "handleVertexSelection",
    value: function handleVertexSelection(v, e, multiselect) {
      var existing = this.selection.vertices.findIndex(function (ve) {
        return ve.vertex.id === v.vertex.id;
      });

      if (existing < 0) {
        if (e.ctrlKey || multiselect) this.selection.vertices.push(v);else {
          this.clearSelection();
          this.selection.vertices = [v];
        }
      } else {
        if (e.ctrlKey) this.selection.vertices.splice(existing, 1);
      }
    }
  }, {
    key: "handleObjectSelection",
    value: function handleObjectSelection(o, e, multiselect) {
      var existing = this.selection.objects.findIndex(function (oe) {
        return oe.id === o.id;
      });

      if (existing < 0) {
        if (e.ctrlKey || multiselect) this.selection.objects.push(o);else {
          this.clearSelection();
          this.selection.objects = [o];
        }
      } else {
        if (e.ctrlKey) this.selection.objects.splice(existing, 1);
      }
    }
  }, {
    key: "xtovx",
    value: function xtovx(x) {
      return (x - this.viewPortOffset.x) / this.zoom;
    }
  }, {
    key: "ytovy",
    value: function ytovy(y) {
      return (y - this.viewPortOffset.y) / this.zoom;
    }
  }, {
    key: "vxtox",
    value: function vxtox(vx) {
      return vx * this.zoom + this.viewPortOffset.x;
    }
  }, {
    key: "vytoy",
    value: function vytoy(vy) {
      return vy * this.zoom + this.viewPortOffset.y;
    }
  }, {
    key: "resize",
    value: function resize() {
      this.canvas.width = this.wrapper.width = this.container.offsetWidth;
      this.canvas.height = this.wrapper.height = this.container.offsetHeight;
    }
  }, {
    key: "newLevel",
    value: function newLevel() {
      this.editor.newLevel();
    }
  }, {
    key: "loop",
    value: function loop() {
      var _this7 = this;

      this.render();
      this.animationLoop = window.requestAnimationFrame(function () {
        _this7.loop();
      });
    }
  }, {
    key: "stopAnimationLoop",
    value: function stopAnimationLoop() {
      window.cancelAnimationFrame(this.animationLoop);
    }
  }, {
    key: "render",
    value: function render() {
      var _this8 = this;

      this.ctx.fillStyle = this.colors.ground;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = this.colors.sky;
      this.ctx.strokeStyle = this.colors.edges;
      this.ctx.save();
      this.ctx.translate(this.viewPortOffset.x, this.viewPortOffset.y);
      this.ctx.scale(this.zoom, this.zoom);
      this.ctx.beginPath();
      this.editor.level.polygons.map(function (p) {
        var d = p.vertices.slice(0);
        if (!_this8.drawAllEdges && _this8.editor.shouldPolygonBeGround(p) !== _this8.editor.isPolygonClockwise(p)) d.reverse();
        d.map(function (v, i) {
          if (i === 0) _this8.ctx.moveTo(v.x, v.y);else _this8.ctx.lineTo(v.x, v.y);
        });

        _this8.ctx.lineTo(d[0].x, d[0].y);
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
        this.ap.vertices.map(function (v, i) {
          if (i === 0) _this8.ctx.moveTo(v.x, v.y);else _this8.ctx.lineTo(v.x, v.y);
        });
        this.ctx.closePath();
        this.ctx.restore();
        this.ctx.stroke();
      }

      this.editor.level.objects.map(function (o) {
        switch (o.type) {
          case 'apple':
            _this8.ctx.fillStyle = _this8.colors.apple;
            break;

          case 'killer':
            _this8.ctx.fillStyle = _this8.colors.killer;
            break;

          case 'start':
            _this8.ctx.fillStyle = _this8.colors.start;
            break;

          case 'exit':
            _this8.ctx.fillStyle = _this8.colors.flower;
            break;
        }

        _this8.ctx.save();

        _this8.ctx.translate(_this8.viewPortOffset.x, _this8.viewPortOffset.y);

        _this8.ctx.scale(_this8.zoom, _this8.zoom);

        _this8.ctx.beginPath();

        _this8.ctx.arc(o.x, o.y, 0.4, 0, 2 * Math.PI);

        _this8.ctx.closePath();

        _this8.ctx.restore();

        _this8.ctx.fill();
      });
      /**
       * Selection handles
       */

      this.ctx.save();
      this.ctx.translate(this.viewPortOffset.x, this.viewPortOffset.y);
      this.ctx.scale(this.zoom, this.zoom);
      this.ctx.fillStyle = this.colors.selection;
      this.selection.vertices.map(function (v) {
        _this8.ctx.fillRect(v.vertex.x - 2.5 / _this8.zoom, v.vertex.y - 2.5 / _this8.zoom, 5 / _this8.zoom, 5 / _this8.zoom);
      });
      this.selection.objects.map(function (v) {
        _this8.ctx.fillRect(v.x - 2.5 / _this8.zoom, v.y - 2.5 / _this8.zoom, 5 / _this8.zoom, 5 / _this8.zoom);
      });
      this.ctx.restore();

      if (this.dragSelectStart && this.dragSelectEnd) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colors.selectBox;
        this.ctx.rect(this.dragSelectStart.x, this.dragSelectStart.y, this.dragSelectEnd.x - this.dragSelectStart.x, this.dragSelectEnd.y - this.dragSelectStart.y);
        this.ctx.closePath();
        this.ctx.stroke();
      }
    }
  }]);

  return LevelEditorGUI;
}();

module.exports = LevelEditorGUI;