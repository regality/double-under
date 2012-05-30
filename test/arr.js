var __ = require('../index');

__.configure();

var x = __("__test");

x.ready(function() {
  x.set('arr', []);
  var inc = Number(x.inc);
  x.arr.push(inc);
  x.arr.push(inc + 1);
  x.arr.push(inc + 2);
  x.update('arr');
  process.exit();
});
