var __ = require('../index');

__.configure();

var x = __('__test');

x.set('hai', 'bai');

setTimeout(function() {
  process.exit();
}, 100);
