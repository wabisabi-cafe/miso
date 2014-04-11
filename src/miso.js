"use strict";
var BuiltIn, Constructor, LIB_CONFIG, NAMESPACE_EXP, attach, batch, hasOwnProp, namespace, settings, storage, toString, _H, _builtin;

LIB_CONFIG = {
  name: "@NAME",
  version: "@VERSION"
};

toString = {}.toString;

NAMESPACE_EXP = /^[0-9A-Z_.]+[^_.]?$/i;

settings = {
  validator: function() {}
};

storage = {
  core: {},
  types: {},
  modules: {
    Core: {
      BuiltIn: null
    }
  }
};


/*
 * 判断某个对象是否有自己的指定属性
 *
 * !!! 不能用 object.hasOwnProperty(prop) 这种方式，低版本 IE 不支持。
 *
 * @private
 * @method   hasOwnProp
 * @param    obj {Object}    Target object
 * @param    prop {String}   Property to be tested
 * @return   {Boolean}
 */

hasOwnProp = function(obj, prop) {
  if (obj == null) {
    return false;
  } else {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }
};


/*
 * 添加命名空间
 *
 * @private
 * @method  namespace
 * @param   ns_str {String}     a namespace format string (e.g. 'Module.Package')
 * @return  {Object}
 */

namespace = function(ns_str) {
  var obj;
  obj = null;
  if (_builtin.isString(ns_str) && NAMESPACE_EXP.test(ns_str)) {
    obj = storage.modules;
    _builtin.each(ns_str.split("."), function(part, idx) {
      if (obj[part] === void 0) {
        obj[part] = {};
      }
      return obj = obj[part];
    });
  }
  return obj;
};


/*
 * 批量添加 method
 *
 * @private
 * @method  batch
 * @param   host {Object}       the host of methods to be added
 * @param   handlers {Object}   data of a method
 * @param   data {Object}       data of a module
 * @return
 */

batch = function(host, handlers, data) {
  var context;
  context = this;
  if (_builtin.isArray(data)) {
    _builtin.each(data, function(d) {
      var _ref;
      return batch.apply(context, [(typeof d[1] === "string" && NAMESPACE_EXP.test(d[1]) ? namespace(d[1]) : host), (_ref = d[0]) != null ? _ref.handlers : void 0, d[0]]);
    });
  } else if (_builtin.isObject(data)) {
    _builtin.each(handlers, function(info) {
      return attach.apply(context, [host, info, data]);
    });
  }
  return true;
};


/*
 * 构造 method
 *
 * @private
 * @method  attach
 * @param   host {Object}       the host of methods to be added
 * @param   set {Object}        data of a method
 * @param   data {Object}       data of a module
 * @param   isCore {Boolean}    whether copy to the core-method-object
 * @return
 */

attach = function(host, set, data) {
  var handler, method, name, validator, validators, value, _i, _len;
  name = set.name;
  if (!_builtin.isFunction(host[name])) {
    handler = set.handler;
    value = hasOwnProp(set, "value") ? set.value : data.value;
    validators = [set.validator, data.validator, settings.validator, function() {}];
    for (_i = 0, _len = validators.length; _i < _len; _i++) {
      validator = validators[_i];
      if (_builtin.isFunction(validator)) {
        break;
      }
    }
    method = function() {
      if (_builtin.isFunction(handler) === true && validator.apply(host, arguments)) {
        return handler.apply(host, arguments);
      } else {
        return value;
      }
    };
    host[name] = method;
  }
  return true;
};

BuiltIn = (function() {
  function BuiltIn() {}


  /*
   * 扩展指定对象
   * 
   * @method  mixin
   * @param   unspecified {Mixed}
   * @return  {Object}
   */

  BuiltIn.prototype.mixin = function() {
    var args, copy, i, length, name, opts, target, _ref;
    args = arguments;
    length = args.length;
    target = (_ref = args[0]) != null ? _ref : {};
    i = 1;
    if (length === 1) {
      target = this;
      i--;
    }
    while (i < length) {
      opts = args[i];
      if (typeof opts === "object") {
        for (name in opts) {
          copy = opts[name];
          if (copy === target) {
            continue;
          }
          if (copy !== void 0) {
            target[name] = copy;
          }
        }
      }
      i++;
    }
    return target;
  };


  /*
   * 遍历
   * 
   * @method  each
   * @param   object {Object/Array/Function}
   * @param   callback {Function}
   * @return  {Mixed}
   */

  BuiltIn.prototype.each = function(object, callback) {
    var ele, index, name, type, value;
    type = this.type(object);
    if (type === "object" || type === "function") {
      for (name in object) {
        value = object[name];
        if (callback.apply(value, [value, name, object]) === false) {
          break;
        }
      }
    } else if (type === "array" || type === "string") {
      index = 0;
      while (index < object.length) {
        ele = type === "array" ? object[index] : object.charAt(index);
        if (callback.apply(object[index], [ele, index++, object]) === false) {
          break;
        }
      }
    }
    return object;
  };


  /*
   * 获取对象类型
   * 
   * @method  type
   * @param   object {Mixed}
   * @return  {String}
   */

  BuiltIn.prototype.type = function(object) {
    if (object == null) {
      return String(object);
    } else {
      return storage.types[toString.call(object)] || "object";
    }
  };


  /*
   * 切割 Array-Like Object 片段
   *
   * @method   slice
   * @param    args {Array-Like}
   * @param    index {Integer}
   * @return
   */

  BuiltIn.prototype.slice = function(args, index) {
    if (args == null) {
      return [];
    } else {
      return [].slice.call(args, Number(index) || 0);
    }
  };


  /*
   * 判断某个对象是否有自己的指定属性
   *
   * @method   hasProp
   * @return   {Boolean}
   */

  BuiltIn.prototype.hasProp = function() {
    return hasOwnProp.apply(this, this.slice(arguments));
  };

  return BuiltIn;

})();

_builtin = new BuiltIn;

_builtin.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(name, i) {
  var lc;
  storage.types["[object " + name + "]"] = lc = name.toLowerCase();
  return _builtin["is" + name] = function(target) {
    return this.type(target) === lc;
  };
});

_builtin.mixin({

  /*
   * 判断是否为 window 对象
   * 
   * @method  isWindow
   * @param   object {Mixed}
   * @return  {String}
   */
  isWindow: function(object) {
    return object && this.isObject(object) && "setInterval" in object;
  },

  /*
   * 判断是否为数字类型（字符串）
   * 
   * @method  isNumeric
   * @param   object {Mixed}
   * @return  {Boolean}
   */
  isNumeric: function(object) {
    return !isNaN(parseFloat(object)) && isFinite(object);
  },

  /*
   * Determine whether a number is an integer.
   *
   * @method  isInteger
   * @param   object {Mixed}
   * @return  {Boolean}
   */
  isInteger: function(object) {
    return this.isNumeric(object) && /^-?[1-9]\d*$/.test(object);
  },

  /*
   * 判断对象是否为纯粹的对象（由 {} 或 new Object 创建）
   * 
   * @method  isPlainObject
   * @param   object {Mixed}
   * @return  {Boolean}
   */
  isPlainObject: function(object) {
    var error, key;
    if (!object || !this.isObject(object) || object.nodeType || this.isWindow(object)) {
      return false;
    }
    try {
      if (object.constructor && !this.hasProp(object, "constructor") && !this.hasProp(object.constructor.prototype, "isPrototypeOf")) {
        return false;
      }
    } catch (_error) {
      error = _error;
      return false;
    }
    for (key in object) {
      key;
    }
    return key === void 0 || this.hasProp(object, key);
  },

  /*
   * Determin whether a variable is considered to be empty.
   *
   * A variable is considered empty if its value is or like:
   *  - null
   *  - undefined
   *  - false
   *  - ""
   *  - []
   *  - {}
   *  - 0
   *  - 0.0
   *  - "0"
   *  - "0.0"
   *
   * @method  isEmpty
   * @param   object {Mixed}
   * @return  {Boolean}
   *
   * refer: http://www.php.net/manual/en/function.empty.php
   */
  isEmpty: function(object) {
    var name, result;
    result = false;
    if ((object == null) || !object) {
      result = true;
    } else if (this.isObject(object)) {
      result = true;
      for (name in object) {
        result = false;
        break;
      }
    }
    return result;
  },

  /*
   * 是否为类数组对象
   *
   * @method  isArrayLike
   * @param   object {Mixed}
   * @return  {Boolean}
   */
  isArrayLike: function(object) {
    var length, result, type;
    result = false;
    if (this.isObject(object) && object !== null) {
      if (!this.isWindow(object)) {
        type = this.type(object);
        length = object.length;
        if (object.nodeType === 1 && length || this.isArray(type) || !this.isFunction(type) && (length === 0 || this.isNumber(length) && length > 0 && (length - 1) in object)) {
          result = true;
        }
      }
    }
    return result;
  }
});


/*
 * A constructor to construct methods
 *
 * @class   Constructor
 * @constructor
 */

Constructor = (function() {
  function Constructor() {
    var args, data, host;
    this.constructor = Constructor;
    args = arguments;
    data = args[0];
    host = args[1];
    if (args.length < 2 || !(_builtin.isObject(host) || _builtin.isFunction(host))) {
      host = this.object = {};
    }
    batch.apply(this, [host, data != null ? data.handlers : void 0, data]);
  }

  Constructor.prototype.toString = function() {
    return "[object " + LIB_CONFIG.name + "]";
  };

  Constructor.prototype.add = function(set) {
    return attach(set);
  };

  return Constructor;

})();

_builtin.mixin(Constructor, {
  __builtIn__: _builtin,
  toString: function() {
    return "function " + LIB_CONFIG.name + "() { [native code] }";
  },
  config: function(setting) {
    return _builtin.mixin(settings, setting);
  }
});

_H = Constructor;

window[LIB_CONFIG.name] = _H;
