var __ = require('../index');

__.configure();

var x = __("__test");
x.set('inc', 7);

setTimeout(function() {
  process.exit();
}, 100);
