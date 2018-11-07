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

      this.settings = settings;
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
      this.wrapper.style = 'position: relative; height: 100%;';
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
        key: 'rooms',
        name: 'Rooms',
        onClick: function onClick() {
          _this.dialog.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:#fff;z-index:10;padding:10px;box-sizing:border-box';
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
      this.activateTool(this.tools[0]);
      this.createDialog();

      if (settings.server) {
        this.createStatusbar();

        this.editor.onConnectionStatusChange = function (status) {
          _this.serverStatusChange(status);
        };

        this.editor.onServerRoomsChange = function (rooms) {
          _this.updateRoomList(rooms);
        };

        this.editor.connect(settings.server);
      }

      this.animationLoop = window.requestAnimationFrame(function () {
        _this.loop();
      });
    }
  }, {
    key: "serverStatusChange",
    value: function serverStatusChange(status) {
      switch (status) {
        case 'connecting':
        case 'reconnecting':
          this.statusbar.style.background = '#b96914';
          this.statusbar.innerHTML = 'Connecting to ' + this.settings.server;
          break;

        case 'connected':
          this.statusbar.style.background = '#396915';
          this.statusbar.innerHTML = 'Connected to ' + this.settings.server;
          break;
      }
    }
  }, {
    key: "createStatusbar",
    value: function createStatusbar() {
      this.statusbar = document.createElement('div');
      this.statusbar.style.cssText = 'position: absolute;left: 0;bottom: 0px;width: 100%;background: black; padding: 10px; color: #ffffff; font-size: 12px;z-index: 15';
      this.wrapper.appendChild(this.statusbar);
    }
  }, {
    key: "createDialog",
    value: function createDialog() {
      var _this2 = this;

      var inputStyle = 'margin: 5px 0; padding: 5px;';
      var buttonStyle = 'margin: 5px 0; padding: 5px; min-width: 100px; margin-right: 10px;';
      var el = document.createElement('div');
      this.dialog = el;
      el.style.cssText = 'display: none;';
      this.roomListElement = document.createElement('div');
      this.roomListElement.style.cssText = 'float:left;width:50%;padding: 10px; box-sizing: border-box;';
      el.appendChild(this.roomListElement);
      this.joinRoomElement = document.createElement('div');
      this.joinRoomElement.innerHTML = '<h4>Join room</h4>';
      this.joinRoomElement.style.cssText = 'float:left;width:50%;padding: 10px; box-sizing: border-box;';
      this.roomNameInput = document.createElement('input');
      this.roomNameInput.setAttribute('placeholder', 'Room name');
      this.roomNameInput.setAttribute('type', 'text');
      this.roomNameInput.style.cssText = inputStyle;
      this.joinRoomElement.appendChild(this.roomNameInput);
      this.joinRoomElement.appendChild(document.createElement('br'));
      this.passwordInput = document.createElement('input');
      this.passwordInput.setAttribute('placeholder', 'Password');
      this.passwordInput.style.cssText = inputStyle;
      this.joinRoomElement.appendChild(this.passwordInput);
      this.joinRoomElement.appendChild(document.createElement('br'));
      var joinButton = document.createElement('button');
      joinButton.innerHTML = 'Join';
      joinButton.style.cssText = buttonStyle;
      this.joinRoomElement.appendChild(joinButton);
      var cancelButton = document.createElement('button');
      cancelButton.innerHTML = 'Close';
      cancelButton.style.cssText = buttonStyle;
      this.joinRoomElement.appendChild(cancelButton);
      el.appendChild(this.joinRoomElement);

      joinButton.onclick = function () {
        _this2.editor.joinRoom(_this2.roomNameInput.value, _this2.passwordInput.value);

        _this2.dialog.style.cssText = 'display:none';
      };

      cancelButton.onclick = function () {
        _this2.dialog.style.cssText = 'display:none';
      };

      this.wrapper.appendChild(el);
    }
  }, {
    key: "updateRoomList",
    value: function updateRoomList(rooms) {
      var _this3 = this;

      var itemStyle = 'border-bottom: 1px solid #f1f1f1; padding: 10px; font-size: 14px;';
      this.roomListElement.innerHTML = '<h4>Rooms</h4>';
      rooms.map(function (r) {
        var el = document.createElement('div');
        el.innerText = r;
        el.style.cssText = itemStyle;

        el.onclick = function () {
          _this3.roomNameInput.value = r;
        };

        _this3.roomListElement.appendChild(el);
      });
    }
  }, {
    key: "createToolbar",
    value: function createToolbar() {
      var _this4 = this;

      this.toolbar = document.createElement('div');
      this.toolbar.style.cssText = 'position: absolute;left: 0;top: 0;width: 100px;height: 100%;background: ' + this.colors.toolbar;
      this.toolbar.id = 'level-editor-gui-toolbar';
      this.tools.map(function (t) {
        var el = document.createElement('div');
        el.style.cssText = 'color: #fff;padding: 10px;';
        el.className = 'level-editor-gui-toolbar-tool' + (_this4.activeTool === t.key ? ' active' : '');
        el.textContent = t.name;
        el.setAttribute('key', t.key);
        el.addEventListener('mousedown', function () {
          _this4.activateTool(t);

          t.onClick && t.onClick();
        });

        _this4.toolbarElements.push(el);

        _this4.toolbar.appendChild(el);
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
      var _this5 = this;

      var minDist = 10;
      var cv;
      var cp;
      this.editor.level.polygons.map(function (p) {
        p.vertices.map(function (v) {
          var distance = Math.hypot(e.x - _this5.vxtox(v.x), e.y - _this5.vytoy(v.y));

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
      var _this6 = this;

      var minDist = 10;
      var co;
      this.editor.level.objects.map(function (o) {
        var distance = Math.hypot(e.x - _this6.vxtox(o.x), e.y - _this6.vytoy(o.y));

        if (distance < minDist) {
          minDist = distance;
          co = o;
        }
      });
      return co;
    }
  }, {
    key: "handleZoom",
    value: function handleZoom(e) {
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
      var _this7 = this;

      window.addEventListener('resize', function () {
        _this7.resize();
      });
      this.canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
      });
      this.canvas.addEventListener('mousewheel', function (e) {
        _this7.handleZoom(e);
      }, false);
      this.canvas.addEventListener('DOMMouseScroll', function (e) {
        _this7.handleZoom(e);
      }, false);
      this.canvas.addEventListener('keydown', function (e) {
        var deletedPolygons = [];

        switch (e.keyCode) {
          case 16:
            _this7.drawAllEdges = !_this7.drawAllEdges;
            break;

          case 32:
            if (_this7.ap) {
              var i = _this7.direction === 1 ? -1 : 1;
              var index = _this7.editor.findVertexIndex(_this7.av.id, _this7.ap) + i;
              var ci = _this7.av.id;
              _this7.direction = _this7.direction === 0 ? 1 : 0;
              _this7.av = _this7.editor.createVertex(_this7.av.x, _this7.av.y, _this7.ap, _this7.ap.vertices[index].id, _this7.direction);

              _this7.editor.deleteVertex(_this7.ap, ci);
            }

            break;

          case 46:
            _this7.selection.vertices.map(function (v) {
              if (v.polygon.vertices.length > 3) _this7.editor.deleteVertex(v.polygon, v.vertex.id);else if (deletedPolygons.indexOf(v.polygon.id) < 0) {
                _this7.editor.deletePolygon(v.polygon.id);

                deletedPolygons.push(v.polygon.id);
              }
            });

            _this7.selection.objects.map(function (o) {
              _this7.editor.deleteObject(o.id);
            });

            _this7.clearSelection();

            break;
        }
      });
      this.canvas.addEventListener('mouseup', function (e) {
        switch (e.button) {
          case 0:
            _this7.drag = false;

            if (_this7.activeTool === 'select') {
              _this7.ap = null;
              _this7.av = null;
              _this7.dragMove = false;

              if (_this7.dragSelectStart && _this7.dragSelectEnd) {
                var vxStart = _this7.xtovx(_this7.dragSelectStart.x);

                var vxEnd = _this7.xtovx(_this7.dragSelectEnd.x);

                var vyStart = _this7.ytovy(_this7.dragSelectStart.y);

                var vyEnd = _this7.ytovy(_this7.dragSelectEnd.y);

                _this7.editor.level.polygons.map(function (p) {
                  p.vertices.map(function (v) {
                    if ((v.x > vxStart && v.x < vxEnd || v.x < vxStart && v.x > vxEnd) && (v.y > vyStart && v.y < vyEnd || v.y < vyStart && v.y > vyEnd)) {
                      _this7.handleVertexSelection({
                        polygon: p,
                        vertex: v
                      }, e, true);
                    }
                  });
                });

                _this7.editor.level.objects.map(function (o) {
                  if ((o.x > vxStart && o.x < vxEnd || o.x < vxStart && o.x > vxEnd) && (o.y > vyStart && o.y < vyEnd || o.y < vyStart && o.y > vyEnd)) {
                    _this7.handleObjectSelection(o, e, true);
                  }
                });
              }

              _this7.dragSelectEnd = null;
              _this7.dragSelectStart = null;
            }

            break;

          case 1:
            _this7.middleDrag = false;
            break;
        }
      });
      this.canvas.addEventListener('mousedown', function (e) {
        var boundingRect = _this7.canvas.getBoundingClientRect();

        var event = {
          x: e.clientX - boundingRect.x,
          y: e.clientY - boundingRect.y
        };

        switch (e.button) {
          case 0:
            _this7.drag = true;

            if (_this7.activeTool === 'polygon') {
              if (!_this7.ap) {
                /**
                 * Create new polygon and start editing/adding vertices
                 */
                if (!_this7.mouseOnVertex(event)) {
                  _this7.ap = _this7.editor.createPolygon([{
                    x: _this7.xtovx(event.x),
                    y: _this7.ytovy(event.y)
                  }], false);
                  _this7.av = _this7.editor.createVertex(_this7.xtovx(event.x), _this7.ytovy(event.y), _this7.ap);
                }
              } else if (_this7.ap) {
                /**
                 * Polygon editing active, add new vertex
                 */
                _this7.av = _this7.editor.createVertex(_this7.xtovx(event.x), _this7.ytovy(event.y), _this7.ap, _this7.av.id, _this7.direction);
              }
            }

            if (_this7.activeTool === 'select') {
              var v = _this7.getCloseVertex(event);

              var o = _this7.getCloseObject(event);

              if (!v.vertex && !o && !e.ctrlKey) {
                _this7.clearSelection();
              }

              if (o) {
                _this7.handleObjectSelection(o, e);

                _this7.dragMove = true;
              }

              if (v.vertex) {
                _this7.handleVertexSelection(v, e);

                _this7.dragMove = true;
              }

              if (!_this7.dragMove) {
                _this7.dragSelectStart = event;
              }
            } else if (_this7.activeTool === 'apple' || _this7.activeTool === 'killer' || _this7.activeTool === 'exit') {
              _this7.editor.createObject(_this7.xtovx(event.x), _this7.ytovy(event.y), _this7.activeTool, 'normal', 0);
            }

            break;

          case 1:
            _this7.middleDrag = true;
            break;

          case 2:
            if (_this7.activeTool === 'polygon') {
              /**
               * Stop polygon editing, delete polygon if not enough vertices
               */
              if (_this7.ap) {
                if (_this7.ap.vertices.length < 4) {
                  _this7.editor.deletePolygon(_this7.ap.id);
                } else {
                  _this7.editor.deleteVertex(_this7.ap, _this7.av.id);
                }

                _this7.av = null;
                _this7.ap = null;
              }
            }

        }
      });
      this.canvas.addEventListener('mousemove', function (e) {
        var boundingRect = _this7.canvas.getBoundingClientRect();

        var event = {
          x: e.clientX - boundingRect.x,
          y: e.clientY - boundingRect.y
        };

        if (_this7.activeTool === 'polygon') {
          if (_this7.av) {
            _this7.editor.updateVertex(_this7.av, _this7.ap, _this7.xtovx(event.x), _this7.ytovy(event.y));
          }
        }

        if (_this7.activeTool === 'select') {
          if (_this7.dragMove) {
            _this7.selection.vertices.map(function (v) {
              _this7.editor.updateVertex(v.vertex, v.polygon, _this7.xtovx(_this7.vxtox(v.vertex.x) + (event.x - _this7.preMouse.x)), _this7.ytovy(_this7.vytoy(v.vertex.y) + (event.y - _this7.preMouse.y)));
            });

            _this7.selection.objects.map(function (v) {
              _this7.editor.updateObject(v, _this7.xtovx(_this7.vxtox(v.x) + (event.x - _this7.preMouse.x)), _this7.ytovy(_this7.vytoy(v.y) + (event.y - _this7.preMouse.y)));
            });
          }

          if (_this7.drag) {
            _this7.dragSelectEnd = event;
          }
        }

        if (_this7.middleDrag && _this7.preMouse) {
          _this7.viewPortOffset.x += event.x - _this7.preMouse.x;
          _this7.viewPortOffset.y += event.y - _this7.preMouse.y;
        }

        _this7.preMouse = event;
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
      var _this8 = this;

      this.render();
      this.animationLoop = window.requestAnimationFrame(function () {
        _this8.loop();
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
      var _this9 = this;

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
        if (!_this9.drawAllEdges && _this9.editor.shouldPolygonBeGround(p) !== _this9.editor.isPolygonClockwise(p)) d.reverse();
        d.map(function (v, i) {
          if (i === 0) _this9.ctx.moveTo(v.x, v.y);else _this9.ctx.lineTo(v.x, v.y);
        });

        _this9.ctx.lineTo(d[0].x, d[0].y);
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
          if (i === 0) _this9.ctx.moveTo(v.x, v.y);else _this9.ctx.lineTo(v.x, v.y);
        });
        this.ctx.closePath();
        this.ctx.restore();
        this.ctx.stroke();
      }

      this.editor.level.objects.map(function (o) {
        switch (o.type) {
          case 'apple':
            _this9.ctx.fillStyle = _this9.colors.apple;
            break;

          case 'killer':
            _this9.ctx.fillStyle = _this9.colors.killer;
            break;

          case 'start':
            _this9.ctx.fillStyle = _this9.colors.start;
            break;

          case 'exit':
            _this9.ctx.fillStyle = _this9.colors.flower;
            break;
        }

        _this9.ctx.save();

        _this9.ctx.translate(_this9.viewPortOffset.x, _this9.viewPortOffset.y);

        _this9.ctx.scale(_this9.zoom, _this9.zoom);

        _this9.ctx.beginPath();

        _this9.ctx.arc(o.x, o.y, 0.4, 0, 2 * Math.PI);

        _this9.ctx.closePath();

        _this9.ctx.restore();

        _this9.ctx.fill();
      });
      /**
       * Selection handles
       */

      this.ctx.save();
      this.ctx.translate(this.viewPortOffset.x, this.viewPortOffset.y);
      this.ctx.scale(this.zoom, this.zoom);
      this.ctx.fillStyle = this.colors.selection;
      this.selection.vertices.map(function (v) {
        _this9.ctx.fillRect(v.vertex.x - 2.5 / _this9.zoom, v.vertex.y - 2.5 / _this9.zoom, 5 / _this9.zoom, 5 / _this9.zoom);
      });
      this.selection.objects.map(function (v) {
        _this9.ctx.fillRect(v.x - 2.5 / _this9.zoom, v.y - 2.5 / _this9.zoom, 5 / _this9.zoom, 5 / _this9.zoom);
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