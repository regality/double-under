var __ = require('../index');

__.configure({
  host: 'localhost'
});

var x = __({
  __: "__test"
});

x.unset('hai');

setTimeout(function() {
  process.exit();
}, 100);
