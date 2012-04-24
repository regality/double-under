var __ = require('../index');

__.configure({
  host: 'localhost'
});

var x = __({
  __: "__test",
  inc: 7
});

setTimeout(function() {
  process.exit();
}, 100);
