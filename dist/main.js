var Main;
/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/events/events.js":
/*!***************************************!*\
  !*** ./node_modules/events/events.js ***!
  \***************************************/
/***/ (function(module) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}


/***/ }),

/***/ "./node_modules/reflect-metadata/Reflect.js":
/*!**************************************************!*\
  !*** ./node_modules/reflect-metadata/Reflect.js ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

/*! *****************************************************************************
Copyright (C) Microsoft. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
var Reflect;
(function (Reflect) {
    // Metadata Proposal
    // https://rbuckton.github.io/reflect-metadata/
    (function (factory) {
        var root = typeof __webpack_require__.g === "object" ? __webpack_require__.g :
            typeof self === "object" ? self :
                typeof this === "object" ? this :
                    Function("return this;")();
        var exporter = makeExporter(Reflect);
        if (typeof root.Reflect === "undefined") {
            root.Reflect = Reflect;
        }
        else {
            exporter = makeExporter(root.Reflect, exporter);
        }
        factory(exporter);
        function makeExporter(target, previous) {
            return function (key, value) {
                if (typeof target[key] !== "function") {
                    Object.defineProperty(target, key, { configurable: true, writable: true, value: value });
                }
                if (previous)
                    previous(key, value);
            };
        }
    })(function (exporter) {
        var hasOwn = Object.prototype.hasOwnProperty;
        // feature test for Symbol support
        var supportsSymbol = typeof Symbol === "function";
        var toPrimitiveSymbol = supportsSymbol && typeof Symbol.toPrimitive !== "undefined" ? Symbol.toPrimitive : "@@toPrimitive";
        var iteratorSymbol = supportsSymbol && typeof Symbol.iterator !== "undefined" ? Symbol.iterator : "@@iterator";
        var supportsCreate = typeof Object.create === "function"; // feature test for Object.create support
        var supportsProto = { __proto__: [] } instanceof Array; // feature test for __proto__ support
        var downLevel = !supportsCreate && !supportsProto;
        var HashMap = {
            // create an object in dictionary mode (a.k.a. "slow" mode in v8)
            create: supportsCreate
                ? function () { return MakeDictionary(Object.create(null)); }
                : supportsProto
                    ? function () { return MakeDictionary({ __proto__: null }); }
                    : function () { return MakeDictionary({}); },
            has: downLevel
                ? function (map, key) { return hasOwn.call(map, key); }
                : function (map, key) { return key in map; },
            get: downLevel
                ? function (map, key) { return hasOwn.call(map, key) ? map[key] : undefined; }
                : function (map, key) { return map[key]; },
        };
        // Load global or shim versions of Map, Set, and WeakMap
        var functionPrototype = Object.getPrototypeOf(Function);
        var usePolyfill = typeof process === "object" && process.env && process.env["REFLECT_METADATA_USE_MAP_POLYFILL"] === "true";
        var _Map = !usePolyfill && typeof Map === "function" && typeof Map.prototype.entries === "function" ? Map : CreateMapPolyfill();
        var _Set = !usePolyfill && typeof Set === "function" && typeof Set.prototype.entries === "function" ? Set : CreateSetPolyfill();
        var _WeakMap = !usePolyfill && typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
        // [[Metadata]] internal slot
        // https://rbuckton.github.io/reflect-metadata/#ordinary-object-internal-methods-and-internal-slots
        var Metadata = new _WeakMap();
        /**
         * Applies a set of decorators to a property of a target object.
         * @param decorators An array of decorators.
         * @param target The target object.
         * @param propertyKey (Optional) The property key to decorate.
         * @param attributes (Optional) The property descriptor for the target key.
         * @remarks Decorators are applied in reverse order.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     Example = Reflect.decorate(decoratorsArray, Example);
         *
         *     // property (on constructor)
         *     Reflect.decorate(decoratorsArray, Example, "staticProperty");
         *
         *     // property (on prototype)
         *     Reflect.decorate(decoratorsArray, Example.prototype, "property");
         *
         *     // method (on constructor)
         *     Object.defineProperty(Example, "staticMethod",
         *         Reflect.decorate(decoratorsArray, Example, "staticMethod",
         *             Object.getOwnPropertyDescriptor(Example, "staticMethod")));
         *
         *     // method (on prototype)
         *     Object.defineProperty(Example.prototype, "method",
         *         Reflect.decorate(decoratorsArray, Example.prototype, "method",
         *             Object.getOwnPropertyDescriptor(Example.prototype, "method")));
         *
         */
        function decorate(decorators, target, propertyKey, attributes) {
            if (!IsUndefined(propertyKey)) {
                if (!IsArray(decorators))
                    throw new TypeError();
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsObject(attributes) && !IsUndefined(attributes) && !IsNull(attributes))
                    throw new TypeError();
                if (IsNull(attributes))
                    attributes = undefined;
                propertyKey = ToPropertyKey(propertyKey);
                return DecorateProperty(decorators, target, propertyKey, attributes);
            }
            else {
                if (!IsArray(decorators))
                    throw new TypeError();
                if (!IsConstructor(target))
                    throw new TypeError();
                return DecorateConstructor(decorators, target);
            }
        }
        exporter("decorate", decorate);
        // 4.1.2 Reflect.metadata(metadataKey, metadataValue)
        // https://rbuckton.github.io/reflect-metadata/#reflect.metadata
        /**
         * A default metadata decorator factory that can be used on a class, class member, or parameter.
         * @param metadataKey The key for the metadata entry.
         * @param metadataValue The value for the metadata entry.
         * @returns A decorator function.
         * @remarks
         * If `metadataKey` is already defined for the target and target key, the
         * metadataValue for that key will be overwritten.
         * @example
         *
         *     // constructor
         *     @Reflect.metadata(key, value)
         *     class Example {
         *     }
         *
         *     // property (on constructor, TypeScript only)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         static staticProperty;
         *     }
         *
         *     // property (on prototype, TypeScript only)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         property;
         *     }
         *
         *     // method (on constructor)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         static staticMethod() { }
         *     }
         *
         *     // method (on prototype)
         *     class Example {
         *         @Reflect.metadata(key, value)
         *         method() { }
         *     }
         *
         */
        function metadata(metadataKey, metadataValue) {
            function decorator(target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey) && !IsPropertyKey(propertyKey))
                    throw new TypeError();
                OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
            }
            return decorator;
        }
        exporter("metadata", metadata);
        /**
         * Define a unique metadata entry on the target.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param metadataValue A value that contains attached metadata.
         * @param target The target object on which to define metadata.
         * @param propertyKey (Optional) The property key for the target.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     Reflect.defineMetadata("custom:annotation", options, Example);
         *
         *     // property (on constructor)
         *     Reflect.defineMetadata("custom:annotation", options, Example, "staticProperty");
         *
         *     // property (on prototype)
         *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "property");
         *
         *     // method (on constructor)
         *     Reflect.defineMetadata("custom:annotation", options, Example, "staticMethod");
         *
         *     // method (on prototype)
         *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "method");
         *
         *     // decorator factory as metadata-producing annotation.
         *     function MyAnnotation(options): Decorator {
         *         return (target, key?) => Reflect.defineMetadata("custom:annotation", options, target, key);
         *     }
         *
         */
        function defineMetadata(metadataKey, metadataValue, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
        }
        exporter("defineMetadata", defineMetadata);
        /**
         * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.hasMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.hasMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.hasMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function hasMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryHasMetadata(metadataKey, target, propertyKey);
        }
        exporter("hasMetadata", hasMetadata);
        /**
         * Gets a value indicating whether the target object has the provided metadata key defined.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function hasOwnMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryHasOwnMetadata(metadataKey, target, propertyKey);
        }
        exporter("hasOwnMetadata", hasOwnMetadata);
        /**
         * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function getMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryGetMetadata(metadataKey, target, propertyKey);
        }
        exporter("getMetadata", getMetadata);
        /**
         * Gets the metadata value for the provided metadata key on the target object.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getOwnMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function getOwnMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryGetOwnMetadata(metadataKey, target, propertyKey);
        }
        exporter("getOwnMetadata", getOwnMetadata);
        /**
         * Gets the metadata keys defined on the target object or its prototype chain.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns An array of unique metadata keys.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getMetadataKeys(Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getMetadataKeys(Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getMetadataKeys(Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getMetadataKeys(Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getMetadataKeys(Example.prototype, "method");
         *
         */
        function getMetadataKeys(target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryMetadataKeys(target, propertyKey);
        }
        exporter("getMetadataKeys", getMetadataKeys);
        /**
         * Gets the unique metadata keys defined on the target object.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns An array of unique metadata keys.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.getOwnMetadataKeys(Example);
         *
         *     // property (on constructor)
         *     result = Reflect.getOwnMetadataKeys(Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.getOwnMetadataKeys(Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.getOwnMetadataKeys(Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.getOwnMetadataKeys(Example.prototype, "method");
         *
         */
        function getOwnMetadataKeys(target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryOwnMetadataKeys(target, propertyKey);
        }
        exporter("getOwnMetadataKeys", getOwnMetadataKeys);
        /**
         * Deletes the metadata entry from the target object with the provided key.
         * @param metadataKey A key used to store and retrieve metadata.
         * @param target The target object on which the metadata is defined.
         * @param propertyKey (Optional) The property key for the target.
         * @returns `true` if the metadata entry was found and deleted; otherwise, false.
         * @example
         *
         *     class Example {
         *         // property declarations are not part of ES6, though they are valid in TypeScript:
         *         // static staticProperty;
         *         // property;
         *
         *         constructor(p) { }
         *         static staticMethod(p) { }
         *         method(p) { }
         *     }
         *
         *     // constructor
         *     result = Reflect.deleteMetadata("custom:annotation", Example);
         *
         *     // property (on constructor)
         *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticProperty");
         *
         *     // property (on prototype)
         *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "property");
         *
         *     // method (on constructor)
         *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticMethod");
         *
         *     // method (on prototype)
         *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "method");
         *
         */
        function deleteMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
                throw new TypeError();
            if (!IsUndefined(propertyKey))
                propertyKey = ToPropertyKey(propertyKey);
            var metadataMap = GetOrCreateMetadataMap(target, propertyKey, /*Create*/ false);
            if (IsUndefined(metadataMap))
                return false;
            if (!metadataMap.delete(metadataKey))
                return false;
            if (metadataMap.size > 0)
                return true;
            var targetMetadata = Metadata.get(target);
            targetMetadata.delete(propertyKey);
            if (targetMetadata.size > 0)
                return true;
            Metadata.delete(target);
            return true;
        }
        exporter("deleteMetadata", deleteMetadata);
        function DecorateConstructor(decorators, target) {
            for (var i = decorators.length - 1; i >= 0; --i) {
                var decorator = decorators[i];
                var decorated = decorator(target);
                if (!IsUndefined(decorated) && !IsNull(decorated)) {
                    if (!IsConstructor(decorated))
                        throw new TypeError();
                    target = decorated;
                }
            }
            return target;
        }
        function DecorateProperty(decorators, target, propertyKey, descriptor) {
            for (var i = decorators.length - 1; i >= 0; --i) {
                var decorator = decorators[i];
                var decorated = decorator(target, propertyKey, descriptor);
                if (!IsUndefined(decorated) && !IsNull(decorated)) {
                    if (!IsObject(decorated))
                        throw new TypeError();
                    descriptor = decorated;
                }
            }
            return descriptor;
        }
        function GetOrCreateMetadataMap(O, P, Create) {
            var targetMetadata = Metadata.get(O);
            if (IsUndefined(targetMetadata)) {
                if (!Create)
                    return undefined;
                targetMetadata = new _Map();
                Metadata.set(O, targetMetadata);
            }
            var metadataMap = targetMetadata.get(P);
            if (IsUndefined(metadataMap)) {
                if (!Create)
                    return undefined;
                metadataMap = new _Map();
                targetMetadata.set(P, metadataMap);
            }
            return metadataMap;
        }
        // 3.1.1.1 OrdinaryHasMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinaryhasmetadata
        function OrdinaryHasMetadata(MetadataKey, O, P) {
            var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
            if (hasOwn)
                return true;
            var parent = OrdinaryGetPrototypeOf(O);
            if (!IsNull(parent))
                return OrdinaryHasMetadata(MetadataKey, parent, P);
            return false;
        }
        // 3.1.2.1 OrdinaryHasOwnMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinaryhasownmetadata
        function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
            var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
            if (IsUndefined(metadataMap))
                return false;
            return ToBoolean(metadataMap.has(MetadataKey));
        }
        // 3.1.3.1 OrdinaryGetMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarygetmetadata
        function OrdinaryGetMetadata(MetadataKey, O, P) {
            var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
            if (hasOwn)
                return OrdinaryGetOwnMetadata(MetadataKey, O, P);
            var parent = OrdinaryGetPrototypeOf(O);
            if (!IsNull(parent))
                return OrdinaryGetMetadata(MetadataKey, parent, P);
            return undefined;
        }
        // 3.1.4.1 OrdinaryGetOwnMetadata(MetadataKey, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarygetownmetadata
        function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
            var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
            if (IsUndefined(metadataMap))
                return undefined;
            return metadataMap.get(MetadataKey);
        }
        // 3.1.5.1 OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarydefineownmetadata
        function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
            var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ true);
            metadataMap.set(MetadataKey, MetadataValue);
        }
        // 3.1.6.1 OrdinaryMetadataKeys(O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinarymetadatakeys
        function OrdinaryMetadataKeys(O, P) {
            var ownKeys = OrdinaryOwnMetadataKeys(O, P);
            var parent = OrdinaryGetPrototypeOf(O);
            if (parent === null)
                return ownKeys;
            var parentKeys = OrdinaryMetadataKeys(parent, P);
            if (parentKeys.length <= 0)
                return ownKeys;
            if (ownKeys.length <= 0)
                return parentKeys;
            var set = new _Set();
            var keys = [];
            for (var _i = 0, ownKeys_1 = ownKeys; _i < ownKeys_1.length; _i++) {
                var key = ownKeys_1[_i];
                var hasKey = set.has(key);
                if (!hasKey) {
                    set.add(key);
                    keys.push(key);
                }
            }
            for (var _a = 0, parentKeys_1 = parentKeys; _a < parentKeys_1.length; _a++) {
                var key = parentKeys_1[_a];
                var hasKey = set.has(key);
                if (!hasKey) {
                    set.add(key);
                    keys.push(key);
                }
            }
            return keys;
        }
        // 3.1.7.1 OrdinaryOwnMetadataKeys(O, P)
        // https://rbuckton.github.io/reflect-metadata/#ordinaryownmetadatakeys
        function OrdinaryOwnMetadataKeys(O, P) {
            var keys = [];
            var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
            if (IsUndefined(metadataMap))
                return keys;
            var keysObj = metadataMap.keys();
            var iterator = GetIterator(keysObj);
            var k = 0;
            while (true) {
                var next = IteratorStep(iterator);
                if (!next) {
                    keys.length = k;
                    return keys;
                }
                var nextValue = IteratorValue(next);
                try {
                    keys[k] = nextValue;
                }
                catch (e) {
                    try {
                        IteratorClose(iterator);
                    }
                    finally {
                        throw e;
                    }
                }
                k++;
            }
        }
        // 6 ECMAScript Data Typ0es and Values
        // https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values
        function Type(x) {
            if (x === null)
                return 1 /* Null */;
            switch (typeof x) {
                case "undefined": return 0 /* Undefined */;
                case "boolean": return 2 /* Boolean */;
                case "string": return 3 /* String */;
                case "symbol": return 4 /* Symbol */;
                case "number": return 5 /* Number */;
                case "object": return x === null ? 1 /* Null */ : 6 /* Object */;
                default: return 6 /* Object */;
            }
        }
        // 6.1.1 The Undefined Type
        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-undefined-type
        function IsUndefined(x) {
            return x === undefined;
        }
        // 6.1.2 The Null Type
        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-null-type
        function IsNull(x) {
            return x === null;
        }
        // 6.1.5 The Symbol Type
        // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-symbol-type
        function IsSymbol(x) {
            return typeof x === "symbol";
        }
        // 6.1.7 The Object Type
        // https://tc39.github.io/ecma262/#sec-object-type
        function IsObject(x) {
            return typeof x === "object" ? x !== null : typeof x === "function";
        }
        // 7.1 Type Conversion
        // https://tc39.github.io/ecma262/#sec-type-conversion
        // 7.1.1 ToPrimitive(input [, PreferredType])
        // https://tc39.github.io/ecma262/#sec-toprimitive
        function ToPrimitive(input, PreferredType) {
            switch (Type(input)) {
                case 0 /* Undefined */: return input;
                case 1 /* Null */: return input;
                case 2 /* Boolean */: return input;
                case 3 /* String */: return input;
                case 4 /* Symbol */: return input;
                case 5 /* Number */: return input;
            }
            var hint = PreferredType === 3 /* String */ ? "string" : PreferredType === 5 /* Number */ ? "number" : "default";
            var exoticToPrim = GetMethod(input, toPrimitiveSymbol);
            if (exoticToPrim !== undefined) {
                var result = exoticToPrim.call(input, hint);
                if (IsObject(result))
                    throw new TypeError();
                return result;
            }
            return OrdinaryToPrimitive(input, hint === "default" ? "number" : hint);
        }
        // 7.1.1.1 OrdinaryToPrimitive(O, hint)
        // https://tc39.github.io/ecma262/#sec-ordinarytoprimitive
        function OrdinaryToPrimitive(O, hint) {
            if (hint === "string") {
                var toString_1 = O.toString;
                if (IsCallable(toString_1)) {
                    var result = toString_1.call(O);
                    if (!IsObject(result))
                        return result;
                }
                var valueOf = O.valueOf;
                if (IsCallable(valueOf)) {
                    var result = valueOf.call(O);
                    if (!IsObject(result))
                        return result;
                }
            }
            else {
                var valueOf = O.valueOf;
                if (IsCallable(valueOf)) {
                    var result = valueOf.call(O);
                    if (!IsObject(result))
                        return result;
                }
                var toString_2 = O.toString;
                if (IsCallable(toString_2)) {
                    var result = toString_2.call(O);
                    if (!IsObject(result))
                        return result;
                }
            }
            throw new TypeError();
        }
        // 7.1.2 ToBoolean(argument)
        // https://tc39.github.io/ecma262/2016/#sec-toboolean
        function ToBoolean(argument) {
            return !!argument;
        }
        // 7.1.12 ToString(argument)
        // https://tc39.github.io/ecma262/#sec-tostring
        function ToString(argument) {
            return "" + argument;
        }
        // 7.1.14 ToPropertyKey(argument)
        // https://tc39.github.io/ecma262/#sec-topropertykey
        function ToPropertyKey(argument) {
            var key = ToPrimitive(argument, 3 /* String */);
            if (IsSymbol(key))
                return key;
            return ToString(key);
        }
        // 7.2 Testing and Comparison Operations
        // https://tc39.github.io/ecma262/#sec-testing-and-comparison-operations
        // 7.2.2 IsArray(argument)
        // https://tc39.github.io/ecma262/#sec-isarray
        function IsArray(argument) {
            return Array.isArray
                ? Array.isArray(argument)
                : argument instanceof Object
                    ? argument instanceof Array
                    : Object.prototype.toString.call(argument) === "[object Array]";
        }
        // 7.2.3 IsCallable(argument)
        // https://tc39.github.io/ecma262/#sec-iscallable
        function IsCallable(argument) {
            // NOTE: This is an approximation as we cannot check for [[Call]] internal method.
            return typeof argument === "function";
        }
        // 7.2.4 IsConstructor(argument)
        // https://tc39.github.io/ecma262/#sec-isconstructor
        function IsConstructor(argument) {
            // NOTE: This is an approximation as we cannot check for [[Construct]] internal method.
            return typeof argument === "function";
        }
        // 7.2.7 IsPropertyKey(argument)
        // https://tc39.github.io/ecma262/#sec-ispropertykey
        function IsPropertyKey(argument) {
            switch (Type(argument)) {
                case 3 /* String */: return true;
                case 4 /* Symbol */: return true;
                default: return false;
            }
        }
        // 7.3 Operations on Objects
        // https://tc39.github.io/ecma262/#sec-operations-on-objects
        // 7.3.9 GetMethod(V, P)
        // https://tc39.github.io/ecma262/#sec-getmethod
        function GetMethod(V, P) {
            var func = V[P];
            if (func === undefined || func === null)
                return undefined;
            if (!IsCallable(func))
                throw new TypeError();
            return func;
        }
        // 7.4 Operations on Iterator Objects
        // https://tc39.github.io/ecma262/#sec-operations-on-iterator-objects
        function GetIterator(obj) {
            var method = GetMethod(obj, iteratorSymbol);
            if (!IsCallable(method))
                throw new TypeError(); // from Call
            var iterator = method.call(obj);
            if (!IsObject(iterator))
                throw new TypeError();
            return iterator;
        }
        // 7.4.4 IteratorValue(iterResult)
        // https://tc39.github.io/ecma262/2016/#sec-iteratorvalue
        function IteratorValue(iterResult) {
            return iterResult.value;
        }
        // 7.4.5 IteratorStep(iterator)
        // https://tc39.github.io/ecma262/#sec-iteratorstep
        function IteratorStep(iterator) {
            var result = iterator.next();
            return result.done ? false : result;
        }
        // 7.4.6 IteratorClose(iterator, completion)
        // https://tc39.github.io/ecma262/#sec-iteratorclose
        function IteratorClose(iterator) {
            var f = iterator["return"];
            if (f)
                f.call(iterator);
        }
        // 9.1 Ordinary Object Internal Methods and Internal Slots
        // https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots
        // 9.1.1.1 OrdinaryGetPrototypeOf(O)
        // https://tc39.github.io/ecma262/#sec-ordinarygetprototypeof
        function OrdinaryGetPrototypeOf(O) {
            var proto = Object.getPrototypeOf(O);
            if (typeof O !== "function" || O === functionPrototype)
                return proto;
            // TypeScript doesn't set __proto__ in ES5, as it's non-standard.
            // Try to determine the superclass constructor. Compatible implementations
            // must either set __proto__ on a subclass constructor to the superclass constructor,
            // or ensure each class has a valid `constructor` property on its prototype that
            // points back to the constructor.
            // If this is not the same as Function.[[Prototype]], then this is definately inherited.
            // This is the case when in ES6 or when using __proto__ in a compatible browser.
            if (proto !== functionPrototype)
                return proto;
            // If the super prototype is Object.prototype, null, or undefined, then we cannot determine the heritage.
            var prototype = O.prototype;
            var prototypeProto = prototype && Object.getPrototypeOf(prototype);
            if (prototypeProto == null || prototypeProto === Object.prototype)
                return proto;
            // If the constructor was not a function, then we cannot determine the heritage.
            var constructor = prototypeProto.constructor;
            if (typeof constructor !== "function")
                return proto;
            // If we have some kind of self-reference, then we cannot determine the heritage.
            if (constructor === O)
                return proto;
            // we have a pretty good guess at the heritage.
            return constructor;
        }
        // naive Map shim
        function CreateMapPolyfill() {
            var cacheSentinel = {};
            var arraySentinel = [];
            var MapIterator = /** @class */ (function () {
                function MapIterator(keys, values, selector) {
                    this._index = 0;
                    this._keys = keys;
                    this._values = values;
                    this._selector = selector;
                }
                MapIterator.prototype["@@iterator"] = function () { return this; };
                MapIterator.prototype[iteratorSymbol] = function () { return this; };
                MapIterator.prototype.next = function () {
                    var index = this._index;
                    if (index >= 0 && index < this._keys.length) {
                        var result = this._selector(this._keys[index], this._values[index]);
                        if (index + 1 >= this._keys.length) {
                            this._index = -1;
                            this._keys = arraySentinel;
                            this._values = arraySentinel;
                        }
                        else {
                            this._index++;
                        }
                        return { value: result, done: false };
                    }
                    return { value: undefined, done: true };
                };
                MapIterator.prototype.throw = function (error) {
                    if (this._index >= 0) {
                        this._index = -1;
                        this._keys = arraySentinel;
                        this._values = arraySentinel;
                    }
                    throw error;
                };
                MapIterator.prototype.return = function (value) {
                    if (this._index >= 0) {
                        this._index = -1;
                        this._keys = arraySentinel;
                        this._values = arraySentinel;
                    }
                    return { value: value, done: true };
                };
                return MapIterator;
            }());
            return /** @class */ (function () {
                function Map() {
                    this._keys = [];
                    this._values = [];
                    this._cacheKey = cacheSentinel;
                    this._cacheIndex = -2;
                }
                Object.defineProperty(Map.prototype, "size", {
                    get: function () { return this._keys.length; },
                    enumerable: true,
                    configurable: true
                });
                Map.prototype.has = function (key) { return this._find(key, /*insert*/ false) >= 0; };
                Map.prototype.get = function (key) {
                    var index = this._find(key, /*insert*/ false);
                    return index >= 0 ? this._values[index] : undefined;
                };
                Map.prototype.set = function (key, value) {
                    var index = this._find(key, /*insert*/ true);
                    this._values[index] = value;
                    return this;
                };
                Map.prototype.delete = function (key) {
                    var index = this._find(key, /*insert*/ false);
                    if (index >= 0) {
                        var size = this._keys.length;
                        for (var i = index + 1; i < size; i++) {
                            this._keys[i - 1] = this._keys[i];
                            this._values[i - 1] = this._values[i];
                        }
                        this._keys.length--;
                        this._values.length--;
                        if (key === this._cacheKey) {
                            this._cacheKey = cacheSentinel;
                            this._cacheIndex = -2;
                        }
                        return true;
                    }
                    return false;
                };
                Map.prototype.clear = function () {
                    this._keys.length = 0;
                    this._values.length = 0;
                    this._cacheKey = cacheSentinel;
                    this._cacheIndex = -2;
                };
                Map.prototype.keys = function () { return new MapIterator(this._keys, this._values, getKey); };
                Map.prototype.values = function () { return new MapIterator(this._keys, this._values, getValue); };
                Map.prototype.entries = function () { return new MapIterator(this._keys, this._values, getEntry); };
                Map.prototype["@@iterator"] = function () { return this.entries(); };
                Map.prototype[iteratorSymbol] = function () { return this.entries(); };
                Map.prototype._find = function (key, insert) {
                    if (this._cacheKey !== key) {
                        this._cacheIndex = this._keys.indexOf(this._cacheKey = key);
                    }
                    if (this._cacheIndex < 0 && insert) {
                        this._cacheIndex = this._keys.length;
                        this._keys.push(key);
                        this._values.push(undefined);
                    }
                    return this._cacheIndex;
                };
                return Map;
            }());
            function getKey(key, _) {
                return key;
            }
            function getValue(_, value) {
                return value;
            }
            function getEntry(key, value) {
                return [key, value];
            }
        }
        // naive Set shim
        function CreateSetPolyfill() {
            return /** @class */ (function () {
                function Set() {
                    this._map = new _Map();
                }
                Object.defineProperty(Set.prototype, "size", {
                    get: function () { return this._map.size; },
                    enumerable: true,
                    configurable: true
                });
                Set.prototype.has = function (value) { return this._map.has(value); };
                Set.prototype.add = function (value) { return this._map.set(value, value), this; };
                Set.prototype.delete = function (value) { return this._map.delete(value); };
                Set.prototype.clear = function () { this._map.clear(); };
                Set.prototype.keys = function () { return this._map.keys(); };
                Set.prototype.values = function () { return this._map.values(); };
                Set.prototype.entries = function () { return this._map.entries(); };
                Set.prototype["@@iterator"] = function () { return this.keys(); };
                Set.prototype[iteratorSymbol] = function () { return this.keys(); };
                return Set;
            }());
        }
        // naive WeakMap shim
        function CreateWeakMapPolyfill() {
            var UUID_SIZE = 16;
            var keys = HashMap.create();
            var rootKey = CreateUniqueKey();
            return /** @class */ (function () {
                function WeakMap() {
                    this._key = CreateUniqueKey();
                }
                WeakMap.prototype.has = function (target) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                    return table !== undefined ? HashMap.has(table, this._key) : false;
                };
                WeakMap.prototype.get = function (target) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                    return table !== undefined ? HashMap.get(table, this._key) : undefined;
                };
                WeakMap.prototype.set = function (target, value) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/ true);
                    table[this._key] = value;
                    return this;
                };
                WeakMap.prototype.delete = function (target) {
                    var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                    return table !== undefined ? delete table[this._key] : false;
                };
                WeakMap.prototype.clear = function () {
                    // NOTE: not a real clear, just makes the previous data unreachable
                    this._key = CreateUniqueKey();
                };
                return WeakMap;
            }());
            function CreateUniqueKey() {
                var key;
                do
                    key = "@@WeakMap@@" + CreateUUID();
                while (HashMap.has(keys, key));
                keys[key] = true;
                return key;
            }
            function GetOrCreateWeakMapTable(target, create) {
                if (!hasOwn.call(target, rootKey)) {
                    if (!create)
                        return undefined;
                    Object.defineProperty(target, rootKey, { value: HashMap.create() });
                }
                return target[rootKey];
            }
            function FillRandomBytes(buffer, size) {
                for (var i = 0; i < size; ++i)
                    buffer[i] = Math.random() * 0xff | 0;
                return buffer;
            }
            function GenRandomBytes(size) {
                if (typeof Uint8Array === "function") {
                    if (typeof crypto !== "undefined")
                        return crypto.getRandomValues(new Uint8Array(size));
                    if (typeof msCrypto !== "undefined")
                        return msCrypto.getRandomValues(new Uint8Array(size));
                    return FillRandomBytes(new Uint8Array(size), size);
                }
                return FillRandomBytes(new Array(size), size);
            }
            function CreateUUID() {
                var data = GenRandomBytes(UUID_SIZE);
                // mark as random - RFC 4122 § 4.4
                data[6] = data[6] & 0x4f | 0x40;
                data[8] = data[8] & 0xbf | 0x80;
                var result = "";
                for (var offset = 0; offset < UUID_SIZE; ++offset) {
                    var byte = data[offset];
                    if (offset === 4 || offset === 6 || offset === 8)
                        result += "-";
                    if (byte < 16)
                        result += "0";
                    result += byte.toString(16).toLowerCase();
                }
                return result;
            }
        }
        // uses a heuristic used by v8 and chakra to force an object into dictionary mode.
        function MakeDictionary(obj) {
            obj.__ = undefined;
            delete obj.__;
            return obj;
        }
    });
})(Reflect || (Reflect = {}));


/***/ }),

/***/ "./src/config/game-data.ts":
/*!*********************************!*\
  !*** ./src/config/game-data.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, exports) {

"use strict";

var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameFileName = exports.GameKey = void 0;
var GameKey;
(function (GameKey) {
    GameKey[GameKey["LeagueOfLegends"] = 5426] = "LeagueOfLegends";
    GameKey[GameKey["CS2"] = 22730] = "CS2";
    GameKey[GameKey["RocketLeague"] = 10798] = "RocketLeague";
    GameKey[GameKey["PUBG"] = 10906] = "PUBG";
    GameKey[GameKey["Fortnite"] = 21216] = "Fortnite";
    GameKey[GameKey["ApexLegends"] = 21566] = "ApexLegends";
    GameKey[GameKey["Valorant"] = 21640] = "Valorant";
    GameKey[GameKey["CSGO"] = 7764] = "CSGO";
})(GameKey = exports.GameKey || (exports.GameKey = {}));
exports.GameFileName = (_a = {},
    _a[GameKey.LeagueOfLegends] = 'League Of Legends',
    _a[GameKey.CS2] = 'Counter Strike 2',
    _a[GameKey.RocketLeague] = 'Rocket League',
    _a[GameKey.PUBG] = 'PUBG',
    _a[GameKey.Fortnite] = 'Fortnite',
    _a[GameKey.ApexLegends] = 'Apex Legends',
    _a[GameKey.Valorant] = 'Valorant',
    _a[GameKey.CSGO] = 'Counter Strike GO',
    _a);
var data = (_b = {},
    _b[GameKey.LeagueOfLegends] = {
        interestedInFeatures: [
            'summoner_info',
            'gameMode',
            'teams',
            'matchState',
            'kill',
            'death',
            'respawn',
            'assist',
            'minions',
            'level',
            'abilities',
            'announcer',
            'counters',
            'match_info',
            'damage',
            'heal',
            'live_client_data',
            'jungle_camps',
            'team_frames',
        ],
        description: 'LOL data',
    },
    _b[GameKey.CS2] = {
        interestedInFeatures: [
            'gep_internal',
            'match_info',
            'live_data',
        ],
        description: 'CS:GO data',
    },
    _b[GameKey.RocketLeague] = {
        interestedInFeatures: [
            'stats',
            'roster',
            'match',
            'me',
            'match_info',
            'death',
            'game_info',
        ],
        description: 'Rocket league data',
    },
    _b[GameKey.PUBG] = {
        interestedInFeatures: [
            'kill',
            'revived',
            'death',
            'killer',
            'match',
            'rank',
            'location',
            'me',
            'team',
            'phase',
            'map',
            'roster',
            'inventory',
            'match_info',
            'counters',
        ],
        description: 'PUBG data',
    },
    _b[GameKey.Fortnite] = {
        interestedInFeatures: [
            'kill',
            'killed',
            'killer',
            'revived',
            'death',
            'match',
            'rank',
            'me',
            'phase',
            'location',
            'roster',
            'team',
            'items',
            'counters',
            'match_info',
            'map',
        ],
        description: 'Fortnite data',
    },
    _b[GameKey.ApexLegends] = {
        interestedInFeatures: [
            'death',
            'kill',
            'match_state',
            'me',
            'revive',
            'team',
            'roster',
            'kill_feed',
            'rank',
            'match_summary',
            'location',
            'match_info',
            'victory',
            'damage',
            'inventory',
            'localization',
        ],
        description: 'Apex data',
    },
    _b[GameKey.Valorant] = {
        interestedInFeatures: [
            'game_info',
            'me',
            'match_info',
            'kill',
            'death',
            'gep_internal',
        ],
        description: 'Valorant data',
    },
    _b[GameKey.CSGO] = {
        interestedInFeatures: [
            'kill',
            'death',
            'assist',
            'headshot',
            'round_start',
            'match_start',
            'match_end',
            'team_round_win',
            'bomb_planted',
            'bomb_change',
            'reloading',
            'fired',
            'weapon_change',
            'weapon_acquired',
            'player_activity_change',
            'team_set',
            'info',
            'roster',
            'scene',
            'match_info',
            'replay',
            'counters',
            'mvp',
            'kill_feed',
            'scoreboard',
            'score',
        ],
        description: 'CS:GO data',
    },
    _b);
exports["default"] = data;


/***/ }),

/***/ "./src/environment/environment.ts":
/*!****************************************!*\
  !*** ./src/environment/environment.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.environment = void 0;
exports.environment = {
    url: 'http://localhost:3000',
};


/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Main = void 0;
__webpack_require__(/*! reflect-metadata */ "./node_modules/reflect-metadata/Reflect.js");
var tsyringe_1 = __webpack_require__(/*! tsyringe */ "./node_modules/tsyringe/dist/esm5/index.js");
var game_data_1 = __importDefault(__webpack_require__(/*! ./config/game-data */ "./src/config/game-data.ts"));
var gep_service_1 = __webpack_require__(/*! ./services/gep-service */ "./src/services/gep-service.ts");
var game_detection_service_1 = __webpack_require__(/*! ./services/game-detection-service */ "./src/services/game-detection-service.ts");
var gep_consumer_1 = __webpack_require__(/*! ./services/gep-consumer */ "./src/services/gep-consumer.ts");
var auth_service_1 = __webpack_require__(/*! ./services/auth-service */ "./src/services/auth-service.ts");
var Main = (function () {
    function Main(gepService, gepConsumer, gameDetectionService, authService) {
        var _this = this;
        var _a;
        this.gepService = gepService;
        this.gepConsumer = gepConsumer;
        this.gameDetectionService = gameDetectionService;
        this.authService = authService;
        this.loginButton = document.getElementById('discord-button');
        (_a = this.loginButton) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () {
            _this.authService.login();
        });
        this.init();
    }
    Main.prototype.init = function () {
        var _this = this;
        this.gameDetectionService.on('gameLaunched', function (gameLaunch) {
            console.log("Game was launched: ".concat(gameLaunch.name, " ").concat(gameLaunch.id));
            var gameConfig = game_data_1.default[gameLaunch.id];
            if (gameConfig) {
                _this.gepService.gameLaunchId = gameLaunch.id;
                _this.gepService.onGameLaunched(gameConfig.interestedInFeatures);
            }
        });
        this.gameDetectionService.on('gameClosed', function (gameClosed) {
            console.log("Game was closed: ".concat(gameClosed.name));
            _this.gepService.onGameClosed();
        });
        this.gameDetectionService.on('postGame', function (postGame) {
            console.log("Running post-game logic for game: ".concat(postGame.name));
        });
        this.gepService.on('gameEvent', this.gepConsumer.onNewGameEvent);
        this.gepService.on('infoUpdate', this.gepConsumer.onGameInfoUpdate);
        this.gepService.on('error', this.gepConsumer.onGEPError);
        this.gepService.on('gameEvent', this.gepService.onNewGameEvent);
        this.gepService.on('infoUpdate', this.gepService.onGameInfoUpdate);
        this.gameDetectionService.init();
    };
    Main = __decorate([
        (0, tsyringe_1.injectable)(),
        __metadata("design:paramtypes", [gep_service_1.GEPService,
            gep_consumer_1.GEPConsumer,
            game_detection_service_1.GameDetectionService,
            auth_service_1.AuthService])
    ], Main);
    return Main;
}());
exports.Main = Main;
tsyringe_1.container.resolve(Main);


/***/ }),

/***/ "./src/services/auth-service.ts":
/*!**************************************!*\
  !*** ./src/services/auth-service.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthService = void 0;
var tsyringe_1 = __webpack_require__(/*! tsyringe */ "./node_modules/tsyringe/dist/esm5/index.js");
var environment_1 = __webpack_require__(/*! ../environment/environment */ "./src/environment/environment.ts");
var AuthService = (function () {
    function AuthService() {
    }
    AuthService.prototype.getUser = function () { };
    AuthService.prototype.login = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4, fetch(environment_1.environment.url + '/auth/discord/login', {
                                method: 'GET',
                            })];
                    case 1:
                        response = _a.sent();
                        response.json().then(function (data) {
                            overwolf.utils.openUrlInDefaultBrowser(data.url);
                        });
                        return [3, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error:', error_1.message);
                        return [3, 3];
                    case 3: return [2];
                }
            });
        });
    };
    AuthService = __decorate([
        (0, tsyringe_1.injectable)(),
        __metadata("design:paramtypes", [])
    ], AuthService);
    return AuthService;
}());
exports.AuthService = AuthService;


/***/ }),

/***/ "./src/services/game-detection-service.ts":
/*!************************************************!*\
  !*** ./src/services/game-detection-service.ts ***!
  \************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameDetectionService = void 0;
var events_1 = __webpack_require__(/*! events */ "./node_modules/events/events.js");
var tsyringe_1 = __webpack_require__(/*! tsyringe */ "./node_modules/tsyringe/dist/esm5/index.js");
var GameDetectionService = (function (_super) {
    __extends(GameDetectionService, _super);
    function GameDetectionService() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._runningGame = undefined;
        return _this;
    }
    GameDetectionService.prototype.init = function () {
        var _this = this;
        overwolf.games.onGameInfoUpdated.addListener(function (update) {
            return _this.gameUpdated(update);
        });
        overwolf.games.getRunningGameInfo2(function (info) {
            var _a;
            if ((_a = info.gameInfo) === null || _a === void 0 ? void 0 : _a.isRunning)
                _this.gameLaunched(info.gameInfo, false);
        });
    };
    GameDetectionService.prototype.gameLaunched = function (gameInfo, freshLaunch) {
        if (freshLaunch && this._runningGame)
            throw new Error("A fresh launch was called, but a running game was already detected! Launched `".concat(gameInfo.title, "`, while `").concat(this._runningGame.name, "` was already running"));
        this._runningGame = {
            id: gameInfo.classId,
            name: gameInfo.title,
        };
        var gameLaunchedEvent = __assign(__assign({}, this._runningGame), { freshLaunch: freshLaunch });
        this.emit('gameLaunched', gameLaunchedEvent);
    };
    GameDetectionService.prototype.gameClosed = function (fullShutdown) {
        if (!this._runningGame)
            throw new Error('Cannot run `gameClosed` when no game is currently running!');
        var gameClosedEvent = __assign({}, this._runningGame);
        this._runningGame = undefined;
        this.emit('gameClosed', gameClosedEvent);
        if (fullShutdown) {
            var postGameEvent = __assign({}, gameClosedEvent);
            this.emit('postGame', postGameEvent);
        }
    };
    GameDetectionService.prototype.gameUpdated = function (updateEvent) {
        if (updateEvent.reason.includes("gameLaunched")) {
            if (this._runningGame) {
                this.gameClosed(false);
            }
            this.gameLaunched(updateEvent.gameInfo, true);
        }
        else if (updateEvent.reason.includes("gameTerminated")) {
            this.gameClosed(true);
        }
    };
    GameDetectionService.prototype.currentlyRunningGame = function () {
        return this._runningGame;
    };
    GameDetectionService = __decorate([
        (0, tsyringe_1.injectable)()
    ], GameDetectionService);
    return GameDetectionService;
}(events_1.EventEmitter));
exports.GameDetectionService = GameDetectionService;


/***/ }),

/***/ "./src/services/gep-consumer.ts":
/*!**************************************!*\
  !*** ./src/services/gep-consumer.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GEPConsumer = void 0;
var tsyringe_1 = __webpack_require__(/*! tsyringe */ "./node_modules/tsyringe/dist/esm5/index.js");
var GEPConsumer = (function () {
    function GEPConsumer() {
    }
    GEPConsumer.prototype.onGEPError = function (error) {
        console.error("GEP Error: ".concat(prettify(error)));
    };
    GEPConsumer.prototype.onGameInfoUpdate = function (info) {
        console.log("Game Info Changed: ".concat(prettify(info)));
    };
    GEPConsumer.prototype.onNewGameEvent = function (event) {
        console.log("Game Event Fired: ".concat(prettify(event)));
    };
    GEPConsumer = __decorate([
        (0, tsyringe_1.injectable)()
    ], GEPConsumer);
    return GEPConsumer;
}());
exports.GEPConsumer = GEPConsumer;
var prettify = function (data) {
    return JSON.stringify(data, undefined, 4);
};


/***/ }),

/***/ "./src/services/gep-service.ts":
/*!*************************************!*\
  !*** ./src/services/gep-service.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GEPService = void 0;
var events_1 = __webpack_require__(/*! events */ "./node_modules/events/events.js");
var tsyringe_1 = __webpack_require__(/*! tsyringe */ "./node_modules/tsyringe/dist/esm5/index.js");
var game_data_1 = __webpack_require__(/*! ../config/game-data */ "./src/config/game-data.ts");
var environment_1 = __webpack_require__(/*! ../environment/environment */ "./src/environment/environment.ts");
var GEPService = (function (_super) {
    __extends(GEPService, _super);
    function GEPService() {
        var _this = _super.call(this) || this;
        _this.events = [];
        _this.info = [];
        _this.gameLaunchId = null;
        _this.onErrorListener = _this.onErrorListener.bind(_this);
        _this.onInfoUpdateListener = _this.onInfoUpdateListener.bind(_this);
        _this.onGameEventListener = _this.onGameEventListener.bind(_this);
        return _this;
    }
    GEPService.prototype.saveToDataBase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var fileName, response, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        fileName = game_data_1.GameFileName[this.gameLaunchId];
                        return [4, fetch(environment_1.environment.url, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    data: { events: this.events, info: this.info, fileName: fileName ? fileName : null },
                                }),
                            })];
                    case 1:
                        response = _a.sent();
                        this.events = [];
                        this.info = [];
                        if (!!response.ok) return [3, 2];
                        console.error('Error saving to database:', response.statusText);
                        return [3, 4];
                    case 2: return [4, response.json()];
                    case 3:
                        result = _a.sent();
                        console.log('Data saved to database:', result);
                        _a.label = 4;
                    case 4: return [3, 6];
                    case 5:
                        error_1 = _a.sent();
                        this.events = [];
                        this.info = [];
                        console.error('Error:', error_1.message);
                        return [3, 6];
                    case 6: return [2];
                }
            });
        });
    };
    GEPService.prototype.onNewGameEvent = function (event) {
        switch (this.gameLaunchId) {
            case game_data_1.GameKey.ApexLegends:
                this.handleApexLegendsEvents(event);
                break;
            case game_data_1.GameKey.RocketLeague:
                this.handleRocketLeagueEvents(event);
                break;
            case game_data_1.GameKey.Fortnite:
                this.handleFortniteEvents(event);
                break;
            case game_data_1.GameKey.Valorant:
                this.handleValorantEvents(event);
                break;
            case game_data_1.GameKey.LeagueOfLegends:
                this.handleLeagueOfLegendsEvents(event);
                break;
            case game_data_1.GameKey.PUBG:
                this.handlePUBGEvents(event);
                break;
            case game_data_1.GameKey.CS2:
                this.handleCS2Events(event);
                break;
        }
    };
    GEPService.prototype.onGameInfoUpdate = function (info) {
        if (!info.info) {
            return;
        }
        switch (this.gameLaunchId) {
            case game_data_1.GameKey.RocketLeague:
                this.handleRocketLeagueInfo(info);
                break;
            case game_data_1.GameKey.Fortnite:
                this.handleFortniteInfo(info);
                break;
            case game_data_1.GameKey.Valorant:
                this.handleValorantInfo(info);
                break;
            case game_data_1.GameKey.LeagueOfLegends:
                this.handleLeagueOfLegendsInfo(info);
                break;
            case game_data_1.GameKey.PUBG:
                this.handlePUBGInfo(info);
                break;
        }
    };
    GEPService.prototype.handleApexLegendsEvents = function (event) {
        var killFeedEvent = event.events.find(function (item) { return item.name === 'kill_feed'; });
        if (killFeedEvent) {
            var killFeedEventDataParsed = JSON.parse(killFeedEvent.data);
            var resultData = {
                local_player_name: killFeedEventDataParsed.local_player_name,
                victimName: killFeedEventDataParsed.victimName,
                action: killFeedEventDataParsed.action,
            };
            this.events.push(resultData);
            return;
        }
        var matchEndEvent = event.events.find(function (item) { return item.name === 'match_end'; });
        if (matchEndEvent && this.events.length) {
            this.events.push({ name: matchEndEvent.name, data: { date: new Date() } });
            this.saveToDataBase();
        }
    };
    GEPService.prototype.handleRocketLeagueEvents = function (event) {
        var goalEvent = event.events.find(function (item) { return item.name === 'goal'; });
        if (goalEvent) {
            this.events.push(goalEvent);
            return;
        }
        var scoreEvent = event.events.find(function (item) { return item.name === 'score'; });
        if (scoreEvent) {
            this.events.push(scoreEvent);
            return;
        }
        var matchEndEvent = event.events.find(function (item) { return item.name === 'matchEnd'; });
        if (matchEndEvent && (this.info.length || this.events.length)) {
            this.events.push({ name: matchEndEvent.name, data: { date: new Date() } });
            this.saveToDataBase();
        }
    };
    GEPService.prototype.handleRocketLeagueInfo = function (info) {
        var _this = this;
        if (info.info.matchState &&
            (Object.prototype.hasOwnProperty.call(info.info.matchState, 'started') ||
                Object.prototype.hasOwnProperty.call(info.info.matchState, 'ended'))) {
            this.info.push({ matchState: info.info.matchState, data: { date: new Date() } });
        }
        if (info.info.playersInfo) {
            Object.keys(info.info.playersInfo).map(function (item) {
                if (item.match(/player([0-9]+)/gi)) {
                    _this.info.push(info.info);
                }
            });
        }
    };
    GEPService.prototype.handleFortniteEvents = function (event) {
        var killedEvent = event.events.find(function (item) { return item.name === 'killed'; });
        if (killedEvent) {
            this.events.push(killedEvent);
            return;
        }
        var deathEvent = event.events.find(function (item) { return item.name === 'death'; });
        if (deathEvent) {
            this.events.push(deathEvent);
            return;
        }
        var matchStartEvent = event.events.find(function (item) { return item.name === 'matchStart'; });
        if (matchStartEvent) {
            this.events.push({ name: matchStartEvent.name, data: { date: new Date() } });
            return;
        }
        var matchEndEvent = event.events.find(function (item) { return item.name === 'matchEnd'; });
        if (matchEndEvent && (this.info.length || this.events.length)) {
            this.events.push({ name: matchEndEvent.name, data: { date: new Date() } });
            this.saveToDataBase();
        }
    };
    GEPService.prototype.handleFortniteInfo = function (info) {
        if (info.info.match_info &&
            Object.prototype.hasOwnProperty.call(info.info.match_info, 'rank')) {
            this.info.push(info.info);
        }
    };
    GEPService.prototype.handleValorantEvents = function (event) {
        var matchStartEvent = event.events.find(function (item) { return item.name === 'match_start'; });
        if (matchStartEvent) {
            this.events.push({ name: matchStartEvent.name, data: { date: new Date() } });
            return;
        }
        var matchEndEvent = event.events.find(function (item) { return item.name === 'match_end'; });
        if (matchEndEvent && (this.info.length || this.events.length)) {
            this.events.push({ name: matchEndEvent.name, data: { date: new Date() } });
            this.saveToDataBase();
        }
    };
    GEPService.prototype.handleValorantInfo = function (info) {
        if (info.info.match_info &&
            Object.prototype.hasOwnProperty.call(info.info.match_info, 'kill_feed')) {
            this.info.push(info.info);
        }
    };
    GEPService.prototype.handleLeagueOfLegendsEvents = function (event) {
        var killEvent = event.events.find(function (item) { return item.name === 'kill'; });
        if (killEvent) {
            this.events.push(killEvent);
            return;
        }
        var deathEvent = event.events.find(function (item) { return item.name === 'death'; });
        if (deathEvent) {
            this.events.push(deathEvent);
            return;
        }
        var matchEndEvent = event.events.find(function (item) { return item.name === 'announcer'; });
        if (matchEndEvent &&
            (this.info.length || this.events.length) &&
            (matchEndEvent.data.includes('victory') ||
                matchEndEvent.data.includes('defeat'))) {
            this.events.push(matchEndEvent);
            this.saveToDataBase();
        }
    };
    GEPService.prototype.handleLeagueOfLegendsInfo = function (info) {
        if (info.info.live_client_data &&
            (Object.prototype.hasOwnProperty.call(info.info.live_client_data, 'all_players'))) {
            this.info.push(info.info);
        }
    };
    GEPService.prototype.handlePUBGEvents = function (event) {
        var killEvent = event.events.find(function (item) { return item.name === 'kill'; });
        if (killEvent) {
            this.events.push(killEvent);
            return;
        }
        var killerEvent = event.events.find(function (item) { return item.name === 'killer'; });
        if (killerEvent) {
            this.events.push(killerEvent);
            return;
        }
        var deathEvent = event.events.find(function (item) { return item.name === 'death'; });
        if (deathEvent) {
            this.events.push(deathEvent);
            return;
        }
        var matchStartEvent = event.events.find(function (item) { return item.name === 'matchStart'; });
        if (matchStartEvent) {
            this.events.push({ name: matchStartEvent.name, data: { date: new Date() } });
            return;
        }
        var matchSummaryEvent = event.events.find(function (item) { return item.name === 'matchSummary'; });
        if (matchSummaryEvent) {
            this.events.push(matchSummaryEvent);
            return;
        }
        var matchEndEvent = event.events.find(function (item) { return item.name === 'matchEnd'; });
        if (matchEndEvent && (this.info.length || this.events.length)) {
            this.events.push({ name: matchEndEvent.name, data: { date: new Date() } });
            this.saveToDataBase();
        }
    };
    GEPService.prototype.handlePUBGInfo = function (info) {
        if (info.info.match_info &&
            Object.prototype.hasOwnProperty.call(info.info.match_info, 'kills') ||
            Object.prototype.hasOwnProperty.call(info.info.match_info, 'headshots')) {
            this.info.push(info.info);
        }
    };
    GEPService.prototype.handleCS2Events = function (event) {
        var killEvent = event.events.find(function (item) { return item.name === 'kill'; });
        if (killEvent) {
            this.events.push(killEvent);
            return;
        }
        var deathEvent = event.events.find(function (item) { return item.name === 'death'; });
        if (deathEvent) {
            this.events.push(deathEvent);
            return;
        }
        var killFeedEvent = event.events.find(function (item) { return item.name === 'kill_feed'; });
        if (killFeedEvent) {
            this.events.push(killFeedEvent);
            return;
        }
        var matchStartEvent = event.events.find(function (item) { return item.name === 'match_start'; });
        if (matchStartEvent) {
            this.events.push({ name: matchStartEvent.name, data: { date: new Date() } });
            return;
        }
        var matchEndEvent = event.events.find(function (item) { return item.name === 'match_end'; });
        if (matchEndEvent && (this.info.length || this.events.length)) {
            this.events.push({ name: matchEndEvent.name, data: { date: new Date() } });
            this.saveToDataBase();
        }
    };
    GEPService.prototype.onErrorListener = function (error) {
        this.emit('error', error);
    };
    GEPService.prototype.onInfoUpdateListener = function (info) {
        this.tryEmit('infoUpdate', info);
    };
    GEPService.prototype.onGameEventListener = function (events) {
        this.tryEmit('gameEvent', events);
    };
    GEPService.prototype.tryEmit = function (event, value) {
        if (this.listenerCount(event)) {
            this.emit(event, value);
        }
        else {
            console.warn("Unhandled ".concat(event, ", with value ").concat(value));
        }
    };
    GEPService.prototype.onGameLaunched = function (requiredFeatures) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('Registering GEP listeners');
                this.registerEvents();
                if (requiredFeatures) {
                    console.log('Registering required features');
                    return [2, this.setRequiredFeatures(requiredFeatures, 10)];
                }
                console.log('GEP SDK detected, no need to set required features');
                return [2];
            });
        });
    };
    GEPService.prototype.onGameClosed = function () {
        console.log('Removing all GEP listeners');
        this.unregisterEvents();
    };
    GEPService.prototype.setRequiredFeatures = function (requiredFeatures, maximumRetries) {
        return __awaiter(this, void 0, void 0, function () {
            var _loop_1, this_1, i, state_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _loop_1 = function (i) {
                            var success_1, e_1;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 2, , 4]);
                                        return [4, this_1.trySetRequiredFeatures(requiredFeatures)];
                                    case 1:
                                        success_1 = _b.sent();
                                        console.log("Required features set: ".concat(success_1));
                                        if (success_1.length < requiredFeatures.length)
                                            console.warn("Could not set ".concat(requiredFeatures.filter(function (feature) { return !success_1.includes(feature); })));
                                        return [2, { value: success_1 }];
                                    case 2:
                                        e_1 = _b.sent();
                                        console.warn("Could not set required features: ".concat(JSON.stringify(e_1)));
                                        console.log('Retrying in 2 seconds');
                                        return [4, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                                    case 3:
                                        _b.sent();
                                        return [3, 4];
                                    case 4: return [2];
                                }
                            });
                        };
                        this_1 = this;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < maximumRetries)) return [3, 4];
                        return [5, _loop_1(i)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2, state_1.value];
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3, 1];
                    case 4: throw new Error('Aborting required features!');
                }
            });
        });
    };
    GEPService.prototype.trySetRequiredFeatures = function (requiredFeatures) {
        return __awaiter(this, void 0, void 0, function () {
            var registered, failed, promise;
            return __generator(this, function (_a) {
                promise = new Promise(function (resolve, reject) {
                    registered = resolve;
                    failed = reject;
                });
                overwolf.games.events.setRequiredFeatures(requiredFeatures, function (result) {
                    if (!result.success) {
                        return failed(result.error);
                    }
                    registered(result.supportedFeatures);
                });
                return [2, promise];
            });
        });
    };
    GEPService.prototype.registerEvents = function () {
        overwolf.games.events.onError.addListener(this.onErrorListener);
        overwolf.games.events.onInfoUpdates2.addListener(this.onInfoUpdateListener);
        overwolf.games.events.onNewEvents.addListener(this.onGameEventListener);
    };
    GEPService.prototype.unregisterEvents = function () {
        overwolf.games.events.onError.removeListener(this.onErrorListener);
        overwolf.games.events.onInfoUpdates2.removeListener(this.onInfoUpdateListener);
        overwolf.games.events.onNewEvents.removeListener(this.onGameEventListener);
    };
    GEPService = __decorate([
        (0, tsyringe_1.injectable)(),
        __metadata("design:paramtypes", [])
    ], GEPService);
    return GEPService;
}(events_1.EventEmitter));
exports.GEPService = GEPService;


/***/ }),

/***/ "./node_modules/tslib/tslib.es6.js":
/*!*****************************************!*\
  !*** ./node_modules/tslib/tslib.es6.js ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   __assign: function() { return /* binding */ __assign; },
/* harmony export */   __asyncDelegator: function() { return /* binding */ __asyncDelegator; },
/* harmony export */   __asyncGenerator: function() { return /* binding */ __asyncGenerator; },
/* harmony export */   __asyncValues: function() { return /* binding */ __asyncValues; },
/* harmony export */   __await: function() { return /* binding */ __await; },
/* harmony export */   __awaiter: function() { return /* binding */ __awaiter; },
/* harmony export */   __classPrivateFieldGet: function() { return /* binding */ __classPrivateFieldGet; },
/* harmony export */   __classPrivateFieldSet: function() { return /* binding */ __classPrivateFieldSet; },
/* harmony export */   __createBinding: function() { return /* binding */ __createBinding; },
/* harmony export */   __decorate: function() { return /* binding */ __decorate; },
/* harmony export */   __exportStar: function() { return /* binding */ __exportStar; },
/* harmony export */   __extends: function() { return /* binding */ __extends; },
/* harmony export */   __generator: function() { return /* binding */ __generator; },
/* harmony export */   __importDefault: function() { return /* binding */ __importDefault; },
/* harmony export */   __importStar: function() { return /* binding */ __importStar; },
/* harmony export */   __makeTemplateObject: function() { return /* binding */ __makeTemplateObject; },
/* harmony export */   __metadata: function() { return /* binding */ __metadata; },
/* harmony export */   __param: function() { return /* binding */ __param; },
/* harmony export */   __read: function() { return /* binding */ __read; },
/* harmony export */   __rest: function() { return /* binding */ __rest; },
/* harmony export */   __spread: function() { return /* binding */ __spread; },
/* harmony export */   __spreadArrays: function() { return /* binding */ __spreadArrays; },
/* harmony export */   __values: function() { return /* binding */ __values; }
/* harmony export */ });
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __createBinding(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}

function __exportStar(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) exports[p] = m[p];
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result.default = mod;
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
}

function __classPrivateFieldSet(receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/auto-injectable.js":
/*!***********************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/auto-injectable.js ***!
  \***********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _reflection_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reflection-helpers */ "./node_modules/tsyringe/dist/esm5/reflection-helpers.js");
/* harmony import */ var _dependency_container__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../dependency-container */ "./node_modules/tsyringe/dist/esm5/dependency-container.js");
/* harmony import */ var _providers_injection_token__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../providers/injection-token */ "./node_modules/tsyringe/dist/esm5/providers/injection-token.js");
/* harmony import */ var _error_helpers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../error-helpers */ "./node_modules/tsyringe/dist/esm5/error-helpers.js");





function autoInjectable() {
    return function (target) {
        var paramInfo = (0,_reflection_helpers__WEBPACK_IMPORTED_MODULE_0__.getParamInfo)(target);
        return (function (_super) {
            (0,tslib__WEBPACK_IMPORTED_MODULE_4__.__extends)(class_1, _super);
            function class_1() {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return _super.apply(this, (0,tslib__WEBPACK_IMPORTED_MODULE_4__.__spread)(args.concat(paramInfo.slice(args.length).map(function (type, index) {
                    var _a, _b, _c;
                    try {
                        if ((0,_providers_injection_token__WEBPACK_IMPORTED_MODULE_2__.isTokenDescriptor)(type)) {
                            if ((0,_providers_injection_token__WEBPACK_IMPORTED_MODULE_2__.isTransformDescriptor)(type)) {
                                return type.multiple
                                    ? (_a = _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance
                                        .resolve(type.transform)).transform.apply(_a, (0,tslib__WEBPACK_IMPORTED_MODULE_4__.__spread)([_dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.resolveAll(type.token)], type.transformArgs)) : (_b = _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance
                                    .resolve(type.transform)).transform.apply(_b, (0,tslib__WEBPACK_IMPORTED_MODULE_4__.__spread)([_dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.resolve(type.token)], type.transformArgs));
                            }
                            else {
                                return type.multiple
                                    ? _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.resolveAll(type.token)
                                    : _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.resolve(type.token);
                            }
                        }
                        else if ((0,_providers_injection_token__WEBPACK_IMPORTED_MODULE_2__.isTransformDescriptor)(type)) {
                            return (_c = _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance
                                .resolve(type.transform)).transform.apply(_c, (0,tslib__WEBPACK_IMPORTED_MODULE_4__.__spread)([_dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.resolve(type.token)], type.transformArgs));
                        }
                        return _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.resolve(type);
                    }
                    catch (e) {
                        var argIndex = index + args.length;
                        throw new Error((0,_error_helpers__WEBPACK_IMPORTED_MODULE_3__.formatErrorCtor)(target, argIndex, e));
                    }
                })))) || this;
            }
            return class_1;
        }(target));
    };
}
/* harmony default export */ __webpack_exports__["default"] = (autoInjectable);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/index.js":
/*!*************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/index.js ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   autoInjectable: function() { return /* reexport safe */ _auto_injectable__WEBPACK_IMPORTED_MODULE_0__["default"]; },
/* harmony export */   inject: function() { return /* reexport safe */ _inject__WEBPACK_IMPORTED_MODULE_1__["default"]; },
/* harmony export */   injectAll: function() { return /* reexport safe */ _inject_all__WEBPACK_IMPORTED_MODULE_5__["default"]; },
/* harmony export */   injectAllWithTransform: function() { return /* reexport safe */ _inject_all_with_transform__WEBPACK_IMPORTED_MODULE_6__["default"]; },
/* harmony export */   injectWithTransform: function() { return /* reexport safe */ _inject_with_transform__WEBPACK_IMPORTED_MODULE_7__["default"]; },
/* harmony export */   injectable: function() { return /* reexport safe */ _injectable__WEBPACK_IMPORTED_MODULE_2__["default"]; },
/* harmony export */   registry: function() { return /* reexport safe */ _registry__WEBPACK_IMPORTED_MODULE_3__["default"]; },
/* harmony export */   scoped: function() { return /* reexport safe */ _scoped__WEBPACK_IMPORTED_MODULE_8__["default"]; },
/* harmony export */   singleton: function() { return /* reexport safe */ _singleton__WEBPACK_IMPORTED_MODULE_4__["default"]; }
/* harmony export */ });
/* harmony import */ var _auto_injectable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./auto-injectable */ "./node_modules/tsyringe/dist/esm5/decorators/auto-injectable.js");
/* harmony import */ var _inject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./inject */ "./node_modules/tsyringe/dist/esm5/decorators/inject.js");
/* harmony import */ var _injectable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./injectable */ "./node_modules/tsyringe/dist/esm5/decorators/injectable.js");
/* harmony import */ var _registry__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./registry */ "./node_modules/tsyringe/dist/esm5/decorators/registry.js");
/* harmony import */ var _singleton__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./singleton */ "./node_modules/tsyringe/dist/esm5/decorators/singleton.js");
/* harmony import */ var _inject_all__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./inject-all */ "./node_modules/tsyringe/dist/esm5/decorators/inject-all.js");
/* harmony import */ var _inject_all_with_transform__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./inject-all-with-transform */ "./node_modules/tsyringe/dist/esm5/decorators/inject-all-with-transform.js");
/* harmony import */ var _inject_with_transform__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./inject-with-transform */ "./node_modules/tsyringe/dist/esm5/decorators/inject-with-transform.js");
/* harmony import */ var _scoped__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./scoped */ "./node_modules/tsyringe/dist/esm5/decorators/scoped.js");











/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/inject-all-with-transform.js":
/*!*********************************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/inject-all-with-transform.js ***!
  \*********************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _reflection_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reflection-helpers */ "./node_modules/tsyringe/dist/esm5/reflection-helpers.js");

function injectAllWithTransform(token, transformer) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var data = {
        token: token,
        multiple: true,
        transform: transformer,
        transformArgs: args
    };
    return (0,_reflection_helpers__WEBPACK_IMPORTED_MODULE_0__.defineInjectionTokenMetadata)(data);
}
/* harmony default export */ __webpack_exports__["default"] = (injectAllWithTransform);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/inject-all.js":
/*!******************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/inject-all.js ***!
  \******************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _reflection_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reflection-helpers */ "./node_modules/tsyringe/dist/esm5/reflection-helpers.js");

function injectAll(token) {
    var data = { token: token, multiple: true };
    return (0,_reflection_helpers__WEBPACK_IMPORTED_MODULE_0__.defineInjectionTokenMetadata)(data);
}
/* harmony default export */ __webpack_exports__["default"] = (injectAll);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/inject-with-transform.js":
/*!*****************************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/inject-with-transform.js ***!
  \*****************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _reflection_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reflection-helpers */ "./node_modules/tsyringe/dist/esm5/reflection-helpers.js");

function injectWithTransform(token, transformer) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return (0,_reflection_helpers__WEBPACK_IMPORTED_MODULE_0__.defineInjectionTokenMetadata)(token, {
        transformToken: transformer,
        args: args
    });
}
/* harmony default export */ __webpack_exports__["default"] = (injectWithTransform);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/inject.js":
/*!**************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/inject.js ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _reflection_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reflection-helpers */ "./node_modules/tsyringe/dist/esm5/reflection-helpers.js");

function inject(token) {
    return (0,_reflection_helpers__WEBPACK_IMPORTED_MODULE_0__.defineInjectionTokenMetadata)(token);
}
/* harmony default export */ __webpack_exports__["default"] = (inject);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/injectable.js":
/*!******************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/injectable.js ***!
  \******************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _reflection_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reflection-helpers */ "./node_modules/tsyringe/dist/esm5/reflection-helpers.js");
/* harmony import */ var _dependency_container__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../dependency-container */ "./node_modules/tsyringe/dist/esm5/dependency-container.js");


function injectable() {
    return function (target) {
        _dependency_container__WEBPACK_IMPORTED_MODULE_1__.typeInfo.set(target, (0,_reflection_helpers__WEBPACK_IMPORTED_MODULE_0__.getParamInfo)(target));
    };
}
/* harmony default export */ __webpack_exports__["default"] = (injectable);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/registry.js":
/*!****************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/registry.js ***!
  \****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _dependency_container__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../dependency-container */ "./node_modules/tsyringe/dist/esm5/dependency-container.js");


function registry(registrations) {
    if (registrations === void 0) { registrations = []; }
    return function (target) {
        registrations.forEach(function (_a) {
            var token = _a.token, options = _a.options, provider = (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__rest)(_a, ["token", "options"]);
            return _dependency_container__WEBPACK_IMPORTED_MODULE_0__.instance.register(token, provider, options);
        });
        return target;
    };
}
/* harmony default export */ __webpack_exports__["default"] = (registry);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/scoped.js":
/*!**************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/scoped.js ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ scoped; }
/* harmony export */ });
/* harmony import */ var _injectable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./injectable */ "./node_modules/tsyringe/dist/esm5/decorators/injectable.js");
/* harmony import */ var _dependency_container__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../dependency-container */ "./node_modules/tsyringe/dist/esm5/dependency-container.js");


function scoped(lifecycle, token) {
    return function (target) {
        (0,_injectable__WEBPACK_IMPORTED_MODULE_0__["default"])()(target);
        _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.register(token || target, target, {
            lifecycle: lifecycle
        });
    };
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/decorators/singleton.js":
/*!*****************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/decorators/singleton.js ***!
  \*****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _injectable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./injectable */ "./node_modules/tsyringe/dist/esm5/decorators/injectable.js");
/* harmony import */ var _dependency_container__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../dependency-container */ "./node_modules/tsyringe/dist/esm5/dependency-container.js");


function singleton() {
    return function (target) {
        (0,_injectable__WEBPACK_IMPORTED_MODULE_0__["default"])()(target);
        _dependency_container__WEBPACK_IMPORTED_MODULE_1__.instance.registerSingleton(target);
    };
}
/* harmony default export */ __webpack_exports__["default"] = (singleton);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/dependency-container.js":
/*!*****************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/dependency-container.js ***!
  \*****************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   instance: function() { return /* binding */ instance; },
/* harmony export */   typeInfo: function() { return /* binding */ typeInfo; }
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _providers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./providers */ "./node_modules/tsyringe/dist/esm5/providers/index.js");
/* harmony import */ var _providers_provider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./providers/provider */ "./node_modules/tsyringe/dist/esm5/providers/provider.js");
/* harmony import */ var _providers_injection_token__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./providers/injection-token */ "./node_modules/tsyringe/dist/esm5/providers/injection-token.js");
/* harmony import */ var _registry__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./registry */ "./node_modules/tsyringe/dist/esm5/registry.js");
/* harmony import */ var _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./types/lifecycle */ "./node_modules/tsyringe/dist/esm5/types/lifecycle.js");
/* harmony import */ var _resolution_context__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./resolution-context */ "./node_modules/tsyringe/dist/esm5/resolution-context.js");
/* harmony import */ var _error_helpers__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./error-helpers */ "./node_modules/tsyringe/dist/esm5/error-helpers.js");
/* harmony import */ var _lazy_helpers__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./lazy-helpers */ "./node_modules/tsyringe/dist/esm5/lazy-helpers.js");
/* harmony import */ var _types_disposable__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./types/disposable */ "./node_modules/tsyringe/dist/esm5/types/disposable.js");
/* harmony import */ var _interceptors__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./interceptors */ "./node_modules/tsyringe/dist/esm5/interceptors.js");











var typeInfo = new Map();
var InternalDependencyContainer = (function () {
    function InternalDependencyContainer(parent) {
        this.parent = parent;
        this._registry = new _registry__WEBPACK_IMPORTED_MODULE_3__["default"]();
        this.interceptors = new _interceptors__WEBPACK_IMPORTED_MODULE_9__["default"]();
        this.disposed = false;
        this.disposables = new Set();
    }
    InternalDependencyContainer.prototype.register = function (token, providerOrConstructor, options) {
        if (options === void 0) { options = { lifecycle: _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].Transient }; }
        this.ensureNotDisposed();
        var provider;
        if (!(0,_providers_provider__WEBPACK_IMPORTED_MODULE_1__.isProvider)(providerOrConstructor)) {
            provider = { useClass: providerOrConstructor };
        }
        else {
            provider = providerOrConstructor;
        }
        if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isTokenProvider)(provider)) {
            var path = [token];
            var tokenProvider = provider;
            while (tokenProvider != null) {
                var currentToken = tokenProvider.useToken;
                if (path.includes(currentToken)) {
                    throw new Error("Token registration cycle detected! " + (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__spread)(path, [currentToken]).join(" -> "));
                }
                path.push(currentToken);
                var registration = this._registry.get(currentToken);
                if (registration && (0,_providers__WEBPACK_IMPORTED_MODULE_0__.isTokenProvider)(registration.provider)) {
                    tokenProvider = registration.provider;
                }
                else {
                    tokenProvider = null;
                }
            }
        }
        if (options.lifecycle === _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].Singleton ||
            options.lifecycle == _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].ContainerScoped ||
            options.lifecycle == _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].ResolutionScoped) {
            if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isValueProvider)(provider) || (0,_providers__WEBPACK_IMPORTED_MODULE_0__.isFactoryProvider)(provider)) {
                throw new Error("Cannot use lifecycle \"" + _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"][options.lifecycle] + "\" with ValueProviders or FactoryProviders");
            }
        }
        this._registry.set(token, { provider: provider, options: options });
        return this;
    };
    InternalDependencyContainer.prototype.registerType = function (from, to) {
        this.ensureNotDisposed();
        if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isNormalToken)(to)) {
            return this.register(from, {
                useToken: to
            });
        }
        return this.register(from, {
            useClass: to
        });
    };
    InternalDependencyContainer.prototype.registerInstance = function (token, instance) {
        this.ensureNotDisposed();
        return this.register(token, {
            useValue: instance
        });
    };
    InternalDependencyContainer.prototype.registerSingleton = function (from, to) {
        this.ensureNotDisposed();
        if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isNormalToken)(from)) {
            if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isNormalToken)(to)) {
                return this.register(from, {
                    useToken: to
                }, { lifecycle: _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].Singleton });
            }
            else if (to) {
                return this.register(from, {
                    useClass: to
                }, { lifecycle: _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].Singleton });
            }
            throw new Error('Cannot register a type name as a singleton without a "to" token');
        }
        var useClass = from;
        if (to && !(0,_providers__WEBPACK_IMPORTED_MODULE_0__.isNormalToken)(to)) {
            useClass = to;
        }
        return this.register(from, {
            useClass: useClass
        }, { lifecycle: _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].Singleton });
    };
    InternalDependencyContainer.prototype.resolve = function (token, context) {
        if (context === void 0) { context = new _resolution_context__WEBPACK_IMPORTED_MODULE_5__["default"](); }
        this.ensureNotDisposed();
        var registration = this.getRegistration(token);
        if (!registration && (0,_providers__WEBPACK_IMPORTED_MODULE_0__.isNormalToken)(token)) {
            throw new Error("Attempted to resolve unregistered dependency token: \"" + token.toString() + "\"");
        }
        this.executePreResolutionInterceptor(token, "Single");
        if (registration) {
            var result = this.resolveRegistration(registration, context);
            this.executePostResolutionInterceptor(token, result, "Single");
            return result;
        }
        if ((0,_providers_injection_token__WEBPACK_IMPORTED_MODULE_2__.isConstructorToken)(token)) {
            var result = this.construct(token, context);
            this.executePostResolutionInterceptor(token, result, "Single");
            return result;
        }
        throw new Error("Attempted to construct an undefined constructor. Could mean a circular dependency problem. Try using `delay` function.");
    };
    InternalDependencyContainer.prototype.executePreResolutionInterceptor = function (token, resolutionType) {
        var e_1, _a;
        if (this.interceptors.preResolution.has(token)) {
            var remainingInterceptors = [];
            try {
                for (var _b = (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__values)(this.interceptors.preResolution.getAll(token)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var interceptor = _c.value;
                    if (interceptor.options.frequency != "Once") {
                        remainingInterceptors.push(interceptor);
                    }
                    interceptor.callback(token, resolutionType);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            this.interceptors.preResolution.setAll(token, remainingInterceptors);
        }
    };
    InternalDependencyContainer.prototype.executePostResolutionInterceptor = function (token, result, resolutionType) {
        var e_2, _a;
        if (this.interceptors.postResolution.has(token)) {
            var remainingInterceptors = [];
            try {
                for (var _b = (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__values)(this.interceptors.postResolution.getAll(token)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var interceptor = _c.value;
                    if (interceptor.options.frequency != "Once") {
                        remainingInterceptors.push(interceptor);
                    }
                    interceptor.callback(token, result, resolutionType);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            this.interceptors.postResolution.setAll(token, remainingInterceptors);
        }
    };
    InternalDependencyContainer.prototype.resolveRegistration = function (registration, context) {
        this.ensureNotDisposed();
        if (registration.options.lifecycle === _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].ResolutionScoped &&
            context.scopedResolutions.has(registration)) {
            return context.scopedResolutions.get(registration);
        }
        var isSingleton = registration.options.lifecycle === _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].Singleton;
        var isContainerScoped = registration.options.lifecycle === _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].ContainerScoped;
        var returnInstance = isSingleton || isContainerScoped;
        var resolved;
        if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isValueProvider)(registration.provider)) {
            resolved = registration.provider.useValue;
        }
        else if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isTokenProvider)(registration.provider)) {
            resolved = returnInstance
                ? registration.instance ||
                    (registration.instance = this.resolve(registration.provider.useToken, context))
                : this.resolve(registration.provider.useToken, context);
        }
        else if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isClassProvider)(registration.provider)) {
            resolved = returnInstance
                ? registration.instance ||
                    (registration.instance = this.construct(registration.provider.useClass, context))
                : this.construct(registration.provider.useClass, context);
        }
        else if ((0,_providers__WEBPACK_IMPORTED_MODULE_0__.isFactoryProvider)(registration.provider)) {
            resolved = registration.provider.useFactory(this);
        }
        else {
            resolved = this.construct(registration.provider, context);
        }
        if (registration.options.lifecycle === _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].ResolutionScoped) {
            context.scopedResolutions.set(registration, resolved);
        }
        return resolved;
    };
    InternalDependencyContainer.prototype.resolveAll = function (token, context) {
        var _this = this;
        if (context === void 0) { context = new _resolution_context__WEBPACK_IMPORTED_MODULE_5__["default"](); }
        this.ensureNotDisposed();
        var registrations = this.getAllRegistrations(token);
        if (!registrations && (0,_providers__WEBPACK_IMPORTED_MODULE_0__.isNormalToken)(token)) {
            throw new Error("Attempted to resolve unregistered dependency token: \"" + token.toString() + "\"");
        }
        this.executePreResolutionInterceptor(token, "All");
        if (registrations) {
            var result_1 = registrations.map(function (item) {
                return _this.resolveRegistration(item, context);
            });
            this.executePostResolutionInterceptor(token, result_1, "All");
            return result_1;
        }
        var result = [this.construct(token, context)];
        this.executePostResolutionInterceptor(token, result, "All");
        return result;
    };
    InternalDependencyContainer.prototype.isRegistered = function (token, recursive) {
        if (recursive === void 0) { recursive = false; }
        this.ensureNotDisposed();
        return (this._registry.has(token) ||
            (recursive &&
                (this.parent || false) &&
                this.parent.isRegistered(token, true)));
    };
    InternalDependencyContainer.prototype.reset = function () {
        this.ensureNotDisposed();
        this._registry.clear();
        this.interceptors.preResolution.clear();
        this.interceptors.postResolution.clear();
    };
    InternalDependencyContainer.prototype.clearInstances = function () {
        var e_3, _a;
        this.ensureNotDisposed();
        try {
            for (var _b = (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__values)(this._registry.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__read)(_c.value, 2), token = _d[0], registrations = _d[1];
                this._registry.setAll(token, registrations
                    .filter(function (registration) { return !(0,_providers__WEBPACK_IMPORTED_MODULE_0__.isValueProvider)(registration.provider); })
                    .map(function (registration) {
                    registration.instance = undefined;
                    return registration;
                }));
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
    };
    InternalDependencyContainer.prototype.createChildContainer = function () {
        var e_4, _a;
        this.ensureNotDisposed();
        var childContainer = new InternalDependencyContainer(this);
        try {
            for (var _b = (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__values)(this._registry.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__read)(_c.value, 2), token = _d[0], registrations = _d[1];
                if (registrations.some(function (_a) {
                    var options = _a.options;
                    return options.lifecycle === _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].ContainerScoped;
                })) {
                    childContainer._registry.setAll(token, registrations.map(function (registration) {
                        if (registration.options.lifecycle === _types_lifecycle__WEBPACK_IMPORTED_MODULE_4__["default"].ContainerScoped) {
                            return {
                                provider: registration.provider,
                                options: registration.options
                            };
                        }
                        return registration;
                    }));
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return childContainer;
    };
    InternalDependencyContainer.prototype.beforeResolution = function (token, callback, options) {
        if (options === void 0) { options = { frequency: "Always" }; }
        this.interceptors.preResolution.set(token, {
            callback: callback,
            options: options
        });
    };
    InternalDependencyContainer.prototype.afterResolution = function (token, callback, options) {
        if (options === void 0) { options = { frequency: "Always" }; }
        this.interceptors.postResolution.set(token, {
            callback: callback,
            options: options
        });
    };
    InternalDependencyContainer.prototype.dispose = function () {
        return (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__awaiter)(this, void 0, void 0, function () {
            var promises;
            return (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.disposed = true;
                        promises = [];
                        this.disposables.forEach(function (disposable) {
                            var maybePromise = disposable.dispose();
                            if (maybePromise) {
                                promises.push(maybePromise);
                            }
                        });
                        return [4, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    InternalDependencyContainer.prototype.getRegistration = function (token) {
        if (this.isRegistered(token)) {
            return this._registry.get(token);
        }
        if (this.parent) {
            return this.parent.getRegistration(token);
        }
        return null;
    };
    InternalDependencyContainer.prototype.getAllRegistrations = function (token) {
        if (this.isRegistered(token)) {
            return this._registry.getAll(token);
        }
        if (this.parent) {
            return this.parent.getAllRegistrations(token);
        }
        return null;
    };
    InternalDependencyContainer.prototype.construct = function (ctor, context) {
        var _this = this;
        if (ctor instanceof _lazy_helpers__WEBPACK_IMPORTED_MODULE_7__.DelayedConstructor) {
            return ctor.createProxy(function (target) {
                return _this.resolve(target, context);
            });
        }
        var instance = (function () {
            var paramInfo = typeInfo.get(ctor);
            if (!paramInfo || paramInfo.length === 0) {
                if (ctor.length === 0) {
                    return new ctor();
                }
                else {
                    throw new Error("TypeInfo not known for \"" + ctor.name + "\"");
                }
            }
            var params = paramInfo.map(_this.resolveParams(context, ctor));
            return new (ctor.bind.apply(ctor, (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__spread)([void 0], params)))();
        })();
        if ((0,_types_disposable__WEBPACK_IMPORTED_MODULE_8__.isDisposable)(instance)) {
            this.disposables.add(instance);
        }
        return instance;
    };
    InternalDependencyContainer.prototype.resolveParams = function (context, ctor) {
        var _this = this;
        return function (param, idx) {
            var _a, _b, _c;
            try {
                if ((0,_providers_injection_token__WEBPACK_IMPORTED_MODULE_2__.isTokenDescriptor)(param)) {
                    if ((0,_providers_injection_token__WEBPACK_IMPORTED_MODULE_2__.isTransformDescriptor)(param)) {
                        return param.multiple
                            ? (_a = _this.resolve(param.transform)).transform.apply(_a, (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__spread)([_this.resolveAll(param.token)], param.transformArgs)) : (_b = _this.resolve(param.transform)).transform.apply(_b, (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__spread)([_this.resolve(param.token, context)], param.transformArgs));
                    }
                    else {
                        return param.multiple
                            ? _this.resolveAll(param.token)
                            : _this.resolve(param.token, context);
                    }
                }
                else if ((0,_providers_injection_token__WEBPACK_IMPORTED_MODULE_2__.isTransformDescriptor)(param)) {
                    return (_c = _this.resolve(param.transform, context)).transform.apply(_c, (0,tslib__WEBPACK_IMPORTED_MODULE_10__.__spread)([_this.resolve(param.token, context)], param.transformArgs));
                }
                return _this.resolve(param, context);
            }
            catch (e) {
                throw new Error((0,_error_helpers__WEBPACK_IMPORTED_MODULE_6__.formatErrorCtor)(ctor, idx, e));
            }
        };
    };
    InternalDependencyContainer.prototype.ensureNotDisposed = function () {
        if (this.disposed) {
            throw new Error("This container has been disposed, you cannot interact with a disposed container");
        }
    };
    return InternalDependencyContainer;
}());
var instance = new InternalDependencyContainer();
/* harmony default export */ __webpack_exports__["default"] = (instance);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/error-helpers.js":
/*!**********************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/error-helpers.js ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   formatErrorCtor: function() { return /* binding */ formatErrorCtor; }
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");

function formatDependency(params, idx) {
    if (params === null) {
        return "at position #" + idx;
    }
    var argName = params.split(",")[idx].trim();
    return "\"" + argName + "\" at position #" + idx;
}
function composeErrorMessage(msg, e, indent) {
    if (indent === void 0) { indent = "    "; }
    return (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spread)([msg], e.message.split("\n").map(function (l) { return indent + l; })).join("\n");
}
function formatErrorCtor(ctor, paramIdx, error) {
    var _a = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__read)(ctor.toString().match(/constructor\(([\w, ]+)\)/) || [], 2), _b = _a[1], params = _b === void 0 ? null : _b;
    var dep = formatDependency(params, paramIdx);
    return composeErrorMessage("Cannot inject the dependency " + dep + " of \"" + ctor.name + "\" constructor. Reason:", error);
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/factories/index.js":
/*!************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/factories/index.js ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   instanceCachingFactory: function() { return /* reexport safe */ _instance_caching_factory__WEBPACK_IMPORTED_MODULE_0__["default"]; },
/* harmony export */   instancePerContainerCachingFactory: function() { return /* reexport safe */ _instance_per_container_caching_factory__WEBPACK_IMPORTED_MODULE_1__["default"]; },
/* harmony export */   predicateAwareClassFactory: function() { return /* reexport safe */ _predicate_aware_class_factory__WEBPACK_IMPORTED_MODULE_2__["default"]; }
/* harmony export */ });
/* harmony import */ var _instance_caching_factory__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./instance-caching-factory */ "./node_modules/tsyringe/dist/esm5/factories/instance-caching-factory.js");
/* harmony import */ var _instance_per_container_caching_factory__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./instance-per-container-caching-factory */ "./node_modules/tsyringe/dist/esm5/factories/instance-per-container-caching-factory.js");
/* harmony import */ var _predicate_aware_class_factory__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./predicate-aware-class-factory */ "./node_modules/tsyringe/dist/esm5/factories/predicate-aware-class-factory.js");





/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/factories/instance-caching-factory.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/factories/instance-caching-factory.js ***!
  \*******************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ instanceCachingFactory; }
/* harmony export */ });
function instanceCachingFactory(factoryFunc) {
    var instance;
    return function (dependencyContainer) {
        if (instance == undefined) {
            instance = factoryFunc(dependencyContainer);
        }
        return instance;
    };
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/factories/instance-per-container-caching-factory.js":
/*!*********************************************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/factories/instance-per-container-caching-factory.js ***!
  \*********************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ instancePerContainerCachingFactory; }
/* harmony export */ });
function instancePerContainerCachingFactory(factoryFunc) {
    var cache = new WeakMap();
    return function (dependencyContainer) {
        var instance = cache.get(dependencyContainer);
        if (instance == undefined) {
            instance = factoryFunc(dependencyContainer);
            cache.set(dependencyContainer, instance);
        }
        return instance;
    };
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/factories/predicate-aware-class-factory.js":
/*!************************************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/factories/predicate-aware-class-factory.js ***!
  \************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ predicateAwareClassFactory; }
/* harmony export */ });
function predicateAwareClassFactory(predicate, trueConstructor, falseConstructor, useCaching) {
    if (useCaching === void 0) { useCaching = true; }
    var instance;
    var previousPredicate;
    return function (dependencyContainer) {
        var currentPredicate = predicate(dependencyContainer);
        if (!useCaching || previousPredicate !== currentPredicate) {
            if ((previousPredicate = currentPredicate)) {
                instance = dependencyContainer.resolve(trueConstructor);
            }
            else {
                instance = dependencyContainer.resolve(falseConstructor);
            }
        }
        return instance;
    };
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/index.js":
/*!**************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/index.js ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Lifecycle: function() { return /* reexport safe */ _types__WEBPACK_IMPORTED_MODULE_0__.Lifecycle; },
/* harmony export */   autoInjectable: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.autoInjectable; },
/* harmony export */   container: function() { return /* reexport safe */ _dependency_container__WEBPACK_IMPORTED_MODULE_5__.instance; },
/* harmony export */   delay: function() { return /* reexport safe */ _lazy_helpers__WEBPACK_IMPORTED_MODULE_4__.delay; },
/* harmony export */   inject: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.inject; },
/* harmony export */   injectAll: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.injectAll; },
/* harmony export */   injectAllWithTransform: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.injectAllWithTransform; },
/* harmony export */   injectWithTransform: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.injectWithTransform; },
/* harmony export */   injectable: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.injectable; },
/* harmony export */   instanceCachingFactory: function() { return /* reexport safe */ _factories__WEBPACK_IMPORTED_MODULE_2__.instanceCachingFactory; },
/* harmony export */   instancePerContainerCachingFactory: function() { return /* reexport safe */ _factories__WEBPACK_IMPORTED_MODULE_2__.instancePerContainerCachingFactory; },
/* harmony export */   isClassProvider: function() { return /* reexport safe */ _providers__WEBPACK_IMPORTED_MODULE_3__.isClassProvider; },
/* harmony export */   isFactoryProvider: function() { return /* reexport safe */ _providers__WEBPACK_IMPORTED_MODULE_3__.isFactoryProvider; },
/* harmony export */   isNormalToken: function() { return /* reexport safe */ _providers__WEBPACK_IMPORTED_MODULE_3__.isNormalToken; },
/* harmony export */   isTokenProvider: function() { return /* reexport safe */ _providers__WEBPACK_IMPORTED_MODULE_3__.isTokenProvider; },
/* harmony export */   isValueProvider: function() { return /* reexport safe */ _providers__WEBPACK_IMPORTED_MODULE_3__.isValueProvider; },
/* harmony export */   predicateAwareClassFactory: function() { return /* reexport safe */ _factories__WEBPACK_IMPORTED_MODULE_2__.predicateAwareClassFactory; },
/* harmony export */   registry: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.registry; },
/* harmony export */   scoped: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.scoped; },
/* harmony export */   singleton: function() { return /* reexport safe */ _decorators__WEBPACK_IMPORTED_MODULE_1__.singleton; }
/* harmony export */ });
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./types */ "./node_modules/tsyringe/dist/esm5/types/index.js");
/* harmony import */ var _decorators__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./decorators */ "./node_modules/tsyringe/dist/esm5/decorators/index.js");
/* harmony import */ var _factories__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./factories */ "./node_modules/tsyringe/dist/esm5/factories/index.js");
/* harmony import */ var _providers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./providers */ "./node_modules/tsyringe/dist/esm5/providers/index.js");
/* harmony import */ var _lazy_helpers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./lazy-helpers */ "./node_modules/tsyringe/dist/esm5/lazy-helpers.js");
/* harmony import */ var _dependency_container__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./dependency-container */ "./node_modules/tsyringe/dist/esm5/dependency-container.js");
if (typeof Reflect === "undefined" || !Reflect.getMetadata) {
    throw new Error("tsyringe requires a reflect polyfill. Please add 'import \"reflect-metadata\"' to the top of your entry point.");
}








/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/interceptors.js":
/*!*********************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/interceptors.js ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PostResolutionInterceptors: function() { return /* binding */ PostResolutionInterceptors; },
/* harmony export */   PreResolutionInterceptors: function() { return /* binding */ PreResolutionInterceptors; }
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _registry_base__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./registry-base */ "./node_modules/tsyringe/dist/esm5/registry-base.js");


var PreResolutionInterceptors = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__extends)(PreResolutionInterceptors, _super);
    function PreResolutionInterceptors() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PreResolutionInterceptors;
}(_registry_base__WEBPACK_IMPORTED_MODULE_0__["default"]));

var PostResolutionInterceptors = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__extends)(PostResolutionInterceptors, _super);
    function PostResolutionInterceptors() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PostResolutionInterceptors;
}(_registry_base__WEBPACK_IMPORTED_MODULE_0__["default"]));

var Interceptors = (function () {
    function Interceptors() {
        this.preResolution = new PreResolutionInterceptors();
        this.postResolution = new PostResolutionInterceptors();
    }
    return Interceptors;
}());
/* harmony default export */ __webpack_exports__["default"] = (Interceptors);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/lazy-helpers.js":
/*!*********************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/lazy-helpers.js ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DelayedConstructor: function() { return /* binding */ DelayedConstructor; },
/* harmony export */   delay: function() { return /* binding */ delay; }
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");

var DelayedConstructor = (function () {
    function DelayedConstructor(wrap) {
        this.wrap = wrap;
        this.reflectMethods = [
            "get",
            "getPrototypeOf",
            "setPrototypeOf",
            "getOwnPropertyDescriptor",
            "defineProperty",
            "has",
            "set",
            "deleteProperty",
            "apply",
            "construct",
            "ownKeys"
        ];
    }
    DelayedConstructor.prototype.createProxy = function (createObject) {
        var _this = this;
        var target = {};
        var init = false;
        var value;
        var delayedObject = function () {
            if (!init) {
                value = createObject(_this.wrap());
                init = true;
            }
            return value;
        };
        return new Proxy(target, this.createHandler(delayedObject));
    };
    DelayedConstructor.prototype.createHandler = function (delayedObject) {
        var handler = {};
        var install = function (name) {
            handler[name] = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                args[0] = delayedObject();
                var method = Reflect[name];
                return method.apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spread)(args));
            };
        };
        this.reflectMethods.forEach(install);
        return handler;
    };
    return DelayedConstructor;
}());

function delay(wrappedConstructor) {
    if (typeof wrappedConstructor === "undefined") {
        throw new Error("Attempt to `delay` undefined. Constructor must be wrapped in a callback");
    }
    return new DelayedConstructor(wrappedConstructor);
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/providers/class-provider.js":
/*!*********************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/providers/class-provider.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isClassProvider: function() { return /* binding */ isClassProvider; }
/* harmony export */ });
function isClassProvider(provider) {
    return !!provider.useClass;
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/providers/factory-provider.js":
/*!***********************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/providers/factory-provider.js ***!
  \***********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isFactoryProvider: function() { return /* binding */ isFactoryProvider; }
/* harmony export */ });
function isFactoryProvider(provider) {
    return !!provider.useFactory;
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/providers/index.js":
/*!************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/providers/index.js ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isClassProvider: function() { return /* reexport safe */ _class_provider__WEBPACK_IMPORTED_MODULE_0__.isClassProvider; },
/* harmony export */   isFactoryProvider: function() { return /* reexport safe */ _factory_provider__WEBPACK_IMPORTED_MODULE_1__.isFactoryProvider; },
/* harmony export */   isNormalToken: function() { return /* reexport safe */ _injection_token__WEBPACK_IMPORTED_MODULE_2__.isNormalToken; },
/* harmony export */   isTokenProvider: function() { return /* reexport safe */ _token_provider__WEBPACK_IMPORTED_MODULE_3__.isTokenProvider; },
/* harmony export */   isValueProvider: function() { return /* reexport safe */ _value_provider__WEBPACK_IMPORTED_MODULE_4__.isValueProvider; }
/* harmony export */ });
/* harmony import */ var _class_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./class-provider */ "./node_modules/tsyringe/dist/esm5/providers/class-provider.js");
/* harmony import */ var _factory_provider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./factory-provider */ "./node_modules/tsyringe/dist/esm5/providers/factory-provider.js");
/* harmony import */ var _injection_token__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./injection-token */ "./node_modules/tsyringe/dist/esm5/providers/injection-token.js");
/* harmony import */ var _token_provider__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./token-provider */ "./node_modules/tsyringe/dist/esm5/providers/token-provider.js");
/* harmony import */ var _value_provider__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./value-provider */ "./node_modules/tsyringe/dist/esm5/providers/value-provider.js");







/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/providers/injection-token.js":
/*!**********************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/providers/injection-token.js ***!
  \**********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isConstructorToken: function() { return /* binding */ isConstructorToken; },
/* harmony export */   isNormalToken: function() { return /* binding */ isNormalToken; },
/* harmony export */   isTokenDescriptor: function() { return /* binding */ isTokenDescriptor; },
/* harmony export */   isTransformDescriptor: function() { return /* binding */ isTransformDescriptor; }
/* harmony export */ });
/* harmony import */ var _lazy_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lazy-helpers */ "./node_modules/tsyringe/dist/esm5/lazy-helpers.js");

function isNormalToken(token) {
    return typeof token === "string" || typeof token === "symbol";
}
function isTokenDescriptor(descriptor) {
    return (typeof descriptor === "object" &&
        "token" in descriptor &&
        "multiple" in descriptor);
}
function isTransformDescriptor(descriptor) {
    return (typeof descriptor === "object" &&
        "token" in descriptor &&
        "transform" in descriptor);
}
function isConstructorToken(token) {
    return typeof token === "function" || token instanceof _lazy_helpers__WEBPACK_IMPORTED_MODULE_0__.DelayedConstructor;
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/providers/provider.js":
/*!***************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/providers/provider.js ***!
  \***************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isProvider: function() { return /* binding */ isProvider; }
/* harmony export */ });
/* harmony import */ var _class_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./class-provider */ "./node_modules/tsyringe/dist/esm5/providers/class-provider.js");
/* harmony import */ var _value_provider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./value-provider */ "./node_modules/tsyringe/dist/esm5/providers/value-provider.js");
/* harmony import */ var _token_provider__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./token-provider */ "./node_modules/tsyringe/dist/esm5/providers/token-provider.js");
/* harmony import */ var _factory_provider__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./factory-provider */ "./node_modules/tsyringe/dist/esm5/providers/factory-provider.js");




function isProvider(provider) {
    return ((0,_class_provider__WEBPACK_IMPORTED_MODULE_0__.isClassProvider)(provider) ||
        (0,_value_provider__WEBPACK_IMPORTED_MODULE_1__.isValueProvider)(provider) ||
        (0,_token_provider__WEBPACK_IMPORTED_MODULE_2__.isTokenProvider)(provider) ||
        (0,_factory_provider__WEBPACK_IMPORTED_MODULE_3__.isFactoryProvider)(provider));
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/providers/token-provider.js":
/*!*********************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/providers/token-provider.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isTokenProvider: function() { return /* binding */ isTokenProvider; }
/* harmony export */ });
function isTokenProvider(provider) {
    return !!provider.useToken;
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/providers/value-provider.js":
/*!*********************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/providers/value-provider.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isValueProvider: function() { return /* binding */ isValueProvider; }
/* harmony export */ });
function isValueProvider(provider) {
    return provider.useValue != undefined;
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/reflection-helpers.js":
/*!***************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/reflection-helpers.js ***!
  \***************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   INJECTION_TOKEN_METADATA_KEY: function() { return /* binding */ INJECTION_TOKEN_METADATA_KEY; },
/* harmony export */   defineInjectionTokenMetadata: function() { return /* binding */ defineInjectionTokenMetadata; },
/* harmony export */   getParamInfo: function() { return /* binding */ getParamInfo; }
/* harmony export */ });
var INJECTION_TOKEN_METADATA_KEY = "injectionTokens";
function getParamInfo(target) {
    var params = Reflect.getMetadata("design:paramtypes", target) || [];
    var injectionTokens = Reflect.getOwnMetadata(INJECTION_TOKEN_METADATA_KEY, target) || {};
    Object.keys(injectionTokens).forEach(function (key) {
        params[+key] = injectionTokens[key];
    });
    return params;
}
function defineInjectionTokenMetadata(data, transform) {
    return function (target, _propertyKey, parameterIndex) {
        var descriptors = Reflect.getOwnMetadata(INJECTION_TOKEN_METADATA_KEY, target) || {};
        descriptors[parameterIndex] = transform
            ? {
                token: data,
                transform: transform.transformToken,
                transformArgs: transform.args || []
            }
            : data;
        Reflect.defineMetadata(INJECTION_TOKEN_METADATA_KEY, descriptors, target);
    };
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/registry-base.js":
/*!**********************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/registry-base.js ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var RegistryBase = (function () {
    function RegistryBase() {
        this._registryMap = new Map();
    }
    RegistryBase.prototype.entries = function () {
        return this._registryMap.entries();
    };
    RegistryBase.prototype.getAll = function (key) {
        this.ensure(key);
        return this._registryMap.get(key);
    };
    RegistryBase.prototype.get = function (key) {
        this.ensure(key);
        var value = this._registryMap.get(key);
        return value[value.length - 1] || null;
    };
    RegistryBase.prototype.set = function (key, value) {
        this.ensure(key);
        this._registryMap.get(key).push(value);
    };
    RegistryBase.prototype.setAll = function (key, value) {
        this._registryMap.set(key, value);
    };
    RegistryBase.prototype.has = function (key) {
        this.ensure(key);
        return this._registryMap.get(key).length > 0;
    };
    RegistryBase.prototype.clear = function () {
        this._registryMap.clear();
    };
    RegistryBase.prototype.ensure = function (key) {
        if (!this._registryMap.has(key)) {
            this._registryMap.set(key, []);
        }
    };
    return RegistryBase;
}());
/* harmony default export */ __webpack_exports__["default"] = (RegistryBase);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/registry.js":
/*!*****************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/registry.js ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _registry_base__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./registry-base */ "./node_modules/tsyringe/dist/esm5/registry-base.js");


var Registry = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__extends)(Registry, _super);
    function Registry() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Registry;
}(_registry_base__WEBPACK_IMPORTED_MODULE_0__["default"]));
/* harmony default export */ __webpack_exports__["default"] = (Registry);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/resolution-context.js":
/*!***************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/resolution-context.js ***!
  \***************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var ResolutionContext = (function () {
    function ResolutionContext() {
        this.scopedResolutions = new Map();
    }
    return ResolutionContext;
}());
/* harmony default export */ __webpack_exports__["default"] = (ResolutionContext);


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/types/disposable.js":
/*!*************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/types/disposable.js ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isDisposable: function() { return /* binding */ isDisposable; }
/* harmony export */ });
function isDisposable(value) {
    if (typeof value.dispose !== "function")
        return false;
    var disposeFun = value.dispose;
    if (disposeFun.length > 0) {
        return false;
    }
    return true;
}


/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/types/index.js":
/*!********************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/types/index.js ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Lifecycle: function() { return /* reexport safe */ _lifecycle__WEBPACK_IMPORTED_MODULE_0__["default"]; }
/* harmony export */ });
/* harmony import */ var _lifecycle__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./lifecycle */ "./node_modules/tsyringe/dist/esm5/types/lifecycle.js");



/***/ }),

/***/ "./node_modules/tsyringe/dist/esm5/types/lifecycle.js":
/*!************************************************************!*\
  !*** ./node_modules/tsyringe/dist/esm5/types/lifecycle.js ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var Lifecycle;
(function (Lifecycle) {
    Lifecycle[Lifecycle["Transient"] = 0] = "Transient";
    Lifecycle[Lifecycle["Singleton"] = 1] = "Singleton";
    Lifecycle[Lifecycle["ResolutionScoped"] = 2] = "ResolutionScoped";
    Lifecycle[Lifecycle["ContainerScoped"] = 3] = "ContainerScoped";
})(Lifecycle || (Lifecycle = {}));
/* harmony default export */ __webpack_exports__["default"] = (Lifecycle);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	!function() {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main.ts");
/******/ 	Main = __webpack_exports__.Main;
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRWE7O0FBRWI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1COztBQUVuQjtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVEOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGtCQUFrQixzQkFBc0I7QUFDeEM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZTtBQUNmOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0Esb0JBQW9CLFNBQVM7QUFDN0I7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQSxNQUFNO0FBQ047QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjs7QUFFQSxrQ0FBa0MsUUFBUTtBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLGlCQUFpQjtBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLFFBQVE7QUFDUjtB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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdHQUF3RztBQUN4RztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUZBQWlGO0FBQ2pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzRUFBc0U7QUFDdEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNFQUFzRTtBQUN0RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3RUFBd0U7QUFDeEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QsUUFBUTtBQUN4RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELFFBQVE7QUFDeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsdUJBQXVCO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0RBQXdELDBCQUEwQjtBQUNsRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUM7QUFDdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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Q0E5QztXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0Q7Ozs7O1VFTkE7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy9yZWZsZWN0LW1ldGFkYXRhL1JlZmxlY3QuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL3NyYy9jb25maWcvZ2FtZS1kYXRhLnRzIiwid2VicGFjazovL01haW4vLi9zcmMvZW52aXJvbm1lbnQvZW52aXJvbm1lbnQudHMiLCJ3ZWJwYWNrOi8vTWFpbi8uL3NyYy9tYWluLnRzIiwid2VicGFjazovL01haW4vLi9zcmMvc2VydmljZXMvYXV0aC1zZXJ2aWNlLnRzIiwid2VicGFjazovL01haW4vLi9zcmMvc2VydmljZXMvZ2FtZS1kZXRlY3Rpb24tc2VydmljZS50cyIsIndlYnBhY2s6Ly9NYWluLy4vc3JjL3NlcnZpY2VzL2dlcC1jb25zdW1lci50cyIsIndlYnBhY2s6Ly9NYWluLy4vc3JjL3NlcnZpY2VzL2dlcC1zZXJ2aWNlLnRzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHNsaWIvdHNsaWIuZXM2LmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2RlY29yYXRvcnMvYXV0by1pbmplY3RhYmxlLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2RlY29yYXRvcnMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZGVjb3JhdG9ycy9pbmplY3QtYWxsLXdpdGgtdHJhbnNmb3JtLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2RlY29yYXRvcnMvaW5qZWN0LWFsbC5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9kZWNvcmF0b3JzL2luamVjdC13aXRoLXRyYW5zZm9ybS5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9kZWNvcmF0b3JzL2luamVjdC5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9kZWNvcmF0b3JzL2luamVjdGFibGUuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZGVjb3JhdG9ycy9yZWdpc3RyeS5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9kZWNvcmF0b3JzL3Njb3BlZC5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9kZWNvcmF0b3JzL3NpbmdsZXRvbi5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9kZXBlbmRlbmN5LWNvbnRhaW5lci5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9lcnJvci1oZWxwZXJzLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2ZhY3Rvcmllcy9pbmRleC5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9mYWN0b3JpZXMvaW5zdGFuY2UtY2FjaGluZy1mYWN0b3J5LmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2ZhY3Rvcmllcy9pbnN0YW5jZS1wZXItY29udGFpbmVyLWNhY2hpbmctZmFjdG9yeS5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9mYWN0b3JpZXMvcHJlZGljYXRlLWF3YXJlLWNsYXNzLWZhY3RvcnkuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvaW5kZXguanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvaW50ZXJjZXB0b3JzLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2xhenktaGVscGVycy5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9wcm92aWRlcnMvY2xhc3MtcHJvdmlkZXIuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvcHJvdmlkZXJzL2ZhY3RvcnktcHJvdmlkZXIuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvcHJvdmlkZXJzL2luZGV4LmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L3Byb3ZpZGVycy9pbmplY3Rpb24tdG9rZW4uanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvcHJvdmlkZXJzL3Byb3ZpZGVyLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L3Byb3ZpZGVycy90b2tlbi1wcm92aWRlci5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9wcm92aWRlcnMvdmFsdWUtcHJvdmlkZXIuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvcmVmbGVjdGlvbi1oZWxwZXJzLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L3JlZ2lzdHJ5LWJhc2UuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvcmVnaXN0cnkuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvcmVzb2x1dGlvbi1jb250ZXh0LmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L3R5cGVzL2Rpc3Bvc2FibGUuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvdHlwZXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvdHlwZXMvbGlmZWN5Y2xlLmpzIiwid2VicGFjazovL01haW4vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vTWFpbi93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vTWFpbi93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL01haW4vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9NYWluL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vTWFpbi93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL01haW4vd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL01haW4vd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSID0gdHlwZW9mIFJlZmxlY3QgPT09ICdvYmplY3QnID8gUmVmbGVjdCA6IG51bGxcbnZhciBSZWZsZWN0QXBwbHkgPSBSICYmIHR5cGVvZiBSLmFwcGx5ID09PSAnZnVuY3Rpb24nXG4gID8gUi5hcHBseVxuICA6IGZ1bmN0aW9uIFJlZmxlY3RBcHBseSh0YXJnZXQsIHJlY2VpdmVyLCBhcmdzKSB7XG4gICAgcmV0dXJuIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKHRhcmdldCwgcmVjZWl2ZXIsIGFyZ3MpO1xuICB9XG5cbnZhciBSZWZsZWN0T3duS2V5c1xuaWYgKFIgJiYgdHlwZW9mIFIub3duS2V5cyA9PT0gJ2Z1bmN0aW9uJykge1xuICBSZWZsZWN0T3duS2V5cyA9IFIub3duS2V5c1xufSBlbHNlIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG4gIFJlZmxlY3RPd25LZXlzID0gZnVuY3Rpb24gUmVmbGVjdE93bktleXModGFyZ2V0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRhcmdldClcbiAgICAgIC5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyh0YXJnZXQpKTtcbiAgfTtcbn0gZWxzZSB7XG4gIFJlZmxlY3RPd25LZXlzID0gZnVuY3Rpb24gUmVmbGVjdE93bktleXModGFyZ2V0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRhcmdldCk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIFByb2Nlc3NFbWl0V2FybmluZyh3YXJuaW5nKSB7XG4gIGlmIChjb25zb2xlICYmIGNvbnNvbGUud2FybikgY29uc29sZS53YXJuKHdhcm5pbmcpO1xufVxuXG52YXIgTnVtYmVySXNOYU4gPSBOdW1iZXIuaXNOYU4gfHwgZnVuY3Rpb24gTnVtYmVySXNOYU4odmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9PSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICBFdmVudEVtaXR0ZXIuaW5pdC5jYWxsKHRoaXMpO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5tb2R1bGUuZXhwb3J0cy5vbmNlID0gb25jZTtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHNDb3VudCA9IDA7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbnZhciBkZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbmZ1bmN0aW9uIGNoZWNrTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImxpc3RlbmVyXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIEZ1bmN0aW9uLiBSZWNlaXZlZCB0eXBlICcgKyB0eXBlb2YgbGlzdGVuZXIpO1xuICB9XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIsICdkZWZhdWx0TWF4TGlzdGVuZXJzJywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuICB9LFxuICBzZXQ6IGZ1bmN0aW9uKGFyZykge1xuICAgIGlmICh0eXBlb2YgYXJnICE9PSAnbnVtYmVyJyB8fCBhcmcgPCAwIHx8IE51bWJlcklzTmFOKGFyZykpIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgb2YgXCJkZWZhdWx0TWF4TGlzdGVuZXJzXCIgaXMgb3V0IG9mIHJhbmdlLiBJdCBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIG51bWJlci4gUmVjZWl2ZWQgJyArIGFyZyArICcuJyk7XG4gICAgfVxuICAgIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSBhcmc7XG4gIH1cbn0pO1xuXG5FdmVudEVtaXR0ZXIuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXG4gIGlmICh0aGlzLl9ldmVudHMgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgdGhpcy5fZXZlbnRzID09PSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykuX2V2ZW50cykge1xuICAgIHRoaXMuX2V2ZW50cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xuICB9XG5cbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn07XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycyhuKSB7XG4gIGlmICh0eXBlb2YgbiAhPT0gJ251bWJlcicgfHwgbiA8IDAgfHwgTnVtYmVySXNOYU4obikpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIG9mIFwiblwiIGlzIG91dCBvZiByYW5nZS4gSXQgbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBudW1iZXIuIFJlY2VpdmVkICcgKyBuICsgJy4nKTtcbiAgfVxuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbmZ1bmN0aW9uIF9nZXRNYXhMaXN0ZW5lcnModGhhdCkge1xuICBpZiAodGhhdC5fbWF4TGlzdGVuZXJzID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICByZXR1cm4gdGhhdC5fbWF4TGlzdGVuZXJzO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmdldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIGdldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuIF9nZXRNYXhMaXN0ZW5lcnModGhpcyk7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KHR5cGUpIHtcbiAgdmFyIGFyZ3MgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pO1xuICB2YXIgZG9FcnJvciA9ICh0eXBlID09PSAnZXJyb3InKTtcblxuICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzO1xuICBpZiAoZXZlbnRzICE9PSB1bmRlZmluZWQpXG4gICAgZG9FcnJvciA9IChkb0Vycm9yICYmIGV2ZW50cy5lcnJvciA9PT0gdW5kZWZpbmVkKTtcbiAgZWxzZSBpZiAoIWRvRXJyb3IpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKGRvRXJyb3IpIHtcbiAgICB2YXIgZXI7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID4gMClcbiAgICAgIGVyID0gYXJnc1swXTtcbiAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgLy8gTm90ZTogVGhlIGNvbW1lbnRzIG9uIHRoZSBgdGhyb3dgIGxpbmVzIGFyZSBpbnRlbnRpb25hbCwgdGhleSBzaG93XG4gICAgICAvLyB1cCBpbiBOb2RlJ3Mgb3V0cHV0IGlmIHRoaXMgcmVzdWx0cyBpbiBhbiB1bmhhbmRsZWQgZXhjZXB0aW9uLlxuICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgfVxuICAgIC8vIEF0IGxlYXN0IGdpdmUgc29tZSBraW5kIG9mIGNvbnRleHQgdG8gdGhlIHVzZXJcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdVbmhhbmRsZWQgZXJyb3IuJyArIChlciA/ICcgKCcgKyBlci5tZXNzYWdlICsgJyknIDogJycpKTtcbiAgICBlcnIuY29udGV4dCA9IGVyO1xuICAgIHRocm93IGVycjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgfVxuXG4gIHZhciBoYW5kbGVyID0gZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChoYW5kbGVyID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIFJlZmxlY3RBcHBseShoYW5kbGVyLCB0aGlzLCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbGVuID0gaGFuZGxlci5sZW5ndGg7XG4gICAgdmFyIGxpc3RlbmVycyA9IGFycmF5Q2xvbmUoaGFuZGxlciwgbGVuKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKVxuICAgICAgUmVmbGVjdEFwcGx5KGxpc3RlbmVyc1tpXSwgdGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbmZ1bmN0aW9uIF9hZGRMaXN0ZW5lcih0YXJnZXQsIHR5cGUsIGxpc3RlbmVyLCBwcmVwZW5kKSB7XG4gIHZhciBtO1xuICB2YXIgZXZlbnRzO1xuICB2YXIgZXhpc3Rpbmc7XG5cbiAgY2hlY2tMaXN0ZW5lcihsaXN0ZW5lcik7XG5cbiAgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHM7XG4gIGlmIChldmVudHMgPT09IHVuZGVmaW5lZCkge1xuICAgIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0YXJnZXQuX2V2ZW50c0NvdW50ID0gMDtcbiAgfSBlbHNlIHtcbiAgICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAgIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgICBpZiAoZXZlbnRzLm5ld0xpc3RlbmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRhcmdldC5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA/IGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gICAgICAvLyBSZS1hc3NpZ24gYGV2ZW50c2AgYmVjYXVzZSBhIG5ld0xpc3RlbmVyIGhhbmRsZXIgY291bGQgaGF2ZSBjYXVzZWQgdGhlXG4gICAgICAvLyB0aGlzLl9ldmVudHMgdG8gYmUgYXNzaWduZWQgdG8gYSBuZXcgb2JqZWN0XG4gICAgICBldmVudHMgPSB0YXJnZXQuX2V2ZW50cztcbiAgICB9XG4gICAgZXhpc3RpbmcgPSBldmVudHNbdHlwZV07XG4gIH1cblxuICBpZiAoZXhpc3RpbmcgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIGV4aXN0aW5nID0gZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gICAgKyt0YXJnZXQuX2V2ZW50c0NvdW50O1xuICB9IGVsc2Uge1xuICAgIGlmICh0eXBlb2YgZXhpc3RpbmcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgICAgZXhpc3RpbmcgPSBldmVudHNbdHlwZV0gPVxuICAgICAgICBwcmVwZW5kID8gW2xpc3RlbmVyLCBleGlzdGluZ10gOiBbZXhpc3RpbmcsIGxpc3RlbmVyXTtcbiAgICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB9IGVsc2UgaWYgKHByZXBlbmQpIHtcbiAgICAgIGV4aXN0aW5nLnVuc2hpZnQobGlzdGVuZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleGlzdGluZy5wdXNoKGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICAgIG0gPSBfZ2V0TWF4TGlzdGVuZXJzKHRhcmdldCk7XG4gICAgaWYgKG0gPiAwICYmIGV4aXN0aW5nLmxlbmd0aCA+IG0gJiYgIWV4aXN0aW5nLndhcm5lZCkge1xuICAgICAgZXhpc3Rpbmcud2FybmVkID0gdHJ1ZTtcbiAgICAgIC8vIE5vIGVycm9yIGNvZGUgZm9yIHRoaXMgc2luY2UgaXQgaXMgYSBXYXJuaW5nXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcmVzdHJpY3RlZC1zeW50YXhcbiAgICAgIHZhciB3ID0gbmV3IEVycm9yKCdQb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5IGxlYWsgZGV0ZWN0ZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBleGlzdGluZy5sZW5ndGggKyAnICcgKyBTdHJpbmcodHlwZSkgKyAnIGxpc3RlbmVycyAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2FkZGVkLiBVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2luY3JlYXNlIGxpbWl0Jyk7XG4gICAgICB3Lm5hbWUgPSAnTWF4TGlzdGVuZXJzRXhjZWVkZWRXYXJuaW5nJztcbiAgICAgIHcuZW1pdHRlciA9IHRhcmdldDtcbiAgICAgIHcudHlwZSA9IHR5cGU7XG4gICAgICB3LmNvdW50ID0gZXhpc3RpbmcubGVuZ3RoO1xuICAgICAgUHJvY2Vzc0VtaXRXYXJuaW5nKHcpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICByZXR1cm4gX2FkZExpc3RlbmVyKHRoaXMsIHR5cGUsIGxpc3RlbmVyLCBmYWxzZSk7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5wcmVwZW5kTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHByZXBlbmRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgcmV0dXJuIF9hZGRMaXN0ZW5lcih0aGlzLCB0eXBlLCBsaXN0ZW5lciwgdHJ1ZSk7XG4gICAgfTtcblxuZnVuY3Rpb24gb25jZVdyYXBwZXIoKSB7XG4gIGlmICghdGhpcy5maXJlZCkge1xuICAgIHRoaXMudGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHRoaXMudHlwZSwgdGhpcy53cmFwRm4pO1xuICAgIHRoaXMuZmlyZWQgPSB0cnVlO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXIuY2FsbCh0aGlzLnRhcmdldCk7XG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXIuYXBwbHkodGhpcy50YXJnZXQsIGFyZ3VtZW50cyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX29uY2VXcmFwKHRhcmdldCwgdHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIHN0YXRlID0geyBmaXJlZDogZmFsc2UsIHdyYXBGbjogdW5kZWZpbmVkLCB0YXJnZXQ6IHRhcmdldCwgdHlwZTogdHlwZSwgbGlzdGVuZXI6IGxpc3RlbmVyIH07XG4gIHZhciB3cmFwcGVkID0gb25jZVdyYXBwZXIuYmluZChzdGF0ZSk7XG4gIHdyYXBwZWQubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgc3RhdGUud3JhcEZuID0gd3JhcHBlZDtcbiAgcmV0dXJuIHdyYXBwZWQ7XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UodHlwZSwgbGlzdGVuZXIpIHtcbiAgY2hlY2tMaXN0ZW5lcihsaXN0ZW5lcik7XG4gIHRoaXMub24odHlwZSwgX29uY2VXcmFwKHRoaXMsIHR5cGUsIGxpc3RlbmVyKSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5wcmVwZW5kT25jZUxpc3RlbmVyID1cbiAgICBmdW5jdGlvbiBwcmVwZW5kT25jZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgICBjaGVja0xpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgIHRoaXMucHJlcGVuZExpc3RlbmVyKHR5cGUsIF9vbmNlV3JhcCh0aGlzLCB0eXBlLCBsaXN0ZW5lcikpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuLy8gRW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmIGFuZCBvbmx5IGlmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgICB2YXIgbGlzdCwgZXZlbnRzLCBwb3NpdGlvbiwgaSwgb3JpZ2luYWxMaXN0ZW5lcjtcblxuICAgICAgY2hlY2tMaXN0ZW5lcihsaXN0ZW5lcik7XG5cbiAgICAgIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcbiAgICAgIGlmIChldmVudHMgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIGxpc3QgPSBldmVudHNbdHlwZV07XG4gICAgICBpZiAobGlzdCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gdGhpcztcblxuICAgICAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8IGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKVxuICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGRlbGV0ZSBldmVudHNbdHlwZV07XG4gICAgICAgICAgaWYgKGV2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgICAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0Lmxpc3RlbmVyIHx8IGxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgbGlzdCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBwb3NpdGlvbiA9IC0xO1xuXG4gICAgICAgIGZvciAoaSA9IGxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHwgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgICAgIG9yaWdpbmFsTGlzdGVuZXIgPSBsaXN0W2ldLmxpc3RlbmVyO1xuICAgICAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgICAgICByZXR1cm4gdGhpcztcblxuICAgICAgICBpZiAocG9zaXRpb24gPT09IDApXG4gICAgICAgICAgbGlzdC5zaGlmdCgpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBzcGxpY2VPbmUobGlzdCwgcG9zaXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKVxuICAgICAgICAgIGV2ZW50c1t0eXBlXSA9IGxpc3RbMF07XG5cbiAgICAgICAgaWYgKGV2ZW50cy5yZW1vdmVMaXN0ZW5lciAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBvcmlnaW5hbExpc3RlbmVyIHx8IGxpc3RlbmVyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9XG4gICAgZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKHR5cGUpIHtcbiAgICAgIHZhciBsaXN0ZW5lcnMsIGV2ZW50cywgaTtcblxuICAgICAgZXZlbnRzID0gdGhpcy5fZXZlbnRzO1xuICAgICAgaWYgKGV2ZW50cyA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gdGhpcztcblxuICAgICAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICAgICAgaWYgKGV2ZW50cy5yZW1vdmVMaXN0ZW5lciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhpcy5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnRzW3R5cGVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMClcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgZGVsZXRlIGV2ZW50c1t0eXBlXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGV2ZW50cyk7XG4gICAgICAgIHZhciBrZXk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgICAgICB0aGlzLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICBsaXN0ZW5lcnMgPSBldmVudHNbdHlwZV07XG5cbiAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgICAgIH0gZWxzZSBpZiAobGlzdGVuZXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gTElGTyBvcmRlclxuICAgICAgICBmb3IgKGkgPSBsaXN0ZW5lcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuZnVuY3Rpb24gX2xpc3RlbmVycyh0YXJnZXQsIHR5cGUsIHVud3JhcCkge1xuICB2YXIgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHM7XG5cbiAgaWYgKGV2ZW50cyA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBbXTtcblxuICB2YXIgZXZsaXN0ZW5lciA9IGV2ZW50c1t0eXBlXTtcbiAgaWYgKGV2bGlzdGVuZXIgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gW107XG5cbiAgaWYgKHR5cGVvZiBldmxpc3RlbmVyID09PSAnZnVuY3Rpb24nKVxuICAgIHJldHVybiB1bndyYXAgPyBbZXZsaXN0ZW5lci5saXN0ZW5lciB8fCBldmxpc3RlbmVyXSA6IFtldmxpc3RlbmVyXTtcblxuICByZXR1cm4gdW53cmFwID9cbiAgICB1bndyYXBMaXN0ZW5lcnMoZXZsaXN0ZW5lcikgOiBhcnJheUNsb25lKGV2bGlzdGVuZXIsIGV2bGlzdGVuZXIubGVuZ3RoKTtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnModHlwZSkge1xuICByZXR1cm4gX2xpc3RlbmVycyh0aGlzLCB0eXBlLCB0cnVlKTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmF3TGlzdGVuZXJzID0gZnVuY3Rpb24gcmF3TGlzdGVuZXJzKHR5cGUpIHtcbiAgcmV0dXJuIF9saXN0ZW5lcnModGhpcywgdHlwZSwgZmFsc2UpO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIGlmICh0eXBlb2YgZW1pdHRlci5saXN0ZW5lckNvdW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudCh0eXBlKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbGlzdGVuZXJDb3VudC5jYWxsKGVtaXR0ZXIsIHR5cGUpO1xuICB9XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyQ291bnQgPSBsaXN0ZW5lckNvdW50O1xuZnVuY3Rpb24gbGlzdGVuZXJDb3VudCh0eXBlKSB7XG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHM7XG5cbiAgaWYgKGV2ZW50cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIGV2bGlzdGVuZXIgPSBldmVudHNbdHlwZV07XG5cbiAgICBpZiAodHlwZW9mIGV2bGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH0gZWxzZSBpZiAoZXZsaXN0ZW5lciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gZXZsaXN0ZW5lci5sZW5ndGg7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIDA7XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnROYW1lcyA9IGZ1bmN0aW9uIGV2ZW50TmFtZXMoKSB7XG4gIHJldHVybiB0aGlzLl9ldmVudHNDb3VudCA+IDAgPyBSZWZsZWN0T3duS2V5cyh0aGlzLl9ldmVudHMpIDogW107XG59O1xuXG5mdW5jdGlvbiBhcnJheUNsb25lKGFyciwgbikge1xuICB2YXIgY29weSA9IG5ldyBBcnJheShuKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpXG4gICAgY29weVtpXSA9IGFycltpXTtcbiAgcmV0dXJuIGNvcHk7XG59XG5cbmZ1bmN0aW9uIHNwbGljZU9uZShsaXN0LCBpbmRleCkge1xuICBmb3IgKDsgaW5kZXggKyAxIDwgbGlzdC5sZW5ndGg7IGluZGV4KyspXG4gICAgbGlzdFtpbmRleF0gPSBsaXN0W2luZGV4ICsgMV07XG4gIGxpc3QucG9wKCk7XG59XG5cbmZ1bmN0aW9uIHVud3JhcExpc3RlbmVycyhhcnIpIHtcbiAgdmFyIHJldCA9IG5ldyBBcnJheShhcnIubGVuZ3RoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXQubGVuZ3RoOyArK2kpIHtcbiAgICByZXRbaV0gPSBhcnJbaV0ubGlzdGVuZXIgfHwgYXJyW2ldO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIG9uY2UoZW1pdHRlciwgbmFtZSkge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGZ1bmN0aW9uIGVycm9yTGlzdGVuZXIoZXJyKSB7XG4gICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKG5hbWUsIHJlc29sdmVyKTtcbiAgICAgIHJlamVjdChlcnIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc29sdmVyKCkge1xuICAgICAgaWYgKHR5cGVvZiBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgZXJyb3JMaXN0ZW5lcik7XG4gICAgICB9XG4gICAgICByZXNvbHZlKFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7XG4gICAgfTtcblxuICAgIGV2ZW50VGFyZ2V0QWdub3N0aWNBZGRMaXN0ZW5lcihlbWl0dGVyLCBuYW1lLCByZXNvbHZlciwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIGlmIChuYW1lICE9PSAnZXJyb3InKSB7XG4gICAgICBhZGRFcnJvckhhbmRsZXJJZkV2ZW50RW1pdHRlcihlbWl0dGVyLCBlcnJvckxpc3RlbmVyLCB7IG9uY2U6IHRydWUgfSk7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gYWRkRXJyb3JIYW5kbGVySWZFdmVudEVtaXR0ZXIoZW1pdHRlciwgaGFuZGxlciwgZmxhZ3MpIHtcbiAgaWYgKHR5cGVvZiBlbWl0dGVyLm9uID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZXZlbnRUYXJnZXRBZ25vc3RpY0FkZExpc3RlbmVyKGVtaXR0ZXIsICdlcnJvcicsIGhhbmRsZXIsIGZsYWdzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBldmVudFRhcmdldEFnbm9zdGljQWRkTGlzdGVuZXIoZW1pdHRlciwgbmFtZSwgbGlzdGVuZXIsIGZsYWdzKSB7XG4gIGlmICh0eXBlb2YgZW1pdHRlci5vbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGlmIChmbGFncy5vbmNlKSB7XG4gICAgICBlbWl0dGVyLm9uY2UobmFtZSwgbGlzdGVuZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbWl0dGVyLm9uKG5hbWUsIGxpc3RlbmVyKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIGVtaXR0ZXIuYWRkRXZlbnRMaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIEV2ZW50VGFyZ2V0IGRvZXMgbm90IGhhdmUgYGVycm9yYCBldmVudCBzZW1hbnRpY3MgbGlrZSBOb2RlXG4gICAgLy8gRXZlbnRFbWl0dGVycywgd2UgZG8gbm90IGxpc3RlbiBmb3IgYGVycm9yYCBldmVudHMgaGVyZS5cbiAgICBlbWl0dGVyLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgZnVuY3Rpb24gd3JhcExpc3RlbmVyKGFyZykge1xuICAgICAgLy8gSUUgZG9lcyBub3QgaGF2ZSBidWlsdGluIGB7IG9uY2U6IHRydWUgfWAgc3VwcG9ydCBzbyB3ZVxuICAgICAgLy8gaGF2ZSB0byBkbyBpdCBtYW51YWxseS5cbiAgICAgIGlmIChmbGFncy5vbmNlKSB7XG4gICAgICAgIGVtaXR0ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCB3cmFwTGlzdGVuZXIpO1xuICAgICAgfVxuICAgICAgbGlzdGVuZXIoYXJnKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJlbWl0dGVyXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIEV2ZW50RW1pdHRlci4gUmVjZWl2ZWQgdHlwZSAnICsgdHlwZW9mIGVtaXR0ZXIpO1xuICB9XG59XG4iLCIvKiEgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbkNvcHlyaWdodCAoQykgTWljcm9zb2Z0LiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG50aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuTGljZW5zZSBhdCBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcblxuVEhJUyBDT0RFIElTIFBST1ZJREVEIE9OIEFOICpBUyBJUyogQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuS0lORCwgRUlUSEVSIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIFdJVEhPVVQgTElNSVRBVElPTiBBTlkgSU1QTElFRFxuV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIFRJVExFLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSxcbk1FUkNIQU5UQUJMSVRZIE9SIE5PTi1JTkZSSU5HRU1FTlQuXG5cblNlZSB0aGUgQXBhY2hlIFZlcnNpb24gMi4wIExpY2Vuc2UgZm9yIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9uc1xuYW5kIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cbnZhciBSZWZsZWN0O1xuKGZ1bmN0aW9uIChSZWZsZWN0KSB7XG4gICAgLy8gTWV0YWRhdGEgUHJvcG9zYWxcbiAgICAvLyBodHRwczovL3JidWNrdG9uLmdpdGh1Yi5pby9yZWZsZWN0LW1ldGFkYXRhL1xuICAgIChmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgICAgICB2YXIgcm9vdCA9IHR5cGVvZiBnbG9iYWwgPT09IFwib2JqZWN0XCIgPyBnbG9iYWwgOlxuICAgICAgICAgICAgdHlwZW9mIHNlbGYgPT09IFwib2JqZWN0XCIgPyBzZWxmIDpcbiAgICAgICAgICAgICAgICB0eXBlb2YgdGhpcyA9PT0gXCJvYmplY3RcIiA/IHRoaXMgOlxuICAgICAgICAgICAgICAgICAgICBGdW5jdGlvbihcInJldHVybiB0aGlzO1wiKSgpO1xuICAgICAgICB2YXIgZXhwb3J0ZXIgPSBtYWtlRXhwb3J0ZXIoUmVmbGVjdCk7XG4gICAgICAgIGlmICh0eXBlb2Ygcm9vdC5SZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICByb290LlJlZmxlY3QgPSBSZWZsZWN0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZXhwb3J0ZXIgPSBtYWtlRXhwb3J0ZXIocm9vdC5SZWZsZWN0LCBleHBvcnRlcik7XG4gICAgICAgIH1cbiAgICAgICAgZmFjdG9yeShleHBvcnRlcik7XG4gICAgICAgIGZ1bmN0aW9uIG1ha2VFeHBvcnRlcih0YXJnZXQsIHByZXZpb3VzKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRhcmdldFtrZXldICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHByZXZpb3VzKVxuICAgICAgICAgICAgICAgICAgICBwcmV2aW91cyhrZXksIHZhbHVlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KShmdW5jdGlvbiAoZXhwb3J0ZXIpIHtcbiAgICAgICAgdmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4gICAgICAgIC8vIGZlYXR1cmUgdGVzdCBmb3IgU3ltYm9sIHN1cHBvcnRcbiAgICAgICAgdmFyIHN1cHBvcnRzU3ltYm9sID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiO1xuICAgICAgICB2YXIgdG9QcmltaXRpdmVTeW1ib2wgPSBzdXBwb3J0c1N5bWJvbCAmJiB0eXBlb2YgU3ltYm9sLnRvUHJpbWl0aXZlICE9PSBcInVuZGVmaW5lZFwiID8gU3ltYm9sLnRvUHJpbWl0aXZlIDogXCJAQHRvUHJpbWl0aXZlXCI7XG4gICAgICAgIHZhciBpdGVyYXRvclN5bWJvbCA9IHN1cHBvcnRzU3ltYm9sICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgIT09IFwidW5kZWZpbmVkXCIgPyBTeW1ib2wuaXRlcmF0b3IgOiBcIkBAaXRlcmF0b3JcIjtcbiAgICAgICAgdmFyIHN1cHBvcnRzQ3JlYXRlID0gdHlwZW9mIE9iamVjdC5jcmVhdGUgPT09IFwiZnVuY3Rpb25cIjsgLy8gZmVhdHVyZSB0ZXN0IGZvciBPYmplY3QuY3JlYXRlIHN1cHBvcnRcbiAgICAgICAgdmFyIHN1cHBvcnRzUHJvdG8gPSB7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5OyAvLyBmZWF0dXJlIHRlc3QgZm9yIF9fcHJvdG9fXyBzdXBwb3J0XG4gICAgICAgIHZhciBkb3duTGV2ZWwgPSAhc3VwcG9ydHNDcmVhdGUgJiYgIXN1cHBvcnRzUHJvdG87XG4gICAgICAgIHZhciBIYXNoTWFwID0ge1xuICAgICAgICAgICAgLy8gY3JlYXRlIGFuIG9iamVjdCBpbiBkaWN0aW9uYXJ5IG1vZGUgKGEuay5hLiBcInNsb3dcIiBtb2RlIGluIHY4KVxuICAgICAgICAgICAgY3JlYXRlOiBzdXBwb3J0c0NyZWF0ZVxuICAgICAgICAgICAgICAgID8gZnVuY3Rpb24gKCkgeyByZXR1cm4gTWFrZURpY3Rpb25hcnkoT2JqZWN0LmNyZWF0ZShudWxsKSk7IH1cbiAgICAgICAgICAgICAgICA6IHN1cHBvcnRzUHJvdG9cbiAgICAgICAgICAgICAgICAgICAgPyBmdW5jdGlvbiAoKSB7IHJldHVybiBNYWtlRGljdGlvbmFyeSh7IF9fcHJvdG9fXzogbnVsbCB9KTsgfVxuICAgICAgICAgICAgICAgICAgICA6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIE1ha2VEaWN0aW9uYXJ5KHt9KTsgfSxcbiAgICAgICAgICAgIGhhczogZG93bkxldmVsXG4gICAgICAgICAgICAgICAgPyBmdW5jdGlvbiAobWFwLCBrZXkpIHsgcmV0dXJuIGhhc093bi5jYWxsKG1hcCwga2V5KTsgfVxuICAgICAgICAgICAgICAgIDogZnVuY3Rpb24gKG1hcCwga2V5KSB7IHJldHVybiBrZXkgaW4gbWFwOyB9LFxuICAgICAgICAgICAgZ2V0OiBkb3duTGV2ZWxcbiAgICAgICAgICAgICAgICA/IGZ1bmN0aW9uIChtYXAsIGtleSkgeyByZXR1cm4gaGFzT3duLmNhbGwobWFwLCBrZXkpID8gbWFwW2tleV0gOiB1bmRlZmluZWQ7IH1cbiAgICAgICAgICAgICAgICA6IGZ1bmN0aW9uIChtYXAsIGtleSkgeyByZXR1cm4gbWFwW2tleV07IH0sXG4gICAgICAgIH07XG4gICAgICAgIC8vIExvYWQgZ2xvYmFsIG9yIHNoaW0gdmVyc2lvbnMgb2YgTWFwLCBTZXQsIGFuZCBXZWFrTWFwXG4gICAgICAgIHZhciBmdW5jdGlvblByb3RvdHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihGdW5jdGlvbik7XG4gICAgICAgIHZhciB1c2VQb2x5ZmlsbCA9IHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHByb2Nlc3MuZW52ICYmIHByb2Nlc3MuZW52W1wiUkVGTEVDVF9NRVRBREFUQV9VU0VfTUFQX1BPTFlGSUxMXCJdID09PSBcInRydWVcIjtcbiAgICAgICAgdmFyIF9NYXAgPSAhdXNlUG9seWZpbGwgJiYgdHlwZW9mIE1hcCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBNYXAucHJvdG90eXBlLmVudHJpZXMgPT09IFwiZnVuY3Rpb25cIiA/IE1hcCA6IENyZWF0ZU1hcFBvbHlmaWxsKCk7XG4gICAgICAgIHZhciBfU2V0ID0gIXVzZVBvbHlmaWxsICYmIHR5cGVvZiBTZXQgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU2V0LnByb3RvdHlwZS5lbnRyaWVzID09PSBcImZ1bmN0aW9uXCIgPyBTZXQgOiBDcmVhdGVTZXRQb2x5ZmlsbCgpO1xuICAgICAgICB2YXIgX1dlYWtNYXAgPSAhdXNlUG9seWZpbGwgJiYgdHlwZW9mIFdlYWtNYXAgPT09IFwiZnVuY3Rpb25cIiA/IFdlYWtNYXAgOiBDcmVhdGVXZWFrTWFwUG9seWZpbGwoKTtcbiAgICAgICAgLy8gW1tNZXRhZGF0YV1dIGludGVybmFsIHNsb3RcbiAgICAgICAgLy8gaHR0cHM6Ly9yYnVja3Rvbi5naXRodWIuaW8vcmVmbGVjdC1tZXRhZGF0YS8jb3JkaW5hcnktb2JqZWN0LWludGVybmFsLW1ldGhvZHMtYW5kLWludGVybmFsLXNsb3RzXG4gICAgICAgIHZhciBNZXRhZGF0YSA9IG5ldyBfV2Vha01hcCgpO1xuICAgICAgICAvKipcbiAgICAgICAgICogQXBwbGllcyBhIHNldCBvZiBkZWNvcmF0b3JzIHRvIGEgcHJvcGVydHkgb2YgYSB0YXJnZXQgb2JqZWN0LlxuICAgICAgICAgKiBAcGFyYW0gZGVjb3JhdG9ycyBBbiBhcnJheSBvZiBkZWNvcmF0b3JzLlxuICAgICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0LlxuICAgICAgICAgKiBAcGFyYW0gcHJvcGVydHlLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IHRvIGRlY29yYXRlLlxuICAgICAgICAgKiBAcGFyYW0gYXR0cmlidXRlcyAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBkZXNjcmlwdG9yIGZvciB0aGUgdGFyZ2V0IGtleS5cbiAgICAgICAgICogQHJlbWFya3MgRGVjb3JhdG9ycyBhcmUgYXBwbGllZCBpbiByZXZlcnNlIG9yZGVyLlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxuICAgICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cbiAgICAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXG4gICAgICAgICAqICAgICBFeGFtcGxlID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzQXJyYXksIEV4YW1wbGUpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzQXJyYXksIEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzQXJyYXksIEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiLFxuICAgICAgICAgKiAgICAgICAgIFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9yc0FycmF5LCBFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiLFxuICAgICAgICAgKiAgICAgICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpKSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIixcbiAgICAgICAgICogICAgICAgICBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnNBcnJheSwgRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIsXG4gICAgICAgICAqICAgICAgICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpKSk7XG4gICAgICAgICAqXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBkZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIHByb3BlcnR5S2V5LCBhdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHByb3BlcnR5S2V5KSkge1xuICAgICAgICAgICAgICAgIGlmICghSXNBcnJheShkZWNvcmF0b3JzKSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgIGlmICghSXNPYmplY3QoYXR0cmlidXRlcykgJiYgIUlzVW5kZWZpbmVkKGF0dHJpYnV0ZXMpICYmICFJc051bGwoYXR0cmlidXRlcykpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICBpZiAoSXNOdWxsKGF0dHJpYnV0ZXMpKVxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHByb3BlcnR5S2V5ID0gVG9Qcm9wZXJ0eUtleShwcm9wZXJ0eUtleSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIERlY29yYXRlUHJvcGVydHkoZGVjb3JhdG9ycywgdGFyZ2V0LCBwcm9wZXJ0eUtleSwgYXR0cmlidXRlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIUlzQXJyYXkoZGVjb3JhdG9ycykpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICBpZiAoIUlzQ29uc3RydWN0b3IodGFyZ2V0KSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgIHJldHVybiBEZWNvcmF0ZUNvbnN0cnVjdG9yKGRlY29yYXRvcnMsIHRhcmdldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0ZXIoXCJkZWNvcmF0ZVwiLCBkZWNvcmF0ZSk7XG4gICAgICAgIC8vIDQuMS4yIFJlZmxlY3QubWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpXG4gICAgICAgIC8vIGh0dHBzOi8vcmJ1Y2t0b24uZ2l0aHViLmlvL3JlZmxlY3QtbWV0YWRhdGEvI3JlZmxlY3QubWV0YWRhdGFcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEEgZGVmYXVsdCBtZXRhZGF0YSBkZWNvcmF0b3IgZmFjdG9yeSB0aGF0IGNhbiBiZSB1c2VkIG9uIGEgY2xhc3MsIGNsYXNzIG1lbWJlciwgb3IgcGFyYW1ldGVyLlxuICAgICAgICAgKiBAcGFyYW0gbWV0YWRhdGFLZXkgVGhlIGtleSBmb3IgdGhlIG1ldGFkYXRhIGVudHJ5LlxuICAgICAgICAgKiBAcGFyYW0gbWV0YWRhdGFWYWx1ZSBUaGUgdmFsdWUgZm9yIHRoZSBtZXRhZGF0YSBlbnRyeS5cbiAgICAgICAgICogQHJldHVybnMgQSBkZWNvcmF0b3IgZnVuY3Rpb24uXG4gICAgICAgICAqIEByZW1hcmtzXG4gICAgICAgICAqIElmIGBtZXRhZGF0YUtleWAgaXMgYWxyZWFkeSBkZWZpbmVkIGZvciB0aGUgdGFyZ2V0IGFuZCB0YXJnZXQga2V5LCB0aGVcbiAgICAgICAgICogbWV0YWRhdGFWYWx1ZSBmb3IgdGhhdCBrZXkgd2lsbCBiZSBvdmVyd3JpdHRlbi5cbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXG4gICAgICAgICAqICAgICBAUmVmbGVjdC5tZXRhZGF0YShrZXksIHZhbHVlKVxuICAgICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IsIFR5cGVTY3JpcHQgb25seSlcbiAgICAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xuICAgICAgICAgKiAgICAgICAgIEBSZWZsZWN0Lm1ldGFkYXRhKGtleSwgdmFsdWUpXG4gICAgICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSwgVHlwZVNjcmlwdCBvbmx5KVxuICAgICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XG4gICAgICAgICAqICAgICAgICAgQFJlZmxlY3QubWV0YWRhdGEoa2V5LCB2YWx1ZSlcbiAgICAgICAgICogICAgICAgICBwcm9wZXJ0eTtcbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcbiAgICAgICAgICogICAgICAgICBAUmVmbGVjdC5tZXRhZGF0YShrZXksIHZhbHVlKVxuICAgICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QoKSB7IH1cbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XG4gICAgICAgICAqICAgICAgICAgQFJlZmxlY3QubWV0YWRhdGEoa2V5LCB2YWx1ZSlcbiAgICAgICAgICogICAgICAgICBtZXRob2QoKSB7IH1cbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIG1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBkZWNvcmF0b3IodGFyZ2V0LCBwcm9wZXJ0eUtleSkge1xuICAgICAgICAgICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgIGlmICghSXNVbmRlZmluZWQocHJvcGVydHlLZXkpICYmICFJc1Byb3BlcnR5S2V5KHByb3BlcnR5S2V5KSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgIE9yZGluYXJ5RGVmaW5lT3duTWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUsIHRhcmdldCwgcHJvcGVydHlLZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRlY29yYXRvcjtcbiAgICAgICAgfVxuICAgICAgICBleHBvcnRlcihcIm1ldGFkYXRhXCIsIG1ldGFkYXRhKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlZmluZSBhIHVuaXF1ZSBtZXRhZGF0YSBlbnRyeSBvbiB0aGUgdGFyZ2V0LlxuICAgICAgICAgKiBAcGFyYW0gbWV0YWRhdGFLZXkgQSBrZXkgdXNlZCB0byBzdG9yZSBhbmQgcmV0cmlldmUgbWV0YWRhdGEuXG4gICAgICAgICAqIEBwYXJhbSBtZXRhZGF0YVZhbHVlIEEgdmFsdWUgdGhhdCBjb250YWlucyBhdHRhY2hlZCBtZXRhZGF0YS5cbiAgICAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0byBkZWZpbmUgbWV0YWRhdGEuXG4gICAgICAgICAqIEBwYXJhbSBwcm9wZXJ0eUtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XG4gICAgICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcbiAgICAgICAgICogICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBvcHRpb25zLCBFeGFtcGxlKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBvcHRpb25zLCBFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBvcHRpb25zLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgb3B0aW9ucywgRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBvcHRpb25zLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBkZWNvcmF0b3IgZmFjdG9yeSBhcyBtZXRhZGF0YS1wcm9kdWNpbmcgYW5ub3RhdGlvbi5cbiAgICAgICAgICogICAgIGZ1bmN0aW9uIE15QW5ub3RhdGlvbihvcHRpb25zKTogRGVjb3JhdG9yIHtcbiAgICAgICAgICogICAgICAgICByZXR1cm4gKHRhcmdldCwga2V5PykgPT4gUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIG9wdGlvbnMsIHRhcmdldCwga2V5KTtcbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGRlZmluZU1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KSB7XG4gICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgaWYgKCFJc1VuZGVmaW5lZChwcm9wZXJ0eUtleSkpXG4gICAgICAgICAgICAgICAgcHJvcGVydHlLZXkgPSBUb1Byb3BlcnR5S2V5KHByb3BlcnR5S2V5KTtcbiAgICAgICAgICAgIHJldHVybiBPcmRpbmFyeURlZmluZU93bk1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KTtcbiAgICAgICAgfVxuICAgICAgICBleHBvcnRlcihcImRlZmluZU1ldGFkYXRhXCIsIGRlZmluZU1ldGFkYXRhKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldHMgYSB2YWx1ZSBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIHRhcmdldCBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZSBjaGFpbiBoYXMgdGhlIHByb3ZpZGVkIG1ldGFkYXRhIGtleSBkZWZpbmVkLlxuICAgICAgICAgKiBAcGFyYW0gbWV0YWRhdGFLZXkgQSBrZXkgdXNlZCB0byBzdG9yZSBhbmQgcmV0cmlldmUgbWV0YWRhdGEuXG4gICAgICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdGhlIG1ldGFkYXRhIGlzIGRlZmluZWQuXG4gICAgICAgICAqIEBwYXJhbSBwcm9wZXJ0eUtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXG4gICAgICAgICAqIEByZXR1cm5zIGB0cnVlYCBpZiB0aGUgbWV0YWRhdGEga2V5IHdhcyBkZWZpbmVkIG9uIHRoZSB0YXJnZXQgb2JqZWN0IG9yIGl0cyBwcm90b3R5cGUgY2hhaW47IG90aGVyd2lzZSwgYGZhbHNlYC5cbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcbiAgICAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGhhc01ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHByb3BlcnR5S2V5KSB7XG4gICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgaWYgKCFJc1VuZGVmaW5lZChwcm9wZXJ0eUtleSkpXG4gICAgICAgICAgICAgICAgcHJvcGVydHlLZXkgPSBUb1Byb3BlcnR5S2V5KHByb3BlcnR5S2V5KTtcbiAgICAgICAgICAgIHJldHVybiBPcmRpbmFyeUhhc01ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHByb3BlcnR5S2V5KTtcbiAgICAgICAgfVxuICAgICAgICBleHBvcnRlcihcImhhc01ldGFkYXRhXCIsIGhhc01ldGFkYXRhKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldHMgYSB2YWx1ZSBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIHRhcmdldCBvYmplY3QgaGFzIHRoZSBwcm92aWRlZCBtZXRhZGF0YSBrZXkgZGVmaW5lZC5cbiAgICAgICAgICogQHBhcmFtIG1ldGFkYXRhS2V5IEEga2V5IHVzZWQgdG8gc3RvcmUgYW5kIHJldHJpZXZlIG1ldGFkYXRhLlxuICAgICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRoZSBtZXRhZGF0YSBpcyBkZWZpbmVkLlxuICAgICAgICAgKiBAcGFyYW0gcHJvcGVydHlLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxuICAgICAgICAgKiBAcmV0dXJucyBgdHJ1ZWAgaWYgdGhlIG1ldGFkYXRhIGtleSB3YXMgZGVmaW5lZCBvbiB0aGUgdGFyZ2V0IG9iamVjdDsgb3RoZXJ3aXNlLCBgZmFsc2VgLlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxuICAgICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cbiAgICAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc093bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc093bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc093bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc093bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gaGFzT3duTWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgcHJvcGVydHlLZXkpIHtcbiAgICAgICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHByb3BlcnR5S2V5KSlcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eUtleSA9IFRvUHJvcGVydHlLZXkocHJvcGVydHlLZXkpO1xuICAgICAgICAgICAgcmV0dXJuIE9yZGluYXJ5SGFzT3duTWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgcHJvcGVydHlLZXkpO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydGVyKFwiaGFzT3duTWV0YWRhdGFcIiwgaGFzT3duTWV0YWRhdGEpO1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0cyB0aGUgbWV0YWRhdGEgdmFsdWUgZm9yIHRoZSBwcm92aWRlZCBtZXRhZGF0YSBrZXkgb24gdGhlIHRhcmdldCBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZSBjaGFpbi5cbiAgICAgICAgICogQHBhcmFtIG1ldGFkYXRhS2V5IEEga2V5IHVzZWQgdG8gc3RvcmUgYW5kIHJldHJpZXZlIG1ldGFkYXRhLlxuICAgICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRoZSBtZXRhZGF0YSBpcyBkZWZpbmVkLlxuICAgICAgICAgKiBAcGFyYW0gcHJvcGVydHlLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxuICAgICAgICAgKiBAcmV0dXJucyBUaGUgbWV0YWRhdGEgdmFsdWUgZm9yIHRoZSBtZXRhZGF0YSBrZXkgaWYgZm91bmQ7IG90aGVyd2lzZSwgYHVuZGVmaW5lZGAuXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XG4gICAgICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBnZXRNZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSkge1xuICAgICAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgIGlmICghSXNVbmRlZmluZWQocHJvcGVydHlLZXkpKVxuICAgICAgICAgICAgICAgIHByb3BlcnR5S2V5ID0gVG9Qcm9wZXJ0eUtleShwcm9wZXJ0eUtleSk7XG4gICAgICAgICAgICByZXR1cm4gT3JkaW5hcnlHZXRNZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0ZXIoXCJnZXRNZXRhZGF0YVwiLCBnZXRNZXRhZGF0YSk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIHRoZSBtZXRhZGF0YSB2YWx1ZSBmb3IgdGhlIHByb3ZpZGVkIG1ldGFkYXRhIGtleSBvbiB0aGUgdGFyZ2V0IG9iamVjdC5cbiAgICAgICAgICogQHBhcmFtIG1ldGFkYXRhS2V5IEEga2V5IHVzZWQgdG8gc3RvcmUgYW5kIHJldHJpZXZlIG1ldGFkYXRhLlxuICAgICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRoZSBtZXRhZGF0YSBpcyBkZWZpbmVkLlxuICAgICAgICAgKiBAcGFyYW0gcHJvcGVydHlLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxuICAgICAgICAgKiBAcmV0dXJucyBUaGUgbWV0YWRhdGEgdmFsdWUgZm9yIHRoZSBtZXRhZGF0YSBrZXkgaWYgZm91bmQ7IG90aGVyd2lzZSwgYHVuZGVmaW5lZGAuXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XG4gICAgICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBnZXRPd25NZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSkge1xuICAgICAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgIGlmICghSXNVbmRlZmluZWQocHJvcGVydHlLZXkpKVxuICAgICAgICAgICAgICAgIHByb3BlcnR5S2V5ID0gVG9Qcm9wZXJ0eUtleShwcm9wZXJ0eUtleSk7XG4gICAgICAgICAgICByZXR1cm4gT3JkaW5hcnlHZXRPd25NZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0ZXIoXCJnZXRPd25NZXRhZGF0YVwiLCBnZXRPd25NZXRhZGF0YSk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIHRoZSBtZXRhZGF0YSBrZXlzIGRlZmluZWQgb24gdGhlIHRhcmdldCBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZSBjaGFpbi5cbiAgICAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0aGUgbWV0YWRhdGEgaXMgZGVmaW5lZC5cbiAgICAgICAgICogQHBhcmFtIHByb3BlcnR5S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cbiAgICAgICAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgdW5pcXVlIG1ldGFkYXRhIGtleXMuXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XG4gICAgICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGFLZXlzKEV4YW1wbGUpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YUtleXMoRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhS2V5cyhFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhS2V5cyhFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YUtleXMoRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0TWV0YWRhdGFLZXlzKHRhcmdldCwgcHJvcGVydHlLZXkpIHtcbiAgICAgICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHByb3BlcnR5S2V5KSlcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eUtleSA9IFRvUHJvcGVydHlLZXkocHJvcGVydHlLZXkpO1xuICAgICAgICAgICAgcmV0dXJuIE9yZGluYXJ5TWV0YWRhdGFLZXlzKHRhcmdldCwgcHJvcGVydHlLZXkpO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydGVyKFwiZ2V0TWV0YWRhdGFLZXlzXCIsIGdldE1ldGFkYXRhS2V5cyk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIHRoZSB1bmlxdWUgbWV0YWRhdGEga2V5cyBkZWZpbmVkIG9uIHRoZSB0YXJnZXQgb2JqZWN0LlxuICAgICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRoZSBtZXRhZGF0YSBpcyBkZWZpbmVkLlxuICAgICAgICAgKiBAcGFyYW0gcHJvcGVydHlLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxuICAgICAgICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiB1bmlxdWUgbWV0YWRhdGEga2V5cy5cbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcbiAgICAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YUtleXMoRXhhbXBsZSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhS2V5cyhFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGFLZXlzKEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGFLZXlzKEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhS2V5cyhFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBnZXRPd25NZXRhZGF0YUtleXModGFyZ2V0LCBwcm9wZXJ0eUtleSkge1xuICAgICAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgIGlmICghSXNVbmRlZmluZWQocHJvcGVydHlLZXkpKVxuICAgICAgICAgICAgICAgIHByb3BlcnR5S2V5ID0gVG9Qcm9wZXJ0eUtleShwcm9wZXJ0eUtleSk7XG4gICAgICAgICAgICByZXR1cm4gT3JkaW5hcnlPd25NZXRhZGF0YUtleXModGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0ZXIoXCJnZXRPd25NZXRhZGF0YUtleXNcIiwgZ2V0T3duTWV0YWRhdGFLZXlzKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlbGV0ZXMgdGhlIG1ldGFkYXRhIGVudHJ5IGZyb20gdGhlIHRhcmdldCBvYmplY3Qgd2l0aCB0aGUgcHJvdmlkZWQga2V5LlxuICAgICAgICAgKiBAcGFyYW0gbWV0YWRhdGFLZXkgQSBrZXkgdXNlZCB0byBzdG9yZSBhbmQgcmV0cmlldmUgbWV0YWRhdGEuXG4gICAgICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdGhlIG1ldGFkYXRhIGlzIGRlZmluZWQuXG4gICAgICAgICAqIEBwYXJhbSBwcm9wZXJ0eUtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXG4gICAgICAgICAqIEByZXR1cm5zIGB0cnVlYCBpZiB0aGUgbWV0YWRhdGEgZW50cnkgd2FzIGZvdW5kIGFuZCBkZWxldGVkOyBvdGhlcndpc2UsIGZhbHNlLlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxuICAgICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cbiAgICAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmRlbGV0ZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmRlbGV0ZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmRlbGV0ZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5kZWxldGVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmRlbGV0ZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZGVsZXRlTWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgcHJvcGVydHlLZXkpIHtcbiAgICAgICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHByb3BlcnR5S2V5KSlcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eUtleSA9IFRvUHJvcGVydHlLZXkocHJvcGVydHlLZXkpO1xuICAgICAgICAgICAgdmFyIG1ldGFkYXRhTWFwID0gR2V0T3JDcmVhdGVNZXRhZGF0YU1hcCh0YXJnZXQsIHByb3BlcnR5S2V5LCAvKkNyZWF0ZSovIGZhbHNlKTtcbiAgICAgICAgICAgIGlmIChJc1VuZGVmaW5lZChtZXRhZGF0YU1hcCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKCFtZXRhZGF0YU1hcC5kZWxldGUobWV0YWRhdGFLZXkpKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmIChtZXRhZGF0YU1hcC5zaXplID4gMClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIHZhciB0YXJnZXRNZXRhZGF0YSA9IE1ldGFkYXRhLmdldCh0YXJnZXQpO1xuICAgICAgICAgICAgdGFyZ2V0TWV0YWRhdGEuZGVsZXRlKHByb3BlcnR5S2V5KTtcbiAgICAgICAgICAgIGlmICh0YXJnZXRNZXRhZGF0YS5zaXplID4gMClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIE1ldGFkYXRhLmRlbGV0ZSh0YXJnZXQpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0ZXIoXCJkZWxldGVNZXRhZGF0YVwiLCBkZWxldGVNZXRhZGF0YSk7XG4gICAgICAgIGZ1bmN0aW9uIERlY29yYXRlQ29uc3RydWN0b3IoZGVjb3JhdG9ycywgdGFyZ2V0KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgICAgIHZhciBkZWNvcmF0b3IgPSBkZWNvcmF0b3JzW2ldO1xuICAgICAgICAgICAgICAgIHZhciBkZWNvcmF0ZWQgPSBkZWNvcmF0b3IodGFyZ2V0KTtcbiAgICAgICAgICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKGRlY29yYXRlZCkgJiYgIUlzTnVsbChkZWNvcmF0ZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghSXNDb25zdHJ1Y3RvcihkZWNvcmF0ZWQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQgPSBkZWNvcmF0ZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBEZWNvcmF0ZVByb3BlcnR5KGRlY29yYXRvcnMsIHRhcmdldCwgcHJvcGVydHlLZXksIGRlc2NyaXB0b3IpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlY29yYXRvciA9IGRlY29yYXRvcnNbaV07XG4gICAgICAgICAgICAgICAgdmFyIGRlY29yYXRlZCA9IGRlY29yYXRvcih0YXJnZXQsIHByb3BlcnR5S2V5LCBkZXNjcmlwdG9yKTtcbiAgICAgICAgICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKGRlY29yYXRlZCkgJiYgIUlzTnVsbChkZWNvcmF0ZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghSXNPYmplY3QoZGVjb3JhdGVkKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRvciA9IGRlY29yYXRlZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGVzY3JpcHRvcjtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBHZXRPckNyZWF0ZU1ldGFkYXRhTWFwKE8sIFAsIENyZWF0ZSkge1xuICAgICAgICAgICAgdmFyIHRhcmdldE1ldGFkYXRhID0gTWV0YWRhdGEuZ2V0KE8pO1xuICAgICAgICAgICAgaWYgKElzVW5kZWZpbmVkKHRhcmdldE1ldGFkYXRhKSkge1xuICAgICAgICAgICAgICAgIGlmICghQ3JlYXRlKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHRhcmdldE1ldGFkYXRhID0gbmV3IF9NYXAoKTtcbiAgICAgICAgICAgICAgICBNZXRhZGF0YS5zZXQoTywgdGFyZ2V0TWV0YWRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG1ldGFkYXRhTWFwID0gdGFyZ2V0TWV0YWRhdGEuZ2V0KFApO1xuICAgICAgICAgICAgaWYgKElzVW5kZWZpbmVkKG1ldGFkYXRhTWFwKSkge1xuICAgICAgICAgICAgICAgIGlmICghQ3JlYXRlKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIG1ldGFkYXRhTWFwID0gbmV3IF9NYXAoKTtcbiAgICAgICAgICAgICAgICB0YXJnZXRNZXRhZGF0YS5zZXQoUCwgbWV0YWRhdGFNYXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1ldGFkYXRhTWFwO1xuICAgICAgICB9XG4gICAgICAgIC8vIDMuMS4xLjEgT3JkaW5hcnlIYXNNZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUClcbiAgICAgICAgLy8gaHR0cHM6Ly9yYnVja3Rvbi5naXRodWIuaW8vcmVmbGVjdC1tZXRhZGF0YS8jb3JkaW5hcnloYXNtZXRhZGF0YVxuICAgICAgICBmdW5jdGlvbiBPcmRpbmFyeUhhc01ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKSB7XG4gICAgICAgICAgICB2YXIgaGFzT3duID0gT3JkaW5hcnlIYXNPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUCk7XG4gICAgICAgICAgICBpZiAoaGFzT3duKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgdmFyIHBhcmVudCA9IE9yZGluYXJ5R2V0UHJvdG90eXBlT2YoTyk7XG4gICAgICAgICAgICBpZiAoIUlzTnVsbChwYXJlbnQpKVxuICAgICAgICAgICAgICAgIHJldHVybiBPcmRpbmFyeUhhc01ldGFkYXRhKE1ldGFkYXRhS2V5LCBwYXJlbnQsIFApO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIDMuMS4yLjEgT3JkaW5hcnlIYXNPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUClcbiAgICAgICAgLy8gaHR0cHM6Ly9yYnVja3Rvbi5naXRodWIuaW8vcmVmbGVjdC1tZXRhZGF0YS8jb3JkaW5hcnloYXNvd25tZXRhZGF0YVxuICAgICAgICBmdW5jdGlvbiBPcmRpbmFyeUhhc093bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKSB7XG4gICAgICAgICAgICB2YXIgbWV0YWRhdGFNYXAgPSBHZXRPckNyZWF0ZU1ldGFkYXRhTWFwKE8sIFAsIC8qQ3JlYXRlKi8gZmFsc2UpO1xuICAgICAgICAgICAgaWYgKElzVW5kZWZpbmVkKG1ldGFkYXRhTWFwKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gVG9Cb29sZWFuKG1ldGFkYXRhTWFwLmhhcyhNZXRhZGF0YUtleSkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIDMuMS4zLjEgT3JkaW5hcnlHZXRNZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUClcbiAgICAgICAgLy8gaHR0cHM6Ly9yYnVja3Rvbi5naXRodWIuaW8vcmVmbGVjdC1tZXRhZGF0YS8jb3JkaW5hcnlnZXRtZXRhZGF0YVxuICAgICAgICBmdW5jdGlvbiBPcmRpbmFyeUdldE1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKSB7XG4gICAgICAgICAgICB2YXIgaGFzT3duID0gT3JkaW5hcnlIYXNPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUCk7XG4gICAgICAgICAgICBpZiAoaGFzT3duKVxuICAgICAgICAgICAgICAgIHJldHVybiBPcmRpbmFyeUdldE93bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKTtcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBPcmRpbmFyeUdldFByb3RvdHlwZU9mKE8pO1xuICAgICAgICAgICAgaWYgKCFJc051bGwocGFyZW50KSlcbiAgICAgICAgICAgICAgICByZXR1cm4gT3JkaW5hcnlHZXRNZXRhZGF0YShNZXRhZGF0YUtleSwgcGFyZW50LCBQKTtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gMy4xLjQuMSBPcmRpbmFyeUdldE93bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKVxuICAgICAgICAvLyBodHRwczovL3JidWNrdG9uLmdpdGh1Yi5pby9yZWZsZWN0LW1ldGFkYXRhLyNvcmRpbmFyeWdldG93bm1ldGFkYXRhXG4gICAgICAgIGZ1bmN0aW9uIE9yZGluYXJ5R2V0T3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApIHtcbiAgICAgICAgICAgIHZhciBtZXRhZGF0YU1hcCA9IEdldE9yQ3JlYXRlTWV0YWRhdGFNYXAoTywgUCwgLypDcmVhdGUqLyBmYWxzZSk7XG4gICAgICAgICAgICBpZiAoSXNVbmRlZmluZWQobWV0YWRhdGFNYXApKVxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICByZXR1cm4gbWV0YWRhdGFNYXAuZ2V0KE1ldGFkYXRhS2V5KTtcbiAgICAgICAgfVxuICAgICAgICAvLyAzLjEuNS4xIE9yZGluYXJ5RGVmaW5lT3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE1ldGFkYXRhVmFsdWUsIE8sIFApXG4gICAgICAgIC8vIGh0dHBzOi8vcmJ1Y2t0b24uZ2l0aHViLmlvL3JlZmxlY3QtbWV0YWRhdGEvI29yZGluYXJ5ZGVmaW5lb3dubWV0YWRhdGFcbiAgICAgICAgZnVuY3Rpb24gT3JkaW5hcnlEZWZpbmVPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTWV0YWRhdGFWYWx1ZSwgTywgUCkge1xuICAgICAgICAgICAgdmFyIG1ldGFkYXRhTWFwID0gR2V0T3JDcmVhdGVNZXRhZGF0YU1hcChPLCBQLCAvKkNyZWF0ZSovIHRydWUpO1xuICAgICAgICAgICAgbWV0YWRhdGFNYXAuc2V0KE1ldGFkYXRhS2V5LCBNZXRhZGF0YVZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyAzLjEuNi4xIE9yZGluYXJ5TWV0YWRhdGFLZXlzKE8sIFApXG4gICAgICAgIC8vIGh0dHBzOi8vcmJ1Y2t0b24uZ2l0aHViLmlvL3JlZmxlY3QtbWV0YWRhdGEvI29yZGluYXJ5bWV0YWRhdGFrZXlzXG4gICAgICAgIGZ1bmN0aW9uIE9yZGluYXJ5TWV0YWRhdGFLZXlzKE8sIFApIHtcbiAgICAgICAgICAgIHZhciBvd25LZXlzID0gT3JkaW5hcnlPd25NZXRhZGF0YUtleXMoTywgUCk7XG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gT3JkaW5hcnlHZXRQcm90b3R5cGVPZihPKTtcbiAgICAgICAgICAgIGlmIChwYXJlbnQgPT09IG51bGwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG93bktleXM7XG4gICAgICAgICAgICB2YXIgcGFyZW50S2V5cyA9IE9yZGluYXJ5TWV0YWRhdGFLZXlzKHBhcmVudCwgUCk7XG4gICAgICAgICAgICBpZiAocGFyZW50S2V5cy5sZW5ndGggPD0gMClcbiAgICAgICAgICAgICAgICByZXR1cm4gb3duS2V5cztcbiAgICAgICAgICAgIGlmIChvd25LZXlzLmxlbmd0aCA8PSAwKVxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnRLZXlzO1xuICAgICAgICAgICAgdmFyIHNldCA9IG5ldyBfU2V0KCk7XG4gICAgICAgICAgICB2YXIga2V5cyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBvd25LZXlzXzEgPSBvd25LZXlzOyBfaSA8IG93bktleXNfMS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gb3duS2V5c18xW19pXTtcbiAgICAgICAgICAgICAgICB2YXIgaGFzS2V5ID0gc2V0LmhhcyhrZXkpO1xuICAgICAgICAgICAgICAgIGlmICghaGFzS2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIHNldC5hZGQoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgX2EgPSAwLCBwYXJlbnRLZXlzXzEgPSBwYXJlbnRLZXlzOyBfYSA8IHBhcmVudEtleXNfMS5sZW5ndGg7IF9hKyspIHtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gcGFyZW50S2V5c18xW19hXTtcbiAgICAgICAgICAgICAgICB2YXIgaGFzS2V5ID0gc2V0LmhhcyhrZXkpO1xuICAgICAgICAgICAgICAgIGlmICghaGFzS2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIHNldC5hZGQoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGtleXM7XG4gICAgICAgIH1cbiAgICAgICAgLy8gMy4xLjcuMSBPcmRpbmFyeU93bk1ldGFkYXRhS2V5cyhPLCBQKVxuICAgICAgICAvLyBodHRwczovL3JidWNrdG9uLmdpdGh1Yi5pby9yZWZsZWN0LW1ldGFkYXRhLyNvcmRpbmFyeW93bm1ldGFkYXRha2V5c1xuICAgICAgICBmdW5jdGlvbiBPcmRpbmFyeU93bk1ldGFkYXRhS2V5cyhPLCBQKSB7XG4gICAgICAgICAgICB2YXIga2V5cyA9IFtdO1xuICAgICAgICAgICAgdmFyIG1ldGFkYXRhTWFwID0gR2V0T3JDcmVhdGVNZXRhZGF0YU1hcChPLCBQLCAvKkNyZWF0ZSovIGZhbHNlKTtcbiAgICAgICAgICAgIGlmIChJc1VuZGVmaW5lZChtZXRhZGF0YU1hcCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleXM7XG4gICAgICAgICAgICB2YXIga2V5c09iaiA9IG1ldGFkYXRhTWFwLmtleXMoKTtcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IEdldEl0ZXJhdG9yKGtleXNPYmopO1xuICAgICAgICAgICAgdmFyIGsgPSAwO1xuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dCA9IEl0ZXJhdG9yU3RlcChpdGVyYXRvcik7XG4gICAgICAgICAgICAgICAgaWYgKCFuZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGtleXMubGVuZ3RoID0gaztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtleXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBuZXh0VmFsdWUgPSBJdGVyYXRvclZhbHVlKG5leHQpO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGtleXNba10gPSBuZXh0VmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBJdGVyYXRvckNsb3NlKGl0ZXJhdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaysrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIDYgRUNNQVNjcmlwdCBEYXRhIFR5cDBlcyBhbmQgVmFsdWVzXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWVjbWFzY3JpcHQtZGF0YS10eXBlcy1hbmQtdmFsdWVzXG4gICAgICAgIGZ1bmN0aW9uIFR5cGUoeCkge1xuICAgICAgICAgICAgaWYgKHggPT09IG51bGwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIDEgLyogTnVsbCAqLztcbiAgICAgICAgICAgIHN3aXRjaCAodHlwZW9mIHgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwidW5kZWZpbmVkXCI6IHJldHVybiAwIC8qIFVuZGVmaW5lZCAqLztcbiAgICAgICAgICAgICAgICBjYXNlIFwiYm9vbGVhblwiOiByZXR1cm4gMiAvKiBCb29sZWFuICovO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJzdHJpbmdcIjogcmV0dXJuIDMgLyogU3RyaW5nICovO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJzeW1ib2xcIjogcmV0dXJuIDQgLyogU3ltYm9sICovO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJudW1iZXJcIjogcmV0dXJuIDUgLyogTnVtYmVyICovO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJvYmplY3RcIjogcmV0dXJuIHggPT09IG51bGwgPyAxIC8qIE51bGwgKi8gOiA2IC8qIE9iamVjdCAqLztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4gNiAvKiBPYmplY3QgKi87XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gNi4xLjEgVGhlIFVuZGVmaW5lZCBUeXBlXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWVjbWFzY3JpcHQtbGFuZ3VhZ2UtdHlwZXMtdW5kZWZpbmVkLXR5cGVcbiAgICAgICAgZnVuY3Rpb24gSXNVbmRlZmluZWQoeCkge1xuICAgICAgICAgICAgcmV0dXJuIHggPT09IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICAvLyA2LjEuMiBUaGUgTnVsbCBUeXBlXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWVjbWFzY3JpcHQtbGFuZ3VhZ2UtdHlwZXMtbnVsbC10eXBlXG4gICAgICAgIGZ1bmN0aW9uIElzTnVsbCh4KSB7XG4gICAgICAgICAgICByZXR1cm4geCA9PT0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICAvLyA2LjEuNSBUaGUgU3ltYm9sIFR5cGVcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtZWNtYXNjcmlwdC1sYW5ndWFnZS10eXBlcy1zeW1ib2wtdHlwZVxuICAgICAgICBmdW5jdGlvbiBJc1N5bWJvbCh4KSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHggPT09IFwic3ltYm9sXCI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNi4xLjcgVGhlIE9iamVjdCBUeXBlXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLW9iamVjdC10eXBlXG4gICAgICAgIGZ1bmN0aW9uIElzT2JqZWN0KHgpIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gXCJvYmplY3RcIiA/IHggIT09IG51bGwgOiB0eXBlb2YgeCA9PT0gXCJmdW5jdGlvblwiO1xuICAgICAgICB9XG4gICAgICAgIC8vIDcuMSBUeXBlIENvbnZlcnNpb25cbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtdHlwZS1jb252ZXJzaW9uXG4gICAgICAgIC8vIDcuMS4xIFRvUHJpbWl0aXZlKGlucHV0IFssIFByZWZlcnJlZFR5cGVdKVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy10b3ByaW1pdGl2ZVxuICAgICAgICBmdW5jdGlvbiBUb1ByaW1pdGl2ZShpbnB1dCwgUHJlZmVycmVkVHlwZSkge1xuICAgICAgICAgICAgc3dpdGNoIChUeXBlKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGNhc2UgMCAvKiBVbmRlZmluZWQgKi86IHJldHVybiBpbnB1dDtcbiAgICAgICAgICAgICAgICBjYXNlIDEgLyogTnVsbCAqLzogcmV0dXJuIGlucHV0O1xuICAgICAgICAgICAgICAgIGNhc2UgMiAvKiBCb29sZWFuICovOiByZXR1cm4gaW5wdXQ7XG4gICAgICAgICAgICAgICAgY2FzZSAzIC8qIFN0cmluZyAqLzogcmV0dXJuIGlucHV0O1xuICAgICAgICAgICAgICAgIGNhc2UgNCAvKiBTeW1ib2wgKi86IHJldHVybiBpbnB1dDtcbiAgICAgICAgICAgICAgICBjYXNlIDUgLyogTnVtYmVyICovOiByZXR1cm4gaW5wdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaGludCA9IFByZWZlcnJlZFR5cGUgPT09IDMgLyogU3RyaW5nICovID8gXCJzdHJpbmdcIiA6IFByZWZlcnJlZFR5cGUgPT09IDUgLyogTnVtYmVyICovID8gXCJudW1iZXJcIiA6IFwiZGVmYXVsdFwiO1xuICAgICAgICAgICAgdmFyIGV4b3RpY1RvUHJpbSA9IEdldE1ldGhvZChpbnB1dCwgdG9QcmltaXRpdmVTeW1ib2wpO1xuICAgICAgICAgICAgaWYgKGV4b3RpY1RvUHJpbSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGV4b3RpY1RvUHJpbS5jYWxsKGlucHV0LCBoaW50KTtcbiAgICAgICAgICAgICAgICBpZiAoSXNPYmplY3QocmVzdWx0KSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gT3JkaW5hcnlUb1ByaW1pdGl2ZShpbnB1dCwgaGludCA9PT0gXCJkZWZhdWx0XCIgPyBcIm51bWJlclwiIDogaGludCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNy4xLjEuMSBPcmRpbmFyeVRvUHJpbWl0aXZlKE8sIGhpbnQpXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLW9yZGluYXJ5dG9wcmltaXRpdmVcbiAgICAgICAgZnVuY3Rpb24gT3JkaW5hcnlUb1ByaW1pdGl2ZShPLCBoaW50KSB7XG4gICAgICAgICAgICBpZiAoaGludCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHZhciB0b1N0cmluZ18xID0gTy50b1N0cmluZztcbiAgICAgICAgICAgICAgICBpZiAoSXNDYWxsYWJsZSh0b1N0cmluZ18xKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdG9TdHJpbmdfMS5jYWxsKE8pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHJlc3VsdCkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdmFsdWVPZiA9IE8udmFsdWVPZjtcbiAgICAgICAgICAgICAgICBpZiAoSXNDYWxsYWJsZSh2YWx1ZU9mKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdmFsdWVPZi5jYWxsKE8pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHJlc3VsdCkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZU9mID0gTy52YWx1ZU9mO1xuICAgICAgICAgICAgICAgIGlmIChJc0NhbGxhYmxlKHZhbHVlT2YpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWx1ZU9mLmNhbGwoTyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghSXNPYmplY3QocmVzdWx0KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB0b1N0cmluZ18yID0gTy50b1N0cmluZztcbiAgICAgICAgICAgICAgICBpZiAoSXNDYWxsYWJsZSh0b1N0cmluZ18yKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdG9TdHJpbmdfMi5jYWxsKE8pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHJlc3VsdCkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyA3LjEuMiBUb0Jvb2xlYW4oYXJndW1lbnQpXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8yMDE2LyNzZWMtdG9ib29sZWFuXG4gICAgICAgIGZ1bmN0aW9uIFRvQm9vbGVhbihhcmd1bWVudCkge1xuICAgICAgICAgICAgcmV0dXJuICEhYXJndW1lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNy4xLjEyIFRvU3RyaW5nKGFyZ3VtZW50KVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy10b3N0cmluZ1xuICAgICAgICBmdW5jdGlvbiBUb1N0cmluZyhhcmd1bWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiXCIgKyBhcmd1bWVudDtcbiAgICAgICAgfVxuICAgICAgICAvLyA3LjEuMTQgVG9Qcm9wZXJ0eUtleShhcmd1bWVudClcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtdG9wcm9wZXJ0eWtleVxuICAgICAgICBmdW5jdGlvbiBUb1Byb3BlcnR5S2V5KGFyZ3VtZW50KSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gVG9QcmltaXRpdmUoYXJndW1lbnQsIDMgLyogU3RyaW5nICovKTtcbiAgICAgICAgICAgIGlmIChJc1N5bWJvbChrZXkpKVxuICAgICAgICAgICAgICAgIHJldHVybiBrZXk7XG4gICAgICAgICAgICByZXR1cm4gVG9TdHJpbmcoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICAvLyA3LjIgVGVzdGluZyBhbmQgQ29tcGFyaXNvbiBPcGVyYXRpb25zXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLXRlc3RpbmctYW5kLWNvbXBhcmlzb24tb3BlcmF0aW9uc1xuICAgICAgICAvLyA3LjIuMiBJc0FycmF5KGFyZ3VtZW50KVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1pc2FycmF5XG4gICAgICAgIGZ1bmN0aW9uIElzQXJyYXkoYXJndW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5XG4gICAgICAgICAgICAgICAgPyBBcnJheS5pc0FycmF5KGFyZ3VtZW50KVxuICAgICAgICAgICAgICAgIDogYXJndW1lbnQgaW5zdGFuY2VvZiBPYmplY3RcbiAgICAgICAgICAgICAgICAgICAgPyBhcmd1bWVudCBpbnN0YW5jZW9mIEFycmF5XG4gICAgICAgICAgICAgICAgICAgIDogT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3VtZW50KSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xuICAgICAgICB9XG4gICAgICAgIC8vIDcuMi4zIElzQ2FsbGFibGUoYXJndW1lbnQpXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWlzY2FsbGFibGVcbiAgICAgICAgZnVuY3Rpb24gSXNDYWxsYWJsZShhcmd1bWVudCkge1xuICAgICAgICAgICAgLy8gTk9URTogVGhpcyBpcyBhbiBhcHByb3hpbWF0aW9uIGFzIHdlIGNhbm5vdCBjaGVjayBmb3IgW1tDYWxsXV0gaW50ZXJuYWwgbWV0aG9kLlxuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBhcmd1bWVudCA9PT0gXCJmdW5jdGlvblwiO1xuICAgICAgICB9XG4gICAgICAgIC8vIDcuMi40IElzQ29uc3RydWN0b3IoYXJndW1lbnQpXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWlzY29uc3RydWN0b3JcbiAgICAgICAgZnVuY3Rpb24gSXNDb25zdHJ1Y3Rvcihhcmd1bWVudCkge1xuICAgICAgICAgICAgLy8gTk9URTogVGhpcyBpcyBhbiBhcHByb3hpbWF0aW9uIGFzIHdlIGNhbm5vdCBjaGVjayBmb3IgW1tDb25zdHJ1Y3RdXSBpbnRlcm5hbCBtZXRob2QuXG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIGFyZ3VtZW50ID09PSBcImZ1bmN0aW9uXCI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNy4yLjcgSXNQcm9wZXJ0eUtleShhcmd1bWVudClcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtaXNwcm9wZXJ0eWtleVxuICAgICAgICBmdW5jdGlvbiBJc1Byb3BlcnR5S2V5KGFyZ3VtZW50KSB7XG4gICAgICAgICAgICBzd2l0Y2ggKFR5cGUoYXJndW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAzIC8qIFN0cmluZyAqLzogcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgY2FzZSA0IC8qIFN5bWJvbCAqLzogcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIDcuMyBPcGVyYXRpb25zIG9uIE9iamVjdHNcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtb3BlcmF0aW9ucy1vbi1vYmplY3RzXG4gICAgICAgIC8vIDcuMy45IEdldE1ldGhvZChWLCBQKVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1nZXRtZXRob2RcbiAgICAgICAgZnVuY3Rpb24gR2V0TWV0aG9kKFYsIFApIHtcbiAgICAgICAgICAgIHZhciBmdW5jID0gVltQXTtcbiAgICAgICAgICAgIGlmIChmdW5jID09PSB1bmRlZmluZWQgfHwgZnVuYyA9PT0gbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKCFJc0NhbGxhYmxlKGZ1bmMpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgIHJldHVybiBmdW5jO1xuICAgICAgICB9XG4gICAgICAgIC8vIDcuNCBPcGVyYXRpb25zIG9uIEl0ZXJhdG9yIE9iamVjdHNcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtb3BlcmF0aW9ucy1vbi1pdGVyYXRvci1vYmplY3RzXG4gICAgICAgIGZ1bmN0aW9uIEdldEl0ZXJhdG9yKG9iaikge1xuICAgICAgICAgICAgdmFyIG1ldGhvZCA9IEdldE1ldGhvZChvYmosIGl0ZXJhdG9yU3ltYm9sKTtcbiAgICAgICAgICAgIGlmICghSXNDYWxsYWJsZShtZXRob2QpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTsgLy8gZnJvbSBDYWxsXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBtZXRob2QuY2FsbChvYmopO1xuICAgICAgICAgICAgaWYgKCFJc09iamVjdChpdGVyYXRvcikpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yO1xuICAgICAgICB9XG4gICAgICAgIC8vIDcuNC40IEl0ZXJhdG9yVmFsdWUoaXRlclJlc3VsdClcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLzIwMTYvI3NlYy1pdGVyYXRvcnZhbHVlXG4gICAgICAgIGZ1bmN0aW9uIEl0ZXJhdG9yVmFsdWUoaXRlclJlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZXJSZXN1bHQudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNy40LjUgSXRlcmF0b3JTdGVwKGl0ZXJhdG9yKVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1pdGVyYXRvcnN0ZXBcbiAgICAgICAgZnVuY3Rpb24gSXRlcmF0b3JTdGVwKGl0ZXJhdG9yKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5kb25lID8gZmFsc2UgOiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNy40LjYgSXRlcmF0b3JDbG9zZShpdGVyYXRvciwgY29tcGxldGlvbilcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtaXRlcmF0b3JjbG9zZVxuICAgICAgICBmdW5jdGlvbiBJdGVyYXRvckNsb3NlKGl0ZXJhdG9yKSB7XG4gICAgICAgICAgICB2YXIgZiA9IGl0ZXJhdG9yW1wicmV0dXJuXCJdO1xuICAgICAgICAgICAgaWYgKGYpXG4gICAgICAgICAgICAgICAgZi5jYWxsKGl0ZXJhdG9yKTtcbiAgICAgICAgfVxuICAgICAgICAvLyA5LjEgT3JkaW5hcnkgT2JqZWN0IEludGVybmFsIE1ldGhvZHMgYW5kIEludGVybmFsIFNsb3RzXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLW9yZGluYXJ5LW9iamVjdC1pbnRlcm5hbC1tZXRob2RzLWFuZC1pbnRlcm5hbC1zbG90c1xuICAgICAgICAvLyA5LjEuMS4xIE9yZGluYXJ5R2V0UHJvdG90eXBlT2YoTylcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtb3JkaW5hcnlnZXRwcm90b3R5cGVvZlxuICAgICAgICBmdW5jdGlvbiBPcmRpbmFyeUdldFByb3RvdHlwZU9mKE8pIHtcbiAgICAgICAgICAgIHZhciBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihPKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgTyAhPT0gXCJmdW5jdGlvblwiIHx8IE8gPT09IGZ1bmN0aW9uUHJvdG90eXBlKVxuICAgICAgICAgICAgICAgIHJldHVybiBwcm90bztcbiAgICAgICAgICAgIC8vIFR5cGVTY3JpcHQgZG9lc24ndCBzZXQgX19wcm90b19fIGluIEVTNSwgYXMgaXQncyBub24tc3RhbmRhcmQuXG4gICAgICAgICAgICAvLyBUcnkgdG8gZGV0ZXJtaW5lIHRoZSBzdXBlcmNsYXNzIGNvbnN0cnVjdG9yLiBDb21wYXRpYmxlIGltcGxlbWVudGF0aW9uc1xuICAgICAgICAgICAgLy8gbXVzdCBlaXRoZXIgc2V0IF9fcHJvdG9fXyBvbiBhIHN1YmNsYXNzIGNvbnN0cnVjdG9yIHRvIHRoZSBzdXBlcmNsYXNzIGNvbnN0cnVjdG9yLFxuICAgICAgICAgICAgLy8gb3IgZW5zdXJlIGVhY2ggY2xhc3MgaGFzIGEgdmFsaWQgYGNvbnN0cnVjdG9yYCBwcm9wZXJ0eSBvbiBpdHMgcHJvdG90eXBlIHRoYXRcbiAgICAgICAgICAgIC8vIHBvaW50cyBiYWNrIHRvIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgbm90IHRoZSBzYW1lIGFzIEZ1bmN0aW9uLltbUHJvdG90eXBlXV0sIHRoZW4gdGhpcyBpcyBkZWZpbmF0ZWx5IGluaGVyaXRlZC5cbiAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIGNhc2Ugd2hlbiBpbiBFUzYgb3Igd2hlbiB1c2luZyBfX3Byb3RvX18gaW4gYSBjb21wYXRpYmxlIGJyb3dzZXIuXG4gICAgICAgICAgICBpZiAocHJvdG8gIT09IGZ1bmN0aW9uUHJvdG90eXBlKVxuICAgICAgICAgICAgICAgIHJldHVybiBwcm90bztcbiAgICAgICAgICAgIC8vIElmIHRoZSBzdXBlciBwcm90b3R5cGUgaXMgT2JqZWN0LnByb3RvdHlwZSwgbnVsbCwgb3IgdW5kZWZpbmVkLCB0aGVuIHdlIGNhbm5vdCBkZXRlcm1pbmUgdGhlIGhlcml0YWdlLlxuICAgICAgICAgICAgdmFyIHByb3RvdHlwZSA9IE8ucHJvdG90eXBlO1xuICAgICAgICAgICAgdmFyIHByb3RvdHlwZVByb3RvID0gcHJvdG90eXBlICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihwcm90b3R5cGUpO1xuICAgICAgICAgICAgaWYgKHByb3RvdHlwZVByb3RvID09IG51bGwgfHwgcHJvdG90eXBlUHJvdG8gPT09IE9iamVjdC5wcm90b3R5cGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3RvO1xuICAgICAgICAgICAgLy8gSWYgdGhlIGNvbnN0cnVjdG9yIHdhcyBub3QgYSBmdW5jdGlvbiwgdGhlbiB3ZSBjYW5ub3QgZGV0ZXJtaW5lIHRoZSBoZXJpdGFnZS5cbiAgICAgICAgICAgIHZhciBjb25zdHJ1Y3RvciA9IHByb3RvdHlwZVByb3RvLmNvbnN0cnVjdG9yO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25zdHJ1Y3RvciAhPT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgIHJldHVybiBwcm90bztcbiAgICAgICAgICAgIC8vIElmIHdlIGhhdmUgc29tZSBraW5kIG9mIHNlbGYtcmVmZXJlbmNlLCB0aGVuIHdlIGNhbm5vdCBkZXRlcm1pbmUgdGhlIGhlcml0YWdlLlxuICAgICAgICAgICAgaWYgKGNvbnN0cnVjdG9yID09PSBPKVxuICAgICAgICAgICAgICAgIHJldHVybiBwcm90bztcbiAgICAgICAgICAgIC8vIHdlIGhhdmUgYSBwcmV0dHkgZ29vZCBndWVzcyBhdCB0aGUgaGVyaXRhZ2UuXG4gICAgICAgICAgICByZXR1cm4gY29uc3RydWN0b3I7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbmFpdmUgTWFwIHNoaW1cbiAgICAgICAgZnVuY3Rpb24gQ3JlYXRlTWFwUG9seWZpbGwoKSB7XG4gICAgICAgICAgICB2YXIgY2FjaGVTZW50aW5lbCA9IHt9O1xuICAgICAgICAgICAgdmFyIGFycmF5U2VudGluZWwgPSBbXTtcbiAgICAgICAgICAgIHZhciBNYXBJdGVyYXRvciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBNYXBJdGVyYXRvcihrZXlzLCB2YWx1ZXMsIHNlbGVjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2luZGV4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5cyA9IGtleXM7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcyA9IHZhbHVlcztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0b3IgPSBzZWxlY3RvcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgTWFwSXRlcmF0b3IucHJvdG90eXBlW1wiQEBpdGVyYXRvclwiXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH07XG4gICAgICAgICAgICAgICAgTWFwSXRlcmF0b3IucHJvdG90eXBlW2l0ZXJhdG9yU3ltYm9sXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH07XG4gICAgICAgICAgICAgICAgTWFwSXRlcmF0b3IucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2luZGV4O1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gMCAmJiBpbmRleCA8IHRoaXMuX2tleXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5fc2VsZWN0b3IodGhpcy5fa2V5c1tpbmRleF0sIHRoaXMuX3ZhbHVlc1tpbmRleF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ICsgMSA+PSB0aGlzLl9rZXlzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2luZGV4ID0gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5cyA9IGFycmF5U2VudGluZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzID0gYXJyYXlTZW50aW5lbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2luZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogcmVzdWx0LCBkb25lOiBmYWxzZSB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIE1hcEl0ZXJhdG9yLnByb3RvdHlwZS50aHJvdyA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5faW5kZXggPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5kZXggPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleXMgPSBhcnJheVNlbnRpbmVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzID0gYXJyYXlTZW50aW5lbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIE1hcEl0ZXJhdG9yLnByb3RvdHlwZS5yZXR1cm4gPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2luZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2luZGV4ID0gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlzID0gYXJyYXlTZW50aW5lbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcyA9IGFycmF5U2VudGluZWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHZhbHVlLCBkb25lOiB0cnVlIH07XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWFwSXRlcmF0b3I7XG4gICAgICAgICAgICB9KCkpO1xuICAgICAgICAgICAgcmV0dXJuIC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBNYXAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzID0gW107XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlS2V5ID0gY2FjaGVTZW50aW5lbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVJbmRleCA9IC0yO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTWFwLnByb3RvdHlwZSwgXCJzaXplXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9rZXlzLmxlbmd0aDsgfSxcbiAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAoa2V5KSB7IHJldHVybiB0aGlzLl9maW5kKGtleSwgLyppbnNlcnQqLyBmYWxzZSkgPj0gMDsgfTtcbiAgICAgICAgICAgICAgICBNYXAucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZmluZChrZXksIC8qaW5zZXJ0Ki8gZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXggPj0gMCA/IHRoaXMuX3ZhbHVlc1tpbmRleF0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBNYXAucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2ZpbmQoa2V5LCAvKmluc2VydCovIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXNbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2ZpbmQoa2V5LCAvKmluc2VydCovIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzaXplID0gdGhpcy5fa2V5cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gaW5kZXggKyAxOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5c1tpIC0gMV0gPSB0aGlzLl9rZXlzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlc1tpIC0gMV0gPSB0aGlzLl92YWx1ZXNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlzLmxlbmd0aC0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzLmxlbmd0aC0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gdGhpcy5fY2FjaGVLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZUtleSA9IGNhY2hlU2VudGluZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVJbmRleCA9IC0yO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5cy5sZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMubGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVLZXkgPSBjYWNoZVNlbnRpbmVsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZUluZGV4ID0gLTI7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBNYXAucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgTWFwSXRlcmF0b3IodGhpcy5fa2V5cywgdGhpcy5fdmFsdWVzLCBnZXRLZXkpOyB9O1xuICAgICAgICAgICAgICAgIE1hcC5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IE1hcEl0ZXJhdG9yKHRoaXMuX2tleXMsIHRoaXMuX3ZhbHVlcywgZ2V0VmFsdWUpOyB9O1xuICAgICAgICAgICAgICAgIE1hcC5wcm90b3R5cGUuZW50cmllcyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBNYXBJdGVyYXRvcih0aGlzLl9rZXlzLCB0aGlzLl92YWx1ZXMsIGdldEVudHJ5KTsgfTtcbiAgICAgICAgICAgICAgICBNYXAucHJvdG90eXBlW1wiQEBpdGVyYXRvclwiXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuZW50cmllcygpOyB9O1xuICAgICAgICAgICAgICAgIE1hcC5wcm90b3R5cGVbaXRlcmF0b3JTeW1ib2xdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5lbnRyaWVzKCk7IH07XG4gICAgICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5fZmluZCA9IGZ1bmN0aW9uIChrZXksIGluc2VydCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2FjaGVLZXkgIT09IGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVJbmRleCA9IHRoaXMuX2tleXMuaW5kZXhPZih0aGlzLl9jYWNoZUtleSA9IGtleSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2NhY2hlSW5kZXggPCAwICYmIGluc2VydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVJbmRleCA9IHRoaXMuX2tleXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5cy5wdXNoKGtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMucHVzaCh1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYWNoZUluZGV4O1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hcDtcbiAgICAgICAgICAgIH0oKSk7XG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRLZXkoa2V5LCBfKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldFZhbHVlKF8sIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0RW50cnkoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBba2V5LCB2YWx1ZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gbmFpdmUgU2V0IHNoaW1cbiAgICAgICAgZnVuY3Rpb24gQ3JlYXRlU2V0UG9seWZpbGwoKSB7XG4gICAgICAgICAgICByZXR1cm4gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIFNldCgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFwID0gbmV3IF9NYXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNldC5wcm90b3R5cGUsIFwic2l6ZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fbWFwLnNpemU7IH0sXG4gICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFNldC5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB0aGlzLl9tYXAuaGFzKHZhbHVlKTsgfTtcbiAgICAgICAgICAgICAgICBTZXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gdGhpcy5fbWFwLnNldCh2YWx1ZSwgdmFsdWUpLCB0aGlzOyB9O1xuICAgICAgICAgICAgICAgIFNldC5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB0aGlzLl9tYXAuZGVsZXRlKHZhbHVlKTsgfTtcbiAgICAgICAgICAgICAgICBTZXQucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkgeyB0aGlzLl9tYXAuY2xlYXIoKTsgfTtcbiAgICAgICAgICAgICAgICBTZXQucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9tYXAua2V5cygpOyB9O1xuICAgICAgICAgICAgICAgIFNldC5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fbWFwLnZhbHVlcygpOyB9O1xuICAgICAgICAgICAgICAgIFNldC5wcm90b3R5cGUuZW50cmllcyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX21hcC5lbnRyaWVzKCk7IH07XG4gICAgICAgICAgICAgICAgU2V0LnByb3RvdHlwZVtcIkBAaXRlcmF0b3JcIl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLmtleXMoKTsgfTtcbiAgICAgICAgICAgICAgICBTZXQucHJvdG90eXBlW2l0ZXJhdG9yU3ltYm9sXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMua2V5cygpOyB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBTZXQ7XG4gICAgICAgICAgICB9KCkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIG5haXZlIFdlYWtNYXAgc2hpbVxuICAgICAgICBmdW5jdGlvbiBDcmVhdGVXZWFrTWFwUG9seWZpbGwoKSB7XG4gICAgICAgICAgICB2YXIgVVVJRF9TSVpFID0gMTY7XG4gICAgICAgICAgICB2YXIga2V5cyA9IEhhc2hNYXAuY3JlYXRlKCk7XG4gICAgICAgICAgICB2YXIgcm9vdEtleSA9IENyZWF0ZVVuaXF1ZUtleSgpO1xuICAgICAgICAgICAgcmV0dXJuIC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBXZWFrTWFwKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXkgPSBDcmVhdGVVbmlxdWVLZXkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgV2Vha01hcC5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGFibGUgPSBHZXRPckNyZWF0ZVdlYWtNYXBUYWJsZSh0YXJnZXQsIC8qY3JlYXRlKi8gZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFibGUgIT09IHVuZGVmaW5lZCA/IEhhc2hNYXAuaGFzKHRhYmxlLCB0aGlzLl9rZXkpIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBXZWFrTWFwLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0YWJsZSA9IEdldE9yQ3JlYXRlV2Vha01hcFRhYmxlKHRhcmdldCwgLypjcmVhdGUqLyBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0YWJsZSAhPT0gdW5kZWZpbmVkID8gSGFzaE1hcC5nZXQodGFibGUsIHRoaXMuX2tleSkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBXZWFrTWFwLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodGFyZ2V0LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGFibGUgPSBHZXRPckNyZWF0ZVdlYWtNYXBUYWJsZSh0YXJnZXQsIC8qY3JlYXRlKi8gdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRhYmxlW3RoaXMuX2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBXZWFrTWFwLnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0YWJsZSA9IEdldE9yQ3JlYXRlV2Vha01hcFRhYmxlKHRhcmdldCwgLypjcmVhdGUqLyBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0YWJsZSAhPT0gdW5kZWZpbmVkID8gZGVsZXRlIHRhYmxlW3RoaXMuX2tleV0gOiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFdlYWtNYXAucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBOT1RFOiBub3QgYSByZWFsIGNsZWFyLCBqdXN0IG1ha2VzIHRoZSBwcmV2aW91cyBkYXRhIHVucmVhY2hhYmxlXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleSA9IENyZWF0ZVVuaXF1ZUtleSgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIFdlYWtNYXA7XG4gICAgICAgICAgICB9KCkpO1xuICAgICAgICAgICAgZnVuY3Rpb24gQ3JlYXRlVW5pcXVlS2V5KCkge1xuICAgICAgICAgICAgICAgIHZhciBrZXk7XG4gICAgICAgICAgICAgICAgZG9cbiAgICAgICAgICAgICAgICAgICAga2V5ID0gXCJAQFdlYWtNYXBAQFwiICsgQ3JlYXRlVVVJRCgpO1xuICAgICAgICAgICAgICAgIHdoaWxlIChIYXNoTWFwLmhhcyhrZXlzLCBrZXkpKTtcbiAgICAgICAgICAgICAgICBrZXlzW2tleV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBHZXRPckNyZWF0ZVdlYWtNYXBUYWJsZSh0YXJnZXQsIGNyZWF0ZSkge1xuICAgICAgICAgICAgICAgIGlmICghaGFzT3duLmNhbGwodGFyZ2V0LCByb290S2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWNyZWF0ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHJvb3RLZXksIHsgdmFsdWU6IEhhc2hNYXAuY3JlYXRlKCkgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0YXJnZXRbcm9vdEtleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBGaWxsUmFuZG9tQnl0ZXMoYnVmZmVyLCBzaXplKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaXplOyArK2kpXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlcltpXSA9IE1hdGgucmFuZG9tKCkgKiAweGZmIHwgMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gYnVmZmVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gR2VuUmFuZG9tQnl0ZXMoc2l6ZSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgVWludDhBcnJheSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY3J5cHRvICE9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQ4QXJyYXkoc2l6ZSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1zQ3J5cHRvICE9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1zQ3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheShzaXplKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBGaWxsUmFuZG9tQnl0ZXMobmV3IFVpbnQ4QXJyYXkoc2l6ZSksIHNpemUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gRmlsbFJhbmRvbUJ5dGVzKG5ldyBBcnJheShzaXplKSwgc2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBDcmVhdGVVVUlEKCkge1xuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gR2VuUmFuZG9tQnl0ZXMoVVVJRF9TSVpFKTtcbiAgICAgICAgICAgICAgICAvLyBtYXJrIGFzIHJhbmRvbSAtIFJGQyA0MTIyIMKnIDQuNFxuICAgICAgICAgICAgICAgIGRhdGFbNl0gPSBkYXRhWzZdICYgMHg0ZiB8IDB4NDA7XG4gICAgICAgICAgICAgICAgZGF0YVs4XSA9IGRhdGFbOF0gJiAweGJmIHwgMHg4MDtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBvZmZzZXQgPSAwOyBvZmZzZXQgPCBVVUlEX1NJWkU7ICsrb2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBieXRlID0gZGF0YVtvZmZzZXRdO1xuICAgICAgICAgICAgICAgICAgICBpZiAob2Zmc2V0ID09PSA0IHx8IG9mZnNldCA9PT0gNiB8fCBvZmZzZXQgPT09IDgpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gXCItXCI7XG4gICAgICAgICAgICAgICAgICAgIGlmIChieXRlIDwgMTYpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gXCIwXCI7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBieXRlLnRvU3RyaW5nKDE2KS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHVzZXMgYSBoZXVyaXN0aWMgdXNlZCBieSB2OCBhbmQgY2hha3JhIHRvIGZvcmNlIGFuIG9iamVjdCBpbnRvIGRpY3Rpb25hcnkgbW9kZS5cbiAgICAgICAgZnVuY3Rpb24gTWFrZURpY3Rpb25hcnkob2JqKSB7XG4gICAgICAgICAgICBvYmouX18gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBkZWxldGUgb2JqLl9fO1xuICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgfVxuICAgIH0pO1xufSkoUmVmbGVjdCB8fCAoUmVmbGVjdCA9IHt9KSk7XG4iLCJpbnRlcmZhY2UgR2FtZURhdGEge1xyXG4gIGludGVyZXN0ZWRJbkZlYXR1cmVzPzogc3RyaW5nW107XHJcbiAgZGVzY3JpcHRpb246IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGVudW0gR2FtZUtleSB7XHJcbiAgTGVhZ3VlT2ZMZWdlbmRzID0gNTQyNixcclxuICBDUzIgPSAyMjczMCxcclxuICBSb2NrZXRMZWFndWUgPSAxMDc5OCxcclxuICBQVUJHID0gMTA5MDYsXHJcbiAgRm9ydG5pdGUgPSAyMTIxNixcclxuICBBcGV4TGVnZW5kcyA9IDIxNTY2LFxyXG4gIFZhbG9yYW50ID0gMjE2NDAsXHJcbiAgQ1NHTyA9IDc3NjRcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IEdhbWVGaWxlTmFtZSA9IHtcclxuICBbR2FtZUtleS5MZWFndWVPZkxlZ2VuZHNdOiAnTGVhZ3VlIE9mIExlZ2VuZHMnLFxyXG4gIFtHYW1lS2V5LkNTMl06ICdDb3VudGVyIFN0cmlrZSAyJyxcclxuICBbR2FtZUtleS5Sb2NrZXRMZWFndWVdOiAnUm9ja2V0IExlYWd1ZScsXHJcbiAgW0dhbWVLZXkuUFVCR106ICdQVUJHJyxcclxuICBbR2FtZUtleS5Gb3J0bml0ZV06ICdGb3J0bml0ZScsXHJcbiAgW0dhbWVLZXkuQXBleExlZ2VuZHNdOiAnQXBleCBMZWdlbmRzJyxcclxuICBbR2FtZUtleS5WYWxvcmFudF06ICdWYWxvcmFudCcsXHJcbiAgW0dhbWVLZXkuQ1NHT106ICdDb3VudGVyIFN0cmlrZSBHTycsXHJcbn1cclxuXHJcbmNvbnN0IGRhdGE6IHsgW2lkOiBudW1iZXJdOiBHYW1lRGF0YSB9ID0ge1xyXG4gIFtHYW1lS2V5LkxlYWd1ZU9mTGVnZW5kc106IHtcclxuICAgIGludGVyZXN0ZWRJbkZlYXR1cmVzOiBbXHJcbiAgICAgICdzdW1tb25lcl9pbmZvJyxcclxuICAgICAgJ2dhbWVNb2RlJyxcclxuICAgICAgJ3RlYW1zJyxcclxuICAgICAgJ21hdGNoU3RhdGUnLFxyXG4gICAgICAna2lsbCcsXHJcbiAgICAgICdkZWF0aCcsXHJcbiAgICAgICdyZXNwYXduJyxcclxuICAgICAgJ2Fzc2lzdCcsXHJcbiAgICAgICdtaW5pb25zJyxcclxuICAgICAgJ2xldmVsJyxcclxuICAgICAgJ2FiaWxpdGllcycsXHJcbiAgICAgICdhbm5vdW5jZXInLFxyXG4gICAgICAnY291bnRlcnMnLFxyXG4gICAgICAnbWF0Y2hfaW5mbycsXHJcbiAgICAgICdkYW1hZ2UnLFxyXG4gICAgICAnaGVhbCcsXHJcbiAgICAgICdsaXZlX2NsaWVudF9kYXRhJyxcclxuICAgICAgJ2p1bmdsZV9jYW1wcycsXHJcbiAgICAgICd0ZWFtX2ZyYW1lcycsXHJcbiAgICBdLFxyXG4gICAgZGVzY3JpcHRpb246ICdMT0wgZGF0YScsXHJcbiAgfSxcclxuICBbR2FtZUtleS5DUzJdOiB7XHJcbiAgICBpbnRlcmVzdGVkSW5GZWF0dXJlczogW1xyXG4gICAgICAnZ2VwX2ludGVybmFsJyxcclxuICAgICAgJ21hdGNoX2luZm8nLFxyXG4gICAgICAnbGl2ZV9kYXRhJyxcclxuICAgIF0sXHJcbiAgICBkZXNjcmlwdGlvbjogJ0NTOkdPIGRhdGEnLFxyXG4gIH0sXHJcbiAgW0dhbWVLZXkuUm9ja2V0TGVhZ3VlXToge1xyXG4gICAgaW50ZXJlc3RlZEluRmVhdHVyZXM6IFtcclxuICAgICAgJ3N0YXRzJyxcclxuICAgICAgJ3Jvc3RlcicsXHJcbiAgICAgICdtYXRjaCcsXHJcbiAgICAgICdtZScsXHJcbiAgICAgICdtYXRjaF9pbmZvJyxcclxuICAgICAgJ2RlYXRoJyxcclxuICAgICAgJ2dhbWVfaW5mbycsXHJcbiAgICBdLFxyXG4gICAgZGVzY3JpcHRpb246ICdSb2NrZXQgbGVhZ3VlIGRhdGEnLFxyXG4gIH0sXHJcbiAgW0dhbWVLZXkuUFVCR106IHtcclxuICAgIGludGVyZXN0ZWRJbkZlYXR1cmVzOiBbXHJcbiAgICAgICdraWxsJyxcclxuICAgICAgJ3Jldml2ZWQnLFxyXG4gICAgICAnZGVhdGgnLFxyXG4gICAgICAna2lsbGVyJyxcclxuICAgICAgJ21hdGNoJyxcclxuICAgICAgJ3JhbmsnLFxyXG4gICAgICAnbG9jYXRpb24nLFxyXG4gICAgICAnbWUnLFxyXG4gICAgICAndGVhbScsXHJcbiAgICAgICdwaGFzZScsXHJcbiAgICAgICdtYXAnLFxyXG4gICAgICAncm9zdGVyJyxcclxuICAgICAgJ2ludmVudG9yeScsXHJcbiAgICAgICdtYXRjaF9pbmZvJyxcclxuICAgICAgJ2NvdW50ZXJzJyxcclxuICAgIF0sXHJcbiAgICBkZXNjcmlwdGlvbjogJ1BVQkcgZGF0YScsXHJcbiAgfSxcclxuICBbR2FtZUtleS5Gb3J0bml0ZV06IHtcclxuICAgIGludGVyZXN0ZWRJbkZlYXR1cmVzOiBbXHJcbiAgICAgICdraWxsJyxcclxuICAgICAgJ2tpbGxlZCcsXHJcbiAgICAgICdraWxsZXInLFxyXG4gICAgICAncmV2aXZlZCcsXHJcbiAgICAgICdkZWF0aCcsXHJcbiAgICAgICdtYXRjaCcsXHJcbiAgICAgICdyYW5rJyxcclxuICAgICAgJ21lJyxcclxuICAgICAgJ3BoYXNlJyxcclxuICAgICAgJ2xvY2F0aW9uJyxcclxuICAgICAgJ3Jvc3RlcicsXHJcbiAgICAgICd0ZWFtJyxcclxuICAgICAgJ2l0ZW1zJyxcclxuICAgICAgJ2NvdW50ZXJzJyxcclxuICAgICAgJ21hdGNoX2luZm8nLFxyXG4gICAgICAnbWFwJyxcclxuICAgIF0sXHJcbiAgICBkZXNjcmlwdGlvbjogJ0ZvcnRuaXRlIGRhdGEnLFxyXG4gIH0sXHJcbiAgW0dhbWVLZXkuQXBleExlZ2VuZHNdOiB7XHJcbiAgICBpbnRlcmVzdGVkSW5GZWF0dXJlczogW1xyXG4gICAgICAnZGVhdGgnLFxyXG4gICAgICAna2lsbCcsXHJcbiAgICAgICdtYXRjaF9zdGF0ZScsXHJcbiAgICAgICdtZScsXHJcbiAgICAgICdyZXZpdmUnLFxyXG4gICAgICAndGVhbScsXHJcbiAgICAgICdyb3N0ZXInLFxyXG4gICAgICAna2lsbF9mZWVkJyxcclxuICAgICAgJ3JhbmsnLFxyXG4gICAgICAnbWF0Y2hfc3VtbWFyeScsXHJcbiAgICAgICdsb2NhdGlvbicsXHJcbiAgICAgICdtYXRjaF9pbmZvJyxcclxuICAgICAgJ3ZpY3RvcnknLFxyXG4gICAgICAnZGFtYWdlJyxcclxuICAgICAgJ2ludmVudG9yeScsXHJcbiAgICAgICdsb2NhbGl6YXRpb24nLFxyXG4gICAgXSxcclxuICAgIGRlc2NyaXB0aW9uOiAnQXBleCBkYXRhJyxcclxuICB9LFxyXG4gIFtHYW1lS2V5LlZhbG9yYW50XToge1xyXG4gICAgaW50ZXJlc3RlZEluRmVhdHVyZXM6IFtcclxuICAgICAgJ2dhbWVfaW5mbycsXHJcbiAgICAgICdtZScsXHJcbiAgICAgICdtYXRjaF9pbmZvJyxcclxuICAgICAgJ2tpbGwnLFxyXG4gICAgICAnZGVhdGgnLFxyXG4gICAgICAnZ2VwX2ludGVybmFsJyxcclxuICAgIF0sXHJcbiAgICBkZXNjcmlwdGlvbjogJ1ZhbG9yYW50IGRhdGEnLFxyXG4gIH0sXHJcbiAgW0dhbWVLZXkuQ1NHT106IHtcclxuICAgIGludGVyZXN0ZWRJbkZlYXR1cmVzOiBbXHJcbiAgICAgICdraWxsJyxcclxuICAgICAgJ2RlYXRoJyxcclxuICAgICAgJ2Fzc2lzdCcsXHJcbiAgICAgICdoZWFkc2hvdCcsXHJcbiAgICAgICdyb3VuZF9zdGFydCcsXHJcbiAgICAgICdtYXRjaF9zdGFydCcsXHJcbiAgICAgICdtYXRjaF9lbmQnLFxyXG4gICAgICAndGVhbV9yb3VuZF93aW4nLFxyXG4gICAgICAnYm9tYl9wbGFudGVkJyxcclxuICAgICAgJ2JvbWJfY2hhbmdlJyxcclxuICAgICAgJ3JlbG9hZGluZycsXHJcbiAgICAgICdmaXJlZCcsXHJcbiAgICAgICd3ZWFwb25fY2hhbmdlJyxcclxuICAgICAgJ3dlYXBvbl9hY3F1aXJlZCcsXHJcbiAgICAgICdwbGF5ZXJfYWN0aXZpdHlfY2hhbmdlJyxcclxuICAgICAgJ3RlYW1fc2V0JyxcclxuICAgICAgJ2luZm8nLFxyXG4gICAgICAncm9zdGVyJyxcclxuICAgICAgJ3NjZW5lJyxcclxuICAgICAgJ21hdGNoX2luZm8nLFxyXG4gICAgICAncmVwbGF5JyxcclxuICAgICAgJ2NvdW50ZXJzJyxcclxuICAgICAgJ212cCcsXHJcbiAgICAgICdraWxsX2ZlZWQnLFxyXG4gICAgICAnc2NvcmVib2FyZCcsXHJcbiAgICAgICdzY29yZScsXHJcbiAgICBdLFxyXG4gICAgZGVzY3JpcHRpb246ICdDUzpHTyBkYXRhJyxcclxuICB9LFxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGF0YTtcclxuIiwiLy8gdXNlIGh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCBmb3IgZGV2IG1vZGVcclxuLy8gdXNlIGh0dHBzOi8vb3ZlcndvbGYtZHVlbC1hcGktMjA3MDc3ZGQ0YTA5Lmhlcm9rdWFwcC5jb20gZm9yIHByb2RcclxuXHJcbmV4cG9ydCBjb25zdCBlbnZpcm9ubWVudCA9IHtcclxuICB1cmw6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnLFxyXG59O1xyXG4iLCJpbXBvcnQgJ3JlZmxlY3QtbWV0YWRhdGEnO1xyXG5pbXBvcnQgeyBjb250YWluZXIsIGluamVjdGFibGUgfSBmcm9tICd0c3lyaW5nZSc7XHJcbmltcG9ydCBnYW1lRGF0YSBmcm9tICcuL2NvbmZpZy9nYW1lLWRhdGEnO1xyXG5pbXBvcnQgeyBHRVBTZXJ2aWNlIH0gZnJvbSAnLi9zZXJ2aWNlcy9nZXAtc2VydmljZSc7XHJcbmltcG9ydCB7IEdhbWVEZXRlY3Rpb25TZXJ2aWNlIH0gZnJvbSAnLi9zZXJ2aWNlcy9nYW1lLWRldGVjdGlvbi1zZXJ2aWNlJztcclxuaW1wb3J0IHtcclxuICBHYW1lQ2xvc2VkRXZlbnQsXHJcbiAgR2FtZUxhdW5jaGVkRXZlbnQsXHJcbiAgUG9zdEdhbWVFdmVudCxcclxufSBmcm9tICcuL2ludGVyZmFjZXMvcnVubmluZy1nYW1lJztcclxuaW1wb3J0IHsgR0VQQ29uc3VtZXIgfSBmcm9tICcuL3NlcnZpY2VzL2dlcC1jb25zdW1lcic7XHJcbmltcG9ydCB7IEF1dGhTZXJ2aWNlIH0gZnJvbSAnLi9zZXJ2aWNlcy9hdXRoLXNlcnZpY2UnO1xyXG5cclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuQGluamVjdGFibGUoKVxyXG5leHBvcnQgY2xhc3MgTWFpbiB7XHJcbiAgbG9naW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlzY29yZC1idXR0b24nKTtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBnZXBTZXJ2aWNlOiBHRVBTZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBnZXBDb25zdW1lcjogR0VQQ29uc3VtZXIsXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGdhbWVEZXRlY3Rpb25TZXJ2aWNlOiBHYW1lRGV0ZWN0aW9uU2VydmljZSxcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgYXV0aFNlcnZpY2U6IEF1dGhTZXJ2aWNlLFxyXG4gICkge1xyXG4gICAgdGhpcy5sb2dpbkJ1dHRvbj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgIHRoaXMuYXV0aFNlcnZpY2UubG9naW4oKTtcclxuICAgIH0pO1xyXG4gICAgdGhpcy5pbml0KCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGlzIGFwcFxyXG4gICAqL1xyXG4gIHB1YmxpYyBpbml0KCk6IHZvaWQge1xyXG4gICAgLy8gUmVnaXN0ZXIgZm9yIHRoZSBgZ2FtZUxhdW5jaGVkYCBldmVudCBmcm9tIHRoZSBnYW1lIGRldGVjdGlvbiBzZXJ2aWNlXHJcbiAgICB0aGlzLmdhbWVEZXRlY3Rpb25TZXJ2aWNlLm9uKFxyXG4gICAgICAnZ2FtZUxhdW5jaGVkJyxcclxuICAgICAgKGdhbWVMYXVuY2g6IEdhbWVMYXVuY2hlZEV2ZW50KSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYEdhbWUgd2FzIGxhdW5jaGVkOiAke2dhbWVMYXVuY2gubmFtZX0gJHtnYW1lTGF1bmNoLmlkfWApO1xyXG4gICAgICAgIC8vIEdldCB0aGUgY29uZmlndXJlZCBkYXRhIGZvciB0aGUgbGF1bmNoZWQgZ2FtZVxyXG4gICAgICAgIGNvbnN0IGdhbWVDb25maWcgPSBnYW1lRGF0YVtnYW1lTGF1bmNoLmlkXTtcclxuICAgICAgICAvLyBJZiB0aGUgZGV0ZWN0ZWQgZ2FtZSBleGlzdHNcclxuICAgICAgICBpZiAoZ2FtZUNvbmZpZykge1xyXG4gICAgICAgICAgdGhpcy5nZXBTZXJ2aWNlLmdhbWVMYXVuY2hJZCA9IGdhbWVMYXVuY2guaWQ7XHJcbiAgICAgICAgICAvLyBSdW4gdGhlIGdhbWUgbGF1bmNoZWQgbG9naWMgb2YgdGhlIGdlcCBzZXJ2aWNlXHJcbiAgICAgICAgICB0aGlzLmdlcFNlcnZpY2Uub25HYW1lTGF1bmNoZWQoZ2FtZUNvbmZpZy5pbnRlcmVzdGVkSW5GZWF0dXJlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgKTtcclxuICAgIC8vIFJlZ2lzdGVyIGZvciB0aGUgYGdhbWVDbG9zZWRgIGV2ZW50IGZyb20gdGhlIGdhbWVEZXRlY3Rpb25TZXJ2aWNlXHJcbiAgICB0aGlzLmdhbWVEZXRlY3Rpb25TZXJ2aWNlLm9uKFxyXG4gICAgICAnZ2FtZUNsb3NlZCcsXHJcbiAgICAgIChnYW1lQ2xvc2VkOiBHYW1lQ2xvc2VkRXZlbnQpID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgR2FtZSB3YXMgY2xvc2VkOiAke2dhbWVDbG9zZWQubmFtZX1gKTtcclxuICAgICAgICAvLyBSdW4gZ2FtZSBjbG9zZWQgY2xlYW51cCBvZiB0aGUgZ2VwIHNlcnZpY2VcclxuICAgICAgICB0aGlzLmdlcFNlcnZpY2Uub25HYW1lQ2xvc2VkKCk7XHJcbiAgICAgIH0sXHJcbiAgICApO1xyXG4gICAgLy8gUmVnaXN0ZXIgZm9yIHRoZSBgcG9zdEdhbWVgIGV2ZW50IGZyb20gdGhlIGdhbWVEZXRlY3Rpb25TZXJ2aWNlXHJcbiAgICB0aGlzLmdhbWVEZXRlY3Rpb25TZXJ2aWNlLm9uKCdwb3N0R2FtZScsIChwb3N0R2FtZTogUG9zdEdhbWVFdmVudCkgPT4ge1xyXG4gICAgICBjb25zb2xlLmxvZyhgUnVubmluZyBwb3N0LWdhbWUgbG9naWMgZm9yIGdhbWU6ICR7cG9zdEdhbWUubmFtZX1gKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFJlZ2lzdGVyIGZvciB0aGUgYGdhbWVFdmVudGAsIGBpbmZvVXBkYXRlYCwgYW5kIGBlcnJvcmAgZ2VwU2VydmljZSBldmVudHNcclxuICAgIHRoaXMuZ2VwU2VydmljZS5vbignZ2FtZUV2ZW50JywgdGhpcy5nZXBDb25zdW1lci5vbk5ld0dhbWVFdmVudCk7XHJcbiAgICB0aGlzLmdlcFNlcnZpY2Uub24oJ2luZm9VcGRhdGUnLCB0aGlzLmdlcENvbnN1bWVyLm9uR2FtZUluZm9VcGRhdGUpO1xyXG4gICAgdGhpcy5nZXBTZXJ2aWNlLm9uKCdlcnJvcicsIHRoaXMuZ2VwQ29uc3VtZXIub25HRVBFcnJvcik7XHJcblxyXG4gICAgLy8gSGFuZGxlIEV2ZW50cyB0byB3cml0ZSBkYXRhIGludG8gZGF0YWJhc2VcclxuICAgIHRoaXMuZ2VwU2VydmljZS5vbignZ2FtZUV2ZW50JywgdGhpcy5nZXBTZXJ2aWNlLm9uTmV3R2FtZUV2ZW50KTtcclxuICAgIHRoaXMuZ2VwU2VydmljZS5vbignaW5mb1VwZGF0ZScsIHRoaXMuZ2VwU2VydmljZS5vbkdhbWVJbmZvVXBkYXRlKTtcclxuXHJcbiAgICAvLyBJbml0aWFsaXplIHRoZSBnYW1lIGRldGVjdGlvbiBzZXJ2aWNlXHJcbiAgICB0aGlzLmdhbWVEZXRlY3Rpb25TZXJ2aWNlLmluaXQoKTtcclxuICB9XHJcbn1cclxuXHJcbmNvbnRhaW5lci5yZXNvbHZlKE1haW4pO1xyXG4iLCJpbXBvcnQgeyBpbmplY3RhYmxlIH0gZnJvbSAndHN5cmluZ2UnO1xyXG5pbXBvcnQgeyBHYW1lRmlsZU5hbWUgfSBmcm9tICcuLi9jb25maWcvZ2FtZS1kYXRhJztcclxuaW1wb3J0IHsgZW52aXJvbm1lbnQgfSBmcm9tICcuLi9lbnZpcm9ubWVudC9lbnZpcm9ubWVudCc7XHJcblxyXG5pbnRlcmZhY2UgVG9rZW5SZXNwb25zZSB7XHJcbiAgYWNjZXNzX3Rva2VuOiBzdHJpbmc7XHJcbiAgdG9rZW5fdHlwZTogc3RyaW5nO1xyXG4gIGV4cGlyZXNfaW46IG51bWJlcjtcclxuICBzY29wZTogc3RyaW5nO1xyXG59XHJcblxyXG5AaW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBBdXRoU2VydmljZSB7XHJcbiAgY29uc3RydWN0b3IoKSB7fVxyXG5cclxuICBnZXRVc2VyKCk6IHZvaWQge31cclxuXHJcbiAgYXN5bmMgbG9naW4oKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGVudmlyb25tZW50LnVybCArICcvYXV0aC9kaXNjb3JkL2xvZ2luJywge1xyXG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmVzcG9uc2UuanNvbigpLnRoZW4oKGRhdGEpID0+IHtcclxuICAgICAgICBvdmVyd29sZi51dGlscy5vcGVuVXJsSW5EZWZhdWx0QnJvd3NlcihkYXRhLnVybCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvcjonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcclxuaW1wb3J0IHsgaW5qZWN0YWJsZSB9IGZyb20gJ3RzeXJpbmdlJztcclxuaW1wb3J0IHtcclxuICBHYW1lQ2xvc2VkRXZlbnQsXHJcbiAgR2FtZUxhdW5jaGVkRXZlbnQsXHJcbiAgUG9zdEdhbWVFdmVudCxcclxuICBSdW5uaW5nR2FtZSxcclxufSBmcm9tICcuLi9pbnRlcmZhY2VzL3J1bm5pbmctZ2FtZSc7XHJcblxyXG5AaW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBHYW1lRGV0ZWN0aW9uU2VydmljZSBleHRlbmRzIEV2ZW50RW1pdHRlciB7XHJcbiAgLyoqXHJcbiAgICogVGhlIGN1cnJlbnRseSBydW5uaW5nIGdhbWUgKGlmIGFueSlcclxuICAgKi9cclxuICBwcml2YXRlIF9ydW5uaW5nR2FtZT86IFJ1bm5pbmdHYW1lID0gdW5kZWZpbmVkO1xyXG5cclxuICAvKipcclxuICAgKiBTZXR1cCBHYW1lIERldGVjdGlvbiBsaXN0ZW5lcnNcclxuICAgKi9cclxuICBwdWJsaWMgaW5pdCgpIHtcclxuICAgIC8vIFJlZ2lzdGVyIGxpc3RlbmVyIGZvciBydW5uaW5nIGdhbWUgaW5mbyBjaGFuZ2VkXHJcbiAgICBvdmVyd29sZi5nYW1lcy5vbkdhbWVJbmZvVXBkYXRlZC5hZGRMaXN0ZW5lcigodXBkYXRlKSA9PlxyXG4gICAgICB0aGlzLmdhbWVVcGRhdGVkKHVwZGF0ZSksXHJcbiAgICApO1xyXG4gICAgLy8gR2V0IHRoZSBjdXJyZW50bHkgcnVubmluZyBnYW1lIChpZiBhbnkpXHJcbiAgICBvdmVyd29sZi5nYW1lcy5nZXRSdW5uaW5nR2FtZUluZm8yKChpbmZvKSA9PiB7XHJcbiAgICAgIC8vIElmIHRoZXJlIGlzIGEgcnVubmluZyBnYW1lLCBydW4gdGhlIG5vbi1mcmVzaCBnYW1lIGxhdW5jaCBsb2dpY1xyXG4gICAgICBpZiAoaW5mby5nYW1lSW5mbz8uaXNSdW5uaW5nKSB0aGlzLmdhbWVMYXVuY2hlZChpbmZvLmdhbWVJbmZvLCBmYWxzZSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJhbiB3aGVuIGEgbmV3IGdhbWUgd2FzIGxhdW5jaGVkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLlJ1bm5pbmdHYW1lSW5mb30gZ2FtZUluZm9cclxuICAgKiAtIFRoZSBHYW1lSW5mbyBvZiB0aGUgbmV3IGdhbWVcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZyZXNoTGF1bmNoXHJcbiAgICogLSBJcyB0aGlzIGEgXCJmcmVzaCBsYXVuY2hcIiwgb3Igd2FzIHRoZSBnYW1lIGFscmVhZHkgb3BlbiBiZWZvcmUgaXQgd2FzXHJcbiAgICogZGV0ZWN0ZWQ/IChGb3IgZXhhbXBsZSwgdGhlIGFwcCBvcGVuZWQgYWZ0ZXIgdGhlIGdhbWUpXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnYW1lTGF1bmNoZWQoXHJcbiAgICBnYW1lSW5mbzogb3ZlcndvbGYuZ2FtZXMuUnVubmluZ0dhbWVJbmZvLFxyXG4gICAgZnJlc2hMYXVuY2g6IGJvb2xlYW4sXHJcbiAgKSB7XHJcbiAgICAvLyBFbnN1cmUgdGhhdCBmcmVzaCBsYXVuY2ggd2FzIG5vdCBjYWxsZWQgd2hpbGUgdGhlcmUgd2FzIGEgcnVubmluZyBnYW1lXHJcbiAgICBpZiAoZnJlc2hMYXVuY2ggJiYgdGhpcy5fcnVubmluZ0dhbWUpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxlblxyXG4gICAgICAgIGBBIGZyZXNoIGxhdW5jaCB3YXMgY2FsbGVkLCBidXQgYSBydW5uaW5nIGdhbWUgd2FzIGFscmVhZHkgZGV0ZWN0ZWQhIExhdW5jaGVkIFxcYCR7Z2FtZUluZm8udGl0bGV9XFxgLCB3aGlsZSBcXGAke3RoaXMuX3J1bm5pbmdHYW1lLm5hbWV9XFxgIHdhcyBhbHJlYWR5IHJ1bm5pbmdgLFxyXG4gICAgICApO1xyXG5cclxuICAgIC8vIFNldCB0aGUgY3VycmVudGx5IHJ1bm5pbmcgZ2FtZVxyXG4gICAgdGhpcy5fcnVubmluZ0dhbWUgPSB7XHJcbiAgICAgIC8vIEdhbWUgSURcclxuICAgICAgaWQ6IGdhbWVJbmZvLmNsYXNzSWQsXHJcbiAgICAgIC8vIERpc3BsYXkgbmFtZSBvZiB0aGUgZ2FtZVxyXG4gICAgICBuYW1lOiBnYW1lSW5mby50aXRsZSxcclxuICAgIH07XHJcblxyXG4gICAgLy8gQ29uc3RydWN0IHRoZSBgZ2FtZUxhdW5jaGVkYCBldmVudFxyXG4gICAgY29uc3QgZ2FtZUxhdW5jaGVkRXZlbnQ6IEdhbWVMYXVuY2hlZEV2ZW50ID0ge1xyXG4gICAgICAuLi50aGlzLl9ydW5uaW5nR2FtZSxcclxuICAgICAgZnJlc2hMYXVuY2gsXHJcbiAgICB9O1xyXG4gICAgLy8gRW1pdCB0aGUgYGdhbWVMYXVuY2hlZGAgZXZlbnRcclxuICAgIHRoaXMuZW1pdCgnZ2FtZUxhdW5jaGVkJywgZ2FtZUxhdW5jaGVkRXZlbnQpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmFuIHdoZW4gYSBnYW1lIHdhcyBjbG9zZWRcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZnVsbFNodXRkb3duIC0gSXMgdGhpcyBhIGZ1bGwgc2h1dGRvd24gb3Igbm90P1xyXG4gICAqXHJcbiAgICogKkFsdGVybmF0aXZlbHkgLSBkaWQgdGhlIGdhbWUgc2Vzc2lvbiBlbmQsIG9yIGRpZCB0aGUgZ2FtZSBzaW1wbHkgY2hhbmdlPypcclxuICAgKi9cclxuICBwcml2YXRlIGdhbWVDbG9zZWQoZnVsbFNodXRkb3duOiBib29sZWFuKSB7XHJcbiAgICAvLyBFbnN1cmUgdGhhdCB0aGVyZSBpcyBhIGdhbWUgcnVubmluZyBiZWZvcmUgcnVubmluZyBgZ2FtZUNsb3NlZGAgbG9naWNcclxuICAgIGlmICghdGhpcy5fcnVubmluZ0dhbWUpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAnQ2Fubm90IHJ1biBgZ2FtZUNsb3NlZGAgd2hlbiBubyBnYW1lIGlzIGN1cnJlbnRseSBydW5uaW5nIScsXHJcbiAgICAgICk7XHJcblxyXG4gICAgLy8gQ29uc3RydWN0IHRoZSBgZ2FtZUNsb3NlZGAgZXZlbnRcclxuICAgIGNvbnN0IGdhbWVDbG9zZWRFdmVudDogR2FtZUNsb3NlZEV2ZW50ID0ge1xyXG4gICAgICAuLi50aGlzLl9ydW5uaW5nR2FtZSxcclxuICAgIH07XHJcbiAgICAvLyBEZWxldGUgdGhlIGN1cnJlbnRseSBydW5uaW5nIGdhbWVcclxuICAgIHRoaXMuX3J1bm5pbmdHYW1lID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIC8vIEVtaXQgdGhlIGBnYW1lQ2xvc2VkYCBldmVudFxyXG4gICAgdGhpcy5lbWl0KCdnYW1lQ2xvc2VkJywgZ2FtZUNsb3NlZEV2ZW50KTtcclxuXHJcbiAgICAvLyBJZiBwb3N0LWdhbWUgbG9naWMgc2hvdWxkIHJ1biwgZW1pdCB0aGUgYHBvc3RnYW1lYCBldmVudFxyXG4gICAgaWYgKGZ1bGxTaHV0ZG93bikge1xyXG4gICAgICAvLyBDb25zdHJ1Y3QgdGhlIGBwb3N0R2FtZWAgZXZlbnRcclxuICAgICAgY29uc3QgcG9zdEdhbWVFdmVudDogUG9zdEdhbWVFdmVudCA9IHtcclxuICAgICAgICAuLi5nYW1lQ2xvc2VkRXZlbnQsXHJcbiAgICAgIH07XHJcbiAgICAgIC8vIEVtaXQgdGhlIGBwb3N0R2FtZWAgZXZlbnRcclxuICAgICAgdGhpcy5lbWl0KCdwb3N0R2FtZScsIHBvc3RHYW1lRXZlbnQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmFuIHdoZW4gdGhlIGN1cnJlbnRseSBhY3RpdmUgZ2FtZSdzIEdhbWVJbmZvIGlzIHVwZGF0ZWRcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuR2FtZUluZm9VcGRhdGVkRXZlbnR9IHVwZGF0ZUV2ZW50XHJcbiAgICogLSBUaGUgR2FtZUluZm8gdXBkYXRlZCBldmVudFxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2FtZVVwZGF0ZWQodXBkYXRlRXZlbnQ6IG92ZXJ3b2xmLmdhbWVzLkdhbWVJbmZvVXBkYXRlZEV2ZW50KSB7XHJcbiAgICAvKipcclxuICAgICAqIERpZCBhIG5ldyBnYW1lIGp1c3QgZ2V0IGxhdW5jaGVkP1xyXG4gICAgICpcclxuICAgICAqIFRoaXMgY291bGQgdGVjaG5pY2FsbHkgYmUgZG9uZSB1c2luZyBgb3ZlcndvbGYuZ2FtZXMub25HYW1lTGF1bmNoZWRgLlxyXG4gICAgICogSG93ZXZlciwgYXMgd2UgYWxyZWFkeSBuZWVkIHRvIHV0aWxpemUgYG92ZXJ3b2xmLmdhbWVzLm9uR2FtZUluZm9VcGRhdGVkYFxyXG4gICAgICogdG8gZGV0ZWN0IGlmIGEgZ2FtZSB3YXMgdGVybWluYXRlZCwgaXQgaXMgZWFzaWVyIHRvIGp1c3QgdXNlIGl0IGZvciBib3RoLlxyXG4gICAgICovXHJcbiAgICBpZiAoXHJcbiAgICAgIHVwZGF0ZUV2ZW50LnJlYXNvbi5pbmNsdWRlcyhcclxuICAgICAgICBvdmVyd29sZi5nYW1lcy5lbnVtcy5HYW1lSW5mb0NoYW5nZVJlYXNvbi5HYW1lTGF1bmNoZWQsXHJcbiAgICAgIClcclxuICAgICkge1xyXG4gICAgICAvLyBJcyB0aGVyZSBhIGdhbWUgYWxyZWFkeSBydW5uaW5nP1xyXG4gICAgICBpZiAodGhpcy5fcnVubmluZ0dhbWUpIHtcclxuICAgICAgICAvLyBSdW4gZ2FtZSBjbG9zZWQgY2xlYW51cCwgd2l0aG91dCBydW5uaW5nIHBvc3QtZ2FtZSBsb2dpY1xyXG4gICAgICAgIHRoaXMuZ2FtZUNsb3NlZChmYWxzZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qIFJ1biBnYW1lIGxhdW5jaGVkIGxvZ2ljIGZvciB0aGUgbmV3IGxhdW5jaGVkIGdhbWUsIGFzIGEgZnJlc2ggbGF1bmNoLFxyXG4gICAgICAgKiBhcyBpdCB3YXMgZGV0ZWN0ZWQgZnJvbSB0aGUgbW9tZW50IGl0IHdhcyBsYXVuY2hlZFxyXG4gICAgICAgKi9cclxuICAgICAgdGhpcy5nYW1lTGF1bmNoZWQoXHJcbiAgICAgICAgdXBkYXRlRXZlbnQuZ2FtZUluZm8gYXMgb3ZlcndvbGYuZ2FtZXMuUnVubmluZ0dhbWVJbmZvLFxyXG4gICAgICAgIHRydWUsXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICAvLyBJZiB0aGUgZ2FtZSB3YXMgdGVybWluYXRlZFxyXG4gICAgZWxzZSBpZiAoXHJcbiAgICAgIHVwZGF0ZUV2ZW50LnJlYXNvbi5pbmNsdWRlcyhcclxuICAgICAgICBvdmVyd29sZi5nYW1lcy5lbnVtcy5HYW1lSW5mb0NoYW5nZVJlYXNvbi5HYW1lVGVybWluYXRlZCxcclxuICAgICAgKVxyXG4gICAgKSB7XHJcbiAgICAgIC8vIFJ1biBnYW1lIGNsb3NlZCBjbGVhbnVwLCBpbmNsdWRpbmcgcG9zdC1nYW1lIGxvZ2ljXHJcbiAgICAgIHRoaXMuZ2FtZUNsb3NlZCh0cnVlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHRlciBmb3IgdGhlIGN1cnJlbnRseSBhY3RpdmUgZ2FtZVxyXG4gICAqXHJcbiAgICogQHJldHVybnMge251bWJlciB8IHVuZGVmaW5lZH0gVGhlIGN1cnJlbnRseSBydW5uaW5nIGdhbWUgKGlmIGFueSlcclxuICAgKi9cclxuICBwdWJsaWMgY3VycmVudGx5UnVubmluZ0dhbWUoKTogUnVubmluZ0dhbWUgfCB1bmRlZmluZWQge1xyXG4gICAgcmV0dXJuIHRoaXMuX3J1bm5pbmdHYW1lO1xyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBpbmplY3RhYmxlIH0gZnJvbSAndHN5cmluZ2UnO1xyXG5cclxuQGluamVjdGFibGUoKVxyXG5leHBvcnQgY2xhc3MgR0VQQ29uc3VtZXIge1xyXG4gIC8qKlxyXG4gICAqIENvbnN1bWVzIGVycm9ycyBmaXJlZCBieSB0aGUgT3ZlcndvbGYgR0VQXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5FcnJvckV2ZW50fSBlcnJvciAtIEEgZmlyZWQgZXJyb3IgZXZlbnRcclxuICAgKi9cclxuICBwdWJsaWMgb25HRVBFcnJvcihlcnJvcjogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkVycm9yRXZlbnQpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoYEdFUCBFcnJvcjogJHtwcmV0dGlmeShlcnJvcil9YCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdW1lcyBnYW1lIGluZm8gdXBkYXRlcyBmaXJlZCBieSB0aGUgT3ZlcndvbGYgR0VQXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlczJFdmVudDxcclxuICAgKiAgc3RyaW5nLFxyXG4gICAqICBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZTJcclxuICAgKiA+fSBpbmZvIC0gQW4gYXJyYXkgb2YgZmlyZWQgaW5mbyB1cGRhdGVzXHJcbiAgICovXHJcbiAgcHVibGljIG9uR2FtZUluZm9VcGRhdGUoXHJcbiAgICBpbmZvOiBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZXMyRXZlbnQ8XHJcbiAgICAgIHN0cmluZyxcclxuICAgICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGUyXHJcbiAgICA+LFxyXG4gICkge1xyXG4gICAgY29uc29sZS5sb2coYEdhbWUgSW5mbyBDaGFuZ2VkOiAke3ByZXR0aWZ5KGluZm8pfWApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3VtZXMgdGhlIGdhbWUgZXZlbnRzIGZpcmVkIGJ5IHRoZSBPdmVyd29sZiBHRVBcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHN9IGV2ZW50XHJcbiAgICogLSBBbiBhcnJheSBvZiBmaXJlZCBHYW1lIEV2ZW50c1xyXG4gICAqL1xyXG4gIHB1YmxpYyBvbk5ld0dhbWVFdmVudChldmVudDogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHMpIHtcclxuICAgIGNvbnNvbGUubG9nKGBHYW1lIEV2ZW50IEZpcmVkOiAke3ByZXR0aWZ5KGV2ZW50KX1gKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGb3JtYXQvcHJldHRpZnkgR0VQIGRhdGEgZm9yIGxvZ2dpbmcvZGlzcGxheVxyXG4gKlxyXG4gKiBAcGFyYW0ge2FueX0gZGF0YSAtIFRoZSBkYXRhIHRvIGJlIHByZXR0aWZpZWRcclxuICogQHJldHVybnMge3N0cmluZ30gQSBwcmV0dGlmaWVkIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgaW5wdXQgZGF0YVxyXG4gKi9cclxuY29uc3QgcHJldHRpZnkgPSAoZGF0YTogYW55KTogc3RyaW5nID0+IHtcclxuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoZGF0YSwgdW5kZWZpbmVkLCA0KTtcclxufTtcclxuIiwiaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcclxuaW1wb3J0IHsgaW5qZWN0YWJsZSB9IGZyb20gJ3RzeXJpbmdlJztcclxuaW1wb3J0IHsgR2FtZUZpbGVOYW1lLCBHYW1lS2V5IH0gZnJvbSAnLi4vY29uZmlnL2dhbWUtZGF0YSc7XHJcbmltcG9ydCB7IGVudmlyb25tZW50IH0gZnJvbSAnLi4vZW52aXJvbm1lbnQvZW52aXJvbm1lbnQnO1xyXG5cclxuQGluamVjdGFibGUoKVxyXG5leHBvcnQgY2xhc3MgR0VQU2VydmljZSBleHRlbmRzIEV2ZW50RW1pdHRlciB7XHJcbiAgcHJpdmF0ZSBldmVudHM6IGFueSA9IFtdO1xyXG4gIHByaXZhdGUgaW5mbzogYW55ID0gW107XHJcbiAgcHVibGljIGdhbWVMYXVuY2hJZDogbnVsbCB8IG51bWJlciA9IG51bGw7XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgc3VwZXIoKTtcclxuICAgIHRoaXMub25FcnJvckxpc3RlbmVyID0gdGhpcy5vbkVycm9yTGlzdGVuZXIuYmluZCh0aGlzKTtcclxuICAgIHRoaXMub25JbmZvVXBkYXRlTGlzdGVuZXIgPSB0aGlzLm9uSW5mb1VwZGF0ZUxpc3RlbmVyLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLm9uR2FtZUV2ZW50TGlzdGVuZXIgPSB0aGlzLm9uR2FtZUV2ZW50TGlzdGVuZXIuYmluZCh0aGlzKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNhdmUgZGF0YSB0byBkYlxyXG4gICAqXHJcbiAgICovXHJcblxyXG4gIGFzeW5jIHNhdmVUb0RhdGFCYXNlKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZmlsZU5hbWUgPSBHYW1lRmlsZU5hbWVbdGhpcy5nYW1lTGF1bmNoSWQgYXMga2V5b2YgdHlwZW9mIEdhbWVGaWxlTmFtZV07XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZW52aXJvbm1lbnQudXJsLCB7XHJcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgIGRhdGE6IHsgZXZlbnRzOiB0aGlzLmV2ZW50cywgaW5mbzogdGhpcy5pbmZvLCBmaWxlTmFtZTogZmlsZU5hbWUgPyBmaWxlTmFtZSA6IG51bGwgIH0sXHJcbiAgICAgICAgfSksXHJcbiAgICAgIH0pO1xyXG4gICAgICB0aGlzLmV2ZW50cyA9IFtdO1xyXG4gICAgICB0aGlzLmluZm8gPSBbXTtcclxuXHJcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzYXZpbmcgdG8gZGF0YWJhc2U6JywgcmVzcG9uc2Uuc3RhdHVzVGV4dCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdEYXRhIHNhdmVkIHRvIGRhdGFiYXNlOicsIHJlc3VsdCk7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgdGhpcy5ldmVudHMgPSBbXTtcclxuICAgICAgdGhpcy5pbmZvID0gW107XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOicsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3VtZXMgdGhlIGdhbWUgZXZlbnRzIGZpcmVkIGJ5IHRoZSBPdmVyd29sZiBHRVBcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHN9IGV2ZW50XHJcbiAgICogLSBBbiBhcnJheSBvZiBmaXJlZCBHYW1lIEV2ZW50c1xyXG4gICAqL1xyXG4gIHB1YmxpYyBvbk5ld0dhbWVFdmVudChldmVudDogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHMpIHtcclxuICAgIHN3aXRjaCAodGhpcy5nYW1lTGF1bmNoSWQpIHtcclxuICAgICAgY2FzZSBHYW1lS2V5LkFwZXhMZWdlbmRzOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlQXBleExlZ2VuZHNFdmVudHMoZXZlbnQpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEdhbWVLZXkuUm9ja2V0TGVhZ3VlOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlUm9ja2V0TGVhZ3VlRXZlbnRzKGV2ZW50KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBHYW1lS2V5LkZvcnRuaXRlOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlRm9ydG5pdGVFdmVudHMoZXZlbnQpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEdhbWVLZXkuVmFsb3JhbnQ6XHJcbiAgICAgICAgdGhpcy5oYW5kbGVWYWxvcmFudEV2ZW50cyhldmVudCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgR2FtZUtleS5MZWFndWVPZkxlZ2VuZHM6XHJcbiAgICAgICAgdGhpcy5oYW5kbGVMZWFndWVPZkxlZ2VuZHNFdmVudHMoZXZlbnQpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEdhbWVLZXkuUFVCRzpcclxuICAgICAgICB0aGlzLmhhbmRsZVBVQkdFdmVudHMoZXZlbnQpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEdhbWVLZXkuQ1MyOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlQ1MyRXZlbnRzKGV2ZW50KTtcclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN1bWVzIGdhbWUgaW5mbyB1cGRhdGVzIGZpcmVkIGJ5IHRoZSBPdmVyd29sZiBHRVBcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGVzMkV2ZW50PFxyXG4gICAqICBzdHJpbmcsXHJcbiAgICogIG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlMlxyXG4gICAqID59IGluZm8gLSBBbiBhcnJheSBvZiBmaXJlZCBpbmZvIHVwZGF0ZXNcclxuICAgKi9cclxuICBwdWJsaWMgb25HYW1lSW5mb1VwZGF0ZShcclxuICAgIGluZm86IG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlczJFdmVudDxcclxuICAgICAgc3RyaW5nLFxyXG4gICAgICBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZTJcclxuICAgID4sXHJcbiAgKSB7XHJcbiAgICBpZiAoIWluZm8uaW5mbykge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgc3dpdGNoICh0aGlzLmdhbWVMYXVuY2hJZCkge1xyXG4gICAgICBjYXNlIEdhbWVLZXkuUm9ja2V0TGVhZ3VlOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlUm9ja2V0TGVhZ3VlSW5mbyhpbmZvKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBHYW1lS2V5LkZvcnRuaXRlOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlRm9ydG5pdGVJbmZvKGluZm8pO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEdhbWVLZXkuVmFsb3JhbnQ6XHJcbiAgICAgICAgdGhpcy5oYW5kbGVWYWxvcmFudEluZm8oaW5mbyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgR2FtZUtleS5MZWFndWVPZkxlZ2VuZHM6XHJcbiAgICAgICAgdGhpcy5oYW5kbGVMZWFndWVPZkxlZ2VuZHNJbmZvKGluZm8pO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEdhbWVLZXkuUFVCRzpcclxuICAgICAgICB0aGlzLmhhbmRsZVBVQkdJbmZvKGluZm8pO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlIEFwZXggTGVnZW5kcyBldmVudHMgZmlyZWRcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHN9IGV2ZW50XHJcbiAgICogLSBBbiBhcnJheSBvZiBmaXJlZCBHYW1lIEV2ZW50c1xyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlQXBleExlZ2VuZHNFdmVudHMoXHJcbiAgICBldmVudDogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHMsXHJcbiAgKTogdm9pZCB7XHJcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxlblxyXG4gICAgY29uc3Qga2lsbEZlZWRFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKFxyXG4gICAgICAoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAna2lsbF9mZWVkJyxcclxuICAgICk7XHJcbiAgICBpZiAoa2lsbEZlZWRFdmVudCkge1xyXG4gICAgICBjb25zdCBraWxsRmVlZEV2ZW50RGF0YVBhcnNlZCA9IEpTT04ucGFyc2Uoa2lsbEZlZWRFdmVudC5kYXRhKTtcclxuICAgICAgY29uc3QgcmVzdWx0RGF0YSA9IHtcclxuICAgICAgICBsb2NhbF9wbGF5ZXJfbmFtZToga2lsbEZlZWRFdmVudERhdGFQYXJzZWQubG9jYWxfcGxheWVyX25hbWUsXHJcbiAgICAgICAgdmljdGltTmFtZToga2lsbEZlZWRFdmVudERhdGFQYXJzZWQudmljdGltTmFtZSxcclxuICAgICAgICBhY3Rpb246IGtpbGxGZWVkRXZlbnREYXRhUGFyc2VkLmFjdGlvbixcclxuICAgICAgfTtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaChyZXN1bHREYXRhKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1hdGNoRW5kRXZlbnQgPSBldmVudC5ldmVudHMuZmluZChcclxuICAgICAgKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ21hdGNoX2VuZCcsXHJcbiAgICApO1xyXG4gICAgaWYgKG1hdGNoRW5kRXZlbnQgJiYgdGhpcy5ldmVudHMubGVuZ3RoKSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goeyBuYW1lOiBtYXRjaEVuZEV2ZW50Lm5hbWUsIGRhdGE6IHsgZGF0ZTogbmV3IERhdGUoKSB9IH0pO1xyXG4gICAgICB0aGlzLnNhdmVUb0RhdGFCYXNlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGUgUm9ja2V0IExlYWd1ZSBldmVudHMgZmlyZWRcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHN9IGV2ZW50XHJcbiAgICogLSBBbiBhcnJheSBvZiBmaXJlZCBHYW1lIEV2ZW50c1xyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlUm9ja2V0TGVhZ3VlRXZlbnRzKFxyXG4gICAgZXZlbnQ6IG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzLFxyXG4gICk6IHZvaWQge1xyXG4gICAgY29uc3QgZ29hbEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ2dvYWwnKTtcclxuICAgIGlmIChnb2FsRXZlbnQpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaChnb2FsRXZlbnQpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc2NvcmVFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdzY29yZScpO1xyXG4gICAgaWYgKHNjb3JlRXZlbnQpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaChzY29yZUV2ZW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1hdGNoRW5kRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnbWF0Y2hFbmQnKTtcclxuICAgIGlmIChtYXRjaEVuZEV2ZW50ICYmICh0aGlzLmluZm8ubGVuZ3RoIHx8IHRoaXMuZXZlbnRzLmxlbmd0aCkpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaCh7IG5hbWU6IG1hdGNoRW5kRXZlbnQubmFtZSwgZGF0YTogeyBkYXRlOiBuZXcgRGF0ZSgpIH0gfSk7XHJcbiAgICAgIHRoaXMuc2F2ZVRvRGF0YUJhc2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZSBSb2NrZXQgTGVhZ3VlIGluZm8gdXBkYXRlc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZXMyRXZlbnQ8XHJcbiAgICogIHN0cmluZyxcclxuICAgKiAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGUyXHJcbiAgICogPn0gaW5mbyAtIEFuIGFycmF5IG9mIGZpcmVkIGluZm8gdXBkYXRlc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlUm9ja2V0TGVhZ3VlSW5mbyhpbmZvOiBhbnkpIHtcclxuICAgIGlmIChcclxuICAgICAgaW5mby5pbmZvLm1hdGNoU3RhdGUgJiZcclxuICAgICAgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChpbmZvLmluZm8ubWF0Y2hTdGF0ZSwgJ3N0YXJ0ZWQnKSB8fFxyXG4gICAgICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChpbmZvLmluZm8ubWF0Y2hTdGF0ZSwgJ2VuZGVkJykpXHJcbiAgICApIHtcclxuICAgICAgdGhpcy5pbmZvLnB1c2goeyBtYXRjaFN0YXRlOiBpbmZvLmluZm8ubWF0Y2hTdGF0ZSwgZGF0YTogeyBkYXRlOiBuZXcgRGF0ZSgpIH0gfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGluZm8uaW5mby5wbGF5ZXJzSW5mbykge1xyXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgYXJyYXktY2FsbGJhY2stcmV0dXJuXHJcbiAgICAgIE9iamVjdC5rZXlzKGluZm8uaW5mby5wbGF5ZXJzSW5mbykubWFwKChpdGVtKSA9PiB7XHJcbiAgICAgICAgaWYgKGl0ZW0ubWF0Y2goL3BsYXllcihbMC05XSspL2dpKSkge1xyXG4gICAgICAgICAgdGhpcy5pbmZvLnB1c2goaW5mby5pbmZvKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlIEZvcnRuaXRlIGV2ZW50cyBmaXJlZFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvdmVyd29sZi5nYW1lcy5ldmVudHMuTmV3R2FtZUV2ZW50c30gZXZlbnRcclxuICAgKiAtIEFuIGFycmF5IG9mIGZpcmVkIEdhbWUgRXZlbnRzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYW5kbGVGb3J0bml0ZUV2ZW50cyhcclxuICAgIGV2ZW50OiBvdmVyd29sZi5nYW1lcy5ldmVudHMuTmV3R2FtZUV2ZW50cyxcclxuICApOiB2b2lkIHtcclxuICAgIGNvbnN0IGtpbGxlZEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ2tpbGxlZCcpO1xyXG4gICAgaWYgKGtpbGxlZEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goa2lsbGVkRXZlbnQpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGVhdGhFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdkZWF0aCcpO1xyXG4gICAgaWYgKGRlYXRoRXZlbnQpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaChkZWF0aEV2ZW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1hdGNoU3RhcnRFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdtYXRjaFN0YXJ0Jyk7XHJcbiAgICBpZiAobWF0Y2hTdGFydEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goeyBuYW1lOiBtYXRjaFN0YXJ0RXZlbnQubmFtZSwgZGF0YTogeyBkYXRlOiBuZXcgRGF0ZSgpIH0gfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaEVuZEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ21hdGNoRW5kJyk7XHJcbiAgICBpZiAobWF0Y2hFbmRFdmVudCAmJiAodGhpcy5pbmZvLmxlbmd0aCB8fCB0aGlzLmV2ZW50cy5sZW5ndGgpKSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goeyBuYW1lOiBtYXRjaEVuZEV2ZW50Lm5hbWUsIGRhdGE6IHsgZGF0ZTogbmV3IERhdGUoKSB9IH0pO1xyXG4gICAgICB0aGlzLnNhdmVUb0RhdGFCYXNlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGUgRm9ydG5pdGUgaW5mbyB1cGRhdGVzXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlczJFdmVudDxcclxuICAgKiAgc3RyaW5nLFxyXG4gICAqICBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZTJcclxuICAgKiA+fSBpbmZvIC0gQW4gYXJyYXkgb2YgZmlyZWQgaW5mbyB1cGRhdGVzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYW5kbGVGb3J0bml0ZUluZm8oaW5mbzogYW55KSB7XHJcbiAgICBpZiAoXHJcbiAgICAgIGluZm8uaW5mby5tYXRjaF9pbmZvICYmXHJcbiAgICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChpbmZvLmluZm8ubWF0Y2hfaW5mbywgJ3JhbmsnKVxyXG4gICAgKSB7XHJcbiAgICAgIHRoaXMuaW5mby5wdXNoKGluZm8uaW5mbyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGUgVmFsb3JhbnQgZXZlbnRzIGZpcmVkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzfSBldmVudFxyXG4gICAqIC0gQW4gYXJyYXkgb2YgZmlyZWQgR2FtZSBFdmVudHNcclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZVZhbG9yYW50RXZlbnRzKFxyXG4gICAgICBldmVudDogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHMsXHJcbiAgKTogdm9pZCB7XHJcbiAgICBjb25zdCBtYXRjaFN0YXJ0RXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnbWF0Y2hfc3RhcnQnKTtcclxuICAgIGlmIChtYXRjaFN0YXJ0RXZlbnQpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaCh7IG5hbWU6IG1hdGNoU3RhcnRFdmVudC5uYW1lLCBkYXRhOiB7IGRhdGU6IG5ldyBEYXRlKCkgfSB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1hdGNoRW5kRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnbWF0Y2hfZW5kJyk7XHJcbiAgICBpZiAobWF0Y2hFbmRFdmVudCAmJiAodGhpcy5pbmZvLmxlbmd0aCB8fCB0aGlzLmV2ZW50cy5sZW5ndGgpKSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goeyBuYW1lOiBtYXRjaEVuZEV2ZW50Lm5hbWUsIGRhdGE6IHsgZGF0ZTogbmV3IERhdGUoKSB9IH0pO1xyXG4gICAgICB0aGlzLnNhdmVUb0RhdGFCYXNlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGUgVmFsb3JhbnQgaW5mbyB1cGRhdGVzXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlczJFdmVudDxcclxuICAgKiAgc3RyaW5nLFxyXG4gICAqICBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZTJcclxuICAgKiA+fSBpbmZvIC0gQW4gYXJyYXkgb2YgZmlyZWQgaW5mbyB1cGRhdGVzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYW5kbGVWYWxvcmFudEluZm8oaW5mbzogYW55KSB7XHJcbiAgICBpZiAoXHJcbiAgICAgICAgaW5mby5pbmZvLm1hdGNoX2luZm8gJiZcclxuICAgICAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoaW5mby5pbmZvLm1hdGNoX2luZm8sICdraWxsX2ZlZWQnKVxyXG4gICAgKSB7XHJcbiAgICAgIHRoaXMuaW5mby5wdXNoKGluZm8uaW5mbyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGUgTGVhZ3VlIG9mIExlZ2VuZHMgZXZlbnRzIGZpcmVkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzfSBldmVudFxyXG4gICAqIC0gQW4gYXJyYXkgb2YgZmlyZWQgR2FtZSBFdmVudHNcclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZUxlYWd1ZU9mTGVnZW5kc0V2ZW50cyhcclxuICAgICAgZXZlbnQ6IG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzLFxyXG4gICk6IHZvaWQge1xyXG4gICAgY29uc3Qga2lsbEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ2tpbGwnKTtcclxuICAgIGlmIChraWxsRXZlbnQpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaChraWxsRXZlbnQpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGVhdGhFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdkZWF0aCcpO1xyXG4gICAgaWYgKGRlYXRoRXZlbnQpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaChkZWF0aEV2ZW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1hdGNoRW5kRXZlbnQgPSBldmVudC5ldmVudHMuZmluZChcclxuICAgICAgKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ2Fubm91bmNlcicsXHJcbiAgICApO1xyXG4gICAgaWYgKFxyXG4gICAgICBtYXRjaEVuZEV2ZW50ICYmXHJcbiAgICAgICh0aGlzLmluZm8ubGVuZ3RoIHx8IHRoaXMuZXZlbnRzLmxlbmd0aCkgJiZcclxuICAgICAgKG1hdGNoRW5kRXZlbnQuZGF0YS5pbmNsdWRlcygndmljdG9yeScpIHx8XHJcbiAgICAgICAgbWF0Y2hFbmRFdmVudC5kYXRhLmluY2x1ZGVzKCdkZWZlYXQnKSlcclxuICAgICkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKG1hdGNoRW5kRXZlbnQpO1xyXG4gICAgICB0aGlzLnNhdmVUb0RhdGFCYXNlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGUgTGVhZ3VlIG9mIExlZ2VuZHMgaW5mbyB1cGRhdGVzXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlczJFdmVudDxcclxuICAgKiAgc3RyaW5nLFxyXG4gICAqICBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZTJcclxuICAgKiA+fSBpbmZvIC0gQW4gYXJyYXkgb2YgZmlyZWQgaW5mbyB1cGRhdGVzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYW5kbGVMZWFndWVPZkxlZ2VuZHNJbmZvKGluZm86IGFueSkge1xyXG4gICAgaWYgKFxyXG4gICAgICAgIGluZm8uaW5mby5saXZlX2NsaWVudF9kYXRhICYmXHJcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1sZW5cclxuICAgICAgICAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGluZm8uaW5mby5saXZlX2NsaWVudF9kYXRhLCAnYWxsX3BsYXllcnMnKSlcclxuICAgICkge1xyXG4gICAgICB0aGlzLmluZm8ucHVzaChpbmZvLmluZm8pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlIFBVQkcgZXZlbnRzIGZpcmVkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzfSBldmVudFxyXG4gICAqIC0gQW4gYXJyYXkgb2YgZmlyZWQgR2FtZSBFdmVudHNcclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZVBVQkdFdmVudHMoXHJcbiAgICAgIGV2ZW50OiBvdmVyd29sZi5nYW1lcy5ldmVudHMuTmV3R2FtZUV2ZW50cyxcclxuICApOiB2b2lkIHtcclxuICAgIGNvbnN0IGtpbGxFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdraWxsJyk7XHJcbiAgICBpZiAoa2lsbEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goa2lsbEV2ZW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGtpbGxlckV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ2tpbGxlcicpO1xyXG4gICAgaWYgKGtpbGxlckV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goa2lsbGVyRXZlbnQpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGVhdGhFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdkZWF0aCcpO1xyXG4gICAgaWYgKGRlYXRoRXZlbnQpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaChkZWF0aEV2ZW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1hdGNoU3RhcnRFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdtYXRjaFN0YXJ0Jyk7XHJcbiAgICBpZiAobWF0Y2hTdGFydEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goeyBuYW1lOiBtYXRjaFN0YXJ0RXZlbnQubmFtZSwgZGF0YTogeyBkYXRlOiBuZXcgRGF0ZSgpIH0gfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaFN1bW1hcnlFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdtYXRjaFN1bW1hcnknKTtcclxuICAgIGlmIChtYXRjaFN1bW1hcnlFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKG1hdGNoU3VtbWFyeUV2ZW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1hdGNoRW5kRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnbWF0Y2hFbmQnKTtcclxuICAgIGlmIChtYXRjaEVuZEV2ZW50ICYmICh0aGlzLmluZm8ubGVuZ3RoIHx8IHRoaXMuZXZlbnRzLmxlbmd0aCkpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaCh7IG5hbWU6IG1hdGNoRW5kRXZlbnQubmFtZSwgZGF0YTogeyBkYXRlOiBuZXcgRGF0ZSgpIH0gfSk7XHJcbiAgICAgIHRoaXMuc2F2ZVRvRGF0YUJhc2UoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZSBQVUJHIGluZm8gdXBkYXRlc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZXMyRXZlbnQ8XHJcbiAgICogIHN0cmluZyxcclxuICAgKiAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGUyXHJcbiAgICogPn0gaW5mbyAtIEFuIGFycmF5IG9mIGZpcmVkIGluZm8gdXBkYXRlc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlUFVCR0luZm8oaW5mbzogYW55KSB7XHJcbiAgICBpZiAoXHJcbiAgICAgICAgaW5mby5pbmZvLm1hdGNoX2luZm8gJiZcclxuICAgICAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoaW5mby5pbmZvLm1hdGNoX2luZm8sICdraWxscycpIHx8XHJcbiAgICAgICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGluZm8uaW5mby5tYXRjaF9pbmZvLCAnaGVhZHNob3RzJylcclxuICAgICkge1xyXG4gICAgICB0aGlzLmluZm8ucHVzaChpbmZvLmluZm8pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlIENTMiBldmVudHMgZmlyZWRcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHN9IGV2ZW50XHJcbiAgICogLSBBbiBhcnJheSBvZiBmaXJlZCBHYW1lIEV2ZW50c1xyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlQ1MyRXZlbnRzKFxyXG4gICAgICBldmVudDogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHMsXHJcbiAgKTogdm9pZCB7XHJcbiAgICBjb25zdCBraWxsRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAna2lsbCcpO1xyXG4gICAgaWYgKGtpbGxFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKGtpbGxFdmVudCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkZWF0aEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ2RlYXRoJyk7XHJcbiAgICBpZiAoZGVhdGhFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKGRlYXRoRXZlbnQpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qga2lsbEZlZWRFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdraWxsX2ZlZWQnKTtcclxuICAgIGlmIChraWxsRmVlZEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goa2lsbEZlZWRFdmVudCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaFN0YXJ0RXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnbWF0Y2hfc3RhcnQnKTtcclxuICAgIGlmIChtYXRjaFN0YXJ0RXZlbnQpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaCh7IG5hbWU6IG1hdGNoU3RhcnRFdmVudC5uYW1lLCBkYXRhOiB7IGRhdGU6IG5ldyBEYXRlKCkgfSB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1hdGNoRW5kRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnbWF0Y2hfZW5kJyk7XHJcbiAgICBpZiAobWF0Y2hFbmRFdmVudCAmJiAodGhpcy5pbmZvLmxlbmd0aCB8fCB0aGlzLmV2ZW50cy5sZW5ndGgpKSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goeyBuYW1lOiBtYXRjaEVuZEV2ZW50Lm5hbWUsIGRhdGE6IHsgZGF0ZTogbmV3IERhdGUoKSB9IH0pO1xyXG4gICAgICB0aGlzLnNhdmVUb0RhdGFCYXNlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbWl0IHRoZSBmaXJlZCBPdmVyd29sZiBHRVAgRXJyb3JcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkVycm9yRXZlbnR9IGVycm9yIC0gVGhlIGZpcmVkIEdFUCBlcnJvclxyXG4gICAqL1xyXG4gIHByaXZhdGUgb25FcnJvckxpc3RlbmVyKGVycm9yOiBvdmVyd29sZi5nYW1lcy5ldmVudHMuRXJyb3JFdmVudCkge1xyXG4gICAgdGhpcy5lbWl0KCdlcnJvcicsIGVycm9yKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVtaXQgdGhlIGZpcmVkIE92ZXJ3b2xmIEdhbWUgSW5mbyBVcGRhdGVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGVzMkV2ZW50PFxyXG4gICAqIHN0cmluZyxcclxuICAgKiBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZTJcclxuICAgKiA+fSBpbmZvIC0gVGhlIGZpcmVkIGluZm8gdXBkYXRlZFxyXG4gICAqL1xyXG4gIHByaXZhdGUgb25JbmZvVXBkYXRlTGlzdGVuZXIoXHJcbiAgICBpbmZvOiBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZXMyRXZlbnQ8XHJcbiAgICAgIHN0cmluZyxcclxuICAgICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGUyXHJcbiAgICA+LFxyXG4gICkge1xyXG4gICAgdGhpcy50cnlFbWl0KCdpbmZvVXBkYXRlJywgaW5mbyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbWl0IHRoZSBmaXJlZCBPdmVyd29sZiBHYW1lIEV2ZW50cyBhcyBldmVudHNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHN9IGV2ZW50cyAtIFRoZSBmaXJlZCBnYW1lIGV2ZW50c1xyXG4gICAqL1xyXG4gIHByaXZhdGUgb25HYW1lRXZlbnRMaXN0ZW5lcihldmVudHM6IG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzKSB7XHJcbiAgICB0aGlzLnRyeUVtaXQoJ2dhbWVFdmVudCcsIGV2ZW50cyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBdHRlbXB0IHRvIGVtaXQgYW4gZXZlbnQuXHJcbiAgICogSWYgdGhlcmUgYXJlIG5vIGxpc3RlbmVycyBmb3IgdGhpcyBldmVudCwgbG9nIGl0IGFzIGEgd2FybmluZy4qXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnRcclxuICAgKiBAcGFyYW0ge2FueX0gdmFsdWUgLSBUaGUgdmFsdWUgb2YgdGhlIGV2ZW50XHJcbiAgICovXHJcbiAgcHJpdmF0ZSB0cnlFbWl0KGV2ZW50OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcclxuICAgIGlmICh0aGlzLmxpc3RlbmVyQ291bnQoZXZlbnQpKSB7XHJcbiAgICAgIHRoaXMuZW1pdChldmVudCwgdmFsdWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS53YXJuKGBVbmhhbmRsZWQgJHtldmVudH0sIHdpdGggdmFsdWUgJHt2YWx1ZX1gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZXMgYWxsIEdFUC1yZWxhdGVkIGxvZ2ljIHdoZW4gYSBnYW1lIGlzIGxhdW5jaGVkXHJcbiAgICpcclxuICAgKiBJdCBpcyBwb3NzaWJsZSB0byByZWdpc3RlciBhbGwgbGlzdGVuZXJzIG9uY2Ugd2hlbiBzdGFydGluZyB0aGUgYXBwLCBhbmRcclxuICAgKiB0aGVuIG9ubHkgZGUtcmVnaXN0ZXIgdGhlbSB3aGVuIGNsb3NpbmcgdGhlIGFwcCAoaWYgYXQgYWxsKS4gV2UgY2hvb3NlXHJcbiAgICogdG8gcmVnaXN0ZXIvZGVyZWdpc3RlciB0aGVtIGZvciBldmVyeSBnYW1lLCBtb3N0bHkganVzdCB0byBzaG93IGhvdy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nW10gfCB1bmRlZmluZWR9IHJlcXVpcmVkRmVhdHVyZXNcclxuICAgKiAtIE9wdGlvbmFsIGxpc3Qgb2YgcmVxdWlyZWQgZmVhdHVyZXMuIElnbm9yZWQgaWYgdGhpcyBpcyBhIEdFUCBTREsgZ2FtZVxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZ1tdIHwgdW5kZWZpbmVkPn1cclxuICAgKiBBIHByb21pc2UgcmVzb2x2aW5nIHRvIHRoZSBmZWF0dXJlcyB0aGF0IHdlcmUgc3VjY2Vzc2Z1bGx5IHNldCxcclxuICAgKiBvciB0byBub3RoaW5nIGlmIHRoaXMgaXMgYSBHRVAgU0RLIGdhbWVcclxuICAgKiBAdGhyb3dzIEVycm9yIGlmIHNldHRpbmcgdGhlIHJlcXVpcmVkIGZlYXR1cmVzIGZhaWxlZCB0b28gbWFueSB0aW1lc1xyXG4gICAqIChuYXRpdmUgR0VQIG9ubHkpXHJcbiAgICovXHJcbiAgcHVibGljIGFzeW5jIG9uR2FtZUxhdW5jaGVkKFxyXG4gICAgcmVxdWlyZWRGZWF0dXJlcz86IHN0cmluZ1tdLFxyXG4gICk6IFByb21pc2U8c3RyaW5nW10gfCB1bmRlZmluZWQ+IHtcclxuICAgIGNvbnNvbGUubG9nKCdSZWdpc3RlcmluZyBHRVAgbGlzdGVuZXJzJyk7XHJcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnRzKCk7XHJcbiAgICBpZiAocmVxdWlyZWRGZWF0dXJlcykge1xyXG4gICAgICBjb25zb2xlLmxvZygnUmVnaXN0ZXJpbmcgcmVxdWlyZWQgZmVhdHVyZXMnKTtcclxuICAgICAgcmV0dXJuIHRoaXMuc2V0UmVxdWlyZWRGZWF0dXJlcyhyZXF1aXJlZEZlYXR1cmVzLCAxMCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc29sZS5sb2coJ0dFUCBTREsgZGV0ZWN0ZWQsIG5vIG5lZWQgdG8gc2V0IHJlcXVpcmVkIGZlYXR1cmVzJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSdW4gY2xlYW51cCBsb2dpYyBmb3Igd2hlbiBhIGdhbWUgd2FzIGNsb3NlZFxyXG4gICAqL1xyXG4gIHB1YmxpYyBvbkdhbWVDbG9zZWQoKSB7XHJcbiAgICBjb25zb2xlLmxvZygnUmVtb3ZpbmcgYWxsIEdFUCBsaXN0ZW5lcnMnKTtcclxuICAgIHRoaXMudW5yZWdpc3RlckV2ZW50cygpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IHRoZSByZXF1aXJlZCBmZWF0dXJlcyBmb3IgdGhlIGN1cnJlbnQgZ2FtZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gcmVxdWlyZWRGZWF0dXJlc1xyXG4gICAqIC0gQW4gYXJyYXkgY29udGFpbmluZyB0aGUgcmVxdWlyZWQgZmVhdHVyZXMgZm9yIHRoaXMgZ2FtZVxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtYXhpbXVtUmV0cmllc1xyXG4gICAqIC0gVGhlIG1heGltdW0gYW1vdW50IG9mIGF0dGVtcHRzIGJlZm9yZSBnaXZpbmcgdXAgb24gc2V0dGluZ1xyXG4gICAqIHRoZSByZXF1aXJlZCBmZWF0dXJlc1xyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZ1tdPn1cclxuICAgKiBBIHByb21pc2UgcmVzb2x2aW5nIHRvIHRoZSBmZWF0dXJlcyB0aGF0IHdlcmUgc3VjY2Vzc2Z1bGx5IHNldFxyXG4gICAqIEB0aHJvd3MgQW4gZXJyb3IgaWYgc2V0dGluZyB0aGUgcmVxdWlyZWQgZmVhdHVyZXMgZmFpbGVkIHRvbyBtYW55IHRpbWVzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhc3luYyBzZXRSZXF1aXJlZEZlYXR1cmVzKFxyXG4gICAgcmVxdWlyZWRGZWF0dXJlczogc3RyaW5nW10sXHJcbiAgICBtYXhpbXVtUmV0cmllczogbnVtYmVyLFxyXG4gICk6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4aW11bVJldHJpZXM7IGkrKykge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCB0aGlzLnRyeVNldFJlcXVpcmVkRmVhdHVyZXMocmVxdWlyZWRGZWF0dXJlcyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYFJlcXVpcmVkIGZlYXR1cmVzIHNldDogJHtzdWNjZXNzfWApO1xyXG4gICAgICAgIGlmIChzdWNjZXNzLmxlbmd0aCA8IHJlcXVpcmVkRmVhdHVyZXMubGVuZ3RoKVxyXG4gICAgICAgICAgY29uc29sZS53YXJuKFxyXG4gICAgICAgICAgICBgQ291bGQgbm90IHNldCAke3JlcXVpcmVkRmVhdHVyZXMuZmlsdGVyKFxyXG4gICAgICAgICAgICAgIChmZWF0dXJlKSA9PiAhc3VjY2Vzcy5pbmNsdWRlcyhmZWF0dXJlKSxcclxuICAgICAgICAgICAgKX1gLFxyXG4gICAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4gc3VjY2VzcztcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUud2FybihgQ291bGQgbm90IHNldCByZXF1aXJlZCBmZWF0dXJlczogJHtKU09OLnN0cmluZ2lmeShlKX1gKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnUmV0cnlpbmcgaW4gMiBzZWNvbmRzJyk7XHJcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMjAwMCkpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdBYm9ydGluZyByZXF1aXJlZCBmZWF0dXJlcyEnKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEF0dGVtcHRzIHRvIHNldCB0aGUgcmVxdWlyZWQgZmVhdHVyZXMgZm9yIHRoaXMgc3BlY2lmaWMgZ2FtZVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gcmVxdWlyZWRGZWF0dXJlc1xyXG4gICAqIC0gQW4gYXJyYXkgY29udGFpbmluZyB0aGUgcmVxdWlyZWQgZmVhdHVyZXMgZm9yIHRoaXMgZ2FtZVxyXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZ1tdPn1cclxuICAgKiBBIHByb21pc2UgcmVzb2x2aW5nIHRvIHRoZSBmZWF0dXJlcyB0aGF0IHdlcmUgc3VjY2Vzc2Z1bGx5IHNldFxyXG4gICAqIEB0aHJvd3Mge3N0cmluZ30gVGhlIGVycm9yIG1lc3NhZ2UgZ2l2ZW4gaWYgdGhlIGZlYXR1cmVzIGZhaWxlZCB0byBiZSBzZXRcclxuICAgKi9cclxuICBwcml2YXRlIGFzeW5jIHRyeVNldFJlcXVpcmVkRmVhdHVyZXMoXHJcbiAgICByZXF1aXJlZEZlYXR1cmVzOiBzdHJpbmdbXSxcclxuICApOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgICBsZXQgcmVnaXN0ZXJlZDogKHJlc3VsdDogc3RyaW5nW10pID0+IHZvaWQ7XHJcbiAgICBsZXQgZmFpbGVkOiAocmVhc29uOiBzdHJpbmcpID0+IHZvaWQ7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGEgcHJvbWlzZSwgYW5kIHNhdmUgaXRzIHJlc29sdmUvcmVqZWN0IGNhbGxiYWNrc1xyXG4gICAgY29uc3QgcHJvbWlzZTogUHJvbWlzZTxzdHJpbmdbXT4gPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgIHJlZ2lzdGVyZWQgPSByZXNvbHZlO1xyXG4gICAgICBmYWlsZWQgPSByZWplY3Q7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBUcnkgdG8gc2V0IHRoZSByZXF1aXJlZCBmZWF0dXJlc1xyXG4gICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLnNldFJlcXVpcmVkRmVhdHVyZXMocmVxdWlyZWRGZWF0dXJlcywgKHJlc3VsdCkgPT4ge1xyXG4gICAgICAvLyBJZiBmZWF0dXJlcyBmYWlsZWQgdG8gYmUgc2V0XHJcbiAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAvLyBGYWlsIHRoZSBjdXJyZW50IGF0dGVtcHQgd2l0aCB0aGUgZXJyb3IgbWVzc2FnZVxyXG4gICAgICAgIHJldHVybiBmYWlsZWQocmVzdWx0LmVycm9yIGFzIHN0cmluZyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEFwcHJvdmUgdGhlIGN1cnJlbnQgYXR0ZW1wdCwgYW5kIHJldHVybiB0aGUgbGlzdCBvZiBzZXQgZmVhdHVyZXNcclxuICAgICAgcmVnaXN0ZXJlZChyZXN1bHQuc3VwcG9ydGVkRmVhdHVyZXMgYXMgc3RyaW5nW10pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUmV0dXJuIHRoZSBkdW1teSBwcm9taXNlXHJcbiAgICByZXR1cm4gcHJvbWlzZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlZ2lzdGVyIGFsbCBHRVAgbGlzdGVuZXJzXHJcbiAgICovXHJcbiAgcHVibGljIHJlZ2lzdGVyRXZlbnRzKCkge1xyXG4gICAgLy8gUmVnaXN0ZXIgZXJyb3JzIGxpc3RlbmVyXHJcbiAgICBvdmVyd29sZi5nYW1lcy5ldmVudHMub25FcnJvci5hZGRMaXN0ZW5lcih0aGlzLm9uRXJyb3JMaXN0ZW5lcik7XHJcblxyXG4gICAgLy8gUmVnaXN0ZXIgSW5mbyBVcGRhdGUgbGlzdGVuZXJcclxuICAgIG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5vbkluZm9VcGRhdGVzMi5hZGRMaXN0ZW5lcih0aGlzLm9uSW5mb1VwZGF0ZUxpc3RlbmVyKTtcclxuXHJcbiAgICAvLyBSZWdpc3RlciBHYW1lIGV2ZW50IGxpc3RlbmVyXHJcbiAgICBvdmVyd29sZi5nYW1lcy5ldmVudHMub25OZXdFdmVudHMuYWRkTGlzdGVuZXIodGhpcy5vbkdhbWVFdmVudExpc3RlbmVyKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlLXJlZ2lzdGVyIGFsbCBHRVAgbGlzdGVuZXJzXHJcbiAgICovXHJcbiAgcHVibGljIHVucmVnaXN0ZXJFdmVudHMoKSB7XHJcbiAgICBvdmVyd29sZi5nYW1lcy5ldmVudHMub25FcnJvci5yZW1vdmVMaXN0ZW5lcih0aGlzLm9uRXJyb3JMaXN0ZW5lcik7XHJcbiAgICBvdmVyd29sZi5nYW1lcy5ldmVudHMub25JbmZvVXBkYXRlczIucmVtb3ZlTGlzdGVuZXIodGhpcy5vbkluZm9VcGRhdGVMaXN0ZW5lcik7XHJcbiAgICBvdmVyd29sZi5nYW1lcy5ldmVudHMub25OZXdFdmVudHMucmVtb3ZlTGlzdGVuZXIodGhpcy5vbkdhbWVFdmVudExpc3RlbmVyKTtcclxuICB9XHJcbn1cclxuIiwiLyohICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbkNvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLlxyXG5cclxuUGVybWlzc2lvbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgYW5kL29yIGRpc3RyaWJ1dGUgdGhpcyBzb2Z0d2FyZSBmb3IgYW55XHJcbnB1cnBvc2Ugd2l0aCBvciB3aXRob3V0IGZlZSBpcyBoZXJlYnkgZ3JhbnRlZC5cclxuXHJcblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIgQU5EIFRIRSBBVVRIT1IgRElTQ0xBSU1TIEFMTCBXQVJSQU5USUVTIFdJVEhcclxuUkVHQVJEIFRPIFRISVMgU09GVFdBUkUgSU5DTFVESU5HIEFMTCBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZXHJcbkFORCBGSVRORVNTLiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SIEJFIExJQUJMRSBGT1IgQU5ZIFNQRUNJQUwsIERJUkVDVCxcclxuSU5ESVJFQ1QsIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPUiBBTlkgREFNQUdFUyBXSEFUU09FVkVSIFJFU1VMVElORyBGUk9NXHJcbkxPU1MgT0YgVVNFLCBEQVRBIE9SIFBST0ZJVFMsIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBORUdMSUdFTkNFIE9SXHJcbk9USEVSIFRPUlRJT1VTIEFDVElPTiwgQVJJU0lORyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBVU0UgT1JcclxuUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS5cclxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cclxuLyogZ2xvYmFsIFJlZmxlY3QsIFByb21pc2UgKi9cclxuXHJcbnZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24oZCwgYikge1xyXG4gICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxyXG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcclxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcclxuICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXh0ZW5kcyhkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDAgJiYgT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHMsIHBbaV0pKVxyXG4gICAgICAgICAgICAgICAgdFtwW2ldXSA9IHNbcFtpXV07XHJcbiAgICAgICAgfVxyXG4gICAgcmV0dXJuIHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcclxuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wYXJhbShwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHsgZGVjb3JhdG9yKHRhcmdldCwga2V5LCBwYXJhbUluZGV4KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSkge1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXRlcih0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcclxuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxyXG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XHJcbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2dlbmVyYXRvcih0aGlzQXJnLCBib2R5KSB7XHJcbiAgICB2YXIgXyA9IHsgbGFiZWw6IDAsIHNlbnQ6IGZ1bmN0aW9uKCkgeyBpZiAodFswXSAmIDEpIHRocm93IHRbMV07IHJldHVybiB0WzFdOyB9LCB0cnlzOiBbXSwgb3BzOiBbXSB9LCBmLCB5LCB0LCBnO1xyXG4gICAgcmV0dXJuIGcgPSB7IG5leHQ6IHZlcmIoMCksIFwidGhyb3dcIjogdmVyYigxKSwgXCJyZXR1cm5cIjogdmVyYigyKSB9LCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcclxuICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XHJcbiAgICAgICAgd2hpbGUgKF8pIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChmID0gMSwgeSAmJiAodCA9IG9wWzBdICYgMiA/IHlbXCJyZXR1cm5cIl0gOiBvcFswXSA/IHlbXCJ0aHJvd1wiXSB8fCAoKHQgPSB5W1wicmV0dXJuXCJdKSAmJiB0LmNhbGwoeSksIDApIDogeS5uZXh0KSAmJiAhKHQgPSB0LmNhbGwoeSwgb3BbMV0pKS5kb25lKSByZXR1cm4gdDtcclxuICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDA6IGNhc2UgMTogdCA9IG9wOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XHJcbiAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDc6IG9wID0gXy5vcHMucG9wKCk7IF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gMyAmJiAoIXQgfHwgKG9wWzFdID4gdFswXSAmJiBvcFsxXSA8IHRbM10pKSkgeyBfLmxhYmVsID0gb3BbMV07IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0WzJdKSBfLm9wcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG9wID0gYm9keS5jYWxsKHRoaXNBcmcsIF8pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cclxuICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY3JlYXRlQmluZGluZyhvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIG9bazJdID0gbVtrXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXhwb3J0U3RhcihtLCBleHBvcnRzKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIG0pIGlmIChwICE9PSBcImRlZmF1bHRcIiAmJiAhZXhwb3J0cy5oYXNPd25Qcm9wZXJ0eShwKSkgZXhwb3J0c1twXSA9IG1bcF07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3ZhbHVlcyhvKSB7XHJcbiAgICB2YXIgcyA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBTeW1ib2wuaXRlcmF0b3IsIG0gPSBzICYmIG9bc10sIGkgPSAwO1xyXG4gICAgaWYgKG0pIHJldHVybiBtLmNhbGwobyk7XHJcbiAgICBpZiAobyAmJiB0eXBlb2Ygby5sZW5ndGggPT09IFwibnVtYmVyXCIpIHJldHVybiB7XHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAobyAmJiBpID49IG8ubGVuZ3RoKSBvID0gdm9pZCAwO1xyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogbyAmJiBvW2krK10sIGRvbmU6ICFvIH07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IocyA/IFwiT2JqZWN0IGlzIG5vdCBpdGVyYWJsZS5cIiA6IFwiU3ltYm9sLml0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVhZChvLCBuKSB7XHJcbiAgICB2YXIgbSA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvW1N5bWJvbC5pdGVyYXRvcl07XHJcbiAgICBpZiAoIW0pIHJldHVybiBvO1xyXG4gICAgdmFyIGkgPSBtLmNhbGwobyksIHIsIGFyID0gW10sIGU7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHdoaWxlICgobiA9PT0gdm9pZCAwIHx8IG4tLSA+IDApICYmICEociA9IGkubmV4dCgpKS5kb25lKSBhci5wdXNoKHIudmFsdWUpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGVycm9yKSB7IGUgPSB7IGVycm9yOiBlcnJvciB9OyB9XHJcbiAgICBmaW5hbGx5IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAociAmJiAhci5kb25lICYmIChtID0gaVtcInJldHVyblwiXSkpIG0uY2FsbChpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxseSB7IGlmIChlKSB0aHJvdyBlLmVycm9yOyB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXlzKCkge1xyXG4gICAgZm9yICh2YXIgcyA9IDAsIGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSBzICs9IGFyZ3VtZW50c1tpXS5sZW5ndGg7XHJcbiAgICBmb3IgKHZhciByID0gQXJyYXkocyksIGsgPSAwLCBpID0gMDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgZm9yICh2YXIgYSA9IGFyZ3VtZW50c1tpXSwgaiA9IDAsIGpsID0gYS5sZW5ndGg7IGogPCBqbDsgaisrLCBrKyspXHJcbiAgICAgICAgICAgIHJba10gPSBhW2pdO1xyXG4gICAgcmV0dXJuIHI7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpZiAoZ1tuXSkgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IG4gPT09IFwicmV0dXJuXCIgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnRTdGFyKG1vZCkge1xyXG4gICAgaWYgKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgcmV0dXJuIG1vZDtcclxuICAgIHZhciByZXN1bHQgPSB7fTtcclxuICAgIGlmIChtb2QgIT0gbnVsbCkgZm9yICh2YXIgayBpbiBtb2QpIGlmIChPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChtb2QsIGspKSByZXN1bHRba10gPSBtb2Rba107XHJcbiAgICByZXN1bHQuZGVmYXVsdCA9IG1vZDtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2ltcG9ydERlZmF1bHQobW9kKSB7XHJcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IGRlZmF1bHQ6IG1vZCB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZEdldChyZWNlaXZlciwgcHJpdmF0ZU1hcCkge1xyXG4gICAgaWYgKCFwcml2YXRlTWFwLmhhcyhyZWNlaXZlcikpIHtcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYXR0ZW1wdGVkIHRvIGdldCBwcml2YXRlIGZpZWxkIG9uIG5vbi1pbnN0YW5jZVwiKTtcclxuICAgIH1cclxuICAgIHJldHVybiBwcml2YXRlTWFwLmdldChyZWNlaXZlcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkU2V0KHJlY2VpdmVyLCBwcml2YXRlTWFwLCB2YWx1ZSkge1xyXG4gICAgaWYgKCFwcml2YXRlTWFwLmhhcyhyZWNlaXZlcikpIHtcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYXR0ZW1wdGVkIHRvIHNldCBwcml2YXRlIGZpZWxkIG9uIG5vbi1pbnN0YW5jZVwiKTtcclxuICAgIH1cclxuICAgIHByaXZhdGVNYXAuc2V0KHJlY2VpdmVyLCB2YWx1ZSk7XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbn1cclxuIiwiaW1wb3J0IHsgX19leHRlbmRzLCBfX3JlYWQsIF9fc3ByZWFkIH0gZnJvbSBcInRzbGliXCI7XG5pbXBvcnQgeyBnZXRQYXJhbUluZm8gfSBmcm9tIFwiLi4vcmVmbGVjdGlvbi1oZWxwZXJzXCI7XG5pbXBvcnQgeyBpbnN0YW5jZSBhcyBnbG9iYWxDb250YWluZXIgfSBmcm9tIFwiLi4vZGVwZW5kZW5jeS1jb250YWluZXJcIjtcbmltcG9ydCB7IGlzVG9rZW5EZXNjcmlwdG9yLCBpc1RyYW5zZm9ybURlc2NyaXB0b3IgfSBmcm9tIFwiLi4vcHJvdmlkZXJzL2luamVjdGlvbi10b2tlblwiO1xuaW1wb3J0IHsgZm9ybWF0RXJyb3JDdG9yIH0gZnJvbSBcIi4uL2Vycm9yLWhlbHBlcnNcIjtcbmZ1bmN0aW9uIGF1dG9JbmplY3RhYmxlKCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgIHZhciBwYXJhbUluZm8gPSBnZXRQYXJhbUluZm8odGFyZ2V0KTtcbiAgICAgICAgcmV0dXJuIChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgICAgICAgICBfX2V4dGVuZHMoY2xhc3NfMSwgX3N1cGVyKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNsYXNzXzEoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW19pXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBfc3VwZXIuYXBwbHkodGhpcywgX19zcHJlYWQoYXJncy5jb25jYXQocGFyYW1JbmZvLnNsaWNlKGFyZ3MubGVuZ3RoKS5tYXAoZnVuY3Rpb24gKHR5cGUsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfYSwgX2IsIF9jO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVG9rZW5EZXNjcmlwdG9yKHR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVHJhbnNmb3JtRGVzY3JpcHRvcih0eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHlwZS5tdWx0aXBsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAoX2EgPSBnbG9iYWxDb250YWluZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVzb2x2ZSh0eXBlLnRyYW5zZm9ybSkpLnRyYW5zZm9ybS5hcHBseShfYSwgX19zcHJlYWQoW2dsb2JhbENvbnRhaW5lci5yZXNvbHZlQWxsKHR5cGUudG9rZW4pXSwgdHlwZS50cmFuc2Zvcm1BcmdzKSkgOiAoX2IgPSBnbG9iYWxDb250YWluZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXNvbHZlKHR5cGUudHJhbnNmb3JtKSkudHJhbnNmb3JtLmFwcGx5KF9iLCBfX3NwcmVhZChbZ2xvYmFsQ29udGFpbmVyLnJlc29sdmUodHlwZS50b2tlbildLCB0eXBlLnRyYW5zZm9ybUFyZ3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0eXBlLm11bHRpcGxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGdsb2JhbENvbnRhaW5lci5yZXNvbHZlQWxsKHR5cGUudG9rZW4pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGdsb2JhbENvbnRhaW5lci5yZXNvbHZlKHR5cGUudG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGlzVHJhbnNmb3JtRGVzY3JpcHRvcih0eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoX2MgPSBnbG9iYWxDb250YWluZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlc29sdmUodHlwZS50cmFuc2Zvcm0pKS50cmFuc2Zvcm0uYXBwbHkoX2MsIF9fc3ByZWFkKFtnbG9iYWxDb250YWluZXIucmVzb2x2ZSh0eXBlLnRva2VuKV0sIHR5cGUudHJhbnNmb3JtQXJncykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdsb2JhbENvbnRhaW5lci5yZXNvbHZlKHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJnSW5kZXggPSBpbmRleCArIGFyZ3MubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGZvcm1hdEVycm9yQ3Rvcih0YXJnZXQsIGFyZ0luZGV4LCBlKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KSkpKSB8fCB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNsYXNzXzE7XG4gICAgICAgIH0odGFyZ2V0KSk7XG4gICAgfTtcbn1cbmV4cG9ydCBkZWZhdWx0IGF1dG9JbmplY3RhYmxlO1xuIiwiZXhwb3J0IHsgZGVmYXVsdCBhcyBhdXRvSW5qZWN0YWJsZSB9IGZyb20gXCIuL2F1dG8taW5qZWN0YWJsZVwiO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBpbmplY3QgfSBmcm9tIFwiLi9pbmplY3RcIjtcbmV4cG9ydCB7IGRlZmF1bHQgYXMgaW5qZWN0YWJsZSB9IGZyb20gXCIuL2luamVjdGFibGVcIjtcbmV4cG9ydCB7IGRlZmF1bHQgYXMgcmVnaXN0cnkgfSBmcm9tIFwiLi9yZWdpc3RyeVwiO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBzaW5nbGV0b24gfSBmcm9tIFwiLi9zaW5nbGV0b25cIjtcbmV4cG9ydCB7IGRlZmF1bHQgYXMgaW5qZWN0QWxsIH0gZnJvbSBcIi4vaW5qZWN0LWFsbFwiO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBpbmplY3RBbGxXaXRoVHJhbnNmb3JtIH0gZnJvbSBcIi4vaW5qZWN0LWFsbC13aXRoLXRyYW5zZm9ybVwiO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBpbmplY3RXaXRoVHJhbnNmb3JtIH0gZnJvbSBcIi4vaW5qZWN0LXdpdGgtdHJhbnNmb3JtXCI7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHNjb3BlZCB9IGZyb20gXCIuL3Njb3BlZFwiO1xuIiwiaW1wb3J0IHsgZGVmaW5lSW5qZWN0aW9uVG9rZW5NZXRhZGF0YSB9IGZyb20gXCIuLi9yZWZsZWN0aW9uLWhlbHBlcnNcIjtcbmZ1bmN0aW9uIGluamVjdEFsbFdpdGhUcmFuc2Zvcm0odG9rZW4sIHRyYW5zZm9ybWVyKSB7XG4gICAgdmFyIGFyZ3MgPSBbXTtcbiAgICBmb3IgKHZhciBfaSA9IDI7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICBhcmdzW19pIC0gMl0gPSBhcmd1bWVudHNbX2ldO1xuICAgIH1cbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgdG9rZW46IHRva2VuLFxuICAgICAgICBtdWx0aXBsZTogdHJ1ZSxcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2Zvcm1lcixcbiAgICAgICAgdHJhbnNmb3JtQXJnczogYXJnc1xuICAgIH07XG4gICAgcmV0dXJuIGRlZmluZUluamVjdGlvblRva2VuTWV0YWRhdGEoZGF0YSk7XG59XG5leHBvcnQgZGVmYXVsdCBpbmplY3RBbGxXaXRoVHJhbnNmb3JtO1xuIiwiaW1wb3J0IHsgZGVmaW5lSW5qZWN0aW9uVG9rZW5NZXRhZGF0YSB9IGZyb20gXCIuLi9yZWZsZWN0aW9uLWhlbHBlcnNcIjtcbmZ1bmN0aW9uIGluamVjdEFsbCh0b2tlbikge1xuICAgIHZhciBkYXRhID0geyB0b2tlbjogdG9rZW4sIG11bHRpcGxlOiB0cnVlIH07XG4gICAgcmV0dXJuIGRlZmluZUluamVjdGlvblRva2VuTWV0YWRhdGEoZGF0YSk7XG59XG5leHBvcnQgZGVmYXVsdCBpbmplY3RBbGw7XG4iLCJpbXBvcnQgeyBkZWZpbmVJbmplY3Rpb25Ub2tlbk1ldGFkYXRhIH0gZnJvbSBcIi4uL3JlZmxlY3Rpb24taGVscGVyc1wiO1xuZnVuY3Rpb24gaW5qZWN0V2l0aFRyYW5zZm9ybSh0b2tlbiwgdHJhbnNmb3JtZXIpIHtcbiAgICB2YXIgYXJncyA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMjsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIGFyZ3NbX2kgLSAyXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgfVxuICAgIHJldHVybiBkZWZpbmVJbmplY3Rpb25Ub2tlbk1ldGFkYXRhKHRva2VuLCB7XG4gICAgICAgIHRyYW5zZm9ybVRva2VuOiB0cmFuc2Zvcm1lcixcbiAgICAgICAgYXJnczogYXJnc1xuICAgIH0pO1xufVxuZXhwb3J0IGRlZmF1bHQgaW5qZWN0V2l0aFRyYW5zZm9ybTtcbiIsImltcG9ydCB7IGRlZmluZUluamVjdGlvblRva2VuTWV0YWRhdGEgfSBmcm9tIFwiLi4vcmVmbGVjdGlvbi1oZWxwZXJzXCI7XG5mdW5jdGlvbiBpbmplY3QodG9rZW4pIHtcbiAgICByZXR1cm4gZGVmaW5lSW5qZWN0aW9uVG9rZW5NZXRhZGF0YSh0b2tlbik7XG59XG5leHBvcnQgZGVmYXVsdCBpbmplY3Q7XG4iLCJpbXBvcnQgeyBnZXRQYXJhbUluZm8gfSBmcm9tIFwiLi4vcmVmbGVjdGlvbi1oZWxwZXJzXCI7XG5pbXBvcnQgeyB0eXBlSW5mbyB9IGZyb20gXCIuLi9kZXBlbmRlbmN5LWNvbnRhaW5lclwiO1xuZnVuY3Rpb24gaW5qZWN0YWJsZSgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICB0eXBlSW5mby5zZXQodGFyZ2V0LCBnZXRQYXJhbUluZm8odGFyZ2V0KSk7XG4gICAgfTtcbn1cbmV4cG9ydCBkZWZhdWx0IGluamVjdGFibGU7XG4iLCJpbXBvcnQgeyBfX3Jlc3QgfSBmcm9tIFwidHNsaWJcIjtcbmltcG9ydCB7IGluc3RhbmNlIGFzIGdsb2JhbENvbnRhaW5lciB9IGZyb20gXCIuLi9kZXBlbmRlbmN5LWNvbnRhaW5lclwiO1xuZnVuY3Rpb24gcmVnaXN0cnkocmVnaXN0cmF0aW9ucykge1xuICAgIGlmIChyZWdpc3RyYXRpb25zID09PSB2b2lkIDApIHsgcmVnaXN0cmF0aW9ucyA9IFtdOyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgcmVnaXN0cmF0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChfYSkge1xuICAgICAgICAgICAgdmFyIHRva2VuID0gX2EudG9rZW4sIG9wdGlvbnMgPSBfYS5vcHRpb25zLCBwcm92aWRlciA9IF9fcmVzdChfYSwgW1widG9rZW5cIiwgXCJvcHRpb25zXCJdKTtcbiAgICAgICAgICAgIHJldHVybiBnbG9iYWxDb250YWluZXIucmVnaXN0ZXIodG9rZW4sIHByb3ZpZGVyLCBvcHRpb25zKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfTtcbn1cbmV4cG9ydCBkZWZhdWx0IHJlZ2lzdHJ5O1xuIiwiaW1wb3J0IGluamVjdGFibGUgZnJvbSBcIi4vaW5qZWN0YWJsZVwiO1xuaW1wb3J0IHsgaW5zdGFuY2UgYXMgZ2xvYmFsQ29udGFpbmVyIH0gZnJvbSBcIi4uL2RlcGVuZGVuY3ktY29udGFpbmVyXCI7XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBzY29wZWQobGlmZWN5Y2xlLCB0b2tlbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgIGluamVjdGFibGUoKSh0YXJnZXQpO1xuICAgICAgICBnbG9iYWxDb250YWluZXIucmVnaXN0ZXIodG9rZW4gfHwgdGFyZ2V0LCB0YXJnZXQsIHtcbiAgICAgICAgICAgIGxpZmVjeWNsZTogbGlmZWN5Y2xlXG4gICAgICAgIH0pO1xuICAgIH07XG59XG4iLCJpbXBvcnQgaW5qZWN0YWJsZSBmcm9tIFwiLi9pbmplY3RhYmxlXCI7XG5pbXBvcnQgeyBpbnN0YW5jZSBhcyBnbG9iYWxDb250YWluZXIgfSBmcm9tIFwiLi4vZGVwZW5kZW5jeS1jb250YWluZXJcIjtcbmZ1bmN0aW9uIHNpbmdsZXRvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICBpbmplY3RhYmxlKCkodGFyZ2V0KTtcbiAgICAgICAgZ2xvYmFsQ29udGFpbmVyLnJlZ2lzdGVyU2luZ2xldG9uKHRhcmdldCk7XG4gICAgfTtcbn1cbmV4cG9ydCBkZWZhdWx0IHNpbmdsZXRvbjtcbiIsImltcG9ydCB7IF9fYXdhaXRlciwgX19nZW5lcmF0b3IsIF9fcmVhZCwgX19zcHJlYWQsIF9fdmFsdWVzIH0gZnJvbSBcInRzbGliXCI7XG5pbXBvcnQgeyBpc0NsYXNzUHJvdmlkZXIsIGlzRmFjdG9yeVByb3ZpZGVyLCBpc05vcm1hbFRva2VuLCBpc1Rva2VuUHJvdmlkZXIsIGlzVmFsdWVQcm92aWRlciB9IGZyb20gXCIuL3Byb3ZpZGVyc1wiO1xuaW1wb3J0IHsgaXNQcm92aWRlciB9IGZyb20gXCIuL3Byb3ZpZGVycy9wcm92aWRlclwiO1xuaW1wb3J0IHsgaXNDb25zdHJ1Y3RvclRva2VuLCBpc1Rva2VuRGVzY3JpcHRvciwgaXNUcmFuc2Zvcm1EZXNjcmlwdG9yIH0gZnJvbSBcIi4vcHJvdmlkZXJzL2luamVjdGlvbi10b2tlblwiO1xuaW1wb3J0IFJlZ2lzdHJ5IGZyb20gXCIuL3JlZ2lzdHJ5XCI7XG5pbXBvcnQgTGlmZWN5Y2xlIGZyb20gXCIuL3R5cGVzL2xpZmVjeWNsZVwiO1xuaW1wb3J0IFJlc29sdXRpb25Db250ZXh0IGZyb20gXCIuL3Jlc29sdXRpb24tY29udGV4dFwiO1xuaW1wb3J0IHsgZm9ybWF0RXJyb3JDdG9yIH0gZnJvbSBcIi4vZXJyb3ItaGVscGVyc1wiO1xuaW1wb3J0IHsgRGVsYXllZENvbnN0cnVjdG9yIH0gZnJvbSBcIi4vbGF6eS1oZWxwZXJzXCI7XG5pbXBvcnQgeyBpc0Rpc3Bvc2FibGUgfSBmcm9tIFwiLi90eXBlcy9kaXNwb3NhYmxlXCI7XG5pbXBvcnQgSW50ZXJjZXB0b3JzIGZyb20gXCIuL2ludGVyY2VwdG9yc1wiO1xuZXhwb3J0IHZhciB0eXBlSW5mbyA9IG5ldyBNYXAoKTtcbnZhciBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lcihwYXJlbnQpIHtcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIHRoaXMuX3JlZ2lzdHJ5ID0gbmV3IFJlZ2lzdHJ5KCk7XG4gICAgICAgIHRoaXMuaW50ZXJjZXB0b3JzID0gbmV3IEludGVyY2VwdG9ycygpO1xuICAgICAgICB0aGlzLmRpc3Bvc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZXMgPSBuZXcgU2V0KCk7XG4gICAgfVxuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUucmVnaXN0ZXIgPSBmdW5jdGlvbiAodG9rZW4sIHByb3ZpZGVyT3JDb25zdHJ1Y3Rvciwgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7IGxpZmVjeWNsZTogTGlmZWN5Y2xlLlRyYW5zaWVudCB9OyB9XG4gICAgICAgIHRoaXMuZW5zdXJlTm90RGlzcG9zZWQoKTtcbiAgICAgICAgdmFyIHByb3ZpZGVyO1xuICAgICAgICBpZiAoIWlzUHJvdmlkZXIocHJvdmlkZXJPckNvbnN0cnVjdG9yKSkge1xuICAgICAgICAgICAgcHJvdmlkZXIgPSB7IHVzZUNsYXNzOiBwcm92aWRlck9yQ29uc3RydWN0b3IgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHByb3ZpZGVyID0gcHJvdmlkZXJPckNvbnN0cnVjdG9yO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1Rva2VuUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICAgICAgICB2YXIgcGF0aCA9IFt0b2tlbl07XG4gICAgICAgICAgICB2YXIgdG9rZW5Qcm92aWRlciA9IHByb3ZpZGVyO1xuICAgICAgICAgICAgd2hpbGUgKHRva2VuUHJvdmlkZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50VG9rZW4gPSB0b2tlblByb3ZpZGVyLnVzZVRva2VuO1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLmluY2x1ZGVzKGN1cnJlbnRUb2tlbikpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9rZW4gcmVnaXN0cmF0aW9uIGN5Y2xlIGRldGVjdGVkISBcIiArIF9fc3ByZWFkKHBhdGgsIFtjdXJyZW50VG9rZW5dKS5qb2luKFwiIC0+IFwiKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhdGgucHVzaChjdXJyZW50VG9rZW4pO1xuICAgICAgICAgICAgICAgIHZhciByZWdpc3RyYXRpb24gPSB0aGlzLl9yZWdpc3RyeS5nZXQoY3VycmVudFRva2VuKTtcbiAgICAgICAgICAgICAgICBpZiAocmVnaXN0cmF0aW9uICYmIGlzVG9rZW5Qcm92aWRlcihyZWdpc3RyYXRpb24ucHJvdmlkZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRva2VuUHJvdmlkZXIgPSByZWdpc3RyYXRpb24ucHJvdmlkZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0b2tlblByb3ZpZGVyID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMubGlmZWN5Y2xlID09PSBMaWZlY3ljbGUuU2luZ2xldG9uIHx8XG4gICAgICAgICAgICBvcHRpb25zLmxpZmVjeWNsZSA9PSBMaWZlY3ljbGUuQ29udGFpbmVyU2NvcGVkIHx8XG4gICAgICAgICAgICBvcHRpb25zLmxpZmVjeWNsZSA9PSBMaWZlY3ljbGUuUmVzb2x1dGlvblNjb3BlZCkge1xuICAgICAgICAgICAgaWYgKGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikgfHwgaXNGYWN0b3J5UHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHVzZSBsaWZlY3ljbGUgXFxcIlwiICsgTGlmZWN5Y2xlW29wdGlvbnMubGlmZWN5Y2xlXSArIFwiXFxcIiB3aXRoIFZhbHVlUHJvdmlkZXJzIG9yIEZhY3RvcnlQcm92aWRlcnNcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVnaXN0cnkuc2V0KHRva2VuLCB7IHByb3ZpZGVyOiBwcm92aWRlciwgb3B0aW9uczogb3B0aW9ucyB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLnJlZ2lzdGVyVHlwZSA9IGZ1bmN0aW9uIChmcm9tLCB0bykge1xuICAgICAgICB0aGlzLmVuc3VyZU5vdERpc3Bvc2VkKCk7XG4gICAgICAgIGlmIChpc05vcm1hbFRva2VuKHRvKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXIoZnJvbSwge1xuICAgICAgICAgICAgICAgIHVzZVRva2VuOiB0b1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXIoZnJvbSwge1xuICAgICAgICAgICAgdXNlQ2xhc3M6IHRvXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5yZWdpc3Rlckluc3RhbmNlID0gZnVuY3Rpb24gKHRva2VuLCBpbnN0YW5jZSkge1xuICAgICAgICB0aGlzLmVuc3VyZU5vdERpc3Bvc2VkKCk7XG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyKHRva2VuLCB7XG4gICAgICAgICAgICB1c2VWYWx1ZTogaW5zdGFuY2VcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLnJlZ2lzdGVyU2luZ2xldG9uID0gZnVuY3Rpb24gKGZyb20sIHRvKSB7XG4gICAgICAgIHRoaXMuZW5zdXJlTm90RGlzcG9zZWQoKTtcbiAgICAgICAgaWYgKGlzTm9ybWFsVG9rZW4oZnJvbSkpIHtcbiAgICAgICAgICAgIGlmIChpc05vcm1hbFRva2VuKHRvKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyKGZyb20sIHtcbiAgICAgICAgICAgICAgICAgICAgdXNlVG9rZW46IHRvXG4gICAgICAgICAgICAgICAgfSwgeyBsaWZlY3ljbGU6IExpZmVjeWNsZS5TaW5nbGV0b24gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0bykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyKGZyb20sIHtcbiAgICAgICAgICAgICAgICAgICAgdXNlQ2xhc3M6IHRvXG4gICAgICAgICAgICAgICAgfSwgeyBsaWZlY3ljbGU6IExpZmVjeWNsZS5TaW5nbGV0b24gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCByZWdpc3RlciBhIHR5cGUgbmFtZSBhcyBhIHNpbmdsZXRvbiB3aXRob3V0IGEgXCJ0b1wiIHRva2VuJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHVzZUNsYXNzID0gZnJvbTtcbiAgICAgICAgaWYgKHRvICYmICFpc05vcm1hbFRva2VuKHRvKSkge1xuICAgICAgICAgICAgdXNlQ2xhc3MgPSB0bztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3Rlcihmcm9tLCB7XG4gICAgICAgICAgICB1c2VDbGFzczogdXNlQ2xhc3NcbiAgICAgICAgfSwgeyBsaWZlY3ljbGU6IExpZmVjeWNsZS5TaW5nbGV0b24gfSk7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbiAodG9rZW4sIGNvbnRleHQpIHtcbiAgICAgICAgaWYgKGNvbnRleHQgPT09IHZvaWQgMCkgeyBjb250ZXh0ID0gbmV3IFJlc29sdXRpb25Db250ZXh0KCk7IH1cbiAgICAgICAgdGhpcy5lbnN1cmVOb3REaXNwb3NlZCgpO1xuICAgICAgICB2YXIgcmVnaXN0cmF0aW9uID0gdGhpcy5nZXRSZWdpc3RyYXRpb24odG9rZW4pO1xuICAgICAgICBpZiAoIXJlZ2lzdHJhdGlvbiAmJiBpc05vcm1hbFRva2VuKHRva2VuKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXR0ZW1wdGVkIHRvIHJlc29sdmUgdW5yZWdpc3RlcmVkIGRlcGVuZGVuY3kgdG9rZW46IFxcXCJcIiArIHRva2VuLnRvU3RyaW5nKCkgKyBcIlxcXCJcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5leGVjdXRlUHJlUmVzb2x1dGlvbkludGVyY2VwdG9yKHRva2VuLCBcIlNpbmdsZVwiKTtcbiAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbikge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMucmVzb2x2ZVJlZ2lzdHJhdGlvbihyZWdpc3RyYXRpb24sIGNvbnRleHQpO1xuICAgICAgICAgICAgdGhpcy5leGVjdXRlUG9zdFJlc29sdXRpb25JbnRlcmNlcHRvcih0b2tlbiwgcmVzdWx0LCBcIlNpbmdsZVwiKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzQ29uc3RydWN0b3JUb2tlbih0b2tlbikpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB0aGlzLmNvbnN0cnVjdCh0b2tlbiwgY29udGV4dCk7XG4gICAgICAgICAgICB0aGlzLmV4ZWN1dGVQb3N0UmVzb2x1dGlvbkludGVyY2VwdG9yKHRva2VuLCByZXN1bHQsIFwiU2luZ2xlXCIpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRlbXB0ZWQgdG8gY29uc3RydWN0IGFuIHVuZGVmaW5lZCBjb25zdHJ1Y3Rvci4gQ291bGQgbWVhbiBhIGNpcmN1bGFyIGRlcGVuZGVuY3kgcHJvYmxlbS4gVHJ5IHVzaW5nIGBkZWxheWAgZnVuY3Rpb24uXCIpO1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5leGVjdXRlUHJlUmVzb2x1dGlvbkludGVyY2VwdG9yID0gZnVuY3Rpb24gKHRva2VuLCByZXNvbHV0aW9uVHlwZSkge1xuICAgICAgICB2YXIgZV8xLCBfYTtcbiAgICAgICAgaWYgKHRoaXMuaW50ZXJjZXB0b3JzLnByZVJlc29sdXRpb24uaGFzKHRva2VuKSkge1xuICAgICAgICAgICAgdmFyIHJlbWFpbmluZ0ludGVyY2VwdG9ycyA9IFtdO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfYiA9IF9fdmFsdWVzKHRoaXMuaW50ZXJjZXB0b3JzLnByZVJlc29sdXRpb24uZ2V0QWxsKHRva2VuKSksIF9jID0gX2IubmV4dCgpOyAhX2MuZG9uZTsgX2MgPSBfYi5uZXh0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGludGVyY2VwdG9yID0gX2MudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnRlcmNlcHRvci5vcHRpb25zLmZyZXF1ZW5jeSAhPSBcIk9uY2VcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtYWluaW5nSW50ZXJjZXB0b3JzLnB1c2goaW50ZXJjZXB0b3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGludGVyY2VwdG9yLmNhbGxiYWNrKHRva2VuLCByZXNvbHV0aW9uVHlwZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVfMV8xKSB7IGVfMSA9IHsgZXJyb3I6IGVfMV8xIH07IH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfYyAmJiAhX2MuZG9uZSAmJiAoX2EgPSBfYi5yZXR1cm4pKSBfYS5jYWxsKF9iKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmluYWxseSB7IGlmIChlXzEpIHRocm93IGVfMS5lcnJvcjsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5pbnRlcmNlcHRvcnMucHJlUmVzb2x1dGlvbi5zZXRBbGwodG9rZW4sIHJlbWFpbmluZ0ludGVyY2VwdG9ycyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUuZXhlY3V0ZVBvc3RSZXNvbHV0aW9uSW50ZXJjZXB0b3IgPSBmdW5jdGlvbiAodG9rZW4sIHJlc3VsdCwgcmVzb2x1dGlvblR5cGUpIHtcbiAgICAgICAgdmFyIGVfMiwgX2E7XG4gICAgICAgIGlmICh0aGlzLmludGVyY2VwdG9ycy5wb3N0UmVzb2x1dGlvbi5oYXModG9rZW4pKSB7XG4gICAgICAgICAgICB2YXIgcmVtYWluaW5nSW50ZXJjZXB0b3JzID0gW107XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9iID0gX192YWx1ZXModGhpcy5pbnRlcmNlcHRvcnMucG9zdFJlc29sdXRpb24uZ2V0QWxsKHRva2VuKSksIF9jID0gX2IubmV4dCgpOyAhX2MuZG9uZTsgX2MgPSBfYi5uZXh0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGludGVyY2VwdG9yID0gX2MudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnRlcmNlcHRvci5vcHRpb25zLmZyZXF1ZW5jeSAhPSBcIk9uY2VcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtYWluaW5nSW50ZXJjZXB0b3JzLnB1c2goaW50ZXJjZXB0b3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGludGVyY2VwdG9yLmNhbGxiYWNrKHRva2VuLCByZXN1bHQsIHJlc29sdXRpb25UeXBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZV8yXzEpIHsgZV8yID0geyBlcnJvcjogZV8yXzEgfTsgfVxuICAgICAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9jICYmICFfYy5kb25lICYmIChfYSA9IF9iLnJldHVybikpIF9hLmNhbGwoX2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaW5hbGx5IHsgaWYgKGVfMikgdGhyb3cgZV8yLmVycm9yOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmludGVyY2VwdG9ycy5wb3N0UmVzb2x1dGlvbi5zZXRBbGwodG9rZW4sIHJlbWFpbmluZ0ludGVyY2VwdG9ycyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUucmVzb2x2ZVJlZ2lzdHJhdGlvbiA9IGZ1bmN0aW9uIChyZWdpc3RyYXRpb24sIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5lbnN1cmVOb3REaXNwb3NlZCgpO1xuICAgICAgICBpZiAocmVnaXN0cmF0aW9uLm9wdGlvbnMubGlmZWN5Y2xlID09PSBMaWZlY3ljbGUuUmVzb2x1dGlvblNjb3BlZCAmJlxuICAgICAgICAgICAgY29udGV4dC5zY29wZWRSZXNvbHV0aW9ucy5oYXMocmVnaXN0cmF0aW9uKSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuc2NvcGVkUmVzb2x1dGlvbnMuZ2V0KHJlZ2lzdHJhdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGlzU2luZ2xldG9uID0gcmVnaXN0cmF0aW9uLm9wdGlvbnMubGlmZWN5Y2xlID09PSBMaWZlY3ljbGUuU2luZ2xldG9uO1xuICAgICAgICB2YXIgaXNDb250YWluZXJTY29wZWQgPSByZWdpc3RyYXRpb24ub3B0aW9ucy5saWZlY3ljbGUgPT09IExpZmVjeWNsZS5Db250YWluZXJTY29wZWQ7XG4gICAgICAgIHZhciByZXR1cm5JbnN0YW5jZSA9IGlzU2luZ2xldG9uIHx8IGlzQ29udGFpbmVyU2NvcGVkO1xuICAgICAgICB2YXIgcmVzb2x2ZWQ7XG4gICAgICAgIGlmIChpc1ZhbHVlUHJvdmlkZXIocmVnaXN0cmF0aW9uLnByb3ZpZGVyKSkge1xuICAgICAgICAgICAgcmVzb2x2ZWQgPSByZWdpc3RyYXRpb24ucHJvdmlkZXIudXNlVmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNUb2tlblByb3ZpZGVyKHJlZ2lzdHJhdGlvbi5wcm92aWRlcikpIHtcbiAgICAgICAgICAgIHJlc29sdmVkID0gcmV0dXJuSW5zdGFuY2VcbiAgICAgICAgICAgICAgICA/IHJlZ2lzdHJhdGlvbi5pbnN0YW5jZSB8fFxuICAgICAgICAgICAgICAgICAgICAocmVnaXN0cmF0aW9uLmluc3RhbmNlID0gdGhpcy5yZXNvbHZlKHJlZ2lzdHJhdGlvbi5wcm92aWRlci51c2VUb2tlbiwgY29udGV4dCkpXG4gICAgICAgICAgICAgICAgOiB0aGlzLnJlc29sdmUocmVnaXN0cmF0aW9uLnByb3ZpZGVyLnVzZVRva2VuLCBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc0NsYXNzUHJvdmlkZXIocmVnaXN0cmF0aW9uLnByb3ZpZGVyKSkge1xuICAgICAgICAgICAgcmVzb2x2ZWQgPSByZXR1cm5JbnN0YW5jZVxuICAgICAgICAgICAgICAgID8gcmVnaXN0cmF0aW9uLmluc3RhbmNlIHx8XG4gICAgICAgICAgICAgICAgICAgIChyZWdpc3RyYXRpb24uaW5zdGFuY2UgPSB0aGlzLmNvbnN0cnVjdChyZWdpc3RyYXRpb24ucHJvdmlkZXIudXNlQ2xhc3MsIGNvbnRleHQpKVxuICAgICAgICAgICAgICAgIDogdGhpcy5jb25zdHJ1Y3QocmVnaXN0cmF0aW9uLnByb3ZpZGVyLnVzZUNsYXNzLCBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc0ZhY3RvcnlQcm92aWRlcihyZWdpc3RyYXRpb24ucHJvdmlkZXIpKSB7XG4gICAgICAgICAgICByZXNvbHZlZCA9IHJlZ2lzdHJhdGlvbi5wcm92aWRlci51c2VGYWN0b3J5KHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzb2x2ZWQgPSB0aGlzLmNvbnN0cnVjdChyZWdpc3RyYXRpb24ucHJvdmlkZXIsIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWdpc3RyYXRpb24ub3B0aW9ucy5saWZlY3ljbGUgPT09IExpZmVjeWNsZS5SZXNvbHV0aW9uU2NvcGVkKSB7XG4gICAgICAgICAgICBjb250ZXh0LnNjb3BlZFJlc29sdXRpb25zLnNldChyZWdpc3RyYXRpb24sIHJlc29sdmVkKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzb2x2ZWQ7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLnJlc29sdmVBbGwgPSBmdW5jdGlvbiAodG9rZW4sIGNvbnRleHQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKGNvbnRleHQgPT09IHZvaWQgMCkgeyBjb250ZXh0ID0gbmV3IFJlc29sdXRpb25Db250ZXh0KCk7IH1cbiAgICAgICAgdGhpcy5lbnN1cmVOb3REaXNwb3NlZCgpO1xuICAgICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHRoaXMuZ2V0QWxsUmVnaXN0cmF0aW9ucyh0b2tlbik7XG4gICAgICAgIGlmICghcmVnaXN0cmF0aW9ucyAmJiBpc05vcm1hbFRva2VuKHRva2VuKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXR0ZW1wdGVkIHRvIHJlc29sdmUgdW5yZWdpc3RlcmVkIGRlcGVuZGVuY3kgdG9rZW46IFxcXCJcIiArIHRva2VuLnRvU3RyaW5nKCkgKyBcIlxcXCJcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5leGVjdXRlUHJlUmVzb2x1dGlvbkludGVyY2VwdG9yKHRva2VuLCBcIkFsbFwiKTtcbiAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHRfMSA9IHJlZ2lzdHJhdGlvbnMubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLnJlc29sdmVSZWdpc3RyYXRpb24oaXRlbSwgY29udGV4dCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZVBvc3RSZXNvbHV0aW9uSW50ZXJjZXB0b3IodG9rZW4sIHJlc3VsdF8xLCBcIkFsbFwiKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHRfMTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0ID0gW3RoaXMuY29uc3RydWN0KHRva2VuLCBjb250ZXh0KV07XG4gICAgICAgIHRoaXMuZXhlY3V0ZVBvc3RSZXNvbHV0aW9uSW50ZXJjZXB0b3IodG9rZW4sIHJlc3VsdCwgXCJBbGxcIik7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLmlzUmVnaXN0ZXJlZCA9IGZ1bmN0aW9uICh0b2tlbiwgcmVjdXJzaXZlKSB7XG4gICAgICAgIGlmIChyZWN1cnNpdmUgPT09IHZvaWQgMCkgeyByZWN1cnNpdmUgPSBmYWxzZTsgfVxuICAgICAgICB0aGlzLmVuc3VyZU5vdERpc3Bvc2VkKCk7XG4gICAgICAgIHJldHVybiAodGhpcy5fcmVnaXN0cnkuaGFzKHRva2VuKSB8fFxuICAgICAgICAgICAgKHJlY3Vyc2l2ZSAmJlxuICAgICAgICAgICAgICAgICh0aGlzLnBhcmVudCB8fCBmYWxzZSkgJiZcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC5pc1JlZ2lzdGVyZWQodG9rZW4sIHRydWUpKSk7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmVuc3VyZU5vdERpc3Bvc2VkKCk7XG4gICAgICAgIHRoaXMuX3JlZ2lzdHJ5LmNsZWFyKCk7XG4gICAgICAgIHRoaXMuaW50ZXJjZXB0b3JzLnByZVJlc29sdXRpb24uY2xlYXIoKTtcbiAgICAgICAgdGhpcy5pbnRlcmNlcHRvcnMucG9zdFJlc29sdXRpb24uY2xlYXIoKTtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUuY2xlYXJJbnN0YW5jZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlXzMsIF9hO1xuICAgICAgICB0aGlzLmVuc3VyZU5vdERpc3Bvc2VkKCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmb3IgKHZhciBfYiA9IF9fdmFsdWVzKHRoaXMuX3JlZ2lzdHJ5LmVudHJpZXMoKSksIF9jID0gX2IubmV4dCgpOyAhX2MuZG9uZTsgX2MgPSBfYi5uZXh0KCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgX2QgPSBfX3JlYWQoX2MudmFsdWUsIDIpLCB0b2tlbiA9IF9kWzBdLCByZWdpc3RyYXRpb25zID0gX2RbMV07XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVnaXN0cnkuc2V0QWxsKHRva2VuLCByZWdpc3RyYXRpb25zXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHJlZ2lzdHJhdGlvbikgeyByZXR1cm4gIWlzVmFsdWVQcm92aWRlcihyZWdpc3RyYXRpb24ucHJvdmlkZXIpOyB9KVxuICAgICAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChyZWdpc3RyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVnaXN0cmF0aW9uLmluc3RhbmNlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVnaXN0cmF0aW9uO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZV8zXzEpIHsgZV8zID0geyBlcnJvcjogZV8zXzEgfTsgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKF9jICYmICFfYy5kb25lICYmIChfYSA9IF9iLnJldHVybikpIF9hLmNhbGwoX2IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmluYWxseSB7IGlmIChlXzMpIHRocm93IGVfMy5lcnJvcjsgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLmNyZWF0ZUNoaWxkQ29udGFpbmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZV80LCBfYTtcbiAgICAgICAgdGhpcy5lbnN1cmVOb3REaXNwb3NlZCgpO1xuICAgICAgICB2YXIgY2hpbGRDb250YWluZXIgPSBuZXcgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyKHRoaXMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZm9yICh2YXIgX2IgPSBfX3ZhbHVlcyh0aGlzLl9yZWdpc3RyeS5lbnRyaWVzKCkpLCBfYyA9IF9iLm5leHQoKTsgIV9jLmRvbmU7IF9jID0gX2IubmV4dCgpKSB7XG4gICAgICAgICAgICAgICAgdmFyIF9kID0gX19yZWFkKF9jLnZhbHVlLCAyKSwgdG9rZW4gPSBfZFswXSwgcmVnaXN0cmF0aW9ucyA9IF9kWzFdO1xuICAgICAgICAgICAgICAgIGlmIChyZWdpc3RyYXRpb25zLnNvbWUoZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvcHRpb25zID0gX2Eub3B0aW9ucztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMubGlmZWN5Y2xlID09PSBMaWZlY3ljbGUuQ29udGFpbmVyU2NvcGVkO1xuICAgICAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkQ29udGFpbmVyLl9yZWdpc3RyeS5zZXRBbGwodG9rZW4sIHJlZ2lzdHJhdGlvbnMubWFwKGZ1bmN0aW9uIChyZWdpc3RyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWdpc3RyYXRpb24ub3B0aW9ucy5saWZlY3ljbGUgPT09IExpZmVjeWNsZS5Db250YWluZXJTY29wZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlcjogcmVnaXN0cmF0aW9uLnByb3ZpZGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiByZWdpc3RyYXRpb24ub3B0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVnaXN0cmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlXzRfMSkgeyBlXzQgPSB7IGVycm9yOiBlXzRfMSB9OyB9XG4gICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoX2MgJiYgIV9jLmRvbmUgJiYgKF9hID0gX2IucmV0dXJuKSkgX2EuY2FsbChfYik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaW5hbGx5IHsgaWYgKGVfNCkgdGhyb3cgZV80LmVycm9yOyB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNoaWxkQ29udGFpbmVyO1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5iZWZvcmVSZXNvbHV0aW9uID0gZnVuY3Rpb24gKHRva2VuLCBjYWxsYmFjaywgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7IGZyZXF1ZW5jeTogXCJBbHdheXNcIiB9OyB9XG4gICAgICAgIHRoaXMuaW50ZXJjZXB0b3JzLnByZVJlc29sdXRpb24uc2V0KHRva2VuLCB7XG4gICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5hZnRlclJlc29sdXRpb24gPSBmdW5jdGlvbiAodG9rZW4sIGNhbGxiYWNrLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHsgZnJlcXVlbmN5OiBcIkFsd2F5c1wiIH07IH1cbiAgICAgICAgdGhpcy5pbnRlcmNlcHRvcnMucG9zdFJlc29sdXRpb24uc2V0KHRva2VuLCB7XG4gICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcHJvbWlzZXM7XG4gICAgICAgICAgICByZXR1cm4gX19nZW5lcmF0b3IodGhpcywgZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChfYS5sYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGVzLmZvckVhY2goZnVuY3Rpb24gKGRpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWF5YmVQcm9taXNlID0gZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1heWJlUHJvbWlzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKG1heWJlUHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzQsIFByb21pc2UuYWxsKHByb21pc2VzKV07XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hLnNlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5nZXRSZWdpc3RyYXRpb24gPSBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgaWYgKHRoaXMuaXNSZWdpc3RlcmVkKHRva2VuKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlZ2lzdHJ5LmdldCh0b2tlbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucGFyZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0UmVnaXN0cmF0aW9uKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUuZ2V0QWxsUmVnaXN0cmF0aW9ucyA9IGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgICBpZiAodGhpcy5pc1JlZ2lzdGVyZWQodG9rZW4pKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVnaXN0cnkuZ2V0QWxsKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXRBbGxSZWdpc3RyYXRpb25zKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUuY29uc3RydWN0ID0gZnVuY3Rpb24gKGN0b3IsIGNvbnRleHQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKGN0b3IgaW5zdGFuY2VvZiBEZWxheWVkQ29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBjdG9yLmNyZWF0ZVByb3h5KGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMucmVzb2x2ZSh0YXJnZXQsIGNvbnRleHQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGluc3RhbmNlID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbUluZm8gPSB0eXBlSW5mby5nZXQoY3Rvcik7XG4gICAgICAgICAgICBpZiAoIXBhcmFtSW5mbyB8fCBwYXJhbUluZm8ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGN0b3IubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY3RvcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVHlwZUluZm8gbm90IGtub3duIGZvciBcXFwiXCIgKyBjdG9yLm5hbWUgKyBcIlxcXCJcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHBhcmFtSW5mby5tYXAoX3RoaXMucmVzb2x2ZVBhcmFtcyhjb250ZXh0LCBjdG9yKSk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IChjdG9yLmJpbmQuYXBwbHkoY3RvciwgX19zcHJlYWQoW3ZvaWQgMF0sIHBhcmFtcykpKSgpO1xuICAgICAgICB9KSgpO1xuICAgICAgICBpZiAoaXNEaXNwb3NhYmxlKGluc3RhbmNlKSkge1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUucmVzb2x2ZVBhcmFtcyA9IGZ1bmN0aW9uIChjb250ZXh0LCBjdG9yKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAocGFyYW0sIGlkeCkge1xuICAgICAgICAgICAgdmFyIF9hLCBfYiwgX2M7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChpc1Rva2VuRGVzY3JpcHRvcihwYXJhbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzVHJhbnNmb3JtRGVzY3JpcHRvcihwYXJhbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbS5tdWx0aXBsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gKF9hID0gX3RoaXMucmVzb2x2ZShwYXJhbS50cmFuc2Zvcm0pKS50cmFuc2Zvcm0uYXBwbHkoX2EsIF9fc3ByZWFkKFtfdGhpcy5yZXNvbHZlQWxsKHBhcmFtLnRva2VuKV0sIHBhcmFtLnRyYW5zZm9ybUFyZ3MpKSA6IChfYiA9IF90aGlzLnJlc29sdmUocGFyYW0udHJhbnNmb3JtKSkudHJhbnNmb3JtLmFwcGx5KF9iLCBfX3NwcmVhZChbX3RoaXMucmVzb2x2ZShwYXJhbS50b2tlbiwgY29udGV4dCldLCBwYXJhbS50cmFuc2Zvcm1BcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW0ubXVsdGlwbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IF90aGlzLnJlc29sdmVBbGwocGFyYW0udG9rZW4pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBfdGhpcy5yZXNvbHZlKHBhcmFtLnRva2VuLCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChpc1RyYW5zZm9ybURlc2NyaXB0b3IocGFyYW0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoX2MgPSBfdGhpcy5yZXNvbHZlKHBhcmFtLnRyYW5zZm9ybSwgY29udGV4dCkpLnRyYW5zZm9ybS5hcHBseShfYywgX19zcHJlYWQoW190aGlzLnJlc29sdmUocGFyYW0udG9rZW4sIGNvbnRleHQpXSwgcGFyYW0udHJhbnNmb3JtQXJncykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMucmVzb2x2ZShwYXJhbSwgY29udGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihmb3JtYXRFcnJvckN0b3IoY3RvciwgaWR4LCBlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLmVuc3VyZU5vdERpc3Bvc2VkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5kaXNwb3NlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhpcyBjb250YWluZXIgaGFzIGJlZW4gZGlzcG9zZWQsIHlvdSBjYW5ub3QgaW50ZXJhY3Qgd2l0aCBhIGRpc3Bvc2VkIGNvbnRhaW5lclwiKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lcjtcbn0oKSk7XG5leHBvcnQgdmFyIGluc3RhbmNlID0gbmV3IEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lcigpO1xuZXhwb3J0IGRlZmF1bHQgaW5zdGFuY2U7XG4iLCJpbXBvcnQgeyBfX3JlYWQsIF9fc3ByZWFkIH0gZnJvbSBcInRzbGliXCI7XG5mdW5jdGlvbiBmb3JtYXREZXBlbmRlbmN5KHBhcmFtcywgaWR4KSB7XG4gICAgaWYgKHBhcmFtcyA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gXCJhdCBwb3NpdGlvbiAjXCIgKyBpZHg7XG4gICAgfVxuICAgIHZhciBhcmdOYW1lID0gcGFyYW1zLnNwbGl0KFwiLFwiKVtpZHhdLnRyaW0oKTtcbiAgICByZXR1cm4gXCJcXFwiXCIgKyBhcmdOYW1lICsgXCJcXFwiIGF0IHBvc2l0aW9uICNcIiArIGlkeDtcbn1cbmZ1bmN0aW9uIGNvbXBvc2VFcnJvck1lc3NhZ2UobXNnLCBlLCBpbmRlbnQpIHtcbiAgICBpZiAoaW5kZW50ID09PSB2b2lkIDApIHsgaW5kZW50ID0gXCIgICAgXCI7IH1cbiAgICByZXR1cm4gX19zcHJlYWQoW21zZ10sIGUubWVzc2FnZS5zcGxpdChcIlxcblwiKS5tYXAoZnVuY3Rpb24gKGwpIHsgcmV0dXJuIGluZGVudCArIGw7IH0pKS5qb2luKFwiXFxuXCIpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEVycm9yQ3RvcihjdG9yLCBwYXJhbUlkeCwgZXJyb3IpIHtcbiAgICB2YXIgX2EgPSBfX3JlYWQoY3Rvci50b1N0cmluZygpLm1hdGNoKC9jb25zdHJ1Y3RvclxcKChbXFx3LCBdKylcXCkvKSB8fCBbXSwgMiksIF9iID0gX2FbMV0sIHBhcmFtcyA9IF9iID09PSB2b2lkIDAgPyBudWxsIDogX2I7XG4gICAgdmFyIGRlcCA9IGZvcm1hdERlcGVuZGVuY3kocGFyYW1zLCBwYXJhbUlkeCk7XG4gICAgcmV0dXJuIGNvbXBvc2VFcnJvck1lc3NhZ2UoXCJDYW5ub3QgaW5qZWN0IHRoZSBkZXBlbmRlbmN5IFwiICsgZGVwICsgXCIgb2YgXFxcIlwiICsgY3Rvci5uYW1lICsgXCJcXFwiIGNvbnN0cnVjdG9yLiBSZWFzb246XCIsIGVycm9yKTtcbn1cbiIsImV4cG9ydCB7IGRlZmF1bHQgYXMgaW5zdGFuY2VDYWNoaW5nRmFjdG9yeSB9IGZyb20gXCIuL2luc3RhbmNlLWNhY2hpbmctZmFjdG9yeVwiO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBpbnN0YW5jZVBlckNvbnRhaW5lckNhY2hpbmdGYWN0b3J5IH0gZnJvbSBcIi4vaW5zdGFuY2UtcGVyLWNvbnRhaW5lci1jYWNoaW5nLWZhY3RvcnlcIjtcbmV4cG9ydCB7IGRlZmF1bHQgYXMgcHJlZGljYXRlQXdhcmVDbGFzc0ZhY3RvcnkgfSBmcm9tIFwiLi9wcmVkaWNhdGUtYXdhcmUtY2xhc3MtZmFjdG9yeVwiO1xuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5zdGFuY2VDYWNoaW5nRmFjdG9yeShmYWN0b3J5RnVuYykge1xuICAgIHZhciBpbnN0YW5jZTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRlcGVuZGVuY3lDb250YWluZXIpIHtcbiAgICAgICAgaWYgKGluc3RhbmNlID09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaW5zdGFuY2UgPSBmYWN0b3J5RnVuYyhkZXBlbmRlbmN5Q29udGFpbmVyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfTtcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGluc3RhbmNlUGVyQ29udGFpbmVyQ2FjaGluZ0ZhY3RvcnkoZmFjdG9yeUZ1bmMpIHtcbiAgICB2YXIgY2FjaGUgPSBuZXcgV2Vha01hcCgpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZGVwZW5kZW5jeUNvbnRhaW5lcikge1xuICAgICAgICB2YXIgaW5zdGFuY2UgPSBjYWNoZS5nZXQoZGVwZW5kZW5jeUNvbnRhaW5lcik7XG4gICAgICAgIGlmIChpbnN0YW5jZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGluc3RhbmNlID0gZmFjdG9yeUZ1bmMoZGVwZW5kZW5jeUNvbnRhaW5lcik7XG4gICAgICAgICAgICBjYWNoZS5zZXQoZGVwZW5kZW5jeUNvbnRhaW5lciwgaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9O1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcHJlZGljYXRlQXdhcmVDbGFzc0ZhY3RvcnkocHJlZGljYXRlLCB0cnVlQ29uc3RydWN0b3IsIGZhbHNlQ29uc3RydWN0b3IsIHVzZUNhY2hpbmcpIHtcbiAgICBpZiAodXNlQ2FjaGluZyA9PT0gdm9pZCAwKSB7IHVzZUNhY2hpbmcgPSB0cnVlOyB9XG4gICAgdmFyIGluc3RhbmNlO1xuICAgIHZhciBwcmV2aW91c1ByZWRpY2F0ZTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRlcGVuZGVuY3lDb250YWluZXIpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRQcmVkaWNhdGUgPSBwcmVkaWNhdGUoZGVwZW5kZW5jeUNvbnRhaW5lcik7XG4gICAgICAgIGlmICghdXNlQ2FjaGluZyB8fCBwcmV2aW91c1ByZWRpY2F0ZSAhPT0gY3VycmVudFByZWRpY2F0ZSkge1xuICAgICAgICAgICAgaWYgKChwcmV2aW91c1ByZWRpY2F0ZSA9IGN1cnJlbnRQcmVkaWNhdGUpKSB7XG4gICAgICAgICAgICAgICAgaW5zdGFuY2UgPSBkZXBlbmRlbmN5Q29udGFpbmVyLnJlc29sdmUodHJ1ZUNvbnN0cnVjdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGluc3RhbmNlID0gZGVwZW5kZW5jeUNvbnRhaW5lci5yZXNvbHZlKGZhbHNlQ29uc3RydWN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9O1xufVxuIiwiaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcInVuZGVmaW5lZFwiIHx8ICFSZWZsZWN0LmdldE1ldGFkYXRhKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwidHN5cmluZ2UgcmVxdWlyZXMgYSByZWZsZWN0IHBvbHlmaWxsLiBQbGVhc2UgYWRkICdpbXBvcnQgXFxcInJlZmxlY3QtbWV0YWRhdGFcXFwiJyB0byB0aGUgdG9wIG9mIHlvdXIgZW50cnkgcG9pbnQuXCIpO1xufVxuZXhwb3J0IHsgTGlmZWN5Y2xlIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2RlY29yYXRvcnNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2ZhY3Rvcmllc1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vcHJvdmlkZXJzXCI7XG5leHBvcnQgeyBkZWxheSB9IGZyb20gXCIuL2xhenktaGVscGVyc1wiO1xuZXhwb3J0IHsgaW5zdGFuY2UgYXMgY29udGFpbmVyIH0gZnJvbSBcIi4vZGVwZW5kZW5jeS1jb250YWluZXJcIjtcbiIsImltcG9ydCB7IF9fZXh0ZW5kcyB9IGZyb20gXCJ0c2xpYlwiO1xuaW1wb3J0IFJlZ2lzdHJ5QmFzZSBmcm9tIFwiLi9yZWdpc3RyeS1iYXNlXCI7XG52YXIgUHJlUmVzb2x1dGlvbkludGVyY2VwdG9ycyA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFByZVJlc29sdXRpb25JbnRlcmNlcHRvcnMsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gUHJlUmVzb2x1dGlvbkludGVyY2VwdG9ycygpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlciAhPT0gbnVsbCAmJiBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gUHJlUmVzb2x1dGlvbkludGVyY2VwdG9ycztcbn0oUmVnaXN0cnlCYXNlKSk7XG5leHBvcnQgeyBQcmVSZXNvbHV0aW9uSW50ZXJjZXB0b3JzIH07XG52YXIgUG9zdFJlc29sdXRpb25JbnRlcmNlcHRvcnMgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhQb3N0UmVzb2x1dGlvbkludGVyY2VwdG9ycywgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBQb3N0UmVzb2x1dGlvbkludGVyY2VwdG9ycygpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlciAhPT0gbnVsbCAmJiBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gUG9zdFJlc29sdXRpb25JbnRlcmNlcHRvcnM7XG59KFJlZ2lzdHJ5QmFzZSkpO1xuZXhwb3J0IHsgUG9zdFJlc29sdXRpb25JbnRlcmNlcHRvcnMgfTtcbnZhciBJbnRlcmNlcHRvcnMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEludGVyY2VwdG9ycygpIHtcbiAgICAgICAgdGhpcy5wcmVSZXNvbHV0aW9uID0gbmV3IFByZVJlc29sdXRpb25JbnRlcmNlcHRvcnMoKTtcbiAgICAgICAgdGhpcy5wb3N0UmVzb2x1dGlvbiA9IG5ldyBQb3N0UmVzb2x1dGlvbkludGVyY2VwdG9ycygpO1xuICAgIH1cbiAgICByZXR1cm4gSW50ZXJjZXB0b3JzO1xufSgpKTtcbmV4cG9ydCBkZWZhdWx0IEludGVyY2VwdG9ycztcbiIsImltcG9ydCB7IF9fcmVhZCwgX19zcHJlYWQgfSBmcm9tIFwidHNsaWJcIjtcbnZhciBEZWxheWVkQ29uc3RydWN0b3IgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIERlbGF5ZWRDb25zdHJ1Y3Rvcih3cmFwKSB7XG4gICAgICAgIHRoaXMud3JhcCA9IHdyYXA7XG4gICAgICAgIHRoaXMucmVmbGVjdE1ldGhvZHMgPSBbXG4gICAgICAgICAgICBcImdldFwiLFxuICAgICAgICAgICAgXCJnZXRQcm90b3R5cGVPZlwiLFxuICAgICAgICAgICAgXCJzZXRQcm90b3R5cGVPZlwiLFxuICAgICAgICAgICAgXCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JcIixcbiAgICAgICAgICAgIFwiZGVmaW5lUHJvcGVydHlcIixcbiAgICAgICAgICAgIFwiaGFzXCIsXG4gICAgICAgICAgICBcInNldFwiLFxuICAgICAgICAgICAgXCJkZWxldGVQcm9wZXJ0eVwiLFxuICAgICAgICAgICAgXCJhcHBseVwiLFxuICAgICAgICAgICAgXCJjb25zdHJ1Y3RcIixcbiAgICAgICAgICAgIFwib3duS2V5c1wiXG4gICAgICAgIF07XG4gICAgfVxuICAgIERlbGF5ZWRDb25zdHJ1Y3Rvci5wcm90b3R5cGUuY3JlYXRlUHJveHkgPSBmdW5jdGlvbiAoY3JlYXRlT2JqZWN0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciB0YXJnZXQgPSB7fTtcbiAgICAgICAgdmFyIGluaXQgPSBmYWxzZTtcbiAgICAgICAgdmFyIHZhbHVlO1xuICAgICAgICB2YXIgZGVsYXllZE9iamVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghaW5pdCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gY3JlYXRlT2JqZWN0KF90aGlzLndyYXAoKSk7XG4gICAgICAgICAgICAgICAgaW5pdCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBuZXcgUHJveHkodGFyZ2V0LCB0aGlzLmNyZWF0ZUhhbmRsZXIoZGVsYXllZE9iamVjdCkpO1xuICAgIH07XG4gICAgRGVsYXllZENvbnN0cnVjdG9yLnByb3RvdHlwZS5jcmVhdGVIYW5kbGVyID0gZnVuY3Rpb24gKGRlbGF5ZWRPYmplY3QpIHtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSB7fTtcbiAgICAgICAgdmFyIGluc3RhbGwgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgaGFuZGxlcltuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbX2ldID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXJnc1swXSA9IGRlbGF5ZWRPYmplY3QoKTtcbiAgICAgICAgICAgICAgICB2YXIgbWV0aG9kID0gUmVmbGVjdFtuYW1lXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWV0aG9kLmFwcGx5KHZvaWQgMCwgX19zcHJlYWQoYXJncykpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5yZWZsZWN0TWV0aG9kcy5mb3JFYWNoKGluc3RhbGwpO1xuICAgICAgICByZXR1cm4gaGFuZGxlcjtcbiAgICB9O1xuICAgIHJldHVybiBEZWxheWVkQ29uc3RydWN0b3I7XG59KCkpO1xuZXhwb3J0IHsgRGVsYXllZENvbnN0cnVjdG9yIH07XG5leHBvcnQgZnVuY3Rpb24gZGVsYXkod3JhcHBlZENvbnN0cnVjdG9yKSB7XG4gICAgaWYgKHR5cGVvZiB3cmFwcGVkQ29uc3RydWN0b3IgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXR0ZW1wdCB0byBgZGVsYXlgIHVuZGVmaW5lZC4gQ29uc3RydWN0b3IgbXVzdCBiZSB3cmFwcGVkIGluIGEgY2FsbGJhY2tcIik7XG4gICAgfVxuICAgIHJldHVybiBuZXcgRGVsYXllZENvbnN0cnVjdG9yKHdyYXBwZWRDb25zdHJ1Y3Rvcik7XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gaXNDbGFzc1Byb3ZpZGVyKHByb3ZpZGVyKSB7XG4gICAgcmV0dXJuICEhcHJvdmlkZXIudXNlQ2xhc3M7XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gaXNGYWN0b3J5UHJvdmlkZXIocHJvdmlkZXIpIHtcbiAgICByZXR1cm4gISFwcm92aWRlci51c2VGYWN0b3J5O1xufVxuIiwiZXhwb3J0IHsgaXNDbGFzc1Byb3ZpZGVyIH0gZnJvbSBcIi4vY2xhc3MtcHJvdmlkZXJcIjtcbmV4cG9ydCB7IGlzRmFjdG9yeVByb3ZpZGVyIH0gZnJvbSBcIi4vZmFjdG9yeS1wcm92aWRlclwiO1xuZXhwb3J0IHsgaXNOb3JtYWxUb2tlbiB9IGZyb20gXCIuL2luamVjdGlvbi10b2tlblwiO1xuZXhwb3J0IHsgaXNUb2tlblByb3ZpZGVyIH0gZnJvbSBcIi4vdG9rZW4tcHJvdmlkZXJcIjtcbmV4cG9ydCB7IGlzVmFsdWVQcm92aWRlciB9IGZyb20gXCIuL3ZhbHVlLXByb3ZpZGVyXCI7XG4iLCJpbXBvcnQgeyBEZWxheWVkQ29uc3RydWN0b3IgfSBmcm9tIFwiLi4vbGF6eS1oZWxwZXJzXCI7XG5leHBvcnQgZnVuY3Rpb24gaXNOb3JtYWxUb2tlbih0b2tlbikge1xuICAgIHJldHVybiB0eXBlb2YgdG9rZW4gPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIHRva2VuID09PSBcInN5bWJvbFwiO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzVG9rZW5EZXNjcmlwdG9yKGRlc2NyaXB0b3IpIHtcbiAgICByZXR1cm4gKHR5cGVvZiBkZXNjcmlwdG9yID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgIFwidG9rZW5cIiBpbiBkZXNjcmlwdG9yICYmXG4gICAgICAgIFwibXVsdGlwbGVcIiBpbiBkZXNjcmlwdG9yKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc1RyYW5zZm9ybURlc2NyaXB0b3IoZGVzY3JpcHRvcikge1xuICAgIHJldHVybiAodHlwZW9mIGRlc2NyaXB0b3IgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgXCJ0b2tlblwiIGluIGRlc2NyaXB0b3IgJiZcbiAgICAgICAgXCJ0cmFuc2Zvcm1cIiBpbiBkZXNjcmlwdG9yKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnN0cnVjdG9yVG9rZW4odG9rZW4pIHtcbiAgICByZXR1cm4gdHlwZW9mIHRva2VuID09PSBcImZ1bmN0aW9uXCIgfHwgdG9rZW4gaW5zdGFuY2VvZiBEZWxheWVkQ29uc3RydWN0b3I7XG59XG4iLCJpbXBvcnQgeyBpc0NsYXNzUHJvdmlkZXIgfSBmcm9tIFwiLi9jbGFzcy1wcm92aWRlclwiO1xuaW1wb3J0IHsgaXNWYWx1ZVByb3ZpZGVyIH0gZnJvbSBcIi4vdmFsdWUtcHJvdmlkZXJcIjtcbmltcG9ydCB7IGlzVG9rZW5Qcm92aWRlciB9IGZyb20gXCIuL3Rva2VuLXByb3ZpZGVyXCI7XG5pbXBvcnQgeyBpc0ZhY3RvcnlQcm92aWRlciB9IGZyb20gXCIuL2ZhY3RvcnktcHJvdmlkZXJcIjtcbmV4cG9ydCBmdW5jdGlvbiBpc1Byb3ZpZGVyKHByb3ZpZGVyKSB7XG4gICAgcmV0dXJuIChpc0NsYXNzUHJvdmlkZXIocHJvdmlkZXIpIHx8XG4gICAgICAgIGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikgfHxcbiAgICAgICAgaXNUb2tlblByb3ZpZGVyKHByb3ZpZGVyKSB8fFxuICAgICAgICBpc0ZhY3RvcnlQcm92aWRlcihwcm92aWRlcikpO1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGlzVG9rZW5Qcm92aWRlcihwcm92aWRlcikge1xuICAgIHJldHVybiAhIXByb3ZpZGVyLnVzZVRva2VuO1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikge1xuICAgIHJldHVybiBwcm92aWRlci51c2VWYWx1ZSAhPSB1bmRlZmluZWQ7XG59XG4iLCJleHBvcnQgdmFyIElOSkVDVElPTl9UT0tFTl9NRVRBREFUQV9LRVkgPSBcImluamVjdGlvblRva2Vuc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmFtSW5mbyh0YXJnZXQpIHtcbiAgICB2YXIgcGFyYW1zID0gUmVmbGVjdC5nZXRNZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIHRhcmdldCkgfHwgW107XG4gICAgdmFyIGluamVjdGlvblRva2VucyA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoSU5KRUNUSU9OX1RPS0VOX01FVEFEQVRBX0tFWSwgdGFyZ2V0KSB8fCB7fTtcbiAgICBPYmplY3Qua2V5cyhpbmplY3Rpb25Ub2tlbnMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBwYXJhbXNbK2tleV0gPSBpbmplY3Rpb25Ub2tlbnNba2V5XTtcbiAgICB9KTtcbiAgICByZXR1cm4gcGFyYW1zO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUluamVjdGlvblRva2VuTWV0YWRhdGEoZGF0YSwgdHJhbnNmb3JtKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIF9wcm9wZXJ0eUtleSwgcGFyYW1ldGVySW5kZXgpIHtcbiAgICAgICAgdmFyIGRlc2NyaXB0b3JzID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShJTkpFQ1RJT05fVE9LRU5fTUVUQURBVEFfS0VZLCB0YXJnZXQpIHx8IHt9O1xuICAgICAgICBkZXNjcmlwdG9yc1twYXJhbWV0ZXJJbmRleF0gPSB0cmFuc2Zvcm1cbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgIHRva2VuOiBkYXRhLFxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNmb3JtLnRyYW5zZm9ybVRva2VuLFxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybUFyZ3M6IHRyYW5zZm9ybS5hcmdzIHx8IFtdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA6IGRhdGE7XG4gICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoSU5KRUNUSU9OX1RPS0VOX01FVEFEQVRBX0tFWSwgZGVzY3JpcHRvcnMsIHRhcmdldCk7XG4gICAgfTtcbn1cbiIsInZhciBSZWdpc3RyeUJhc2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJlZ2lzdHJ5QmFzZSgpIHtcbiAgICAgICAgdGhpcy5fcmVnaXN0cnlNYXAgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIFJlZ2lzdHJ5QmFzZS5wcm90b3R5cGUuZW50cmllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlZ2lzdHJ5TWFwLmVudHJpZXMoKTtcbiAgICB9O1xuICAgIFJlZ2lzdHJ5QmFzZS5wcm90b3R5cGUuZ2V0QWxsID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICB0aGlzLmVuc3VyZShrZXkpO1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVnaXN0cnlNYXAuZ2V0KGtleSk7XG4gICAgfTtcbiAgICBSZWdpc3RyeUJhc2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgdGhpcy5lbnN1cmUoa2V5KTtcbiAgICAgICAgdmFyIHZhbHVlID0gdGhpcy5fcmVnaXN0cnlNYXAuZ2V0KGtleSk7XG4gICAgICAgIHJldHVybiB2YWx1ZVt2YWx1ZS5sZW5ndGggLSAxXSB8fCBudWxsO1xuICAgIH07XG4gICAgUmVnaXN0cnlCYXNlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmVuc3VyZShrZXkpO1xuICAgICAgICB0aGlzLl9yZWdpc3RyeU1hcC5nZXQoa2V5KS5wdXNoKHZhbHVlKTtcbiAgICB9O1xuICAgIFJlZ2lzdHJ5QmFzZS5wcm90b3R5cGUuc2V0QWxsID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5fcmVnaXN0cnlNYXAuc2V0KGtleSwgdmFsdWUpO1xuICAgIH07XG4gICAgUmVnaXN0cnlCYXNlLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHRoaXMuZW5zdXJlKGtleSk7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZWdpc3RyeU1hcC5nZXQoa2V5KS5sZW5ndGggPiAwO1xuICAgIH07XG4gICAgUmVnaXN0cnlCYXNlLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fcmVnaXN0cnlNYXAuY2xlYXIoKTtcbiAgICB9O1xuICAgIFJlZ2lzdHJ5QmFzZS5wcm90b3R5cGUuZW5zdXJlID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAoIXRoaXMuX3JlZ2lzdHJ5TWFwLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWdpc3RyeU1hcC5zZXQoa2V5LCBbXSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBSZWdpc3RyeUJhc2U7XG59KCkpO1xuZXhwb3J0IGRlZmF1bHQgUmVnaXN0cnlCYXNlO1xuIiwiaW1wb3J0IHsgX19leHRlbmRzIH0gZnJvbSBcInRzbGliXCI7XG5pbXBvcnQgUmVnaXN0cnlCYXNlIGZyb20gXCIuL3JlZ2lzdHJ5LWJhc2VcIjtcbnZhciBSZWdpc3RyeSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFJlZ2lzdHJ5LCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFJlZ2lzdHJ5KCkge1xuICAgICAgICByZXR1cm4gX3N1cGVyICE9PSBudWxsICYmIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpIHx8IHRoaXM7XG4gICAgfVxuICAgIHJldHVybiBSZWdpc3RyeTtcbn0oUmVnaXN0cnlCYXNlKSk7XG5leHBvcnQgZGVmYXVsdCBSZWdpc3RyeTtcbiIsInZhciBSZXNvbHV0aW9uQ29udGV4dCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmVzb2x1dGlvbkNvbnRleHQoKSB7XG4gICAgICAgIHRoaXMuc2NvcGVkUmVzb2x1dGlvbnMgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIHJldHVybiBSZXNvbHV0aW9uQ29udGV4dDtcbn0oKSk7XG5leHBvcnQgZGVmYXVsdCBSZXNvbHV0aW9uQ29udGV4dDtcbiIsImV4cG9ydCBmdW5jdGlvbiBpc0Rpc3Bvc2FibGUodmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlLmRpc3Bvc2UgIT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIHZhciBkaXNwb3NlRnVuID0gdmFsdWUuZGlzcG9zZTtcbiAgICBpZiAoZGlzcG9zZUZ1bi5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG4iLCJleHBvcnQgeyBkZWZhdWx0IGFzIExpZmVjeWNsZSB9IGZyb20gXCIuL2xpZmVjeWNsZVwiO1xuIiwidmFyIExpZmVjeWNsZTtcbihmdW5jdGlvbiAoTGlmZWN5Y2xlKSB7XG4gICAgTGlmZWN5Y2xlW0xpZmVjeWNsZVtcIlRyYW5zaWVudFwiXSA9IDBdID0gXCJUcmFuc2llbnRcIjtcbiAgICBMaWZlY3ljbGVbTGlmZWN5Y2xlW1wiU2luZ2xldG9uXCJdID0gMV0gPSBcIlNpbmdsZXRvblwiO1xuICAgIExpZmVjeWNsZVtMaWZlY3ljbGVbXCJSZXNvbHV0aW9uU2NvcGVkXCJdID0gMl0gPSBcIlJlc29sdXRpb25TY29wZWRcIjtcbiAgICBMaWZlY3ljbGVbTGlmZWN5Y2xlW1wiQ29udGFpbmVyU2NvcGVkXCJdID0gM10gPSBcIkNvbnRhaW5lclNjb3BlZFwiO1xufSkoTGlmZWN5Y2xlIHx8IChMaWZlY3ljbGUgPSB7fSkpO1xuZXhwb3J0IGRlZmF1bHQgTGlmZWN5Y2xlO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIGRlZmluaXRpb24pIHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmosIHByb3ApIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApOyB9IiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIiLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8vIFRoaXMgZW50cnkgbW9kdWxlIGlzIHJlZmVyZW5jZWQgYnkgb3RoZXIgbW9kdWxlcyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9tYWluLnRzXCIpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9