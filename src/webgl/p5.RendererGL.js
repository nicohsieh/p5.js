'use strict';

var p5 = require('../core/core');
var constants = require('../core/constants');
require('./p5.Shader');
require('../core/p5.Renderer');
require('./p5.Matrix');
var fs = require('fs');

var defaultShaders = {
  immediateVert: fs.readFileSync(
    __dirname + '/shaders/immediate.vert',
    'utf-8'
  ),
  vertexColorVert: fs.readFileSync(
    __dirname + '/shaders/vertexColor.vert',
    'utf-8'
  ),
  vertexColorFrag: fs.readFileSync(
    __dirname + '/shaders/vertexColor.frag',
    'utf-8'
  ),
  normalVert: fs.readFileSync(__dirname + '/shaders/normal.vert', 'utf-8'),
  normalFrag: fs.readFileSync(__dirname + '/shaders/normal.frag', 'utf-8'),
  basicFrag: fs.readFileSync(__dirname + '/shaders/basic.frag', 'utf-8'),
  lightVert: fs.readFileSync(__dirname + '/shaders/light.vert', 'utf-8'),
  lightTextureFrag: fs.readFileSync(
    __dirname + '/shaders/light_texture.frag',
    'utf-8'
  ),
  phongVert: fs.readFileSync(__dirname + '/shaders/phong.vert', 'utf-8'),
  phongFrag: fs.readFileSync(__dirname + '/shaders/phong.frag', 'utf-8'),
  lineVert: fs.readFileSync(__dirname + '/shaders/line.vert', 'utf-8'),
  lineFrag: fs.readFileSync(__dirname + '/shaders/line.frag', 'utf-8')
};

/**
 * 3D graphics class
 * @private
 * @class p5.RendererGL
 * @constructor
 * @extends p5.Renderer
 * @todo extend class to include public method for offscreen
 * rendering (FBO).
 *
 */
p5.RendererGL = function(elt, pInst, isMainCanvas, attr) {
  p5.Renderer.call(this, elt, pInst, isMainCanvas);
  this.attributes = {};
  attr = attr || {};
  this.attributes.alpha = attr.alpha === undefined ? true : attr.alpha;
  this.attributes.depth = attr.depth === undefined ? true : attr.depth;
  this.attributes.stencil = attr.stencil === undefined ? true : attr.stencil;
  this.attributes.antialias =
    attr.antialias === undefined ? false : attr.antialias;
  this.attributes.premultipliedAlpha =
    attr.premultipliedAlpha === undefined ? false : attr.premultipliedAlpha;
  this.attributes.preserveDrawingBuffer =
    attr.preserveDrawingBuffer === undefined
      ? true
      : attr.preserveDrawingBuffer;
  this.attributes.perPixelLighting =
    attr.perPixelLighting === undefined ? false : attr.perPixelLighting;
  this._initContext();
  this.isP3D = true; //lets us know we're in 3d mode
  this.GL = this.drawingContext;

  // lights

  this.ambientLightColors = [];
  this.directionalLightDirections = [];
  this.directionalLightColors = [];

  this.pointLightPositions = [];
  this.pointLightColors = [];

  /**
   * model view, projection, & normal
   * matrices
   */
  this.uMVMatrix = new p5.Matrix();
  this.uPMatrix = new p5.Matrix();
  this.uNMatrix = new p5.Matrix('mat3');

  // Camera
  this._curCamera = null;
  // default camera settings, then use those to populate camera fields.
  this._computeCameraDefaultSettings();
  this.cameraFOV = this.defaultCameraFOV;
  this.cameraAspect = this.defaultAspect;
  this.cameraX = this.defaultCameraX;
  this.cameraY = this.defaultCameraY;
  this.cameraZ = this.defaultCameraZ;
  this.cameraNear = this.defaultCameraNear;
  this.cameraFar = this.defaultCameraFar;
  this.cameraMatrix = new p5.Matrix();
  this.camera(); // set default camera matrices

  //Geometry & Material hashes
  this.gHash = {};

  this._defaultLightShader = undefined;
  this._defaultImmediateModeShader = undefined;
  this._defaultNormalShader = undefined;
  this._defaultColorShader = undefined;

  this.curFillShader = undefined;
  this.curStrokeShader = undefined;

  this._useColorShader();
  this.setStrokeShader(this._getLineShader());

  //Imediate Mode
  //default drawing is done in Retained Mode
  this.isImmediateDrawing = false;
  this.immediateMode = {};

  // note: must call fill() and stroke () AFTER
  // default shader has been set.
  this.fill(255, 255, 255, 255);
  //this.stroke(0, 0, 0, 255);
  this.pointSize = 5.0; //default point size
  this.strokeWeight(2);
  this.stroke(0, 0, 0);
  // array of textures created in this gl context via this.getTexture(src)
  this.textures = [];
  this.name = 'p5.RendererGL'; // for friendly debugger system

  return this;
};

p5.RendererGL.prototype = Object.create(p5.Renderer.prototype);

//////////////////////////////////////////////
// Setting
//////////////////////////////////////////////

p5.RendererGL.prototype._initContext = function() {
  try {
    this.drawingContext =
      this.canvas.getContext('webgl', this.attributes) ||
      this.canvas.getContext('experimental-webgl', this.attributes);
    if (this.drawingContext === null) {
      throw new Error('Error creating webgl context');
    } else {
      console.log('p5.RendererGL: enabled webgl context');
      var gl = this.drawingContext;
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      this._viewport = this.drawingContext.getParameter(
        this.drawingContext.VIEWPORT
      );
    }
  } catch (er) {
    throw new Error(er);
  }
};

//This is helper function to reset the context anytime the attributes
//are changed with setAttributes()

p5.RendererGL.prototype._resetContext = function(attr, options, callback) {
  var w = this.width;
  var h = this.height;
  var defaultId = this.canvas.id;
  var c = this.canvas;
  if (c) {
    c.parentNode.removeChild(c);
  }
  c = document.createElement('canvas');
  c.id = defaultId;
  if (this._pInst._userNode) {
    this._pInst._userNode.appendChild(c);
  } else {
    document.body.appendChild(c);
  }
  this._pInst.canvas = c;

  var renderer = new p5.RendererGL(this._pInst.canvas, this._pInst, true, attr);
  this._pInst._setProperty('_renderer', renderer);
  renderer.resize(w, h);
  renderer._applyDefaults();
  this._pInst._elements.push(renderer);

  if (typeof callback === 'function') {
    //setTimeout with 0 forces the task to the back of the queue, this ensures that
    //we finish switching out the renderer
    setTimeout(function() {
      callback.apply(window._renderer, options);
    }, 0);
  }
};
/**
 * @module Rendering
 * @submodule Rendering
 * @for p5
 */
/**
 * Set attributes for the WebGL Drawing context.
 * This is a way of adjusting ways that the WebGL
 * renderer works to fine-tune the display and performance.
 * This should be put in setup().
 * The available attributes are:
 * <br>
 * alpha - indicates if the canvas contains an alpha buffer
 * default is true
 * <br><br>
 * depth - indicates whether the drawing buffer has a depth buffer
 * of at least 16 bits - default is true
 * <br><br>
 * stencil - indicates whether the drawing buffer has a stencil buffer
 * of at least 8 bits
 * <br><br>
 * antialias - indicates whether or not to perform anti-aliasing
 * default is false
 * <br><br>
 * premultipliedAlpha - indicates that the page compositor will assume
 * the drawing buffer contains colors with pre-multiplied alpha
 * default is false
 * <br><br>
 * preserveDrawingBuffer - if true the buffers will not be cleared and
 * and will preserve their values until cleared or overwritten by author
 * (note that p5 clears automatically on draw loop)
 * default is true
 * <br><br>
 * perPixelLighting - if true, per-pixel lighting will be used in the
 * lighting shader.
 * default is false
 * <br><br>
 * @method setAttributes
 * @for p5
 * @param  {String}  key Name of attribute
 * @param  {Boolean}        value New value of named attribute
 * @example
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(100, 100, WEBGL);
 * }
 *
 * function draw() {
 *   background(255);
 *   push();
 *   rotateZ(frameCount * 0.02);
 *   rotateX(frameCount * 0.02);
 *   rotateY(frameCount * 0.02);
 *   fill(0, 0, 0);
 *   box(50);
 *   pop();
 * }
 * </code>
 * </div>
 * <br>
 * Now with the antialias attribute set to true.
 * <br>
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(100, 100, WEBGL);
 *   setAttributes('antialias', true);
 * }
 *
 * function draw() {
 *   background(255);
 *   push();
 *   rotateZ(frameCount * 0.02);
 *   rotateX(frameCount * 0.02);
 *   rotateY(frameCount * 0.02);
 *   fill(0, 0, 0);
 *   box(50);
 *   pop();
 * }
 * </code>
 * </div>
 *
 * <div>
 * <code>
 * // press the mouse button to enable perPixelLighting
 * function setup() {
 *   createCanvas(100, 100, WEBGL);
 *   noStroke();
 *   fill(255);
 * }
 *
 * var lights = [
 *   { c: '#f00', t: 1.12, p: 1.91, r: 0.2 },
 *   { c: '#0f0', t: 1.21, p: 1.31, r: 0.2 },
 *   { c: '#00f', t: 1.37, p: 1.57, r: 0.2 },
 *   { c: '#ff0', t: 1.12, p: 1.91, r: 0.7 },
 *   { c: '#0ff', t: 1.21, p: 1.31, r: 0.7 },
 *   { c: '#f0f', t: 1.37, p: 1.57, r: 0.7 }
 * ];
 *
 * function draw() {
 *   var t = millis() / 1000 + 1000;
 *   background(0);
 *   directionalLight(color('#222'), 1, 1, 1);
 *
 *   for (var i = 0; i < lights.length; i++) {
 *     var light = lights[i];
 *     pointLight(
 *       color(light.c),
 *       p5.Vector.fromAngles(t * light.t, t * light.p, width * light.r)
 *     );
 *   }
 *
 *   specularMaterial(255);
 *   sphere(width * 0.1);
 *
 *   rotateX(t * 0.77);
 *   rotateY(t * 0.83);
 *   rotateZ(t * 0.91);
 *   torus(width * 0.3, width * 0.07, 30, 10);
 * }
 *
 * function mousePressed() {
 *   setAttributes('perPixelLighting', true);
 *   noStroke();
 *   fill(255);
 * }
 * function mouseReleased() {
 *   setAttributes('perPixelLighting', false);
 *   noStroke();
 *   fill(255);
 * }
 * </code>
 * </div>
 *
 * @alt a rotating cube with smoother edges
 */
/**
 * @method setAttributes
 * @for p5
 * @param  {Object}  obj object with key-value pairs
 */

p5.prototype.setAttributes = function(key, value) {
  this._assert3d('setAttributes');
  //@todo_FES
  var attr;
  if (typeof value !== 'undefined') {
    attr = {};
    attr[key] = value;
  } else if (key instanceof Object) {
    attr = key;
  }
  this.push();
  this._renderer._resetContext(attr);
  this.pop();
};

/**
 * @class p5.RendererGL
 */

p5.RendererGL.prototype._computeCameraDefaultSettings = function() {
  this.defaultCameraFOV = 60 / 180 * Math.PI;
  this.defaultCameraAspect = this.width / this.height;
  this.defaultCameraX = 0;
  this.defaultCameraY = 0;
  this.defaultCameraZ =
    this.height / 2.0 / Math.tan(this.defaultCameraFOV / 2.0);
  this.defaultCameraNear = this.defaultCameraZ * 0.1;
  this.defaultCameraFar = this.defaultCameraZ * 10;
};

//detect if user didn't set the camera
//then call this function below
p5.RendererGL.prototype._setDefaultCamera = function() {
  if (this._curCamera === null) {
    this._computeCameraDefaultSettings();
    this.cameraFOV = this.defaultCameraFOV;
    this.cameraAspect = this.defaultAspect;
    this.cameraX = this.defaultCameraX;
    this.cameraY = this.defaultCameraY;
    this.cameraZ = this.defaultCameraZ;
    this.cameraNear = this.defaultCameraNear;
    this.cameraFar = this.defaultCameraFar;

    this.perspective();
    this.camera();
    this._curCamera = 'default';
  }
};

p5.RendererGL.prototype._update = function() {
  // reset model view and apply initial camera transform
  // (containing only look at info; no projection).
  this.uMVMatrix.set(
    this.cameraMatrix.mat4[0],
    this.cameraMatrix.mat4[1],
    this.cameraMatrix.mat4[2],
    this.cameraMatrix.mat4[3],
    this.cameraMatrix.mat4[4],
    this.cameraMatrix.mat4[5],
    this.cameraMatrix.mat4[6],
    this.cameraMatrix.mat4[7],
    this.cameraMatrix.mat4[8],
    this.cameraMatrix.mat4[9],
    this.cameraMatrix.mat4[10],
    this.cameraMatrix.mat4[11],
    this.cameraMatrix.mat4[12],
    this.cameraMatrix.mat4[13],
    this.cameraMatrix.mat4[14],
    this.cameraMatrix.mat4[15]
  );

  // reset light data for new frame.

  this.ambientLightColors.length = 0;
  this.directionalLightDirections.length = 0;
  this.directionalLightColors.length = 0;

  this.pointLightPositions.length = 0;
  this.pointLightColors.length = 0;
};

/**
 * [background description]
 */
p5.RendererGL.prototype.background = function() {
  var _col = this._pInst.color.apply(this._pInst, arguments);
  var _r = _col.levels[0] / 255;
  var _g = _col.levels[1] / 255;
  var _b = _col.levels[2] / 255;
  var _a = _col.levels[3] / 255;
  this.GL.clearColor(_r, _g, _b, _a);
  this.GL.depthMask(true);
  this.GL.clear(this.GL.COLOR_BUFFER_BIT | this.GL.DEPTH_BUFFER_BIT);
};

//@TODO implement this
// p5.RendererGL.prototype.clear = function() {
//@TODO
// };

//////////////////////////////////////////////
// COLOR
//////////////////////////////////////////////
/**
 * Basic fill material for geometry with a given color
 * @method  fill
 * @class p5.RendererGL
 * @param  {Number|Number[]|String|p5.Color} v1  gray value,
 * red or hue value (depending on the current color mode),
 * or color Array, or CSS color string
 * @param  {Number}            [v2] green or saturation value
 * @param  {Number}            [v3] blue or brightness value
 * @param  {Number}            [a]  opacity
 * @chainable
 * @example
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(200, 200, WEBGL);
 * }
 *
 * function draw() {
 *   background(0);
 *   noStroke();
 *   fill(100, 100, 240);
 *   rotateX(frameCount * 0.01);
 *   rotateY(frameCount * 0.01);
 *   box(75, 75, 75);
 * }
 * </code>
 * </div>
 *
 * @alt
 * black canvas with purple cube spinning
 *
 */
p5.RendererGL.prototype.fill = function(v1, v2, v3, a) {
  //see material.js for more info on color blending in webgl
  var color = p5.prototype.color.apply(this._pInst, arguments);
  this.curFillColor = color._array;

  if (this.isImmediateDrawing) {
    this.setFillShader(this._getImmediateModeShader());
  } else {
    this.setFillShader(this._getColorShader());
  }
  this.drawMode = constants.FILL;
  this.curFillShader.setUniform('uMaterialColor', this.curFillColor);
};

/**
 * Basic stroke material for geometry with a given color
 * @method  stroke
 * @param  {Number|Number[]|String|p5.Color} v1  gray value,
 * red or hue value (depending on the current color mode),
 * or color Array, or CSS color string
 * @param  {Number}            [v2] green or saturation value
 * @param  {Number}            [v3] blue or brightness value
 * @param  {Number}            [a]  opacity
 * @example
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(200, 200, WEBGL);
 * }
 *
 * function draw() {
 *   background(0);
 *   stroke(240, 150, 150);
 *   fill(100, 100, 240);
 *   rotateX(frameCount * 0.01);
 *   rotateY(frameCount * 0.01);
 *   box(75, 75, 75);
 * }
 * </code>
 * </div>
 *
 * @alt
 * black canvas with purple cube with pink outline spinning
 *
 */
p5.RendererGL.prototype.stroke = function(r, g, b, a) {
  //@todo allow transparency in stroking currently doesn't have
  //any impact and causes problems with specularMaterial
  arguments[3] = 255;
  var color = p5.prototype.color.apply(this._pInst, arguments);
  this.curStrokeColor = color._array;
  this.curStrokeShader.setUniform('uMaterialColor', this.curStrokeColor);
};

/**
 * Change weight of stroke
 * @method  strokeWeight
 * @param  {Number} stroke weight to be used for drawing
 * @example
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(200, 400, WEBGL);
 *   setAttributes('antialias', true);
 * }
 *
 * function draw() {
 *   background(0);
 *   noStroke();
 *   translate(0, -100, 0);
 *   stroke(240, 150, 150);
 *   fill(100, 100, 240);
 *   push();
 *   strokeWeight(8);
 *   rotateX(frameCount * 0.01);
 *   rotateY(frameCount * 0.01);
 *   sphere(75);
 *   pop();
 *   push();
 *   translate(0, 200, 0);
 *   strokeWeight(1);
 *   rotateX(frameCount * 0.01);
 *   rotateY(frameCount * 0.01);
 *   sphere(75);
 *   pop();
 * }
 * </code>
 * </div>
 *
 * @alt
 * black canvas with two purple rotating spheres with pink
 * outlines the sphere on top has much heavier outlines,
 *
 */
p5.RendererGL.prototype.strokeWeight = function(w) {
  if (this.curStrokeWeight !== w) {
    this.pointSize = w;
    this.curStrokeWeight = w;
    this.curStrokeShader.setUniform('uStrokeWeight', w);
  }
};

/**
 * Returns an array of [R,G,B,A] values for any pixel or grabs a section of
 * an image. If no parameters are specified, the entire image is returned.
 * Use the x and y parameters to get the value of one pixel. Get a section of
 * the display window by specifying additional w and h parameters. When
 * getting an image, the x and y parameters define the coordinates for the
 * upper-left corner of the image, regardless of the current imageMode().
 * <br><br>
 * If the pixel requested is outside of the image window, [0,0,0,255] is
 * returned.
 * <br><br>
 * Getting the color of a single pixel with get(x, y) is easy, but not as fast
 * as grabbing the data directly from pixels[]. The equivalent statement to
 * get(x, y) is using pixels[] with pixel density d
 *
 * @private
 * @method get
 * @param  {Number}               [x] x-coordinate of the pixel
 * @param  {Number}               [y] y-coordinate of the pixel
 * @param  {Number}               [w] width
 * @param  {Number}               [h] height
 * @return {Number[]|Color|p5.Image}  color of pixel at x,y in array format
 *                                    [R, G, B, A] or p5.Image
 */
p5.RendererGL.prototype.get = function(x, y, w, h) {
  return p5.Renderer2D.prototype.get.apply(this, [x, y, w, h]);
};

/**
 * Loads the pixels data for this canvas into the pixels[] attribute.
 * Note that updatePixels() and set() do not work.
 * Any pixel manipulation must be done directly to the pixels[] array.
 *
 * @private
 * @method loadPixels
 *
 */

p5.RendererGL.prototype.loadPixels = function() {
  //@todo_FES
  if (this.attributes.preserveDrawingBuffer !== true) {
    console.log(
      'loadPixels only works in WebGL when preserveDrawingBuffer ' + 'is true.'
    );
    return;
  }
  var pd = this._pInst._pixelDensity;
  var x = 0;
  var y = 0;
  var w = this.width;
  var h = this.height;
  w *= pd;
  h *= pd;
  //if there isn't a renderer-level temporary pixels buffer
  //make a new one
  if (typeof this.pixels === 'undefined') {
    this.pixels = new Uint8Array(
      this.GL.drawingBufferWidth * this.GL.drawingBufferHeight * 4
    );
  }
  this.GL.readPixels(
    x,
    y,
    w,
    h,
    this.GL.RGBA,
    this.GL.UNSIGNED_BYTE,
    this.pixels
  );
  this._pInst._setProperty('pixels', this.pixels);
};

//////////////////////////////////////////////
// HASH | for geometry
//////////////////////////////////////////////

p5.RendererGL.prototype.geometryInHash = function(gId) {
  return this.gHash[gId] !== undefined;
};

/**
 * [resize description]
 * @private
 * @param  {Number} w [description]
 * @param  {Number} h [description]
 */
p5.RendererGL.prototype.resize = function(w, h) {
  p5.Renderer.prototype.resize.call(this, w, h);
  this.GL.viewport(
    0,
    0,
    this.GL.drawingBufferWidth,
    this.GL.drawingBufferHeight
  );
  this._viewport = this.GL.getParameter(this.GL.VIEWPORT);
  // If we're using the default camera, update the aspect ratio
  if (this._curCamera === null || this._curCamera === 'default') {
    this._curCamera = null;
    // camera defaults are dependent on the width & height of the screen,
    // so we'll want to update them if the size of the screen changes.
    this._setDefaultCamera();
  }
  //resize pixels buffer
  if (typeof this.pixels !== 'undefined') {
    this.pixels = new Uint8Array(
      this.GL.drawingBufferWidth * this.GL.drawingBufferHeight * 4
    );
  }
};

/**
 * clears color and depth buffers
 * with r,g,b,a
 * @private
 * @param {Number} r normalized red val.
 * @param {Number} g normalized green val.
 * @param {Number} b normalized blue val.
 * @param {Number} a normalized alpha val.
 */
p5.RendererGL.prototype.clear = function() {
  this.GL.clearColor(arguments[0], arguments[1], arguments[2], arguments[3]);
  this.GL.clear(this.GL.COLOR_BUFFER_BIT | this.GL.DEPTH_BUFFER_BIT);
};

/**
 * [translate description]
 * @private
 * @param  {Number} x [description]
 * @param  {Number} y [description]
 * @param  {Number} z [description]
 * @chainable
 * @todo implement handle for components or vector as args
 */
p5.RendererGL.prototype.translate = function(x, y, z) {
  if (x instanceof p5.Vector) {
    z = x.z;
    y = x.y;
    x = x.x;
  }
  this.uMVMatrix.translate([x, y, z]);
  return this;
};

/**
 * Scales the Model View Matrix by a vector
 * @private
 * @param  {Number | p5.Vector | Array} x [description]
 * @param  {Number} [y] y-axis scalar
 * @param  {Number} [z] z-axis scalar
 * @chainable
 */
p5.RendererGL.prototype.scale = function(x, y, z) {
  this.uMVMatrix.scale(x, y, z);
  return this;
};

p5.RendererGL.prototype.rotate = function(rad, axis) {
  if (typeof axis === 'undefined') {
    return this.rotateZ(rad);
  }
  p5.Matrix.prototype.rotate.apply(this.uMVMatrix, arguments);
  return this;
};

p5.RendererGL.prototype.rotateX = function(rad) {
  this.rotate(rad, 1, 0, 0);
  return this;
};

p5.RendererGL.prototype.rotateY = function(rad) {
  this.rotate(rad, 0, 1, 0);
  return this;
};

p5.RendererGL.prototype.rotateZ = function(rad) {
  this.rotate(rad, 0, 0, 1);
  return this;
};

p5.RendererGL.prototype.push = function() {
  // get the base renderer style
  var style = p5.Renderer.prototype.push.apply(this);

  // add webgl-specific style properties
  var properties = style.properties;

  properties.uMVMatrix = this.uMVMatrix.copy();
  properties.cameraMatrix = this.cameraMatrix.copy();

  return style;
};

p5.RendererGL.prototype.resetMatrix = function() {
  this.uMVMatrix = p5.Matrix.identity(this._pInst);
  return this;
};

// Text/Typography
// @TODO:
p5.RendererGL.prototype._applyTextProperties = function() {
  //@TODO finish implementation
  console.error('text commands not yet implemented in webgl');
};

//////////////////////////////////////////////
// SHADER
//////////////////////////////////////////////

/*
 * Initializes and uses the specified shader, then returns
 * that shader. Note: initialization and resetting the program
 * is only used if needed (say, if a new value is provided)
 * so it is safe to call this method with the same shader multiple
 * times without a signficant performance hit).
 *
 * @method setFillShader
 * @param {p5.Shader} [s] a p5.Shader object
 * @return {p5.Shader} the current, updated fill shader
 */
p5.RendererGL.prototype.setFillShader = function(s) {
  if (this.curFillShader !== s) {
    // only do setup etc. if shader is actually new.
    this.curFillShader = s;

    // safe to do this multiple times;
    // init() will bail early if has already been run.
    this.curFillShader.init();
    //this.curFillShader.useProgram();
  }
  // always return this.curFillShader, even if no change was made.
  return this.curFillShader;
};

/*
 * @method setStrokeShader
 * @param {p5.Shader} [s] a p5.Shader object
 * @return {p5.Shader} the current, updated stroke shader
 */
p5.RendererGL.prototype.setStrokeShader = function(s) {
  if (this.curStrokeShader !== s) {
    // only do setup etc. if shader is actually new.
    this.curStrokeShader = s;
    // safe to do this multiple times;
    // init() will bail early if has already been run.
    this.curStrokeShader.init();
    //this.curStrokeShader.useProgram();
  }
  // always return this.curLineShader, even if no change was made.
  return this.curStrokeShader;
};

/*
 * shaders are created and cached on a per-renderer basis,
 * on the grounds that each renderer will have its own gl context
 * and the shader must be valid in that context.
 *
 *
 */

p5.RendererGL.prototype._useLightShader = function() {
  if (!this.curFillShader || !this.curFillShader.isLightShader()) {
    this.setFillShader(this._getLightShader());
  }
  return this.curFillShader;
};

p5.RendererGL.prototype._useColorShader = function() {
  // looking at the code within the glsl files, I'm not really
  // sure why these are two different shaders. but, they are,
  // and if we're drawing in retain mode but the shader is the
  // immediate mode one, we need to switch.

  // TODO: what if curFillShader is _any_ other shader?
  if (
    !this.curFillShader ||
    this.curFillShader === this._defaultImmediateModeShader
  ) {
    // there are different immediate mode and retain mode color shaders.
    // if we're using the immediate mode one, we need to switch to
    // one that works for retain mode.
    this.setFillShader(this._getColorShader());
  }
  return this.curFillShader;
};

p5.RendererGL.prototype._useImmediateModeShader = function() {
  // TODO: what if curFillShader is _any_ other shader?
  if (!this.curFillShader || this.curFillShader === this._defaultColorShader) {
    // this is the fill/stroke shader for retain mode.
    // must switch to immediate mode shader before drawing!
    this.setFillShader(this._getImmediateModeShader());
    // note that if we're using the texture shader...
    // this shouldn't change. :)
  }
  return this.curFillShader;
};

p5.RendererGL.prototype._getLightShader = function() {
  if (!this._defaultLightShader) {
    if (this.attributes.perPixelLighting) {
      this._defaultLightShader = new p5.Shader(
        this,
        defaultShaders.phongVert,
        defaultShaders.phongFrag
      );
    } else {
      this._defaultLightShader = new p5.Shader(
        this,
        defaultShaders.lightVert,
        defaultShaders.lightTextureFrag
      );
    }
  }
  //this.drawMode = constants.FILL;
  return this._defaultLightShader;
};

p5.RendererGL.prototype._getImmediateModeShader = function() {
  if (!this._defaultImmediateModeShader) {
    this._defaultImmediateModeShader = new p5.Shader(
      this,
      defaultShaders.immediateVert,
      defaultShaders.vertexColorFrag
    );
  }
  //this.drawMode = constants.FILL;
  return this._defaultImmediateModeShader;
};

p5.RendererGL.prototype._getNormalShader = function() {
  if (!this._defaultNormalShader) {
    this._defaultNormalShader = new p5.Shader(
      this,
      defaultShaders.normalVert,
      defaultShaders.normalFrag
    );
  }
  //this.drawMode = constants.FILL;
  return this._defaultNormalShader;
};

p5.RendererGL.prototype._getColorShader = function() {
  if (!this._defaultColorShader) {
    this._defaultColorShader = new p5.Shader(
      this,
      defaultShaders.normalVert,
      defaultShaders.basicFrag
    );
  }
  //this.drawMode = constants.FILL;
  return this._defaultColorShader;
};

p5.RendererGL.prototype._getLineShader = function() {
  if (!this._defaultLineShader) {
    this._defaultLineShader = new p5.Shader(
      this,
      defaultShaders.lineVert,
      defaultShaders.lineFrag
    );
  }
  //this.drawMode = constants.STROKE;
  return this._defaultLineShader;
};

p5.RendererGL.prototype._getEmptyTexture = function() {
  if (!this._emptyTexture) {
    // a plain white texture RGBA, full alpha, single pixel.
    var im = new p5.Image(1, 1);
    im.set(0, 0, 255);
    this._emptyTexture = new p5.Texture(this, im);
  }
  return this._emptyTexture;
};

p5.RendererGL.prototype.getTexture = function(img) {
  var checkSource = function(element) {
    return element.src === img;
  };
  //this.drawMode = constants.TEXTURE;
  var tex = this.textures.find(checkSource);
  if (!tex) {
    tex = new p5.Texture(this, img);
    this.textures.push(tex);
  }

  return tex;
};

//Binds a buffer to the drawing context
//when passed more than two arguments it also updates or initializes
//the data associated with the buffer
p5.RendererGL.prototype._bindBuffer = function(
  buffer,
  target,
  values,
  type,
  usage
) {
  this.GL.bindBuffer(target, buffer);
  if (values !== undefined) {
    var data = new type(values);
    this.GL.bufferData(target, data, usage);
  }
};

//////////////////////////
//// SMOOTHING
/////////////////////////
// @TODO:
p5.RendererGL.prototype.smooth = function() {
  //@TODO finish implementation
  console.log('smoothing not yet implemented in webgl');
};

p5.RendererGL.prototype.noSmooth = function() {
  //@TODO finish implementation
  console.log('smoothing not yet implemented in webgl');
};

///////////////////////////////
//// UTILITY FUNCTIONS
//////////////////////////////
/**
 * turn a two dimensional array into one dimensional array
 * @private
 * @param  {Array} arr 2-dimensional array
 * @return {Array}     1-dimensional array
 * [[1, 2, 3],[4, 5, 6]] -> [1, 2, 3, 4, 5, 6]
 */
p5.RendererGL.prototype._flatten = function(arr) {
  //when empty, return empty
  if (arr.length === 0) {
    return [];
  } else if (arr.length > 20000) {
    //big models , load slower to avoid stack overflow
    //faster non-recursive flatten via axelduch
    //stackoverflow.com/questions/27266550/how-to-flatten-nested-array-in-javascript
    var toString = Object.prototype.toString;
    var arrayTypeStr = '[object Array]';
    var result = [];
    var nodes = arr.slice();
    var node;
    node = nodes.pop();
    do {
      if (toString.call(node) === arrayTypeStr) {
        nodes.push.apply(nodes, node);
      } else {
        result.push(node);
      }
    } while (nodes.length && (node = nodes.pop()) !== undefined);
    result.reverse(); // we reverse result to restore the original order
    return result;
  } else {
    //otherwise if model within limits for browser
    //use faster recursive loading
    return [].concat.apply([], arr);
  }
};

/**
 * turn a p5.Vector Array into a one dimensional number array
 * @private
 * @param  {p5.Vector[]} arr  an array of p5.Vector
 * @return {Number[]}     a one dimensional array of numbers
 * [p5.Vector(1, 2, 3), p5.Vector(4, 5, 6)] ->
 * [1, 2, 3, 4, 5, 6]
 */
p5.RendererGL.prototype._vToNArray = function(arr) {
  return this._flatten(
    arr.map(function(item) {
      return [item.x, item.y, item.z];
    })
  );
};

/**
 * ensures that p5 is using a 3d renderer. throws an error if not.
 */
p5.prototype._assert3d = function(name) {
  if (!this._renderer.isP3D)
    throw new Error(
      name +
        "() is only supported in WEBGL mode. If you'd like to use 3D graphics" +
        ' and WebGL, see  https://p5js.org/examples/form-3d-primitives.html' +
        ' for more information.'
    );
};

module.exports = p5.RendererGL;
