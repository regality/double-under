var spawn = require('child_process').spawn
  , assert = require('assert')
  , __ = require('../index')
  ;

__.configure({
  host: 'localhost'
});

var x = __({
  __: "__test"
});

function runFile(file, cb) {
  var child = spawn('node', ['./' + file]);
  child.on('exit', function() {
    console.log(file + " exited");
    cb();
  });
}

runFile('inc', function() {
  console.log(x.toString());
  runFile('arr', function() {
    console.log(x.toString());
    runFile('hai', function() {
      console.log(x.toString());
      runFile('bai', function() {
        console.log(x.toString());
      });
    });
  });
});
