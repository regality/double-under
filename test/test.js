var spawn = require('child_process').spawn
  , assert = require('assert')
  , __ = require('../index')
  ;

__.configure();

var x = __("__test");

function runFile(file, cb) {
  var child = spawn('node', [__dirname + '/' + file]);
  child.stderr.on('data', function(data) {
    console.log(data.toString());
  });
  child.stdout.on('data', function(data) {
    console.log(data.toString());
  });
  child.on('exit', function(status) {
    assert.equal(status, 0);
    cb();
  });
}

x.on('ready', function() {
  runFile('inc', function() {
    assert.equal(x.inc, 7);

    runFile('arr', function() {
      assert.deepEqual(x.valueOf().arr, [7, 8, 9]);

      runFile('hai', function() {
        assert.equal(x.hai, 'bai');

        runFile('bai', function() {
          assert.equal(x.hai, undefined);


          console.log("All assertions passed.");
          process.exit();
        });
      });
    });
  });
});
