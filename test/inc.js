var __ = require('../index');

__.configure();

var x = __("__test");

x.ready(function() {
  x.ready(function() {
    x.set('inc', 7);
    process.exit();
  });
});
