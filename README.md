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
var foo = __({
  __: 'foo', // namespace (required)
  foo: 'bar',
  baz: 'bam'
});

foo.baz = 'bambam!';
// baz is now propogated to every
// process on every machine

// if you set a new property,
// use the set method the first time
foo.set('double', 'under');

foo.double = 'underscore'; // this works now.
```

## TODO

* Add mutexes/semaphores or something to prevent race conditions.

* Add atomic pop/push for arrays.

* Add a test suite.

* Use [msgpack](https://github.com/pgriess/node-msgpack) instead of JSON parse/stringify
