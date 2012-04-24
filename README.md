# Double Under

Double Under is a node.js utility that allows for shared objects between
different node processes and machines. It is backed by redis using a
pub/sub channel.

It is simple and fun to use.

```javascript
var __ = require('double-under');

// configure redis host before using
__.configure({
  host: 'localhost'
});

// variables are shared based on namespace
var foo = __('foo');

foo.set('double', 'decker');
// baz is now propogated to every
// process on every machine

// you only have to use set the first time
foo.double = 'under'; // this works

```

## TODO

* Add mutexes/semaphores or something to prevent race conditions.

* Add atomic pop/push for arrays.

* Allow atomic update of fields in sub objects.

* Add a test suite.
