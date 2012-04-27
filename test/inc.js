var __ = require('../index');

__.configure();

var x = __("__test");

x.on('ready', function() {
  x.on('ready', function() {
    x.set('inc', 7);
    process.exit();
  });
});
