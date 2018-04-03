/**
 * @module Shape
 * @submodule 3D Primitives
 * @for p5
 * @requires core
 * @requires p5.Geometry
 */

'use strict';

var p5 = require('../core/core');
require('./p5.Geometry');

/**
 * Draw a plane with given a width and height
 * @method plane
 * @param  {Number} [width]    width of the plane
 * @param  {Number} [height]   height of the plane
 * @param  {Integer} [detailX]  Optional number of triangle
 *                             subdivisions in x-dimension
 * @param {Integer} [detailY]   Optional number of triangle
 *                             subdivisions in y-dimension
 * @chainable
 * @example
 * <div>
 * <code>
 * //draw a plane with width 50 and height 50
 * function setup() {
 *   createCanvas(100, 100, WEBGL);
 * }
 *
 * function draw() {
 *   background(200);
 *   plane(50, 50);
 * }
 * </code>
 * </div>
 *
 * @alt
 * Nothing displayed on canvas
 * Rotating interior view of a box with sides that change color.
 * 3d red and green gradient.
 * Rotating interior view of a cylinder with sides that change color.
 * Rotating view of a cylinder with sides that change color.
 * 3d red and green gradient.
 * rotating view of a multi-colored cylinder with concave sides.
 */
p5.prototype.plane = function(width, height, detailX, detailY) {
  this._assert3d('plane');
  if (typeof width === 'undefined') {
    width = 50;
  }
  if (typeof height === 'undefined') {
    height = width;
  }

  if (typeof detailX === 'undefined') {
    detailX = 1;
  }
  if (typeof detailY === 'undefined') {
    detailY = 1;
  }

  var gId = 'plane|' + detailX + '|' + detailY;

  if (!this._renderer.geometryInHash(gId)) {
    var _plane = function() {
      var u, v, p;
      for (var i = 0; i <= this.detailY; i++) {
        v = i / this.detailY;
        for (var j = 0; j <= this.detailX; j++) {
          u = j / this.detailX;
          p = new p5.Vector(u - 0.5, v - 0.5, 0);
          this.vertices.push(p);
          this.uvs.push(u, v);
        }
      }
    };
    var planeGeom = new p5.Geometry(detailX, detailY, _plane);
    planeGeom.computeFaces().computeNormals();
    if (detailX <= 1 && detailY <= 1) {
      planeGeom._makeTriangleEdges()._edgesToVertices();
    } else {
      console.log(
        'Cannot draw stroke on plane objects with more' +
          ' than 1 detailX or 1 detailY'
      );
    }
    this._renderer.createBuffers(gId, planeGeom);
  }

  this._renderer.drawBuffersScaled(gId, width, height, 0);
};

/**
 * Draw a box with given width, height and depth
 * @method  box
 * @param  {Number} [width]     width of the box
 * @param  {Number} [Height]    height of the box
 * @param  {Number} [depth]     depth of the box
 * @param {Integer} [detailX]  Optional number of triangle
 *                            subdivisions in x-dimension
 * @param {Integer} [detailY]  Optional number of triangle
 *                            subdivisions in y-dimension
 * @chainable
 * @example
 * <div>
 * <code>
 * //draw a spinning box with width, height and depth 200
 * function setup() {
 *   createCanvas(100, 100, WEBGL);
 * }
 *
 * function draw() {
 *   background(200);
 *   rotateX(frameCount * 0.01);
 *   rotateY(frameCount * 0.01);
 *   box(50);
 * }
 * </code>
 * </div>
 */
p5.prototype.box = function(width, height, depth, detailX, detailY) {
  this._assert3d('box');
  if (typeof width === 'undefined') {
    width = 50;
  }
  if (typeof height === 'undefined') {
    height = width;
  }
  if (typeof depth === 'undefined') {
    depth = height;
  }

  var perPixelLighting =
    this._renderer.attributes && this._renderer.attributes.perPixelLighting;
  if (typeof detailX === 'undefined') {
    detailX = perPixelLighting ? 1 : 4;
  }
  if (typeof detailY === 'undefined') {
    detailY = perPixelLighting ? 1 : 4;
  }

  var gId = 'box|' + detailX + '|' + detailY;
  if (!this._renderer.geometryInHash(gId)) {
    var _box = function() {
      var cubeIndices = [
        [0, 4, 2, 6], // -1, 0, 0],// -x
        [1, 3, 5, 7], // +1, 0, 0],// +x
        [0, 1, 4, 5], // 0, -1, 0],// -y
        [2, 6, 3, 7], // 0, +1, 0],// +y
        [0, 2, 1, 3], // 0, 0, -1],// -z
        [4, 5, 6, 7] // 0, 0, +1] // +z
      ];
      //using strokeIndices instead of faces for strokes
      //to avoid diagonal stroke lines across face of box
      this.strokeIndices = [
        [0, 1],
        [1, 3],
        [3, 2],
        [6, 7],
        [8, 9],
        [9, 11],
        [14, 15],
        [16, 17],
        [17, 19],
        [18, 19],
        [20, 21],
        [22, 23]
      ];
      for (var i = 0; i < cubeIndices.length; i++) {
        var cubeIndex = cubeIndices[i];
        var v = i * 4;
        for (var j = 0; j < 4; j++) {
          var d = cubeIndex[j];
          //inspired by lightgl:
          //https://github.com/evanw/lightgl.js
          //octants:https://en.wikipedia.org/wiki/Octant_(solid_geometry)
          var octant = new p5.Vector(
            ((d & 1) * 2 - 1) / 2,
            ((d & 2) - 1) / 2,
            ((d & 4) / 2 - 1) / 2
          );
          this.vertices.push(octant);
          this.uvs.push(j & 1, (j & 2) / 2);
        }
        this.faces.push([v, v + 1, v + 2]);
        this.faces.push([v + 2, v + 1, v + 3]);
      }
    };
    var boxGeom = new p5.Geometry(detailX, detailY, _box);
    boxGeom.computeNormals();
    if (detailX <= 4 && detailY <= 4) {
      boxGeom._makeTriangleEdges()._edgesToVertices();
    } else {
      console.log(
        'Cannot draw stroke on box objects with more' +
          ' than 4 detailX or 4 detailY'
      );
    }
    //initialize our geometry buffer with
    //the key val pair:
    //geometry Id, Geom object
    this._renderer.createBuffers(gId, boxGeom);
  }
  this._renderer.drawBuffersScaled(gId, width, height, depth);

  return this;
};

/**
 * Draw a sphere with given radius
 * @method sphere
 * @param  {Number} [radius]          radius of circle
 * @param  {Integer} [detailX]        number of segments,
 *                                    the more segments the smoother geometry
 *                                    default is 24
 * @param  {Integer} [detailY]        number of segments,
 *                                    the more segments the smoother geometry
 *                                    default is 16
 * @chainable
 * @example
 * <div>
 * <code>
 * // draw a sphere with radius 200
 * function setup() {
 *   createCanvas(100, 100, WEBGL);
 * }
 *
 * function draw() {
 *   background(200);
 *   sphere(40);
 * }
 * </code>
 * </div>
 */
p5.prototype.sphere = function(radius, detailX, detailY) {
  this._assert3d('sphere');
  if (typeof radius === 'undefined') {
    radius = 50;
  }
  if (typeof detailX === 'undefined') {
    detailX = 24;
  }
  if (typeof detailY === 'undefined') {
    detailY = 16;
  }

  this.ellipsoid(radius, radius, radius, detailX, detailY);

  return this;
};

/**
 * @private
 * Helper function for creating both cones and cyllinders
 * Will only generate well-defined geometry when bottomRadius, height > 0
 * and topRadius >= 0
 * If topRadius == 0, topCap should be false
 */
var _truncatedCone = function(
  bottomRadius,
  topRadius,
  height,
  detailX,
  detailY,
  bottomCap,
  topCap
) {
  bottomRadius = bottomRadius <= 0 ? 1 : bottomRadius;
  topRadius = topRadius < 0 ? 0 : topRadius;
  height = height <= 0 ? bottomRadius : height;
  detailX = detailX < 3 ? 3 : detailX;
  detailY = detailY < 1 ? 1 : detailY;
  bottomCap = bottomCap === undefined ? true : bottomCap;
  topCap = topCap === undefined ? topRadius !== 0 : topCap;
  var start = bottomCap ? -2 : 0;
  var end = detailY + (topCap ? 2 : 0);
  var vertsOnLayer = {};
  //ensure constant slant for interior vertex normals
  var slant = Math.atan2(bottomRadius - topRadius, height);
  var yy, ii, jj, nextii, nextjj;
  for (yy = start; yy <= end; ++yy) {
    var v = yy / detailY;
    var y = height * v;
    var ringRadius;
    if (yy < 0) {
      //for the bottomCap edge
      y = 0;
      v = 0;
      ringRadius = bottomRadius;
    } else if (yy > detailY) {
      //for the topCap edge
      y = height;
      v = 1;
      ringRadius = topRadius;
    } else {
      //for the middle
      ringRadius = bottomRadius + (topRadius - bottomRadius) * v;
    }
    if (yy === -2 || yy === detailY + 2) {
      //center of bottom or top caps
      ringRadius = 0;
    }

    y -= height / 2; //shift coordiate origin to the center of object
    vertsOnLayer[yy] = ringRadius === 0 ? 1 : detailX;
    for (ii = 0; ii < vertsOnLayer[yy]; ++ii) {
      var u = ii / detailX;
      //VERTICES
      this.vertices.push(
        new p5.Vector(
          Math.sin(u * 2 * Math.PI) * ringRadius,
          y,
          Math.cos(u * 2 * Math.PI) * ringRadius
        )
      );
      //VERTEX NORMALS
      this.vertexNormals.push(
        new p5.Vector(
          yy < 0 || yy > detailY
            ? 0
            : Math.sin(u * 2 * Math.PI) * Math.cos(slant),
          yy < 0 ? -1 : yy > detailY ? 1 : Math.sin(slant),
          yy < 0 || yy > detailY
            ? 0
            : Math.cos(u * 2 * Math.PI) * Math.cos(slant)
        )
      );
      //UVs
      this.uvs.push(u, v);
    }
  }

  var startIndex = 0;
  if (bottomCap) {
    for (jj = 0; jj < vertsOnLayer[-1]; ++jj) {
      nextjj = (jj + 1) % vertsOnLayer[-1];
      this.faces.push([
        startIndex,
        startIndex + 1 + nextjj,
        startIndex + 1 + jj
      ]);
    }
    startIndex += vertsOnLayer[-2] + vertsOnLayer[-1];
  }
  for (yy = 0; yy < detailY; ++yy) {
    for (ii = 0; ii < vertsOnLayer[yy]; ++ii) {
      if (vertsOnLayer[yy + 1] === 1) {
        //top layer
        nextii = (ii + 1) % vertsOnLayer[yy];
        this.faces.push([
          startIndex + ii,
          startIndex + nextii,
          startIndex + vertsOnLayer[yy]
        ]);
      } else {
        //other side faces
        //should have vertsOnLayer[yy] === vertsOnLayer[yy + 1]
        nextii = (ii + 1) % vertsOnLayer[yy];
        this.faces.push([
          startIndex + ii,
          startIndex + nextii,
          startIndex + vertsOnLayer[yy] + nextii
        ]);
        this.faces.push([
          startIndex + ii,
          startIndex + vertsOnLayer[yy] + nextii,
          startIndex + vertsOnLayer[yy] + ii
        ]);
      }
    }
    startIndex += vertsOnLayer[yy];
  }
  if (topCap) {
    startIndex += vertsOnLayer[detailY];
    for (ii = 0; ii < vertsOnLayer[detailY + 1]; ++ii) {
      nextii = (ii + 1) % vertsOnLayer[detailY + 1];
      this.faces.push([
        startIndex + ii,
        startIndex + nextii,
        startIndex + vertsOnLayer[detailY + 1]
      ]);
    }
  }
};

/**
 * Draw a cylinder with given radius and height
 * @method cylinder
 * @param  {Number}  [radius]    radius of the surface
 * @param  {Number}  [height]    height of the cylinder
 * @param  {Integer} [detailX]   number of segments,
 *                               the more segments the smoother geometry
 *                               default is 24
 * @param  {Integer} [detailY]   number of segments in y-dimension,
 *                               the more segments the smoother geometry
 *                               default is 1
 * @param  {Boolean} [bottomCap] whether to draw the bottom of the cylinder
 * @param  {Boolean} [topCap]    whether to draw the top of the cylinder
 * @chainable
 * @example
 * <div>
 * <code>
 * //draw a spinning cylinder with radius 20 and height 50
 * function setup() {
 *   createCanvas(100, 100, WEBGL);
 * }
 *
 * function draw() {
 *   background(200);
 *   rotateX(frameCount * 0.01);
 *   rotateZ(frameCount * 0.01);
 *   cylinder(20, 50);
 * }
 * </code>
 * </div>
 */
p5.prototype.cylinder = function(
  radius,
  height,
  detailX,
  detailY,
  bottomCap,
  topCap
) {
  this._assert3d('cylinder');
  if (typeof radius === 'undefined') {
    radius = 50;
  }
  if (typeof height === 'undefined') {
    height = radius;
  }
  if (typeof detailX === 'undefined') {
    detailX = 24;
  }
  if (typeof detailY === 'undefined') {
    detailY = 1;
  }
  if (typeof topCap === 'undefined') {
    topCap = true;
  }
  if (typeof bottomCap === 'undefined') {
    bottomCap = true;
  }

  var gId =
    'cylinder|' + detailX + '|' + detailY + '|' + bottomCap + '|' + topCap;
  if (!this._renderer.geometryInHash(gId)) {
    var cylinderGeom = new p5.Geometry(detailX, detailY);
    _truncatedCone.call(
      cylinderGeom,
      1,
      1,
      1,
      detailX,
      detailY,
      bottomCap,
      topCap
    );
    cylinderGeom.computeNormals();
    if (detailX <= 24 && detailY <= 16) {
      cylinderGeom._makeTriangleEdges()._edgesToVertices();
    } else {
      console.log(
        'Cannot draw stroke on cylinder objects with more' +
          ' than 24 detailX or 16 detailY'
      );
    }
    this._renderer.createBuffers(gId, cylinderGeom);
  }

  this._renderer.drawBuffersScaled(gId, radius, height, radius);

  return this;
};

/**
 * Draw a cone with given radius and height
 * @method cone
 * @param  {Number}  [radius]  radius of the bottom surface
 * @param  {Number}  [height]  height of the cone
 * @param  {Integer} [detailX] number of segments,
 *                             the more segments the smoother geometry
 *                             default is 24
 * @param  {Integer} [detailY] number of segments,
 *                             the more segments the smoother geometry
 *                             default is 1
 * @param  {Boolean} [cap]     whether to draw the base of the cone
 * @chainable
 * @example
 * <div>
 * <code>
 * //draw a spinning cone with radius 40 and height 70
 * function setup() {
 *   createCanvas(100, 100, WEBGL);
 * }
 *
 * function draw() {
 *   background(200);
 *   rotateX(frameCount * 0.01);
 *   rotateZ(frameCount * 0.01);
 *   cone(40, 70);
 * }
 * </code>
 * </div>
 */
p5.prototype.cone = function(radius, height, detailX, detailY, cap) {
  this._assert3d('cone');
  if (typeof radius === 'undefined') {
    radius = 50;
  }
  if (typeof height === 'undefined') {
    height = radius;
  }
  if (typeof detailX === 'undefined') {
    detailX = 24;
  }
  if (typeof detailY === 'undefined') {
    detailY = 1;
  }
  if (typeof cap === 'undefined') {
    cap = true;
  }

  var gId = 'cone|' + detailX + '|' + detailY + '|' + cap;
  if (!this._renderer.geometryInHash(gId)) {
    var coneGeom = new p5.Geometry(detailX, detailY);
    _truncatedCone.call(coneGeom, 1, 0, 1, detailX, detailY, cap, false);
    //for cones we need to average Normals
    coneGeom.computeNormals();
    if (detailX <= 24 && detailY <= 16) {
      coneGeom._makeTriangleEdges()._edgesToVertices();
    } else {
      console.log(
        'Cannot draw stroke on cone objects with more' +
          ' than 24 detailX or 16 detailY'
      );
    }
    this._renderer.createBuffers(gId, coneGeom);
  }

  this._renderer.drawBuffersScaled(gId, radius, height, radius);

  return this;
};

/**
 * Draw an ellipsoid with given radius
 * @method ellipsoid
 * @param  {Number} [radiusx]         xradius of circle
 * @param  {Number} [radiusy]         yradius of circle
 * @param  {Number} [radiusz]         zradius of circle
 * @param  {Integer} [detailX]        number of segments,
 *                                    the more segments the smoother geometry
 *                                    default is 24. Avoid detail number above
 *                                    150, it may crash the browser.
 * @param  {Integer} [detailY]        number of segments,
 *                                    the more segments the smoother geometry
 *                                    default is 16. Avoid detail number above
 *                                    150, it may crash the browser.
 * @chainable
 * @example
 * <div>
 * <code>
 * // draw an ellipsoid with radius 20, 30 and 40.
 * function setup() {
 *   createCanvas(100, 100, WEBGL);
 * }
 *
 * function draw() {
 *   background(200);
 *   ellipsoid(20, 30, 40);
 * }
 * </code>
 * </div>
 */
p5.prototype.ellipsoid = function(radiusX, radiusY, radiusZ, detailX, detailY) {
  this._assert3d('ellipsoid');
  if (typeof radiusX === 'undefined') {
    radiusX = 50;
  }
  if (typeof radiusY === 'undefined') {
    radiusY = radiusX;
  }
  if (typeof radiusZ === 'undefined') {
    radiusZ = radiusX;
  }

  if (typeof detailX === 'undefined') {
    detailX = 24;
  }
  if (typeof detailY === 'undefined') {
    detailY = 16;
  }

  var gId = 'ellipsoid|' + detailX + '|' + detailY;

  if (!this._renderer.geometryInHash(gId)) {
    var _ellipsoid = function() {
      for (var i = 0; i <= this.detailY; i++) {
        var v = i / this.detailY;
        var phi = Math.PI * v - Math.PI / 2;
        var cosPhi = Math.cos(phi);
        var sinPhi = Math.sin(phi);

        for (var j = 0; j <= this.detailX; j++) {
          var u = j / this.detailX;
          var theta = 2 * Math.PI * u;
          var cosTheta = Math.cos(theta);
          var sinTheta = Math.sin(theta);
          var p = new p5.Vector(cosPhi * sinTheta, sinPhi, cosPhi * cosTheta);
          this.vertices.push(p);
          this.vertexNormals.push(p);
          this.uvs.push(u, v);
        }
      }
    };
    var ellipsoidGeom = new p5.Geometry(detailX, detailY, _ellipsoid);
    ellipsoidGeom.computeFaces();
    if (detailX <= 24 && detailY <= 24) {
      ellipsoidGeom._makeTriangleEdges()._edgesToVertices();
    } else {
      console.log(
        'Cannot draw stroke on ellipsoids with more' +
          ' than 24 detailX or 24 detailY'
      );
    }
    this._renderer.createBuffers(gId, ellipsoidGeom);
  }

  this._renderer.drawBuffersScaled(gId, radiusX, radiusY, radiusZ);

  return this;
};

/**
 * Draw a torus with given radius and tube radius
 * @method torus
 * @param  {Number} [radius]      radius of the whole ring
 * @param  {Number} [tubeRadius]  radius of the tube
 * @param  {Integer} [detailX]    number of segments in x-dimension,
 *                                the more segments the smoother geometry
 *                                default is 24
 * @param  {Integer} [detailY]    number of segments in y-dimension,
 *                                the more segments the smoother geometry
 *                                default is 16
 * @chainable
 * @example
 * <div>
 * <code>
 * //draw a spinning torus with radius 200 and tube radius 60
 * function setup() {
 *   createCanvas(100, 100, WEBGL);
 * }
 *
 * function draw() {
 *   background(200);
 *   rotateX(frameCount * 0.01);
 *   rotateY(frameCount * 0.01);
 *   torus(50, 15);
 * }
 * </code>
 * </div>
 */
p5.prototype.torus = function(radius, tubeRadius, detailX, detailY) {
  this._assert3d('torus');
  if (typeof radius === 'undefined') {
    radius = 50;
  } else if (!radius) {
    return; // nothing to draw
  }

  if (typeof tubeRadius === 'undefined') {
    tubeRadius = 10;
  } else if (!tubeRadius) {
    return; // nothing to draw
  }

  if (typeof detailX === 'undefined') {
    detailX = 24;
  }
  if (typeof detailY === 'undefined') {
    detailY = 16;
  }

  var tubeRatio = (tubeRadius / radius).toPrecision(4);
  var gId = 'torus|' + tubeRatio + '|' + detailX + '|' + detailY;

  if (!this._renderer.geometryInHash(gId)) {
    var _torus = function() {
      for (var i = 0; i <= this.detailY; i++) {
        var v = i / this.detailY;
        var phi = 2 * Math.PI * v;
        var cosPhi = Math.cos(phi);
        var sinPhi = Math.sin(phi);
        var r = 1 + tubeRatio * cosPhi;

        for (var j = 0; j <= this.detailX; j++) {
          var u = j / this.detailX;
          var theta = 2 * Math.PI * u;
          var cosTheta = Math.cos(theta);
          var sinTheta = Math.sin(theta);

          var p = new p5.Vector(r * cosTheta, r * sinTheta, tubeRatio * sinPhi);

          var n = new p5.Vector(cosPhi * cosTheta, cosPhi * sinTheta, sinPhi);

          this.vertices.push(p);
          this.vertexNormals.push(n);
          this.uvs.push(u, v);
        }
      }
    };
    var torusGeom = new p5.Geometry(detailX, detailY, _torus);
    torusGeom.computeFaces();
    if (detailX <= 24 && detailY <= 16) {
      torusGeom._makeTriangleEdges()._edgesToVertices();
    } else {
      console.log(
        'Cannot draw strokes on torus object with more' +
          ' than 24 detailX or 16 detailY'
      );
    }
    this._renderer.createBuffers(gId, torusGeom);
  }
  this._renderer.drawBuffersScaled(gId, radius, radius, radius);

  return this;
};

///////////////////////
/// 2D primitives
/////////////////////////

//@TODO
p5.RendererGL.prototype.point = function(x, y, z) {
  console.log('point not yet implemented in webgl');
  return this;
};

p5.RendererGL.prototype.triangle = function(args) {
  var x1 = args[0],
    y1 = args[1];
  var x2 = args[2],
    y2 = args[3];
  var x3 = args[4],
    y3 = args[5];

  var gId = 'tri';
  if (!this.geometryInHash(gId)) {
    var _triangle = function() {
      var vertices = [];
      vertices.push(new p5.Vector(0, 0, 0));
      vertices.push(new p5.Vector(0, 1, 0));
      vertices.push(new p5.Vector(1, 0, 0));
      this.strokeIndices = [[0, 1], [1, 2], [2, 0]];
      this.vertices = vertices;
      this.faces = [[0, 1, 2]];
      this.uvs = [0, 0, 0, 1, 1, 1];
    };
    var triGeom = new p5.Geometry(1, 1, _triangle);
    triGeom._makeTriangleEdges()._edgesToVertices();
    triGeom.computeNormals();
    this.createBuffers(gId, triGeom);
  }

  // only one triangle is cached, one point is at the origin, and the
  // two adjacent sides are tne unit vectors along the X & Y axes.
  //
  // this matrix multiplication transforms those two unit vectors
  // onto the required vector prior to rendering, and moves the
  // origin appropriately.
  var uMVMatrix = this.uMVMatrix.copy();
  try {
    // prettier-ignore
    var mult = new p5.Matrix([
      x2 - x1, y2 - y1, 0, 0, // the resulting unit X-axis
      x3 - x1, y3 - y1, 0, 0, // the resulting unit Y-axis
      0, 0, 1, 0,             // the resulting unit Z-axis (unchanged)
      x1, y1, 0, 1            // the resulting origin
    ]).mult(this.uMVMatrix);

    this.uMVMatrix = mult;

    this.drawBuffers(gId);
  } finally {
    this.uMVMatrix = uMVMatrix;
  }

  return this;
};

p5.RendererGL.prototype.ellipse = function(args) {
  var x = args[0];
  var y = args[1];
  var width = args[2];
  var height = args[3];
  //detailX and Y are optional 6th & 7th
  //arguments
  var detailX = args[4] || 24;
  var gId = 'ellipse|' + detailX;
  if (!this.geometryInHash(gId)) {
    var _ellipse = function() {
      this.vertices.push(new p5.Vector(0.5, 0.5, 0));
      this.uvs.push([0.5, 0.5]);

      for (var i = 0; i < this.detailX; i++) {
        var u = i / this.detailX;
        var theta = 2 * Math.PI * u;

        var _x = 0.5 + Math.cos(theta) / 2;
        var _y = 0.5 + Math.sin(theta) / 2;

        this.vertices.push(new p5.Vector(_x, _y, 0));
        this.uvs.push(_x, _y);

        this.faces.push([0, (i + 1) % this.detailX + 1, i + 1]);
      }
    };
    var ellipseGeom = new p5.Geometry(detailX, 1, _ellipse);
    ellipseGeom.computeNormals();
    if (detailX <= 50) {
      ellipseGeom._makeTriangleEdges()._edgesToVertices();
    } else {
      console.log('Cannot stroke ellipse with more than 50 detailX');
    }

    this.createBuffers(gId, ellipseGeom);
  }

  // only a single ellipse (of a given detail) is cached: a circle of
  // _diameter_ 1 (radius 0.5).
  //
  // before rendering, this circle is squished (technical term ;)
  // appropriately and moved to the required location.
  var uMVMatrix = this.uMVMatrix.copy();
  try {
    this.uMVMatrix.translate([x, y, 0]);
    this.uMVMatrix.scale(width, height, 1);

    this.drawBuffers(gId);
  } finally {
    this.uMVMatrix = uMVMatrix;
  }
  return this;
};

p5.RendererGL.prototype.rect = function(args) {
  var perPixelLighting = this.attributes.perPixelLighting;
  var x = args[0];
  var y = args[1];
  var width = args[2];
  var height = args[3];
  var detailX = args[4] || (perPixelLighting ? 1 : 24);
  var detailY = args[5] || (perPixelLighting ? 1 : 16);
  var gId = 'rect|' + detailX + '|' + detailY;
  if (!this.geometryInHash(gId)) {
    var _rect = function() {
      for (var i = 0; i <= this.detailY; i++) {
        var v = i / this.detailY;
        for (var j = 0; j <= this.detailX; j++) {
          var u = j / this.detailX;
          var p = new p5.Vector(u, v, 0);
          this.vertices.push(p);
          this.uvs.push(u, v);
        }
      }
    };
    var rectGeom = new p5.Geometry(detailX, detailY, _rect);
    rectGeom
      .computeFaces()
      .computeNormals()
      ._makeTriangleEdges()
      ._edgesToVertices();
    this.createBuffers(gId, rectGeom);
  }

  // only a single rectangle (of a given detail) is cached: a square with
  // opposite corners at (0,0) & (1,1).
  //
  // before rendering, this square is scaled & moved to the required location.
  var uMVMatrix = this.uMVMatrix.copy();
  try {
    this.uMVMatrix.translate([x, y, 0]);
    this.uMVMatrix.scale(width, height, 1);

    this.drawBuffers(gId);
  } finally {
    this.uMVMatrix = uMVMatrix;
  }
  return this;
};

p5.RendererGL.prototype.quad = function(x1, y1, x2, y2, x3, y3, x4, y4) {
  var gId =
    'quad|' +
    x1 +
    '|' +
    y1 +
    '|' +
    x2 +
    '|' +
    y2 +
    '|' +
    x3 +
    '|' +
    y3 +
    '|' +
    x4 +
    '|' +
    y4;
  if (!this.geometryInHash(gId)) {
    var _quad = function() {
      this.vertices.push(new p5.Vector(x1, y1, 0));
      this.vertices.push(new p5.Vector(x2, y2, 0));
      this.vertices.push(new p5.Vector(x3, y3, 0));
      this.vertices.push(new p5.Vector(x4, y4, 0));
      this.uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
      this.strokeIndices = [[0, 1], [1, 2], [2, 3], [3, 0]];
    };
    var quadGeom = new p5.Geometry(2, 2, _quad);
    quadGeom
      .computeNormals()
      ._makeTriangleEdges()
      ._edgesToVertices();
    quadGeom.faces = [[0, 1, 2], [2, 3, 0]];
    this.createBuffers(gId, quadGeom);
  }
  this.drawBuffers(gId);
  return this;
};

//this implementation of bezier curve
//is based on Bernstein polynomial
// pretier-ignore
p5.RendererGL.prototype.bezier = function(
  x1,
  y1,
  z1,
  x2,
  y2,
  z2,
  x3,
  y3,
  z3,
  x4,
  y4,
  z4
) {
  var bezierDetail = this._pInst._bezierDetail || 20; //value of Bezier detail
  this.beginShape();
  for (var i = 0; i <= bezierDetail; i++) {
    var c1 = Math.pow(1 - i / bezierDetail, 3);
    var c2 = 3 * (i / bezierDetail) * Math.pow(1 - i / bezierDetail, 2);
    var c3 = 3 * Math.pow(i / bezierDetail, 2) * (1 - i / bezierDetail);
    var c4 = Math.pow(i / bezierDetail, 3);
    this.vertex(
      x1 * c1 + x2 * c2 + x3 * c3 + x4 * c4,
      y1 * c1 + y2 * c2 + y3 * c3 + y4 * c4,
      z1 * c1 + z2 * c2 + z3 * c3 + z4 * c4
    );
  }
  this.endShape();
  return this;
};

// pretier-ignore
p5.RendererGL.prototype.curve = function(
  x1,
  y1,
  z1,
  x2,
  y2,
  z2,
  x3,
  y3,
  z3,
  x4,
  y4,
  z4
) {
  var curveDetail = this._pInst._curveDetail;
  this.beginShape();
  for (var i = 0; i <= curveDetail; i++) {
    var c1 = Math.pow(i / curveDetail, 3) * 0.5;
    var c2 = Math.pow(i / curveDetail, 2) * 0.5;
    var c3 = i / curveDetail * 0.5;
    var c4 = 0.5;
    var vx =
      c1 * (-x1 + 3 * x2 - 3 * x3 + x4) +
      c2 * (2 * x1 - 5 * x2 + 4 * x3 - x4) +
      c3 * (-x1 + x3) +
      c4 * (2 * x2);
    var vy =
      c1 * (-y1 + 3 * y2 - 3 * y3 + y4) +
      c2 * (2 * y1 - 5 * y2 + 4 * y3 - y4) +
      c3 * (-y1 + y3) +
      c4 * (2 * y2);
    var vz =
      c1 * (-z1 + 3 * z2 - 3 * z3 + z4) +
      c2 * (2 * z1 - 5 * z2 + 4 * z3 - z4) +
      c3 * (-z1 + z3) +
      c4 * (2 * z2);
    this.vertex(vx, vy, vz);
  }
  this.endShape();
  return this;
};

/**
 * Draw a line given two points
 * @private
 * @param {Number} x0 x-coordinate of first vertex
 * @param {Number} y0 y-coordinate of first vertex
 * @param {Number} z0 z-coordinate of first vertex
 * @param {Number} x1 x-coordinate of second vertex
 * @param {Number} y1 y-coordinate of second vertex
 * @param {Number} z1 z-coordinate of second vertex
 * @chainable
 * @example
 * <div>
 * <code>
 * //draw a line
 * function setup() {
 *   createCanvas(100, 100, WEBGL);
 * }
 *
 * function draw() {
 *   background(200);
 *   rotateX(frameCount * 0.01);
 *   rotateY(frameCount * 0.01);
 *   // Use fill instead of stroke to change the color of shape.
 *   fill(255, 0, 0);
 *   line(10, 10, 0, 60, 60, 20);
 * }
 * </code>
 * </div>
 */
p5.RendererGL.prototype.line = function() {
  if (arguments.length === 6) {
    this.beginShape();
    this.vertex(arguments[0], arguments[1], arguments[2]);
    this.vertex(arguments[3], arguments[4], arguments[5]);
    this.endShape();
  } else if (arguments.length === 4) {
    this.beginShape();
    this.vertex(arguments[0], arguments[1], 0);
    this.vertex(arguments[2], arguments[3], 0);
    this.endShape();
  }
  return this;
};

module.exports = p5;
