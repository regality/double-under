var __ = require('../index');

__.configure({
  host: 'localhost'
});

var x = __("__test");

setTimeout(function() {
  x.set('arr', []);
  var inc = Number(x.inc);
  x.arr.push(inc);
  x.arr.push(inc + 1);
  x.arr.push(inc + 2);
  x.update('arr');
  setTimeout(function() {
    process.exit();
  }, 100);
}, 100);
