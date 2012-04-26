var __ = require('../index');

__.configure({
  host: 'localhost'
});

var x = __('__test');

x.set('hai', 'bai');

setTimeout(function() {
  process.exit();
}, 100);
