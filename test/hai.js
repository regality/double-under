var __ = require('../index');

__.configure();

var x = __('__test');

x.ready(function() {
  x.set('hai', 'bai');
  process.exit();
});
