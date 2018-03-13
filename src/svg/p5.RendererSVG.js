'use strict';

var p5 = require('../core/core');
var constants = require('../core/constants');
require('../core/p5.Renderer');
//var fs = require('fs');

var svgNS = 'http://www.w3.org/2000/svg';

/**
 * 3D graphics class
 * @class p5.RendererSVG
 * @constructor
 * @extends p5.Renderer
 * @todo extend class to include public method for offscreen
 * rendering (FBO).
 *
 */
p5.RendererSVG = function(pInst, isMainCanvas, attr) {
  var elt = document.createElementNS(svgNS, 'svg');
  //elt.xmlns = svgNS;

  p5.Renderer.call(this, elt, pInst, constants.SVG, isMainCanvas);

  this._initContext();

  // note: must call fill() and stroke () AFTER
  // default shader has been set.
  this.fill(255, 255, 255, 255);
  this._pointSize = 1;
  this._strokeWeight = 1;
  this._strokeColor = pInst.color(0);

  this.name = 'p5.RendererSVG'; // for friendly debugger system

  return this;
};

p5.RendererSVG.prototype = Object.create(p5.Renderer.prototype);

//////////////////////////////////////////////
// Setting
//////////////////////////////////////////////

p5.RendererSVG.prototype._initContext = function() {};

//This is helper function to reset the context anytime the attributes
//are changed with setAttributes()

p5.RendererSVG.prototype._resetContext = function(attr, options, callback) {};

p5.RendererSVG.prototype._addElement = function(tagName, attributes) {
  var elt = document.createElementNS(svgNS, tagName);
  for (var name in attributes) {
    elt.setAttributeNS(null, name, attributes[name]);
  }
  this.elt.appendChild(elt);
  return elt;
};

p5.RendererSVG.prototype.background = function() {
  var color = this._pInst.color.apply(this._pInst, arguments);

  this.elt.innerHTML = '';

  this.elt.style.backgroundColor = color.toString();
};

p5.RendererSVG.prototype.fill = function(v1, v2, v3, a) {
  this._doFill = true;
  this._fillColor = this._pInst.color.apply(this._pInst, arguments);
};

p5.RendererSVG.prototype.stroke = function(r, g, b, a) {
  this._doStroke = true;
  this._strokeColor = this._pInst.color.apply(this._pInst, arguments);
};

p5.RendererSVG.prototype.strokeWeight = function(w) {
  this._strokeWeight = w;
};

p5.RendererSVG.prototype.line = function(x1, y1, x2, y2) {
  if (this._doStroke) {
    this._addElement('line', {
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      'stroke-width': this._strokeWeight,
      stroke: this._strokeColor.toString()
    });
  }
};

p5.RendererSVG.prototype.ellipse = function(cx, cy, rx, ry) {
  if (this._doStroke || this._fillColor) {
    var elt = this._addElement('ellipse', {
      cx: cx + rx / 2,
      cy: cy + ry / 2,
      rx: rx / 2,
      ry: ry / 2
    });

    if (this._doStroke) {
      elt.setAttributeNS(null, 'stroke-weight', this._strokeWeight);
      elt.setAttributeNS(null, 'stroke', this._strokeColor.toString());
    }
    if (this._fillColor) {
      elt.setAttributeNS(null, 'fill', this._fillColor.toString());
    }
  }
};

p5.RendererSVG.prototype.rect = function(x, y, w, h, tl, tr, br, bl) {
  if (this._doStroke || this._fillColor) {
    var elt;

    if (tl || tr || bl || br) {
      if (typeof tr === 'undefined') {
        tr = tl || 0;
      }
      if (typeof bl === 'undefined') {
        bl = tl || 0;
      }
      if (typeof br === 'undefined') {
        br = tl || 0;
      }

      elt = this._addElement('path', {
        d:
          'M ' +
          (x + tl) +
          ',' +
          y +
          ' L ' +
          (x + w - tr) +
          ',' +
          y +
          ' A ' +
          tr +
          ',' +
          tr +
          ' 0 0 1 ' +
          (x + w) +
          ' ' +
          (y + tr) +
          ' L ' +
          (x + w) +
          ',' +
          (y + h - br) +
          ' A ' +
          br +
          ',' +
          br +
          ' 0 0 1 ' +
          (x + w - br) +
          ' ' +
          (y + h) +
          ' L ' +
          (x + bl) +
          ',' +
          (y + h) +
          ' A ' +
          bl +
          ',' +
          bl +
          ' 0 0 1 ' +
          x +
          ' ' +
          (y + h - bl) +
          ' L ' +
          x +
          ',' +
          (y + tr) +
          ' A ' +
          tl +
          ',' +
          tl +
          ' 0 0 1 ' +
          (x + tl) +
          ' ' +
          y +
          ' Z'
      });
    } else {
      elt = this._addElement('rect', {
        x: x,
        y: y,
        width: w,
        height: h
      });
    }

    if (this._doStroke) {
      elt.setAttributeNS(null, 'stroke-weight', this._strokeWeight);
      elt.setAttributeNS(null, 'stroke', this._strokeColor.toString());
    }
    if (this._fillColor) {
      elt.setAttributeNS(null, 'fill', this._fillColor.toString());
    }
  }
};

/*
p5.RendererSVG.prototype.translate = function(x, y, z) {
  return this;
};

p5.RendererSVG.prototype.scale = function(x,y,z) {
  this.uMVMatrix.scale([x,y,z]);
  return this;
};

p5.RendererSVG.prototype.rotate = function(rad, axis){
  this.uMVMatrix.rotate(rad, axis);
  return this;
};

p5.RendererSVG.prototype.push = function() {
  uMVMatrixStack.push(this.uMVMatrix.copy());
  cameraMatrixStack.push(this.cameraMatrix.copy());
};

p5.RendererSVG.prototype.pop = function() {
  if (uMVMatrixStack.length === 0) {
    throw new Error('Invalid popMatrix!');
  }
  this.uMVMatrix = uMVMatrixStack.pop();
  if (cameraMatrixStack.length === 0) {
    throw new Error('Invalid popMatrix!');
  }
  this.cameraMatrix = cameraMatrixStack.pop();
};

*/

p5.RendererSVG.prototype.resetMatrix = function() {
  //this.uMVMatrix = p5.Matrix.identity();
  return this;
};

module.exports = p5.RendererSVG;
