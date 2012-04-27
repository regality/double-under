var __ = require('../index');

__.configure();

var x = __('__test');

x.on('ready', function() {
  x.set('hai', 'bai');
  process.exit();
});
