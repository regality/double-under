"use strict";

var redis = require('redis')
  , pub
  , sub
  , registry = {};

function configure(config) {
  config.port = config.port || 6379;
  pub = redis.createClient(config.port, config.host, config);
  sub = redis.createClient(config.port, config.host, config);
  sub.on('message', onMessage);
}

function onMessage(channel, msg) {
  var name = channel.match(/__:(.*)/)[1];
  var m = msg.match(/(.+):(.+)/);
  var key = m[1];
  var value = JSON.parse(m[2]);
  for (var i = 0; i < registry[name].length; ++i) {
    registry[name][i].set(key, value);
  }
};

function register(self) {
  if (!registry.hasOwnProperty(self.name)) {
    registry[self.name] = [];
  }
  registry[self.name].push(self);
  sub.subscribe("__:" + self.name);
}

function unRegister(self) {
  var sameName = false;
  for (var i = 0, l = registry[self.name].length; i < l; ++i) {
    if (registry[self.name][i] === self) {
      registry[self.name].splice(i, 1);
      if (registry[self.name].length === 0) {
        sub.unsubscribe("__:" + self.name);
      }
      return;
    }
  }
}

function DoubleUnder(name, object) {
  this.name = name;
  this.object = object;
  for (var key in this.object) {
    if (this.object.hasOwnProperty(key)) {
      this.set(key, this.object[key]);
    }
  }
  register(this);
}

DoubleUnder.prototype.set = function set(key, value) {
  var self = this;

  self.object[key] = value;

  if (self.__lookupSetter__(key) === undefined) {
    self.__defineGetter__(key, function() {
      return self.object[key];
    });

    self.__defineSetter__(key, function(v) {
      self.object[key] = v;
      pub.publish("__:" + self.name, key + ":" + JSON.stringify(v));
    });
  }

};

DoubleUnder.prototype.destroy = function destroy() {
  unRegister(this);
};

DoubleUnder.prototype.toString = function toString() {
  return JSON.stringify(this.object, true, 2);
};

DoubleUnder.prototype.stringify = function stringify() {
  return JSON.stringify(this.object);
};

function __(object) {
  var name = object.__;
  delete object.__;
  return new DoubleUnder(name, object);
}

__.configure = configure;

module.exports = __;
