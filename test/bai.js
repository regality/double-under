var __ = require('../index');

__.configure();

var x = __("__test");

x.on("ready", function() {
  x.unset('hai');
  process.exit();
});
