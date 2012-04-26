var __ = require('../index');

__.configure({
  host: 'localhost'
});

var x = __("__test");
x.set('inc', 7);

setTimeout(function() {
  process.exit();
}, 100);
