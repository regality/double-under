var __ = require('../index');

__.configure();

var x = __("__test");

x.unset('hai');

setTimeout(function() {
  process.exit();
}, 100);
