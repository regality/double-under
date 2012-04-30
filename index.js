"use strict";

var events = require('events')
  , util   = require('util')
  , redis  = require('redis')
  , _      = require('underscore')
  , randId = require('./lib/rand')

var EventEmitter = events.EventEmitter
  , pubkey = randId(20)
  , config = null
  , registry = {}
  , values = {}
  , timers = {}
  , pub
  , sub
  ;

function configure(_config) {
  config = _config || {};
  config.port = config.port || 6379;
  config.host = config.host || 'localhost';
  pub = redis.createClient(config.port, config.host, config);
  sub = redis.createClient(config.port, config.host, config);
  sub.on('message', onMessage);
}

function initRegistry(name, cb) {
  registry[name] = [];
  sub.subscribe("__:" + name);
  values[name] = {};
  getFullUpdate(name, cb);
}

function getFullUpdate(name, cb) {
  pub.hgetall('__:' + name, function(err, vals) {
    if (!vals) return cb();
    for (var key in vals) {
      if (vals.hasOwnProperty(key)) {
        set(name, key, JSON.parse(vals[key]), false);
      }
    }
    cb();
  });
}

function register(self, cb) {
  var name = self.name;
  if (!registry.hasOwnProperty(name)) {
    initRegistry(name, cb);
    registry[name].push(self);
  } else {
    registry[name].push(self);
    cb();
  }
}

function unRegister(self) {
  var name = self.name;
  for (var i = 0, l = registry[name].length; i < l; ++i) {
    if (registry[name][i] === self) {
      registry[name].splice(i, 1);
      if (registry[name].length === 0) {
        sub.unsubscribe("__:" + name);
        delete values[name];
      }
      return;
    }
  }
}

function applyToNameSpace(name, fn) {
  var objects = registry[name];
  if (!objects) return;
  objects.forEach(fn);
}

function publish(name, action, key, value) {
  applyToNameSpace(name, function(v) {
    v.emit("publish");
  });
  var channel = '__:' + name;
  var msg = pubkey + ':' + action + ':' + key;
  if (value) {
    value = JSON.stringify(value);
    msg += ':' + value;
  }
  pub.publish(channel, msg);
  if (action === 'set') {
    pub.hset(channel, key, value);
  } else if (action === 'unset') {
    pub.hdel(channel, key);
  }
}

function unset(name, key, doPublish) {
  delete values[name][key];
  applyToNameSpace(name, function(v) {
    v.deleteSetter(key);
  });
  if (doPublish) {
    publish(name, 'unset', key);
  }
}

function set(namespace, key, value, doPublish) {
  if (values[namespace][key] === undefined) {
    applyToNameSpace(namespace, function(v) {
      v.addSetter(key);
    });
  }
  values[namespace][key] = value;
  if (doPublish) {
    publish(namespace, 'set', key, value);
  }
}

/*
 * messages come in the format of
 *
 *     __:namespace => id:action:key:value
 *
 * value is optional and must be JSON parseable if provided
 */
function onMessage(channel, msg) {
  var name = channel.match(/__:(.*)/)[1];
  var m = msg.match(/^([^:]+):([^:]+):([^:]+):?(.+)?$/);
  var id = m[1];
  var action = m[2];
  var key = m[3];
  var value = (m[4] === undefined || m[4].length === 0 ? null : JSON.parse(m[4]));

  if (id === pubkey) return; // ignore messages we send out
  if (action === "unset") {
    unset(name, key, false);
  } else if (action === "set") {
    set(name, key, value, false);
  }
}

function DoubleUnder(name) {
  if (!config) throw new Error('You must call __.configure before using double-under');
  var self = this;
  this.name = name;
  this.ready = false;
  this.on('newListener', function(event, listener) {
    if (event === 'ready' && self.ready) {
      listener();
    }
  });
  register(this, function() {
    self.ready = true;
    self.emit("ready");
  });
}

util.inherits(DoubleUnder, EventEmitter);

DoubleUnder.prototype.addSetter = function addSetter(key) {
  var name = this.name;

  if (this.__lookupSetter__(key)) return;

  this.__defineGetter__(key, function() {
    return values[name][key];
  });

  this.__defineSetter__(key, function(v) {
    set(name, key, v, true);
  });

};

DoubleUnder.prototype.deleteSetter = function deleteSetter(key) {
  delete this[key];
};

DoubleUnder.prototype.set = function __set(key, value) {
  set(this.name, key, value, true);
};

DoubleUnder.prototype.get = function __get(key) {
  return values[this.name][key]
};

DoubleUnder.prototype.has = function __has(key) {
  return values[this.name].hasOwnProperty(key);
};

DoubleUnder.prototype.update = function update(key) {
  this[key] = this[key]; // trigger setter
};

DoubleUnder.prototype.unset = function __unset(key) {
  unset(this.name, key, true);
};

DoubleUnder.prototype.destroy = function destroy() {
  unRegister(this);
};

DoubleUnder.prototype.toString = function toString() {
  return JSON.stringify(values[this.name], true, 2);
};

DoubleUnder.prototype.valueOf = function valueOf() {
  return _.clone(values[this.name]);
};

DoubleUnder.prototype.stringify = function stringify() {
  return JSON.stringify(this.object);
};

function __(name) {
  return new DoubleUnder(name);
}

__.configure = configure;

module.exports = __;
