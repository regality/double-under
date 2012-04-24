var __ = require('../index');

__.configure({
  host: 'localhost'
});

var x = __({
  __: "__test",
  arr: []
});

x.arr.push(x.inc);
x.arr.push(x.inc + 1);
x.arr.push(x.inc + 2);
x.update('arr');

setTimeout(function() {
  process.exit();
}, 100);
