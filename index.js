"use strict";

var redis = require('redis')
  , _ = require('underscore')
  , randId = require('./lib/rand')
  , pubkey = randId(20)
  , config = null
  , registry = {}
  , values = {}
  , timers = {}
  , pub
  , sub
  , pop
  ;

function configure(_config) {
  config = _config || {};
  config.port = config.port || 6379;
  config.host = config.host || 'localhost';
  pub = redis.createClient(config.port, config.host, config);
  sub = redis.createClient(config.port, config.host, config);
  pop = redis.createClient(config.port, config.host, config);
  sub.on('message', onMessage);
  sub.subscribe('__:fullupdate:' + pubkey);
}

function init(name) {
  registry[name] = [];
  values[name] = values[name] || {};
  sub.subscribe("__:" + name);
  requestFullUpdate(name);
  popFullUpdateRequest(name);
}

function popFullUpdateRequest(name) {
  pop.blpop('fullupdate:' + name, 3600, function(err, vals) {
    if (!vals) return popFullUpdateRequest(name);
    // graciously send out a full update
    var name = vals[0].split(':')[1];
    var pubChannel = vals[1];
    graciouslyProvideUpdate(name, pubChannel);
  });
}

function graciouslyProvideUpdate(name, channel) {
  if (values[name]) {
    // be a peach
    publish(channel, 'fullupdate', name, values[name]);
    popFullUpdateRequest(name);
  } else {
    // dammit
    // make someone else do it
    // TODO: add a TTL or something
    pub.rpush('fullupdate:' + name, channel);
  }
}

function requestFullUpdate(name) {
  if (sub.ready) {
    pub.rpush('fullupdate:' + name, 'fullupdate:' + pubkey);
  } else {
    pub.on('ready', function() {
      pub.rpush('fullupdate:' + name, 'fullupdate:' + pubkey);
    });
  }
}

function register(self) {
  var name = self.name;
  if (!registry.hasOwnProperty(name)) {
    init(name);
  }
  registry[name].push(self);
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

function getNamespace(name) {
  return registry[name];
}

function applyToNameSpace(name, fn) {
  var objects = getNamespace(name);
  if (!objects) return;
  objects.forEach(fn);
}

function publish(name, action, key, value) {
  var channel = '__:' + name;
  var msg = pubkey + ':' + action + ':' + key;
  if (value) {
    msg += ':' + JSON.stringify(value);
  }
  pub.publish(channel, msg);
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
  var value = (m[4].length === 0 ? null : JSON.parse(m[4]));

  if (id === pubkey) return; // ignore messages we send out
  if (action === "unset") {
    unset(name, key, false);
  } else if (action === "set") {
    set(name, key, value, false);
  } else if (action === "fullupdate") {
    values[key] = value;
    for (var k in values[key]) {
      if (values[key].hasOwnProperty(k)) {
        applyToNameSpace(function(v) {
          v.addSetter(k);
        });
      }
    }
  }
}

function DoubleUnder(name) {
  if (!config) throw new Error('You must call __.configure before using double-under');
  this.name = name;
  register(this);
}

DoubleUnder.prototype.set = function __set(key, value) {
  set(this.name, key, value, true);
};

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
