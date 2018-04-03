suite('stroke WebGL', function() {
  var myp5;

  if (!window.Modernizr.webgl) {
    return;
  }

  setup(function() {
    myp5 = new p5(function(p) {
      p.setup = function() {
        p.createCanvas(100, 100, p.WEBGL);
      };
    });
  });

  teardown(function() {
    myp5.clear();
  });

  suite('default stroke shader', function() {
    test('check default shader creation', function(done) {
      myp5.createCanvas(100, 100, myp5.WEBGL);
      done();
    });

    test('check activate and deactivating fill and stroke', function(done) {
      myp5.noStroke();
      assert(
        !myp5._renderer._doStroke,
        'stroke shader still active after noStroke()'
      );
      assert.isTrue(
        myp5._renderer._doFill,
        'fill shader deactivated by noStroke()'
      );
      myp5.stroke(0);
      myp5.noFill();
      assert(
        myp5._renderer._doStroke,
        'stroke shader not active after stroke()'
      );
      assert.isTrue(
        !myp5._renderer._doFill,
        'fill shader still active after noFill()'
      );
      done();
    });
  });
});
