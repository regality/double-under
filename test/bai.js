var __ = require('../index');

__.configure();

var x = __("__test");

x.ready(function() {
  x.unset('hai');
  process.exit();
});
