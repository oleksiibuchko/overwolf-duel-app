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
    url: 'https://overwolf-duel-api-207077dd4a09.herokuapp.com',
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
        this.userGreeting = document.getElementById('userGreeting');
        (_a = this.loginButton) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () {
            _this.authService.login();
        });
        this.createServer();
        this.init();
    }
    Main.prototype.createServer = function () {
        var _this = this;
        var _port = 61234;
        overwolf.web.createServer(_port, function (serverInfo) {
            if (serverInfo.error) {
                console.log('Failed to create server');
            }
            else {
                _this.server = serverInfo.server;
                if (!_this.server) {
                    return;
                }
                _this.server.onRequest.removeListener(_this.onRequest.bind(_this));
                _this.server.onRequest.addListener(_this.onRequest.bind(_this));
                _this.server.listen(function (info) {
                    console.log("Server listening status on port ".concat(_port, " : ").concat(info));
                });
            }
        });
    };
    Main.prototype.onRequest = function (info) {
        var _this = this;
        var urlString = info.url;
        var url = new URL(urlString);
        var searchParams = url.searchParams;
        var access_token = searchParams.get('access_token');
        var token_type = searchParams.get('token_type');
        if (access_token && token_type) {
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('token_type', token_type);
            this.authService.getUser().then(function (data) {
                var _a, _b;
                var user = data.user;
                (_a = _this.loginButton) === null || _a === void 0 ? void 0 : _a.style.display = 'none';
                (_b = _this.userGreeting) === null || _b === void 0 ? void 0 : _b.innerText = "Hi, ".concat(user.username, ". Enjoy playing games.");
            });
        }
    };
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
        this.user = null;
    }
    AuthService.prototype.getUser = function () {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, tokenType, response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        accessToken = localStorage.getItem('access_token');
                        tokenType = localStorage.getItem('token_type');
                        if (!accessToken || !tokenType) {
                            console.log('invalid token');
                            return [2, Promise.reject(new Error('Invalid token'))];
                        }
                        return [4, fetch(environment_1.environment.url + '/auth/discord/user', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    data: {
                                        access_token: accessToken,
                                        token_type: tokenType,
                                    },
                                }),
                            })];
                    case 1:
                        response = _a.sent();
                        if (response.ok) {
                            return [2, response.json()];
                        }
                        else {
                            console.error('Error:', response.statusText);
                            return [2, Promise.reject(new Error(response.statusText))];
                        }
                        return [3, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error:', error_1.message);
                        return [2, Promise.reject(error_1)];
                    case 3: return [2];
                }
            });
        });
    };
    AuthService.prototype.login = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
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
                        error_2 = _a.sent();
                        console.error('Error:', error_2.message);
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
                                    data: { events: this.events, info: this.info, fileName: fileName || null },
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRWE7O0FBRWI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1COztBQUVuQjtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVEOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGtCQUFrQixzQkFBc0I7QUFDeEM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZTtBQUNmOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0Esb0JBQW9CLFNBQVM7QUFDN0I7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQSxNQUFNO0FBQ047QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjs7QUFFQSxrQ0FBa0MsUUFBUTtBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLGlCQUFpQjtBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLFFBQVE7QUFDUjtB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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdHQUF3RztBQUN4RztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUZBQWlGO0FBQ2pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzRUFBc0U7QUFDdEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNFQUFzRTtBQUN0RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3RUFBd0U7QUFDeEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QsUUFBUTtBQUN4RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELFFBQVE7QUFDeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsdUJBQXVCO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0RBQXdELDBCQUEwQjtBQUNsRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUM7QUFDdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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O0FBQ2QsK0RBQWUsUUFBUSxFQUFDOzs7Ozs7Ozs7Ozs7O0FDVHhCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QsK0RBQWUsaUJBQWlCLEVBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUNOMUI7QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7OztBQ1JtRDs7Ozs7Ozs7Ozs7OztBQ0FuRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLDhCQUE4QjtBQUMvQiwrREFBZSxTQUFTLEVBQUM7Ozs7Ozs7VUNQekI7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLEdBQUc7V0FDSDtXQUNBO1dBQ0EsQ0FBQzs7Ozs7V0NQRCw4Q0FBOEM7Ozs7O1dDQTlDO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RDs7Ozs7VUVOQTtVQUNBO1VBQ0E7VUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3JlZmxlY3QtbWV0YWRhdGEvUmVmbGVjdC5qcyIsIndlYnBhY2s6Ly9NYWluLy4vc3JjL2NvbmZpZy9nYW1lLWRhdGEudHMiLCJ3ZWJwYWNrOi8vTWFpbi8uL3NyYy9lbnZpcm9ubWVudC9lbnZpcm9ubWVudC50cyIsIndlYnBhY2s6Ly9NYWluLy4vc3JjL21haW4udHMiLCJ3ZWJwYWNrOi8vTWFpbi8uL3NyYy9zZXJ2aWNlcy9hdXRoLXNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vTWFpbi8uL3NyYy9zZXJ2aWNlcy9nYW1lLWRldGVjdGlvbi1zZXJ2aWNlLnRzIiwid2VicGFjazovL01haW4vLi9zcmMvc2VydmljZXMvZ2VwLWNvbnN1bWVyLnRzIiwid2VicGFjazovL01haW4vLi9zcmMvc2VydmljZXMvZ2VwLXNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c2xpYi90c2xpYi5lczYuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZGVjb3JhdG9ycy9hdXRvLWluamVjdGFibGUuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZGVjb3JhdG9ycy9pbmRleC5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9kZWNvcmF0b3JzL2luamVjdC1hbGwtd2l0aC10cmFuc2Zvcm0uanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZGVjb3JhdG9ycy9pbmplY3QtYWxsLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2RlY29yYXRvcnMvaW5qZWN0LXdpdGgtdHJhbnNmb3JtLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2RlY29yYXRvcnMvaW5qZWN0LmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2RlY29yYXRvcnMvaW5qZWN0YWJsZS5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9kZWNvcmF0b3JzL3JlZ2lzdHJ5LmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2RlY29yYXRvcnMvc2NvcGVkLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2RlY29yYXRvcnMvc2luZ2xldG9uLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2RlcGVuZGVuY3ktY29udGFpbmVyLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2Vycm9yLWhlbHBlcnMuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZmFjdG9yaWVzL2luZGV4LmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2ZhY3Rvcmllcy9pbnN0YW5jZS1jYWNoaW5nLWZhY3RvcnkuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvZmFjdG9yaWVzL2luc3RhbmNlLXBlci1jb250YWluZXItY2FjaGluZy1mYWN0b3J5LmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L2ZhY3Rvcmllcy9wcmVkaWNhdGUtYXdhcmUtY2xhc3MtZmFjdG9yeS5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9pbmRleC5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9pbnRlcmNlcHRvcnMuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvbGF6eS1oZWxwZXJzLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L3Byb3ZpZGVycy9jbGFzcy1wcm92aWRlci5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9wcm92aWRlcnMvZmFjdG9yeS1wcm92aWRlci5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9wcm92aWRlcnMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvcHJvdmlkZXJzL2luamVjdGlvbi10b2tlbi5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9wcm92aWRlcnMvcHJvdmlkZXIuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvcHJvdmlkZXJzL3Rva2VuLXByb3ZpZGVyLmpzIiwid2VicGFjazovL01haW4vLi9ub2RlX21vZHVsZXMvdHN5cmluZ2UvZGlzdC9lc201L3Byb3ZpZGVycy92YWx1ZS1wcm92aWRlci5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9yZWZsZWN0aW9uLWhlbHBlcnMuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvcmVnaXN0cnktYmFzZS5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9yZWdpc3RyeS5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS9yZXNvbHV0aW9uLWNvbnRleHQuanMiLCJ3ZWJwYWNrOi8vTWFpbi8uL25vZGVfbW9kdWxlcy90c3lyaW5nZS9kaXN0L2VzbTUvdHlwZXMvZGlzcG9zYWJsZS5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS90eXBlcy9pbmRleC5qcyIsIndlYnBhY2s6Ly9NYWluLy4vbm9kZV9tb2R1bGVzL3RzeXJpbmdlL2Rpc3QvZXNtNS90eXBlcy9saWZlY3ljbGUuanMiLCJ3ZWJwYWNrOi8vTWFpbi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9NYWluL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9NYWluL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vTWFpbi93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL01haW4vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9NYWluL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vTWFpbi93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vTWFpbi93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFIgPSB0eXBlb2YgUmVmbGVjdCA9PT0gJ29iamVjdCcgPyBSZWZsZWN0IDogbnVsbFxudmFyIFJlZmxlY3RBcHBseSA9IFIgJiYgdHlwZW9mIFIuYXBwbHkgPT09ICdmdW5jdGlvbidcbiAgPyBSLmFwcGx5XG4gIDogZnVuY3Rpb24gUmVmbGVjdEFwcGx5KHRhcmdldCwgcmVjZWl2ZXIsIGFyZ3MpIHtcbiAgICByZXR1cm4gRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5LmNhbGwodGFyZ2V0LCByZWNlaXZlciwgYXJncyk7XG4gIH1cblxudmFyIFJlZmxlY3RPd25LZXlzXG5pZiAoUiAmJiB0eXBlb2YgUi5vd25LZXlzID09PSAnZnVuY3Rpb24nKSB7XG4gIFJlZmxlY3RPd25LZXlzID0gUi5vd25LZXlzXG59IGVsc2UgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgUmVmbGVjdE93bktleXMgPSBmdW5jdGlvbiBSZWZsZWN0T3duS2V5cyh0YXJnZXQpIHtcbiAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGFyZ2V0KVxuICAgICAgLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHRhcmdldCkpO1xuICB9O1xufSBlbHNlIHtcbiAgUmVmbGVjdE93bktleXMgPSBmdW5jdGlvbiBSZWZsZWN0T3duS2V5cyh0YXJnZXQpIHtcbiAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGFyZ2V0KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gUHJvY2Vzc0VtaXRXYXJuaW5nKHdhcm5pbmcpIHtcbiAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS53YXJuKSBjb25zb2xlLndhcm4od2FybmluZyk7XG59XG5cbnZhciBOdW1iZXJJc05hTiA9IE51bWJlci5pc05hTiB8fCBmdW5jdGlvbiBOdW1iZXJJc05hTih2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT09IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIEV2ZW50RW1pdHRlci5pbml0LmNhbGwodGhpcyk7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbm1vZHVsZS5leHBvcnRzLm9uY2UgPSBvbmNlO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50c0NvdW50ID0gMDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxudmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuZnVuY3Rpb24gY2hlY2tMaXN0ZW5lcihsaXN0ZW5lcikge1xuICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwibGlzdGVuZXJcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgRnVuY3Rpb24uIFJlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBsaXN0ZW5lcik7XG4gIH1cbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEV2ZW50RW1pdHRlciwgJ2RlZmF1bHRNYXhMaXN0ZW5lcnMnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gIH0sXG4gIHNldDogZnVuY3Rpb24oYXJnKSB7XG4gICAgaWYgKHR5cGVvZiBhcmcgIT09ICdudW1iZXInIHx8IGFyZyA8IDAgfHwgTnVtYmVySXNOYU4oYXJnKSkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBvZiBcImRlZmF1bHRNYXhMaXN0ZW5lcnNcIiBpcyBvdXQgb2YgcmFuZ2UuIEl0IG11c3QgYmUgYSBub24tbmVnYXRpdmUgbnVtYmVyLiBSZWNlaXZlZCAnICsgYXJnICsgJy4nKTtcbiAgICB9XG4gICAgZGVmYXVsdE1heExpc3RlbmVycyA9IGFyZztcbiAgfVxufSk7XG5cbkV2ZW50RW1pdHRlci5pbml0ID0gZnVuY3Rpb24oKSB7XG5cbiAgaWYgKHRoaXMuX2V2ZW50cyA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICB0aGlzLl9ldmVudHMgPT09IE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKS5fZXZlbnRzKSB7XG4gICAgdGhpcy5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gIH1cblxuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufTtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gc2V0TWF4TGlzdGVuZXJzKG4pIHtcbiAgaWYgKHR5cGVvZiBuICE9PSAnbnVtYmVyJyB8fCBuIDwgMCB8fCBOdW1iZXJJc05hTihuKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgb2YgXCJuXCIgaXMgb3V0IG9mIHJhbmdlLiBJdCBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIG51bWJlci4gUmVjZWl2ZWQgJyArIG4gKyAnLicpO1xuICB9XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuZnVuY3Rpb24gX2dldE1heExpc3RlbmVycyh0aGF0KSB7XG4gIGlmICh0aGF0Ll9tYXhMaXN0ZW5lcnMgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gIHJldHVybiB0aGF0Ll9tYXhMaXN0ZW5lcnM7XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZ2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gZ2V0TWF4TGlzdGVuZXJzKCkge1xuICByZXR1cm4gX2dldE1heExpc3RlbmVycyh0aGlzKTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSkge1xuICB2YXIgYXJncyA9IFtdO1xuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gIHZhciBkb0Vycm9yID0gKHR5cGUgPT09ICdlcnJvcicpO1xuXG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gIGlmIChldmVudHMgIT09IHVuZGVmaW5lZClcbiAgICBkb0Vycm9yID0gKGRvRXJyb3IgJiYgZXZlbnRzLmVycm9yID09PSB1bmRlZmluZWQpO1xuICBlbHNlIGlmICghZG9FcnJvcilcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAoZG9FcnJvcikge1xuICAgIHZhciBlcjtcbiAgICBpZiAoYXJncy5sZW5ndGggPiAwKVxuICAgICAgZXIgPSBhcmdzWzBdO1xuICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAvLyBOb3RlOiBUaGUgY29tbWVudHMgb24gdGhlIGB0aHJvd2AgbGluZXMgYXJlIGludGVudGlvbmFsLCB0aGV5IHNob3dcbiAgICAgIC8vIHVwIGluIE5vZGUncyBvdXRwdXQgaWYgdGhpcyByZXN1bHRzIGluIGFuIHVuaGFuZGxlZCBleGNlcHRpb24uXG4gICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICB9XG4gICAgLy8gQXQgbGVhc3QgZ2l2ZSBzb21lIGtpbmQgb2YgY29udGV4dCB0byB0aGUgdXNlclxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1VuaGFuZGxlZCBlcnJvci4nICsgKGVyID8gJyAoJyArIGVyLm1lc3NhZ2UgKyAnKScgOiAnJykpO1xuICAgIGVyci5jb250ZXh0ID0gZXI7XG4gICAgdGhyb3cgZXJyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICB9XG5cbiAgdmFyIGhhbmRsZXIgPSBldmVudHNbdHlwZV07XG5cbiAgaWYgKGhhbmRsZXIgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgUmVmbGVjdEFwcGx5KGhhbmRsZXIsIHRoaXMsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsZW4gPSBoYW5kbGVyLmxlbmd0aDtcbiAgICB2YXIgbGlzdGVuZXJzID0gYXJyYXlDbG9uZShoYW5kbGVyLCBsZW4pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpXG4gICAgICBSZWZsZWN0QXBwbHkobGlzdGVuZXJzW2ldLCB0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuZnVuY3Rpb24gX2FkZExpc3RlbmVyKHRhcmdldCwgdHlwZSwgbGlzdGVuZXIsIHByZXBlbmQpIHtcbiAgdmFyIG07XG4gIHZhciBldmVudHM7XG4gIHZhciBleGlzdGluZztcblxuICBjaGVja0xpc3RlbmVyKGxpc3RlbmVyKTtcblxuICBldmVudHMgPSB0YXJnZXQuX2V2ZW50cztcbiAgaWYgKGV2ZW50cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRhcmdldC5fZXZlbnRzQ291bnQgPSAwO1xuICB9IGVsc2Uge1xuICAgIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gICAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICAgIGlmIChldmVudHMubmV3TGlzdGVuZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGFyZ2V0LmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyID8gbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgICAgIC8vIFJlLWFzc2lnbiBgZXZlbnRzYCBiZWNhdXNlIGEgbmV3TGlzdGVuZXIgaGFuZGxlciBjb3VsZCBoYXZlIGNhdXNlZCB0aGVcbiAgICAgIC8vIHRoaXMuX2V2ZW50cyB0byBiZSBhc3NpZ25lZCB0byBhIG5ldyBvYmplY3RcbiAgICAgIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuICAgIH1cbiAgICBleGlzdGluZyA9IGV2ZW50c1t0eXBlXTtcbiAgfVxuXG4gIGlmIChleGlzdGluZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgZXhpc3RpbmcgPSBldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgICArK3RhcmdldC5fZXZlbnRzQ291bnQ7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHR5cGVvZiBleGlzdGluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgICBleGlzdGluZyA9IGV2ZW50c1t0eXBlXSA9XG4gICAgICAgIHByZXBlbmQgPyBbbGlzdGVuZXIsIGV4aXN0aW5nXSA6IFtleGlzdGluZywgbGlzdGVuZXJdO1xuICAgICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIH0gZWxzZSBpZiAocHJlcGVuZCkge1xuICAgICAgZXhpc3RpbmcudW5zaGlmdChsaXN0ZW5lcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4aXN0aW5nLnB1c2gobGlzdGVuZXIpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gICAgbSA9IF9nZXRNYXhMaXN0ZW5lcnModGFyZ2V0KTtcbiAgICBpZiAobSA+IDAgJiYgZXhpc3RpbmcubGVuZ3RoID4gbSAmJiAhZXhpc3Rpbmcud2FybmVkKSB7XG4gICAgICBleGlzdGluZy53YXJuZWQgPSB0cnVlO1xuICAgICAgLy8gTm8gZXJyb3IgY29kZSBmb3IgdGhpcyBzaW5jZSBpdCBpcyBhIFdhcm5pbmdcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1yZXN0cmljdGVkLXN5bnRheFxuICAgICAgdmFyIHcgPSBuZXcgRXJyb3IoJ1Bvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgbGVhayBkZXRlY3RlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nLmxlbmd0aCArICcgJyArIFN0cmluZyh0eXBlKSArICcgbGlzdGVuZXJzICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAnYWRkZWQuIFVzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAnaW5jcmVhc2UgbGltaXQnKTtcbiAgICAgIHcubmFtZSA9ICdNYXhMaXN0ZW5lcnNFeGNlZWRlZFdhcm5pbmcnO1xuICAgICAgdy5lbWl0dGVyID0gdGFyZ2V0O1xuICAgICAgdy50eXBlID0gdHlwZTtcbiAgICAgIHcuY291bnQgPSBleGlzdGluZy5sZW5ndGg7XG4gICAgICBQcm9jZXNzRW1pdFdhcm5pbmcodyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHJldHVybiBfYWRkTGlzdGVuZXIodGhpcywgdHlwZSwgbGlzdGVuZXIsIGZhbHNlKTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRMaXN0ZW5lciA9XG4gICAgZnVuY3Rpb24gcHJlcGVuZExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgICByZXR1cm4gX2FkZExpc3RlbmVyKHRoaXMsIHR5cGUsIGxpc3RlbmVyLCB0cnVlKTtcbiAgICB9O1xuXG5mdW5jdGlvbiBvbmNlV3JhcHBlcigpIHtcbiAgaWYgKCF0aGlzLmZpcmVkKSB7XG4gICAgdGhpcy50YXJnZXQucmVtb3ZlTGlzdGVuZXIodGhpcy50eXBlLCB0aGlzLndyYXBGbik7XG4gICAgdGhpcy5maXJlZCA9IHRydWU7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0KTtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5hcHBseSh0aGlzLnRhcmdldCwgYXJndW1lbnRzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfb25jZVdyYXAodGFyZ2V0LCB0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgc3RhdGUgPSB7IGZpcmVkOiBmYWxzZSwgd3JhcEZuOiB1bmRlZmluZWQsIHRhcmdldDogdGFyZ2V0LCB0eXBlOiB0eXBlLCBsaXN0ZW5lcjogbGlzdGVuZXIgfTtcbiAgdmFyIHdyYXBwZWQgPSBvbmNlV3JhcHBlci5iaW5kKHN0YXRlKTtcbiAgd3JhcHBlZC5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICBzdGF0ZS53cmFwRm4gPSB3cmFwcGVkO1xuICByZXR1cm4gd3JhcHBlZDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZSh0eXBlLCBsaXN0ZW5lcikge1xuICBjaGVja0xpc3RlbmVyKGxpc3RlbmVyKTtcbiAgdGhpcy5vbih0eXBlLCBfb25jZVdyYXAodGhpcywgdHlwZSwgbGlzdGVuZXIpKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRPbmNlTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHByZXBlbmRPbmNlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIGNoZWNrTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgdGhpcy5wcmVwZW5kTGlzdGVuZXIodHlwZSwgX29uY2VXcmFwKHRoaXMsIHR5cGUsIGxpc3RlbmVyKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4vLyBFbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWYgYW5kIG9ubHkgaWYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9XG4gICAgZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIHZhciBsaXN0LCBldmVudHMsIHBvc2l0aW9uLCBpLCBvcmlnaW5hbExpc3RlbmVyO1xuXG4gICAgICBjaGVja0xpc3RlbmVyKGxpc3RlbmVyKTtcblxuICAgICAgZXZlbnRzID0gdGhpcy5fZXZlbnRzO1xuICAgICAgaWYgKGV2ZW50cyA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gdGhpcztcblxuICAgICAgbGlzdCA9IGV2ZW50c1t0eXBlXTtcbiAgICAgIGlmIChsaXN0ID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHwgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApXG4gICAgICAgICAgdGhpcy5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgZGVsZXRlIGV2ZW50c1t0eXBlXTtcbiAgICAgICAgICBpZiAoZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3QubGlzdGVuZXIgfHwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBsaXN0ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHBvc2l0aW9uID0gLTE7XG5cbiAgICAgICAgZm9yIChpID0gbGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fCBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuICAgICAgICAgICAgb3JpZ2luYWxMaXN0ZW5lciA9IGxpc3RbaV0ubGlzdGVuZXI7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICAgIGlmIChwb3NpdGlvbiA9PT0gMClcbiAgICAgICAgICBsaXN0LnNoaWZ0KCk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHNwbGljZU9uZShsaXN0LCBwb3NpdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpXG4gICAgICAgICAgZXZlbnRzW3R5cGVdID0gbGlzdFswXTtcblxuICAgICAgICBpZiAoZXZlbnRzLnJlbW92ZUxpc3RlbmVyICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIG9yaWdpbmFsTGlzdGVuZXIgfHwgbGlzdGVuZXIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID1cbiAgICBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnModHlwZSkge1xuICAgICAgdmFyIGxpc3RlbmVycywgZXZlbnRzLCBpO1xuXG4gICAgICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gICAgICBpZiAoZXZlbnRzID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gICAgICBpZiAoZXZlbnRzLnJlbW92ZUxpc3RlbmVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudHNbdHlwZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKVxuICAgICAgICAgICAgdGhpcy5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBkZWxldGUgZXZlbnRzW3R5cGVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoZXZlbnRzKTtcbiAgICAgICAgdmFyIGtleTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBrZXkgPSBrZXlzW2ldO1xuICAgICAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgICAgIHRoaXMuX2V2ZW50cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIGxpc3RlbmVycyA9IGV2ZW50c1t0eXBlXTtcblxuICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICAgICAgfSBlbHNlIGlmIChsaXN0ZW5lcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBMSUZPIG9yZGVyXG4gICAgICAgIGZvciAoaSA9IGxpc3RlbmVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG5mdW5jdGlvbiBfbGlzdGVuZXJzKHRhcmdldCwgdHlwZSwgdW53cmFwKSB7XG4gIHZhciBldmVudHMgPSB0YXJnZXQuX2V2ZW50cztcblxuICBpZiAoZXZlbnRzID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIFtdO1xuXG4gIHZhciBldmxpc3RlbmVyID0gZXZlbnRzW3R5cGVdO1xuICBpZiAoZXZsaXN0ZW5lciA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBbXTtcblxuICBpZiAodHlwZW9mIGV2bGlzdGVuZXIgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIHVud3JhcCA/IFtldmxpc3RlbmVyLmxpc3RlbmVyIHx8IGV2bGlzdGVuZXJdIDogW2V2bGlzdGVuZXJdO1xuXG4gIHJldHVybiB1bndyYXAgP1xuICAgIHVud3JhcExpc3RlbmVycyhldmxpc3RlbmVyKSA6IGFycmF5Q2xvbmUoZXZsaXN0ZW5lciwgZXZsaXN0ZW5lci5sZW5ndGgpO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyh0eXBlKSB7XG4gIHJldHVybiBfbGlzdGVuZXJzKHRoaXMsIHR5cGUsIHRydWUpO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yYXdMaXN0ZW5lcnMgPSBmdW5jdGlvbiByYXdMaXN0ZW5lcnModHlwZSkge1xuICByZXR1cm4gX2xpc3RlbmVycyh0aGlzLCB0eXBlLCBmYWxzZSk7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgaWYgKHR5cGVvZiBlbWl0dGVyLmxpc3RlbmVyQ291bnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZW1pdHRlci5saXN0ZW5lckNvdW50KHR5cGUpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBsaXN0ZW5lckNvdW50LmNhbGwoZW1pdHRlciwgdHlwZSk7XG4gIH1cbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGxpc3RlbmVyQ291bnQ7XG5mdW5jdGlvbiBsaXN0ZW5lckNvdW50KHR5cGUpIHtcbiAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcblxuICBpZiAoZXZlbnRzICE9PSB1bmRlZmluZWQpIHtcbiAgICB2YXIgZXZsaXN0ZW5lciA9IGV2ZW50c1t0eXBlXTtcblxuICAgIGlmICh0eXBlb2YgZXZsaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfSBlbHNlIGlmIChldmxpc3RlbmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gMDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgcmV0dXJuIHRoaXMuX2V2ZW50c0NvdW50ID4gMCA/IFJlZmxlY3RPd25LZXlzKHRoaXMuX2V2ZW50cykgOiBbXTtcbn07XG5cbmZ1bmN0aW9uIGFycmF5Q2xvbmUoYXJyLCBuKSB7XG4gIHZhciBjb3B5ID0gbmV3IEFycmF5KG4pO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSlcbiAgICBjb3B5W2ldID0gYXJyW2ldO1xuICByZXR1cm4gY29weTtcbn1cblxuZnVuY3Rpb24gc3BsaWNlT25lKGxpc3QsIGluZGV4KSB7XG4gIGZvciAoOyBpbmRleCArIDEgPCBsaXN0Lmxlbmd0aDsgaW5kZXgrKylcbiAgICBsaXN0W2luZGV4XSA9IGxpc3RbaW5kZXggKyAxXTtcbiAgbGlzdC5wb3AoKTtcbn1cblxuZnVuY3Rpb24gdW53cmFwTGlzdGVuZXJzKGFycikge1xuICB2YXIgcmV0ID0gbmV3IEFycmF5KGFyci5sZW5ndGgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHJldC5sZW5ndGg7ICsraSkge1xuICAgIHJldFtpXSA9IGFycltpXS5saXN0ZW5lciB8fCBhcnJbaV07XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gb25jZShlbWl0dGVyLCBuYW1lKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgZnVuY3Rpb24gZXJyb3JMaXN0ZW5lcihlcnIpIHtcbiAgICAgIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIobmFtZSwgcmVzb2x2ZXIpO1xuICAgICAgcmVqZWN0KGVycik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZXIoKSB7XG4gICAgICBpZiAodHlwZW9mIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBlcnJvckxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICAgIHJlc29sdmUoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcbiAgICB9O1xuXG4gICAgZXZlbnRUYXJnZXRBZ25vc3RpY0FkZExpc3RlbmVyKGVtaXR0ZXIsIG5hbWUsIHJlc29sdmVyLCB7IG9uY2U6IHRydWUgfSk7XG4gICAgaWYgKG5hbWUgIT09ICdlcnJvcicpIHtcbiAgICAgIGFkZEVycm9ySGFuZGxlcklmRXZlbnRFbWl0dGVyKGVtaXR0ZXIsIGVycm9yTGlzdGVuZXIsIHsgb25jZTogdHJ1ZSB9KTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBhZGRFcnJvckhhbmRsZXJJZkV2ZW50RW1pdHRlcihlbWl0dGVyLCBoYW5kbGVyLCBmbGFncykge1xuICBpZiAodHlwZW9mIGVtaXR0ZXIub24gPT09ICdmdW5jdGlvbicpIHtcbiAgICBldmVudFRhcmdldEFnbm9zdGljQWRkTGlzdGVuZXIoZW1pdHRlciwgJ2Vycm9yJywgaGFuZGxlciwgZmxhZ3MpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV2ZW50VGFyZ2V0QWdub3N0aWNBZGRMaXN0ZW5lcihlbWl0dGVyLCBuYW1lLCBsaXN0ZW5lciwgZmxhZ3MpIHtcbiAgaWYgKHR5cGVvZiBlbWl0dGVyLm9uID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKGZsYWdzLm9uY2UpIHtcbiAgICAgIGVtaXR0ZXIub25jZShuYW1lLCBsaXN0ZW5lcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVtaXR0ZXIub24obmFtZSwgbGlzdGVuZXIpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgZW1pdHRlci5hZGRFdmVudExpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gRXZlbnRUYXJnZXQgZG9lcyBub3QgaGF2ZSBgZXJyb3JgIGV2ZW50IHNlbWFudGljcyBsaWtlIE5vZGVcbiAgICAvLyBFdmVudEVtaXR0ZXJzLCB3ZSBkbyBub3QgbGlzdGVuIGZvciBgZXJyb3JgIGV2ZW50cyBoZXJlLlxuICAgIGVtaXR0ZXIuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBmdW5jdGlvbiB3cmFwTGlzdGVuZXIoYXJnKSB7XG4gICAgICAvLyBJRSBkb2VzIG5vdCBoYXZlIGJ1aWx0aW4gYHsgb25jZTogdHJ1ZSB9YCBzdXBwb3J0IHNvIHdlXG4gICAgICAvLyBoYXZlIHRvIGRvIGl0IG1hbnVhbGx5LlxuICAgICAgaWYgKGZsYWdzLm9uY2UpIHtcbiAgICAgICAgZW1pdHRlci5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIHdyYXBMaXN0ZW5lcik7XG4gICAgICB9XG4gICAgICBsaXN0ZW5lcihhcmcpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImVtaXR0ZXJcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgRXZlbnRFbWl0dGVyLiBSZWNlaXZlZCB0eXBlICcgKyB0eXBlb2YgZW1pdHRlcik7XG4gIH1cbn1cbiIsIi8qISAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuQ29weXJpZ2h0IChDKSBNaWNyb3NvZnQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG5MaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbnRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG5MaWNlbnNlIGF0IGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuXG5USElTIENPREUgSVMgUFJPVklERUQgT04gQU4gKkFTIElTKiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG5LSU5ELCBFSVRIRVIgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgV0lUSE9VVCBMSU1JVEFUSU9OIEFOWSBJTVBMSUVEXG5XQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgVElUTEUsIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLFxuTUVSQ0hBTlRBQkxJVFkgT1IgTk9OLUlORlJJTkdFTUVOVC5cblxuU2VlIHRoZSBBcGFjaGUgVmVyc2lvbiAyLjAgTGljZW5zZSBmb3Igc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zXG5hbmQgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xudmFyIFJlZmxlY3Q7XG4oZnVuY3Rpb24gKFJlZmxlY3QpIHtcbiAgICAvLyBNZXRhZGF0YSBQcm9wb3NhbFxuICAgIC8vIGh0dHBzOi8vcmJ1Y2t0b24uZ2l0aHViLmlvL3JlZmxlY3QtbWV0YWRhdGEvXG4gICAgKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gICAgICAgIHZhciByb290ID0gdHlwZW9mIGdsb2JhbCA9PT0gXCJvYmplY3RcIiA/IGdsb2JhbCA6XG4gICAgICAgICAgICB0eXBlb2Ygc2VsZiA9PT0gXCJvYmplY3RcIiA/IHNlbGYgOlxuICAgICAgICAgICAgICAgIHR5cGVvZiB0aGlzID09PSBcIm9iamVjdFwiID8gdGhpcyA6XG4gICAgICAgICAgICAgICAgICAgIEZ1bmN0aW9uKFwicmV0dXJuIHRoaXM7XCIpKCk7XG4gICAgICAgIHZhciBleHBvcnRlciA9IG1ha2VFeHBvcnRlcihSZWZsZWN0KTtcbiAgICAgICAgaWYgKHR5cGVvZiByb290LlJlZmxlY3QgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHJvb3QuUmVmbGVjdCA9IFJlZmxlY3Q7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBleHBvcnRlciA9IG1ha2VFeHBvcnRlcihyb290LlJlZmxlY3QsIGV4cG9ydGVyKTtcbiAgICAgICAgfVxuICAgICAgICBmYWN0b3J5KGV4cG9ydGVyKTtcbiAgICAgICAgZnVuY3Rpb24gbWFrZUV4cG9ydGVyKHRhcmdldCwgcHJldmlvdXMpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0W2tleV0gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHsgY29uZmlndXJhYmxlOiB0cnVlLCB3cml0YWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocHJldmlvdXMpXG4gICAgICAgICAgICAgICAgICAgIHByZXZpb3VzKGtleSwgdmFsdWUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pKGZ1bmN0aW9uIChleHBvcnRlcikge1xuICAgICAgICB2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgICAgICAgLy8gZmVhdHVyZSB0ZXN0IGZvciBTeW1ib2wgc3VwcG9ydFxuICAgICAgICB2YXIgc3VwcG9ydHNTeW1ib2wgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCI7XG4gICAgICAgIHZhciB0b1ByaW1pdGl2ZVN5bWJvbCA9IHN1cHBvcnRzU3ltYm9sICYmIHR5cGVvZiBTeW1ib2wudG9QcmltaXRpdmUgIT09IFwidW5kZWZpbmVkXCIgPyBTeW1ib2wudG9QcmltaXRpdmUgOiBcIkBAdG9QcmltaXRpdmVcIjtcbiAgICAgICAgdmFyIGl0ZXJhdG9yU3ltYm9sID0gc3VwcG9ydHNTeW1ib2wgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciAhPT0gXCJ1bmRlZmluZWRcIiA/IFN5bWJvbC5pdGVyYXRvciA6IFwiQEBpdGVyYXRvclwiO1xuICAgICAgICB2YXIgc3VwcG9ydHNDcmVhdGUgPSB0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gXCJmdW5jdGlvblwiOyAvLyBmZWF0dXJlIHRlc3QgZm9yIE9iamVjdC5jcmVhdGUgc3VwcG9ydFxuICAgICAgICB2YXIgc3VwcG9ydHNQcm90byA9IHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXk7IC8vIGZlYXR1cmUgdGVzdCBmb3IgX19wcm90b19fIHN1cHBvcnRcbiAgICAgICAgdmFyIGRvd25MZXZlbCA9ICFzdXBwb3J0c0NyZWF0ZSAmJiAhc3VwcG9ydHNQcm90bztcbiAgICAgICAgdmFyIEhhc2hNYXAgPSB7XG4gICAgICAgICAgICAvLyBjcmVhdGUgYW4gb2JqZWN0IGluIGRpY3Rpb25hcnkgbW9kZSAoYS5rLmEuIFwic2xvd1wiIG1vZGUgaW4gdjgpXG4gICAgICAgICAgICBjcmVhdGU6IHN1cHBvcnRzQ3JlYXRlXG4gICAgICAgICAgICAgICAgPyBmdW5jdGlvbiAoKSB7IHJldHVybiBNYWtlRGljdGlvbmFyeShPYmplY3QuY3JlYXRlKG51bGwpKTsgfVxuICAgICAgICAgICAgICAgIDogc3VwcG9ydHNQcm90b1xuICAgICAgICAgICAgICAgICAgICA/IGZ1bmN0aW9uICgpIHsgcmV0dXJuIE1ha2VEaWN0aW9uYXJ5KHsgX19wcm90b19fOiBudWxsIH0pOyB9XG4gICAgICAgICAgICAgICAgICAgIDogZnVuY3Rpb24gKCkgeyByZXR1cm4gTWFrZURpY3Rpb25hcnkoe30pOyB9LFxuICAgICAgICAgICAgaGFzOiBkb3duTGV2ZWxcbiAgICAgICAgICAgICAgICA/IGZ1bmN0aW9uIChtYXAsIGtleSkgeyByZXR1cm4gaGFzT3duLmNhbGwobWFwLCBrZXkpOyB9XG4gICAgICAgICAgICAgICAgOiBmdW5jdGlvbiAobWFwLCBrZXkpIHsgcmV0dXJuIGtleSBpbiBtYXA7IH0sXG4gICAgICAgICAgICBnZXQ6IGRvd25MZXZlbFxuICAgICAgICAgICAgICAgID8gZnVuY3Rpb24gKG1hcCwga2V5KSB7IHJldHVybiBoYXNPd24uY2FsbChtYXAsIGtleSkgPyBtYXBba2V5XSA6IHVuZGVmaW5lZDsgfVxuICAgICAgICAgICAgICAgIDogZnVuY3Rpb24gKG1hcCwga2V5KSB7IHJldHVybiBtYXBba2V5XTsgfSxcbiAgICAgICAgfTtcbiAgICAgICAgLy8gTG9hZCBnbG9iYWwgb3Igc2hpbSB2ZXJzaW9ucyBvZiBNYXAsIFNldCwgYW5kIFdlYWtNYXBcbiAgICAgICAgdmFyIGZ1bmN0aW9uUHJvdG90eXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKEZ1bmN0aW9uKTtcbiAgICAgICAgdmFyIHVzZVBvbHlmaWxsID0gdHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgcHJvY2Vzcy5lbnYgJiYgcHJvY2Vzcy5lbnZbXCJSRUZMRUNUX01FVEFEQVRBX1VTRV9NQVBfUE9MWUZJTExcIl0gPT09IFwidHJ1ZVwiO1xuICAgICAgICB2YXIgX01hcCA9ICF1c2VQb2x5ZmlsbCAmJiB0eXBlb2YgTWFwID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIE1hcC5wcm90b3R5cGUuZW50cmllcyA9PT0gXCJmdW5jdGlvblwiID8gTWFwIDogQ3JlYXRlTWFwUG9seWZpbGwoKTtcbiAgICAgICAgdmFyIF9TZXQgPSAhdXNlUG9seWZpbGwgJiYgdHlwZW9mIFNldCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTZXQucHJvdG90eXBlLmVudHJpZXMgPT09IFwiZnVuY3Rpb25cIiA/IFNldCA6IENyZWF0ZVNldFBvbHlmaWxsKCk7XG4gICAgICAgIHZhciBfV2Vha01hcCA9ICF1c2VQb2x5ZmlsbCAmJiB0eXBlb2YgV2Vha01hcCA9PT0gXCJmdW5jdGlvblwiID8gV2Vha01hcCA6IENyZWF0ZVdlYWtNYXBQb2x5ZmlsbCgpO1xuICAgICAgICAvLyBbW01ldGFkYXRhXV0gaW50ZXJuYWwgc2xvdFxuICAgICAgICAvLyBodHRwczovL3JidWNrdG9uLmdpdGh1Yi5pby9yZWZsZWN0LW1ldGFkYXRhLyNvcmRpbmFyeS1vYmplY3QtaW50ZXJuYWwtbWV0aG9kcy1hbmQtaW50ZXJuYWwtc2xvdHNcbiAgICAgICAgdmFyIE1ldGFkYXRhID0gbmV3IF9XZWFrTWFwKCk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBcHBsaWVzIGEgc2V0IG9mIGRlY29yYXRvcnMgdG8gYSBwcm9wZXJ0eSBvZiBhIHRhcmdldCBvYmplY3QuXG4gICAgICAgICAqIEBwYXJhbSBkZWNvcmF0b3JzIEFuIGFycmF5IG9mIGRlY29yYXRvcnMuXG4gICAgICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3QuXG4gICAgICAgICAqIEBwYXJhbSBwcm9wZXJ0eUtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgdG8gZGVjb3JhdGUuXG4gICAgICAgICAqIEBwYXJhbSBhdHRyaWJ1dGVzIChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGRlc2NyaXB0b3IgZm9yIHRoZSB0YXJnZXQga2V5LlxuICAgICAgICAgKiBAcmVtYXJrcyBEZWNvcmF0b3JzIGFyZSBhcHBsaWVkIGluIHJldmVyc2Ugb3JkZXIuXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XG4gICAgICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcbiAgICAgICAgICogICAgIEV4YW1wbGUgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnNBcnJheSwgRXhhbXBsZSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnNBcnJheSwgRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnNBcnJheSwgRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIsXG4gICAgICAgICAqICAgICAgICAgUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzQXJyYXksIEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIsXG4gICAgICAgICAqICAgICAgICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIikpKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiLFxuICAgICAgICAgKiAgICAgICAgIFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9yc0FycmF5LCBFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIixcbiAgICAgICAgICogICAgICAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIikpKTtcbiAgICAgICAgICpcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwgcHJvcGVydHlLZXksIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgIGlmICghSXNVbmRlZmluZWQocHJvcGVydHlLZXkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFJc0FycmF5KGRlY29yYXRvcnMpKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFJc09iamVjdChhdHRyaWJ1dGVzKSAmJiAhSXNVbmRlZmluZWQoYXR0cmlidXRlcykgJiYgIUlzTnVsbChhdHRyaWJ1dGVzKSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgIGlmIChJc051bGwoYXR0cmlidXRlcykpXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgcHJvcGVydHlLZXkgPSBUb1Byb3BlcnR5S2V5KHByb3BlcnR5S2V5KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gRGVjb3JhdGVQcm9wZXJ0eShkZWNvcmF0b3JzLCB0YXJnZXQsIHByb3BlcnR5S2V5LCBhdHRyaWJ1dGVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghSXNBcnJheShkZWNvcmF0b3JzKSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgIGlmICghSXNDb25zdHJ1Y3Rvcih0YXJnZXQpKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIERlY29yYXRlQ29uc3RydWN0b3IoZGVjb3JhdG9ycywgdGFyZ2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBleHBvcnRlcihcImRlY29yYXRlXCIsIGRlY29yYXRlKTtcbiAgICAgICAgLy8gNC4xLjIgUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSlcbiAgICAgICAgLy8gaHR0cHM6Ly9yYnVja3Rvbi5naXRodWIuaW8vcmVmbGVjdC1tZXRhZGF0YS8jcmVmbGVjdC5tZXRhZGF0YVxuICAgICAgICAvKipcbiAgICAgICAgICogQSBkZWZhdWx0IG1ldGFkYXRhIGRlY29yYXRvciBmYWN0b3J5IHRoYXQgY2FuIGJlIHVzZWQgb24gYSBjbGFzcywgY2xhc3MgbWVtYmVyLCBvciBwYXJhbWV0ZXIuXG4gICAgICAgICAqIEBwYXJhbSBtZXRhZGF0YUtleSBUaGUga2V5IGZvciB0aGUgbWV0YWRhdGEgZW50cnkuXG4gICAgICAgICAqIEBwYXJhbSBtZXRhZGF0YVZhbHVlIFRoZSB2YWx1ZSBmb3IgdGhlIG1ldGFkYXRhIGVudHJ5LlxuICAgICAgICAgKiBAcmV0dXJucyBBIGRlY29yYXRvciBmdW5jdGlvbi5cbiAgICAgICAgICogQHJlbWFya3NcbiAgICAgICAgICogSWYgYG1ldGFkYXRhS2V5YCBpcyBhbHJlYWR5IGRlZmluZWQgZm9yIHRoZSB0YXJnZXQgYW5kIHRhcmdldCBrZXksIHRoZVxuICAgICAgICAgKiBtZXRhZGF0YVZhbHVlIGZvciB0aGF0IGtleSB3aWxsIGJlIG92ZXJ3cml0dGVuLlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcbiAgICAgICAgICogICAgIEBSZWZsZWN0Lm1ldGFkYXRhKGtleSwgdmFsdWUpXG4gICAgICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvciwgVHlwZVNjcmlwdCBvbmx5KVxuICAgICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XG4gICAgICAgICAqICAgICAgICAgQFJlZmxlY3QubWV0YWRhdGEoa2V5LCB2YWx1ZSlcbiAgICAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljUHJvcGVydHk7XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlLCBUeXBlU2NyaXB0IG9ubHkpXG4gICAgICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcbiAgICAgICAgICogICAgICAgICBAUmVmbGVjdC5tZXRhZGF0YShrZXksIHZhbHVlKVxuICAgICAgICAgKiAgICAgICAgIHByb3BlcnR5O1xuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xuICAgICAgICAgKiAgICAgICAgIEBSZWZsZWN0Lm1ldGFkYXRhKGtleSwgdmFsdWUpXG4gICAgICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZCgpIHsgfVxuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcbiAgICAgICAgICogICAgICAgICBAUmVmbGVjdC5tZXRhZGF0YShrZXksIHZhbHVlKVxuICAgICAgICAgKiAgICAgICAgIG1ldGhvZCgpIHsgfVxuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGRlY29yYXRvcih0YXJnZXQsIHByb3BlcnR5S2V5KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFJc1VuZGVmaW5lZChwcm9wZXJ0eUtleSkgJiYgIUlzUHJvcGVydHlLZXkocHJvcGVydHlLZXkpKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgT3JkaW5hcnlEZWZpbmVPd25NZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGVjb3JhdG9yO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydGVyKFwibWV0YWRhdGFcIiwgbWV0YWRhdGEpO1xuICAgICAgICAvKipcbiAgICAgICAgICogRGVmaW5lIGEgdW5pcXVlIG1ldGFkYXRhIGVudHJ5IG9uIHRoZSB0YXJnZXQuXG4gICAgICAgICAqIEBwYXJhbSBtZXRhZGF0YUtleSBBIGtleSB1c2VkIHRvIHN0b3JlIGFuZCByZXRyaWV2ZSBtZXRhZGF0YS5cbiAgICAgICAgICogQHBhcmFtIG1ldGFkYXRhVmFsdWUgQSB2YWx1ZSB0aGF0IGNvbnRhaW5zIGF0dGFjaGVkIG1ldGFkYXRhLlxuICAgICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRvIGRlZmluZSBtZXRhZGF0YS5cbiAgICAgICAgICogQHBhcmFtIHByb3BlcnR5S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcbiAgICAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxuICAgICAgICAgKiAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIG9wdGlvbnMsIEV4YW1wbGUpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIG9wdGlvbnMsIEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIG9wdGlvbnMsIEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBvcHRpb25zLCBFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIG9wdGlvbnMsIEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIGRlY29yYXRvciBmYWN0b3J5IGFzIG1ldGFkYXRhLXByb2R1Y2luZyBhbm5vdGF0aW9uLlxuICAgICAgICAgKiAgICAgZnVuY3Rpb24gTXlBbm5vdGF0aW9uKG9wdGlvbnMpOiBEZWNvcmF0b3Ige1xuICAgICAgICAgKiAgICAgICAgIHJldHVybiAodGFyZ2V0LCBrZXk/KSA9PiBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgb3B0aW9ucywgdGFyZ2V0LCBrZXkpO1xuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZGVmaW5lTWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUsIHRhcmdldCwgcHJvcGVydHlLZXkpIHtcbiAgICAgICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHByb3BlcnR5S2V5KSlcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eUtleSA9IFRvUHJvcGVydHlLZXkocHJvcGVydHlLZXkpO1xuICAgICAgICAgICAgcmV0dXJuIE9yZGluYXJ5RGVmaW5lT3duTWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUsIHRhcmdldCwgcHJvcGVydHlLZXkpO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydGVyKFwiZGVmaW5lTWV0YWRhdGFcIiwgZGVmaW5lTWV0YWRhdGEpO1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0cyBhIHZhbHVlIGluZGljYXRpbmcgd2hldGhlciB0aGUgdGFyZ2V0IG9iamVjdCBvciBpdHMgcHJvdG90eXBlIGNoYWluIGhhcyB0aGUgcHJvdmlkZWQgbWV0YWRhdGEga2V5IGRlZmluZWQuXG4gICAgICAgICAqIEBwYXJhbSBtZXRhZGF0YUtleSBBIGtleSB1c2VkIHRvIHN0b3JlIGFuZCByZXRyaWV2ZSBtZXRhZGF0YS5cbiAgICAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0aGUgbWV0YWRhdGEgaXMgZGVmaW5lZC5cbiAgICAgICAgICogQHBhcmFtIHByb3BlcnR5S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cbiAgICAgICAgICogQHJldHVybnMgYHRydWVgIGlmIHRoZSBtZXRhZGF0YSBrZXkgd2FzIGRlZmluZWQgb24gdGhlIHRhcmdldCBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZSBjaGFpbjsgb3RoZXJ3aXNlLCBgZmFsc2VgLlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxuICAgICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cbiAgICAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc01ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc01ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc01ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc01ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gaGFzTWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgcHJvcGVydHlLZXkpIHtcbiAgICAgICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHByb3BlcnR5S2V5KSlcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eUtleSA9IFRvUHJvcGVydHlLZXkocHJvcGVydHlLZXkpO1xuICAgICAgICAgICAgcmV0dXJuIE9yZGluYXJ5SGFzTWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgcHJvcGVydHlLZXkpO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydGVyKFwiaGFzTWV0YWRhdGFcIiwgaGFzTWV0YWRhdGEpO1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0cyBhIHZhbHVlIGluZGljYXRpbmcgd2hldGhlciB0aGUgdGFyZ2V0IG9iamVjdCBoYXMgdGhlIHByb3ZpZGVkIG1ldGFkYXRhIGtleSBkZWZpbmVkLlxuICAgICAgICAgKiBAcGFyYW0gbWV0YWRhdGFLZXkgQSBrZXkgdXNlZCB0byBzdG9yZSBhbmQgcmV0cmlldmUgbWV0YWRhdGEuXG4gICAgICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdGhlIG1ldGFkYXRhIGlzIGRlZmluZWQuXG4gICAgICAgICAqIEBwYXJhbSBwcm9wZXJ0eUtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXG4gICAgICAgICAqIEByZXR1cm5zIGB0cnVlYCBpZiB0aGUgbWV0YWRhdGEga2V5IHdhcyBkZWZpbmVkIG9uIHRoZSB0YXJnZXQgb2JqZWN0OyBvdGhlcndpc2UsIGBmYWxzZWAuXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XG4gICAgICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzT3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzT3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzT3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0Lmhhc093bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzT3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBoYXNPd25NZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSkge1xuICAgICAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgIGlmICghSXNVbmRlZmluZWQocHJvcGVydHlLZXkpKVxuICAgICAgICAgICAgICAgIHByb3BlcnR5S2V5ID0gVG9Qcm9wZXJ0eUtleShwcm9wZXJ0eUtleSk7XG4gICAgICAgICAgICByZXR1cm4gT3JkaW5hcnlIYXNPd25NZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0ZXIoXCJoYXNPd25NZXRhZGF0YVwiLCBoYXNPd25NZXRhZGF0YSk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIHRoZSBtZXRhZGF0YSB2YWx1ZSBmb3IgdGhlIHByb3ZpZGVkIG1ldGFkYXRhIGtleSBvbiB0aGUgdGFyZ2V0IG9iamVjdCBvciBpdHMgcHJvdG90eXBlIGNoYWluLlxuICAgICAgICAgKiBAcGFyYW0gbWV0YWRhdGFLZXkgQSBrZXkgdXNlZCB0byBzdG9yZSBhbmQgcmV0cmlldmUgbWV0YWRhdGEuXG4gICAgICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdGhlIG1ldGFkYXRhIGlzIGRlZmluZWQuXG4gICAgICAgICAqIEBwYXJhbSBwcm9wZXJ0eUtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXG4gICAgICAgICAqIEByZXR1cm5zIFRoZSBtZXRhZGF0YSB2YWx1ZSBmb3IgdGhlIG1ldGFkYXRhIGtleSBpZiBmb3VuZDsgb3RoZXJ3aXNlLCBgdW5kZWZpbmVkYC5cbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcbiAgICAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGdldE1ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHByb3BlcnR5S2V5KSB7XG4gICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgaWYgKCFJc1VuZGVmaW5lZChwcm9wZXJ0eUtleSkpXG4gICAgICAgICAgICAgICAgcHJvcGVydHlLZXkgPSBUb1Byb3BlcnR5S2V5KHByb3BlcnR5S2V5KTtcbiAgICAgICAgICAgIHJldHVybiBPcmRpbmFyeUdldE1ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHByb3BlcnR5S2V5KTtcbiAgICAgICAgfVxuICAgICAgICBleHBvcnRlcihcImdldE1ldGFkYXRhXCIsIGdldE1ldGFkYXRhKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldHMgdGhlIG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgcHJvdmlkZWQgbWV0YWRhdGEga2V5IG9uIHRoZSB0YXJnZXQgb2JqZWN0LlxuICAgICAgICAgKiBAcGFyYW0gbWV0YWRhdGFLZXkgQSBrZXkgdXNlZCB0byBzdG9yZSBhbmQgcmV0cmlldmUgbWV0YWRhdGEuXG4gICAgICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdGhlIG1ldGFkYXRhIGlzIGRlZmluZWQuXG4gICAgICAgICAqIEBwYXJhbSBwcm9wZXJ0eUtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXG4gICAgICAgICAqIEByZXR1cm5zIFRoZSBtZXRhZGF0YSB2YWx1ZSBmb3IgdGhlIG1ldGFkYXRhIGtleSBpZiBmb3VuZDsgb3RoZXJ3aXNlLCBgdW5kZWZpbmVkYC5cbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcbiAgICAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGdldE93bk1ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHByb3BlcnR5S2V5KSB7XG4gICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgaWYgKCFJc1VuZGVmaW5lZChwcm9wZXJ0eUtleSkpXG4gICAgICAgICAgICAgICAgcHJvcGVydHlLZXkgPSBUb1Byb3BlcnR5S2V5KHByb3BlcnR5S2V5KTtcbiAgICAgICAgICAgIHJldHVybiBPcmRpbmFyeUdldE93bk1ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHByb3BlcnR5S2V5KTtcbiAgICAgICAgfVxuICAgICAgICBleHBvcnRlcihcImdldE93bk1ldGFkYXRhXCIsIGdldE93bk1ldGFkYXRhKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldHMgdGhlIG1ldGFkYXRhIGtleXMgZGVmaW5lZCBvbiB0aGUgdGFyZ2V0IG9iamVjdCBvciBpdHMgcHJvdG90eXBlIGNoYWluLlxuICAgICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRoZSBtZXRhZGF0YSBpcyBkZWZpbmVkLlxuICAgICAgICAgKiBAcGFyYW0gcHJvcGVydHlLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxuICAgICAgICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiB1bmlxdWUgbWV0YWRhdGEga2V5cy5cbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcbiAgICAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YUtleXMoRXhhbXBsZSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhS2V5cyhFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGFLZXlzKEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGFLZXlzKEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhS2V5cyhFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBnZXRNZXRhZGF0YUtleXModGFyZ2V0LCBwcm9wZXJ0eUtleSkge1xuICAgICAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgIGlmICghSXNVbmRlZmluZWQocHJvcGVydHlLZXkpKVxuICAgICAgICAgICAgICAgIHByb3BlcnR5S2V5ID0gVG9Qcm9wZXJ0eUtleShwcm9wZXJ0eUtleSk7XG4gICAgICAgICAgICByZXR1cm4gT3JkaW5hcnlNZXRhZGF0YUtleXModGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0ZXIoXCJnZXRNZXRhZGF0YUtleXNcIiwgZ2V0TWV0YWRhdGFLZXlzKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldHMgdGhlIHVuaXF1ZSBtZXRhZGF0YSBrZXlzIGRlZmluZWQgb24gdGhlIHRhcmdldCBvYmplY3QuXG4gICAgICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdGhlIG1ldGFkYXRhIGlzIGRlZmluZWQuXG4gICAgICAgICAqIEBwYXJhbSBwcm9wZXJ0eUtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXG4gICAgICAgICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIHVuaXF1ZSBtZXRhZGF0YSBrZXlzLlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XG4gICAgICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxuICAgICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cbiAgICAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhS2V5cyhFeGFtcGxlKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGFLZXlzKEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YUtleXMoRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxuICAgICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YUtleXMoRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGFLZXlzKEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGdldE93bk1ldGFkYXRhS2V5cyh0YXJnZXQsIHByb3BlcnR5S2V5KSB7XG4gICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgaWYgKCFJc1VuZGVmaW5lZChwcm9wZXJ0eUtleSkpXG4gICAgICAgICAgICAgICAgcHJvcGVydHlLZXkgPSBUb1Byb3BlcnR5S2V5KHByb3BlcnR5S2V5KTtcbiAgICAgICAgICAgIHJldHVybiBPcmRpbmFyeU93bk1ldGFkYXRhS2V5cyh0YXJnZXQsIHByb3BlcnR5S2V5KTtcbiAgICAgICAgfVxuICAgICAgICBleHBvcnRlcihcImdldE93bk1ldGFkYXRhS2V5c1wiLCBnZXRPd25NZXRhZGF0YUtleXMpO1xuICAgICAgICAvKipcbiAgICAgICAgICogRGVsZXRlcyB0aGUgbWV0YWRhdGEgZW50cnkgZnJvbSB0aGUgdGFyZ2V0IG9iamVjdCB3aXRoIHRoZSBwcm92aWRlZCBrZXkuXG4gICAgICAgICAqIEBwYXJhbSBtZXRhZGF0YUtleSBBIGtleSB1c2VkIHRvIHN0b3JlIGFuZCByZXRyaWV2ZSBtZXRhZGF0YS5cbiAgICAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0aGUgbWV0YWRhdGEgaXMgZGVmaW5lZC5cbiAgICAgICAgICogQHBhcmFtIHByb3BlcnR5S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cbiAgICAgICAgICogQHJldHVybnMgYHRydWVgIGlmIHRoZSBtZXRhZGF0YSBlbnRyeSB3YXMgZm91bmQgYW5kIGRlbGV0ZWQ7IG90aGVyd2lzZSwgZmFsc2UuXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcbiAgICAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XG4gICAgICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xuICAgICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxuICAgICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XG4gICAgICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxuICAgICAgICAgKiAgICAgfVxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZGVsZXRlTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZGVsZXRlTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZGVsZXRlTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXG4gICAgICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmRlbGV0ZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcbiAgICAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZGVsZXRlTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XG4gICAgICAgICAqXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBkZWxldGVNZXRhZGF0YShtZXRhZGF0YUtleSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSkge1xuICAgICAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgIGlmICghSXNVbmRlZmluZWQocHJvcGVydHlLZXkpKVxuICAgICAgICAgICAgICAgIHByb3BlcnR5S2V5ID0gVG9Qcm9wZXJ0eUtleShwcm9wZXJ0eUtleSk7XG4gICAgICAgICAgICB2YXIgbWV0YWRhdGFNYXAgPSBHZXRPckNyZWF0ZU1ldGFkYXRhTWFwKHRhcmdldCwgcHJvcGVydHlLZXksIC8qQ3JlYXRlKi8gZmFsc2UpO1xuICAgICAgICAgICAgaWYgKElzVW5kZWZpbmVkKG1ldGFkYXRhTWFwKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAoIW1ldGFkYXRhTWFwLmRlbGV0ZShtZXRhZGF0YUtleSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKG1ldGFkYXRhTWFwLnNpemUgPiAwKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgdmFyIHRhcmdldE1ldGFkYXRhID0gTWV0YWRhdGEuZ2V0KHRhcmdldCk7XG4gICAgICAgICAgICB0YXJnZXRNZXRhZGF0YS5kZWxldGUocHJvcGVydHlLZXkpO1xuICAgICAgICAgICAgaWYgKHRhcmdldE1ldGFkYXRhLnNpemUgPiAwKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgTWV0YWRhdGEuZGVsZXRlKHRhcmdldCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBleHBvcnRlcihcImRlbGV0ZU1ldGFkYXRhXCIsIGRlbGV0ZU1ldGFkYXRhKTtcbiAgICAgICAgZnVuY3Rpb24gRGVjb3JhdGVDb25zdHJ1Y3RvcihkZWNvcmF0b3JzLCB0YXJnZXQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlY29yYXRvciA9IGRlY29yYXRvcnNbaV07XG4gICAgICAgICAgICAgICAgdmFyIGRlY29yYXRlZCA9IGRlY29yYXRvcih0YXJnZXQpO1xuICAgICAgICAgICAgICAgIGlmICghSXNVbmRlZmluZWQoZGVjb3JhdGVkKSAmJiAhSXNOdWxsKGRlY29yYXRlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFJc0NvbnN0cnVjdG9yKGRlY29yYXRlZCkpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldCA9IGRlY29yYXRlZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIERlY29yYXRlUHJvcGVydHkoZGVjb3JhdG9ycywgdGFyZ2V0LCBwcm9wZXJ0eUtleSwgZGVzY3JpcHRvcikge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVjb3JhdG9yID0gZGVjb3JhdG9yc1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgZGVjb3JhdGVkID0gZGVjb3JhdG9yKHRhcmdldCwgcHJvcGVydHlLZXksIGRlc2NyaXB0b3IpO1xuICAgICAgICAgICAgICAgIGlmICghSXNVbmRlZmluZWQoZGVjb3JhdGVkKSAmJiAhSXNOdWxsKGRlY29yYXRlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFJc09iamVjdChkZWNvcmF0ZWQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdG9yID0gZGVjb3JhdGVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkZXNjcmlwdG9yO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIEdldE9yQ3JlYXRlTWV0YWRhdGFNYXAoTywgUCwgQ3JlYXRlKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0TWV0YWRhdGEgPSBNZXRhZGF0YS5nZXQoTyk7XG4gICAgICAgICAgICBpZiAoSXNVbmRlZmluZWQodGFyZ2V0TWV0YWRhdGEpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFDcmVhdGUpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdGFyZ2V0TWV0YWRhdGEgPSBuZXcgX01hcCgpO1xuICAgICAgICAgICAgICAgIE1ldGFkYXRhLnNldChPLCB0YXJnZXRNZXRhZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbWV0YWRhdGFNYXAgPSB0YXJnZXRNZXRhZGF0YS5nZXQoUCk7XG4gICAgICAgICAgICBpZiAoSXNVbmRlZmluZWQobWV0YWRhdGFNYXApKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFDcmVhdGUpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgbWV0YWRhdGFNYXAgPSBuZXcgX01hcCgpO1xuICAgICAgICAgICAgICAgIHRhcmdldE1ldGFkYXRhLnNldChQLCBtZXRhZGF0YU1hcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWV0YWRhdGFNYXA7XG4gICAgICAgIH1cbiAgICAgICAgLy8gMy4xLjEuMSBPcmRpbmFyeUhhc01ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKVxuICAgICAgICAvLyBodHRwczovL3JidWNrdG9uLmdpdGh1Yi5pby9yZWZsZWN0LW1ldGFkYXRhLyNvcmRpbmFyeWhhc21ldGFkYXRhXG4gICAgICAgIGZ1bmN0aW9uIE9yZGluYXJ5SGFzTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApIHtcbiAgICAgICAgICAgIHZhciBoYXNPd24gPSBPcmRpbmFyeUhhc093bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKTtcbiAgICAgICAgICAgIGlmIChoYXNPd24pXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gT3JkaW5hcnlHZXRQcm90b3R5cGVPZihPKTtcbiAgICAgICAgICAgIGlmICghSXNOdWxsKHBhcmVudCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9yZGluYXJ5SGFzTWV0YWRhdGEoTWV0YWRhdGFLZXksIHBhcmVudCwgUCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gMy4xLjIuMSBPcmRpbmFyeUhhc093bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKVxuICAgICAgICAvLyBodHRwczovL3JidWNrdG9uLmdpdGh1Yi5pby9yZWZsZWN0LW1ldGFkYXRhLyNvcmRpbmFyeWhhc293bm1ldGFkYXRhXG4gICAgICAgIGZ1bmN0aW9uIE9yZGluYXJ5SGFzT3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApIHtcbiAgICAgICAgICAgIHZhciBtZXRhZGF0YU1hcCA9IEdldE9yQ3JlYXRlTWV0YWRhdGFNYXAoTywgUCwgLypDcmVhdGUqLyBmYWxzZSk7XG4gICAgICAgICAgICBpZiAoSXNVbmRlZmluZWQobWV0YWRhdGFNYXApKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBUb0Jvb2xlYW4obWV0YWRhdGFNYXAuaGFzKE1ldGFkYXRhS2V5KSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gMy4xLjMuMSBPcmRpbmFyeUdldE1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKVxuICAgICAgICAvLyBodHRwczovL3JidWNrdG9uLmdpdGh1Yi5pby9yZWZsZWN0LW1ldGFkYXRhLyNvcmRpbmFyeWdldG1ldGFkYXRhXG4gICAgICAgIGZ1bmN0aW9uIE9yZGluYXJ5R2V0TWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApIHtcbiAgICAgICAgICAgIHZhciBoYXNPd24gPSBPcmRpbmFyeUhhc093bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKTtcbiAgICAgICAgICAgIGlmIChoYXNPd24pXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9yZGluYXJ5R2V0T3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApO1xuICAgICAgICAgICAgdmFyIHBhcmVudCA9IE9yZGluYXJ5R2V0UHJvdG90eXBlT2YoTyk7XG4gICAgICAgICAgICBpZiAoIUlzTnVsbChwYXJlbnQpKVxuICAgICAgICAgICAgICAgIHJldHVybiBPcmRpbmFyeUdldE1ldGFkYXRhKE1ldGFkYXRhS2V5LCBwYXJlbnQsIFApO1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICAvLyAzLjEuNC4xIE9yZGluYXJ5R2V0T3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApXG4gICAgICAgIC8vIGh0dHBzOi8vcmJ1Y2t0b24uZ2l0aHViLmlvL3JlZmxlY3QtbWV0YWRhdGEvI29yZGluYXJ5Z2V0b3dubWV0YWRhdGFcbiAgICAgICAgZnVuY3Rpb24gT3JkaW5hcnlHZXRPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUCkge1xuICAgICAgICAgICAgdmFyIG1ldGFkYXRhTWFwID0gR2V0T3JDcmVhdGVNZXRhZGF0YU1hcChPLCBQLCAvKkNyZWF0ZSovIGZhbHNlKTtcbiAgICAgICAgICAgIGlmIChJc1VuZGVmaW5lZChtZXRhZGF0YU1hcCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHJldHVybiBtZXRhZGF0YU1hcC5nZXQoTWV0YWRhdGFLZXkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIDMuMS41LjEgT3JkaW5hcnlEZWZpbmVPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTWV0YWRhdGFWYWx1ZSwgTywgUClcbiAgICAgICAgLy8gaHR0cHM6Ly9yYnVja3Rvbi5naXRodWIuaW8vcmVmbGVjdC1tZXRhZGF0YS8jb3JkaW5hcnlkZWZpbmVvd25tZXRhZGF0YVxuICAgICAgICBmdW5jdGlvbiBPcmRpbmFyeURlZmluZU93bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBNZXRhZGF0YVZhbHVlLCBPLCBQKSB7XG4gICAgICAgICAgICB2YXIgbWV0YWRhdGFNYXAgPSBHZXRPckNyZWF0ZU1ldGFkYXRhTWFwKE8sIFAsIC8qQ3JlYXRlKi8gdHJ1ZSk7XG4gICAgICAgICAgICBtZXRhZGF0YU1hcC5zZXQoTWV0YWRhdGFLZXksIE1ldGFkYXRhVmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIC8vIDMuMS42LjEgT3JkaW5hcnlNZXRhZGF0YUtleXMoTywgUClcbiAgICAgICAgLy8gaHR0cHM6Ly9yYnVja3Rvbi5naXRodWIuaW8vcmVmbGVjdC1tZXRhZGF0YS8jb3JkaW5hcnltZXRhZGF0YWtleXNcbiAgICAgICAgZnVuY3Rpb24gT3JkaW5hcnlNZXRhZGF0YUtleXMoTywgUCkge1xuICAgICAgICAgICAgdmFyIG93bktleXMgPSBPcmRpbmFyeU93bk1ldGFkYXRhS2V5cyhPLCBQKTtcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBPcmRpbmFyeUdldFByb3RvdHlwZU9mKE8pO1xuICAgICAgICAgICAgaWYgKHBhcmVudCA9PT0gbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gb3duS2V5cztcbiAgICAgICAgICAgIHZhciBwYXJlbnRLZXlzID0gT3JkaW5hcnlNZXRhZGF0YUtleXMocGFyZW50LCBQKTtcbiAgICAgICAgICAgIGlmIChwYXJlbnRLZXlzLmxlbmd0aCA8PSAwKVxuICAgICAgICAgICAgICAgIHJldHVybiBvd25LZXlzO1xuICAgICAgICAgICAgaWYgKG93bktleXMubGVuZ3RoIDw9IDApXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudEtleXM7XG4gICAgICAgICAgICB2YXIgc2V0ID0gbmV3IF9TZXQoKTtcbiAgICAgICAgICAgIHZhciBrZXlzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIG93bktleXNfMSA9IG93bktleXM7IF9pIDwgb3duS2V5c18xLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgIHZhciBrZXkgPSBvd25LZXlzXzFbX2ldO1xuICAgICAgICAgICAgICAgIHZhciBoYXNLZXkgPSBzZXQuaGFzKGtleSk7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0LmFkZChrZXkpO1xuICAgICAgICAgICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBfYSA9IDAsIHBhcmVudEtleXNfMSA9IHBhcmVudEtleXM7IF9hIDwgcGFyZW50S2V5c18xLmxlbmd0aDsgX2ErKykge1xuICAgICAgICAgICAgICAgIHZhciBrZXkgPSBwYXJlbnRLZXlzXzFbX2FdO1xuICAgICAgICAgICAgICAgIHZhciBoYXNLZXkgPSBzZXQuaGFzKGtleSk7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0LmFkZChrZXkpO1xuICAgICAgICAgICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ga2V5cztcbiAgICAgICAgfVxuICAgICAgICAvLyAzLjEuNy4xIE9yZGluYXJ5T3duTWV0YWRhdGFLZXlzKE8sIFApXG4gICAgICAgIC8vIGh0dHBzOi8vcmJ1Y2t0b24uZ2l0aHViLmlvL3JlZmxlY3QtbWV0YWRhdGEvI29yZGluYXJ5b3dubWV0YWRhdGFrZXlzXG4gICAgICAgIGZ1bmN0aW9uIE9yZGluYXJ5T3duTWV0YWRhdGFLZXlzKE8sIFApIHtcbiAgICAgICAgICAgIHZhciBrZXlzID0gW107XG4gICAgICAgICAgICB2YXIgbWV0YWRhdGFNYXAgPSBHZXRPckNyZWF0ZU1ldGFkYXRhTWFwKE8sIFAsIC8qQ3JlYXRlKi8gZmFsc2UpO1xuICAgICAgICAgICAgaWYgKElzVW5kZWZpbmVkKG1ldGFkYXRhTWFwKSlcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5cztcbiAgICAgICAgICAgIHZhciBrZXlzT2JqID0gbWV0YWRhdGFNYXAua2V5cygpO1xuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gR2V0SXRlcmF0b3Ioa2V5c09iaik7XG4gICAgICAgICAgICB2YXIgayA9IDA7XG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0ID0gSXRlcmF0b3JTdGVwKGl0ZXJhdG9yKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAga2V5cy5sZW5ndGggPSBrO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2V5cztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIG5leHRWYWx1ZSA9IEl0ZXJhdG9yVmFsdWUobmV4dCk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAga2V5c1trXSA9IG5leHRWYWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEl0ZXJhdG9yQ2xvc2UoaXRlcmF0b3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBrKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gNiBFQ01BU2NyaXB0IERhdGEgVHlwMGVzIGFuZCBWYWx1ZXNcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtZWNtYXNjcmlwdC1kYXRhLXR5cGVzLWFuZC12YWx1ZXNcbiAgICAgICAgZnVuY3Rpb24gVHlwZSh4KSB7XG4gICAgICAgICAgICBpZiAoeCA9PT0gbnVsbClcbiAgICAgICAgICAgICAgICByZXR1cm4gMSAvKiBOdWxsICovO1xuICAgICAgICAgICAgc3dpdGNoICh0eXBlb2YgeCkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJ1bmRlZmluZWRcIjogcmV0dXJuIDAgLyogVW5kZWZpbmVkICovO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJib29sZWFuXCI6IHJldHVybiAyIC8qIEJvb2xlYW4gKi87XG4gICAgICAgICAgICAgICAgY2FzZSBcInN0cmluZ1wiOiByZXR1cm4gMyAvKiBTdHJpbmcgKi87XG4gICAgICAgICAgICAgICAgY2FzZSBcInN5bWJvbFwiOiByZXR1cm4gNCAvKiBTeW1ib2wgKi87XG4gICAgICAgICAgICAgICAgY2FzZSBcIm51bWJlclwiOiByZXR1cm4gNSAvKiBOdW1iZXIgKi87XG4gICAgICAgICAgICAgICAgY2FzZSBcIm9iamVjdFwiOiByZXR1cm4geCA9PT0gbnVsbCA/IDEgLyogTnVsbCAqLyA6IDYgLyogT2JqZWN0ICovO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiA2IC8qIE9iamVjdCAqLztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyA2LjEuMSBUaGUgVW5kZWZpbmVkIFR5cGVcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtZWNtYXNjcmlwdC1sYW5ndWFnZS10eXBlcy11bmRlZmluZWQtdHlwZVxuICAgICAgICBmdW5jdGlvbiBJc1VuZGVmaW5lZCh4KSB7XG4gICAgICAgICAgICByZXR1cm4geCA9PT0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIC8vIDYuMS4yIFRoZSBOdWxsIFR5cGVcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtZWNtYXNjcmlwdC1sYW5ndWFnZS10eXBlcy1udWxsLXR5cGVcbiAgICAgICAgZnVuY3Rpb24gSXNOdWxsKHgpIHtcbiAgICAgICAgICAgIHJldHVybiB4ID09PSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIC8vIDYuMS41IFRoZSBTeW1ib2wgVHlwZVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1lY21hc2NyaXB0LWxhbmd1YWdlLXR5cGVzLXN5bWJvbC10eXBlXG4gICAgICAgIGZ1bmN0aW9uIElzU3ltYm9sKHgpIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gXCJzeW1ib2xcIjtcbiAgICAgICAgfVxuICAgICAgICAvLyA2LjEuNyBUaGUgT2JqZWN0IFR5cGVcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtb2JqZWN0LXR5cGVcbiAgICAgICAgZnVuY3Rpb24gSXNPYmplY3QoeCkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiID8geCAhPT0gbnVsbCA6IHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNy4xIFR5cGUgQ29udmVyc2lvblxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy10eXBlLWNvbnZlcnNpb25cbiAgICAgICAgLy8gNy4xLjEgVG9QcmltaXRpdmUoaW5wdXQgWywgUHJlZmVycmVkVHlwZV0pXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLXRvcHJpbWl0aXZlXG4gICAgICAgIGZ1bmN0aW9uIFRvUHJpbWl0aXZlKGlucHV0LCBQcmVmZXJyZWRUeXBlKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKFR5cGUoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAwIC8qIFVuZGVmaW5lZCAqLzogcmV0dXJuIGlucHV0O1xuICAgICAgICAgICAgICAgIGNhc2UgMSAvKiBOdWxsICovOiByZXR1cm4gaW5wdXQ7XG4gICAgICAgICAgICAgICAgY2FzZSAyIC8qIEJvb2xlYW4gKi86IHJldHVybiBpbnB1dDtcbiAgICAgICAgICAgICAgICBjYXNlIDMgLyogU3RyaW5nICovOiByZXR1cm4gaW5wdXQ7XG4gICAgICAgICAgICAgICAgY2FzZSA0IC8qIFN5bWJvbCAqLzogcmV0dXJuIGlucHV0O1xuICAgICAgICAgICAgICAgIGNhc2UgNSAvKiBOdW1iZXIgKi86IHJldHVybiBpbnB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBoaW50ID0gUHJlZmVycmVkVHlwZSA9PT0gMyAvKiBTdHJpbmcgKi8gPyBcInN0cmluZ1wiIDogUHJlZmVycmVkVHlwZSA9PT0gNSAvKiBOdW1iZXIgKi8gPyBcIm51bWJlclwiIDogXCJkZWZhdWx0XCI7XG4gICAgICAgICAgICB2YXIgZXhvdGljVG9QcmltID0gR2V0TWV0aG9kKGlucHV0LCB0b1ByaW1pdGl2ZVN5bWJvbCk7XG4gICAgICAgICAgICBpZiAoZXhvdGljVG9QcmltICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gZXhvdGljVG9QcmltLmNhbGwoaW5wdXQsIGhpbnQpO1xuICAgICAgICAgICAgICAgIGlmIChJc09iamVjdChyZXN1bHQpKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBPcmRpbmFyeVRvUHJpbWl0aXZlKGlucHV0LCBoaW50ID09PSBcImRlZmF1bHRcIiA/IFwibnVtYmVyXCIgOiBoaW50KTtcbiAgICAgICAgfVxuICAgICAgICAvLyA3LjEuMS4xIE9yZGluYXJ5VG9QcmltaXRpdmUoTywgaGludClcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtb3JkaW5hcnl0b3ByaW1pdGl2ZVxuICAgICAgICBmdW5jdGlvbiBPcmRpbmFyeVRvUHJpbWl0aXZlKE8sIGhpbnQpIHtcbiAgICAgICAgICAgIGlmIChoaW50ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRvU3RyaW5nXzEgPSBPLnRvU3RyaW5nO1xuICAgICAgICAgICAgICAgIGlmIChJc0NhbGxhYmxlKHRvU3RyaW5nXzEpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB0b1N0cmluZ18xLmNhbGwoTyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghSXNPYmplY3QocmVzdWx0KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZU9mID0gTy52YWx1ZU9mO1xuICAgICAgICAgICAgICAgIGlmIChJc0NhbGxhYmxlKHZhbHVlT2YpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWx1ZU9mLmNhbGwoTyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghSXNPYmplY3QocmVzdWx0KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlT2YgPSBPLnZhbHVlT2Y7XG4gICAgICAgICAgICAgICAgaWYgKElzQ2FsbGFibGUodmFsdWVPZikpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbHVlT2YuY2FsbChPKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFJc09iamVjdChyZXN1bHQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRvU3RyaW5nXzIgPSBPLnRvU3RyaW5nO1xuICAgICAgICAgICAgICAgIGlmIChJc0NhbGxhYmxlKHRvU3RyaW5nXzIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB0b1N0cmluZ18yLmNhbGwoTyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghSXNPYmplY3QocmVzdWx0KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICB9XG4gICAgICAgIC8vIDcuMS4yIFRvQm9vbGVhbihhcmd1bWVudClcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLzIwMTYvI3NlYy10b2Jvb2xlYW5cbiAgICAgICAgZnVuY3Rpb24gVG9Cb29sZWFuKGFyZ3VtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gISFhcmd1bWVudDtcbiAgICAgICAgfVxuICAgICAgICAvLyA3LjEuMTIgVG9TdHJpbmcoYXJndW1lbnQpXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLXRvc3RyaW5nXG4gICAgICAgIGZ1bmN0aW9uIFRvU3RyaW5nKGFyZ3VtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gXCJcIiArIGFyZ3VtZW50O1xuICAgICAgICB9XG4gICAgICAgIC8vIDcuMS4xNCBUb1Byb3BlcnR5S2V5KGFyZ3VtZW50KVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy10b3Byb3BlcnR5a2V5XG4gICAgICAgIGZ1bmN0aW9uIFRvUHJvcGVydHlLZXkoYXJndW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBUb1ByaW1pdGl2ZShhcmd1bWVudCwgMyAvKiBTdHJpbmcgKi8pO1xuICAgICAgICAgICAgaWYgKElzU3ltYm9sKGtleSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgICAgIHJldHVybiBUb1N0cmluZyhrZXkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIDcuMiBUZXN0aW5nIGFuZCBDb21wYXJpc29uIE9wZXJhdGlvbnNcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtdGVzdGluZy1hbmQtY29tcGFyaXNvbi1vcGVyYXRpb25zXG4gICAgICAgIC8vIDcuMi4yIElzQXJyYXkoYXJndW1lbnQpXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWlzYXJyYXlcbiAgICAgICAgZnVuY3Rpb24gSXNBcnJheShhcmd1bWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXlcbiAgICAgICAgICAgICAgICA/IEFycmF5LmlzQXJyYXkoYXJndW1lbnQpXG4gICAgICAgICAgICAgICAgOiBhcmd1bWVudCBpbnN0YW5jZW9mIE9iamVjdFxuICAgICAgICAgICAgICAgICAgICA/IGFyZ3VtZW50IGluc3RhbmNlb2YgQXJyYXlcbiAgICAgICAgICAgICAgICAgICAgOiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJndW1lbnQpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNy4yLjMgSXNDYWxsYWJsZShhcmd1bWVudClcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtaXNjYWxsYWJsZVxuICAgICAgICBmdW5jdGlvbiBJc0NhbGxhYmxlKGFyZ3VtZW50KSB7XG4gICAgICAgICAgICAvLyBOT1RFOiBUaGlzIGlzIGFuIGFwcHJveGltYXRpb24gYXMgd2UgY2Fubm90IGNoZWNrIGZvciBbW0NhbGxdXSBpbnRlcm5hbCBtZXRob2QuXG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIGFyZ3VtZW50ID09PSBcImZ1bmN0aW9uXCI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNy4yLjQgSXNDb25zdHJ1Y3Rvcihhcmd1bWVudClcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtaXNjb25zdHJ1Y3RvclxuICAgICAgICBmdW5jdGlvbiBJc0NvbnN0cnVjdG9yKGFyZ3VtZW50KSB7XG4gICAgICAgICAgICAvLyBOT1RFOiBUaGlzIGlzIGFuIGFwcHJveGltYXRpb24gYXMgd2UgY2Fubm90IGNoZWNrIGZvciBbW0NvbnN0cnVjdF1dIGludGVybmFsIG1ldGhvZC5cbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgYXJndW1lbnQgPT09IFwiZnVuY3Rpb25cIjtcbiAgICAgICAgfVxuICAgICAgICAvLyA3LjIuNyBJc1Byb3BlcnR5S2V5KGFyZ3VtZW50KVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1pc3Byb3BlcnR5a2V5XG4gICAgICAgIGZ1bmN0aW9uIElzUHJvcGVydHlLZXkoYXJndW1lbnQpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoVHlwZShhcmd1bWVudCkpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDMgLyogU3RyaW5nICovOiByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjYXNlIDQgLyogU3ltYm9sICovOiByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gNy4zIE9wZXJhdGlvbnMgb24gT2JqZWN0c1xuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1vcGVyYXRpb25zLW9uLW9iamVjdHNcbiAgICAgICAgLy8gNy4zLjkgR2V0TWV0aG9kKFYsIFApXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWdldG1ldGhvZFxuICAgICAgICBmdW5jdGlvbiBHZXRNZXRob2QoViwgUCkge1xuICAgICAgICAgICAgdmFyIGZ1bmMgPSBWW1BdO1xuICAgICAgICAgICAgaWYgKGZ1bmMgPT09IHVuZGVmaW5lZCB8fCBmdW5jID09PSBudWxsKVxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAoIUlzQ2FsbGFibGUoZnVuYykpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmM7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNy40IE9wZXJhdGlvbnMgb24gSXRlcmF0b3IgT2JqZWN0c1xuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1vcGVyYXRpb25zLW9uLWl0ZXJhdG9yLW9iamVjdHNcbiAgICAgICAgZnVuY3Rpb24gR2V0SXRlcmF0b3Iob2JqKSB7XG4gICAgICAgICAgICB2YXIgbWV0aG9kID0gR2V0TWV0aG9kKG9iaiwgaXRlcmF0b3JTeW1ib2wpO1xuICAgICAgICAgICAgaWYgKCFJc0NhbGxhYmxlKG1ldGhvZCkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpOyAvLyBmcm9tIENhbGxcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IG1ldGhvZC5jYWxsKG9iaik7XG4gICAgICAgICAgICBpZiAoIUlzT2JqZWN0KGl0ZXJhdG9yKSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICByZXR1cm4gaXRlcmF0b3I7XG4gICAgICAgIH1cbiAgICAgICAgLy8gNy40LjQgSXRlcmF0b3JWYWx1ZShpdGVyUmVzdWx0KVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvMjAxNi8jc2VjLWl0ZXJhdG9ydmFsdWVcbiAgICAgICAgZnVuY3Rpb24gSXRlcmF0b3JWYWx1ZShpdGVyUmVzdWx0KSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlclJlc3VsdC52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyA3LjQuNSBJdGVyYXRvclN0ZXAoaXRlcmF0b3IpXG4gICAgICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWl0ZXJhdG9yc3RlcFxuICAgICAgICBmdW5jdGlvbiBJdGVyYXRvclN0ZXAoaXRlcmF0b3IpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0LmRvbmUgPyBmYWxzZSA6IHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICAvLyA3LjQuNiBJdGVyYXRvckNsb3NlKGl0ZXJhdG9yLCBjb21wbGV0aW9uKVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1pdGVyYXRvcmNsb3NlXG4gICAgICAgIGZ1bmN0aW9uIEl0ZXJhdG9yQ2xvc2UoaXRlcmF0b3IpIHtcbiAgICAgICAgICAgIHZhciBmID0gaXRlcmF0b3JbXCJyZXR1cm5cIl07XG4gICAgICAgICAgICBpZiAoZilcbiAgICAgICAgICAgICAgICBmLmNhbGwoaXRlcmF0b3IpO1xuICAgICAgICB9XG4gICAgICAgIC8vIDkuMSBPcmRpbmFyeSBPYmplY3QgSW50ZXJuYWwgTWV0aG9kcyBhbmQgSW50ZXJuYWwgU2xvdHNcbiAgICAgICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtb3JkaW5hcnktb2JqZWN0LWludGVybmFsLW1ldGhvZHMtYW5kLWludGVybmFsLXNsb3RzXG4gICAgICAgIC8vIDkuMS4xLjEgT3JkaW5hcnlHZXRQcm90b3R5cGVPZihPKVxuICAgICAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1vcmRpbmFyeWdldHByb3RvdHlwZW9mXG4gICAgICAgIGZ1bmN0aW9uIE9yZGluYXJ5R2V0UHJvdG90eXBlT2YoTykge1xuICAgICAgICAgICAgdmFyIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKE8pO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBPICE9PSBcImZ1bmN0aW9uXCIgfHwgTyA9PT0gZnVuY3Rpb25Qcm90b3R5cGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3RvO1xuICAgICAgICAgICAgLy8gVHlwZVNjcmlwdCBkb2Vzbid0IHNldCBfX3Byb3RvX18gaW4gRVM1LCBhcyBpdCdzIG5vbi1zdGFuZGFyZC5cbiAgICAgICAgICAgIC8vIFRyeSB0byBkZXRlcm1pbmUgdGhlIHN1cGVyY2xhc3MgY29uc3RydWN0b3IuIENvbXBhdGlibGUgaW1wbGVtZW50YXRpb25zXG4gICAgICAgICAgICAvLyBtdXN0IGVpdGhlciBzZXQgX19wcm90b19fIG9uIGEgc3ViY2xhc3MgY29uc3RydWN0b3IgdG8gdGhlIHN1cGVyY2xhc3MgY29uc3RydWN0b3IsXG4gICAgICAgICAgICAvLyBvciBlbnN1cmUgZWFjaCBjbGFzcyBoYXMgYSB2YWxpZCBgY29uc3RydWN0b3JgIHByb3BlcnR5IG9uIGl0cyBwcm90b3R5cGUgdGhhdFxuICAgICAgICAgICAgLy8gcG9pbnRzIGJhY2sgdG8gdGhlIGNvbnN0cnVjdG9yLlxuICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBub3QgdGhlIHNhbWUgYXMgRnVuY3Rpb24uW1tQcm90b3R5cGVdXSwgdGhlbiB0aGlzIGlzIGRlZmluYXRlbHkgaW5oZXJpdGVkLlxuICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgY2FzZSB3aGVuIGluIEVTNiBvciB3aGVuIHVzaW5nIF9fcHJvdG9fXyBpbiBhIGNvbXBhdGlibGUgYnJvd3Nlci5cbiAgICAgICAgICAgIGlmIChwcm90byAhPT0gZnVuY3Rpb25Qcm90b3R5cGUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3RvO1xuICAgICAgICAgICAgLy8gSWYgdGhlIHN1cGVyIHByb3RvdHlwZSBpcyBPYmplY3QucHJvdG90eXBlLCBudWxsLCBvciB1bmRlZmluZWQsIHRoZW4gd2UgY2Fubm90IGRldGVybWluZSB0aGUgaGVyaXRhZ2UuXG4gICAgICAgICAgICB2YXIgcHJvdG90eXBlID0gTy5wcm90b3R5cGU7XG4gICAgICAgICAgICB2YXIgcHJvdG90eXBlUHJvdG8gPSBwcm90b3R5cGUgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKHByb3RvdHlwZSk7XG4gICAgICAgICAgICBpZiAocHJvdG90eXBlUHJvdG8gPT0gbnVsbCB8fCBwcm90b3R5cGVQcm90byA9PT0gT2JqZWN0LnByb3RvdHlwZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvdG87XG4gICAgICAgICAgICAvLyBJZiB0aGUgY29uc3RydWN0b3Igd2FzIG5vdCBhIGZ1bmN0aW9uLCB0aGVuIHdlIGNhbm5vdCBkZXRlcm1pbmUgdGhlIGhlcml0YWdlLlxuICAgICAgICAgICAgdmFyIGNvbnN0cnVjdG9yID0gcHJvdG90eXBlUHJvdG8uY29uc3RydWN0b3I7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbnN0cnVjdG9yICE9PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3RvO1xuICAgICAgICAgICAgLy8gSWYgd2UgaGF2ZSBzb21lIGtpbmQgb2Ygc2VsZi1yZWZlcmVuY2UsIHRoZW4gd2UgY2Fubm90IGRldGVybWluZSB0aGUgaGVyaXRhZ2UuXG4gICAgICAgICAgICBpZiAoY29uc3RydWN0b3IgPT09IE8pXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3RvO1xuICAgICAgICAgICAgLy8gd2UgaGF2ZSBhIHByZXR0eSBnb29kIGd1ZXNzIGF0IHRoZSBoZXJpdGFnZS5cbiAgICAgICAgICAgIHJldHVybiBjb25zdHJ1Y3RvcjtcbiAgICAgICAgfVxuICAgICAgICAvLyBuYWl2ZSBNYXAgc2hpbVxuICAgICAgICBmdW5jdGlvbiBDcmVhdGVNYXBQb2x5ZmlsbCgpIHtcbiAgICAgICAgICAgIHZhciBjYWNoZVNlbnRpbmVsID0ge307XG4gICAgICAgICAgICB2YXIgYXJyYXlTZW50aW5lbCA9IFtdO1xuICAgICAgICAgICAgdmFyIE1hcEl0ZXJhdG9yID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIE1hcEl0ZXJhdG9yKGtleXMsIHZhbHVlcywgc2VsZWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5kZXggPSAwO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlzID0ga2V5cztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzID0gdmFsdWVzO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RvciA9IHNlbGVjdG9yO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBNYXBJdGVyYXRvci5wcm90b3R5cGVbXCJAQGl0ZXJhdG9yXCJdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfTtcbiAgICAgICAgICAgICAgICBNYXBJdGVyYXRvci5wcm90b3R5cGVbaXRlcmF0b3JTeW1ib2xdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfTtcbiAgICAgICAgICAgICAgICBNYXBJdGVyYXRvci5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5faW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSAwICYmIGluZGV4IDwgdGhpcy5fa2V5cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB0aGlzLl9zZWxlY3Rvcih0aGlzLl9rZXlzW2luZGV4XSwgdGhpcy5fdmFsdWVzW2luZGV4XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggKyAxID49IHRoaXMuX2tleXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5kZXggPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlzID0gYXJyYXlTZW50aW5lbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMgPSBhcnJheVNlbnRpbmVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiByZXN1bHQsIGRvbmU6IGZhbHNlIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9O1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgTWFwSXRlcmF0b3IucHJvdG90eXBlLnRocm93ID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pbmRleCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbmRleCA9IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5cyA9IGFycmF5U2VudGluZWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMgPSBhcnJheVNlbnRpbmVsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgTWFwSXRlcmF0b3IucHJvdG90eXBlLnJldHVybiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5faW5kZXggPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5kZXggPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleXMgPSBhcnJheVNlbnRpbmVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzID0gYXJyYXlTZW50aW5lbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogdmFsdWUsIGRvbmU6IHRydWUgfTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBNYXBJdGVyYXRvcjtcbiAgICAgICAgICAgIH0oKSk7XG4gICAgICAgICAgICByZXR1cm4gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIE1hcCgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVLZXkgPSBjYWNoZVNlbnRpbmVsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZUluZGV4ID0gLTI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShNYXAucHJvdG90eXBlLCBcInNpemVcIiwge1xuICAgICAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX2tleXMubGVuZ3RoOyB9LFxuICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBNYXAucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uIChrZXkpIHsgcmV0dXJuIHRoaXMuX2ZpbmQoa2V5LCAvKmluc2VydCovIGZhbHNlKSA+PSAwOyB9O1xuICAgICAgICAgICAgICAgIE1hcC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9maW5kKGtleSwgLyppbnNlcnQqLyBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbmRleCA+PSAwID8gdGhpcy5fdmFsdWVzW2luZGV4XSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIE1hcC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZmluZChrZXksIC8qaW5zZXJ0Ki8gdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlc1tpbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBNYXAucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZmluZChrZXksIC8qaW5zZXJ0Ki8gZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNpemUgPSB0aGlzLl9rZXlzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBpbmRleCArIDE7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlzW2kgLSAxXSA9IHRoaXMuX2tleXNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzW2kgLSAxXSA9IHRoaXMuX3ZhbHVlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleXMubGVuZ3RoLS07XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMubGVuZ3RoLS07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSB0aGlzLl9jYWNoZUtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlS2V5ID0gY2FjaGVTZW50aW5lbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZUluZGV4ID0gLTI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBNYXAucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlzLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcy5sZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZUtleSA9IGNhY2hlU2VudGluZWw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlSW5kZXggPSAtMjtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIE1hcC5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBNYXBJdGVyYXRvcih0aGlzLl9rZXlzLCB0aGlzLl92YWx1ZXMsIGdldEtleSk7IH07XG4gICAgICAgICAgICAgICAgTWFwLnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgTWFwSXRlcmF0b3IodGhpcy5fa2V5cywgdGhpcy5fdmFsdWVzLCBnZXRWYWx1ZSk7IH07XG4gICAgICAgICAgICAgICAgTWFwLnByb3RvdHlwZS5lbnRyaWVzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IE1hcEl0ZXJhdG9yKHRoaXMuX2tleXMsIHRoaXMuX3ZhbHVlcywgZ2V0RW50cnkpOyB9O1xuICAgICAgICAgICAgICAgIE1hcC5wcm90b3R5cGVbXCJAQGl0ZXJhdG9yXCJdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5lbnRyaWVzKCk7IH07XG4gICAgICAgICAgICAgICAgTWFwLnByb3RvdHlwZVtpdGVyYXRvclN5bWJvbF0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLmVudHJpZXMoKTsgfTtcbiAgICAgICAgICAgICAgICBNYXAucHJvdG90eXBlLl9maW5kID0gZnVuY3Rpb24gKGtleSwgaW5zZXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jYWNoZUtleSAhPT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZUluZGV4ID0gdGhpcy5fa2V5cy5pbmRleE9mKHRoaXMuX2NhY2hlS2V5ID0ga2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2FjaGVJbmRleCA8IDAgJiYgaW5zZXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZUluZGV4ID0gdGhpcy5fa2V5cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlzLnB1c2goa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcy5wdXNoKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhY2hlSW5kZXg7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWFwO1xuICAgICAgICAgICAgfSgpKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEtleShrZXksIF8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0VmFsdWUoXywgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRFbnRyeShrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtrZXksIHZhbHVlXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBuYWl2ZSBTZXQgc2hpbVxuICAgICAgICBmdW5jdGlvbiBDcmVhdGVTZXRQb2x5ZmlsbCgpIHtcbiAgICAgICAgICAgIHJldHVybiAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gU2V0KCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXAgPSBuZXcgX01hcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU2V0LnByb3RvdHlwZSwgXCJzaXplXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9tYXAuc2l6ZTsgfSxcbiAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgU2V0LnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHRoaXMuX21hcC5oYXModmFsdWUpOyB9O1xuICAgICAgICAgICAgICAgIFNldC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB0aGlzLl9tYXAuc2V0KHZhbHVlLCB2YWx1ZSksIHRoaXM7IH07XG4gICAgICAgICAgICAgICAgU2V0LnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHRoaXMuX21hcC5kZWxldGUodmFsdWUpOyB9O1xuICAgICAgICAgICAgICAgIFNldC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7IHRoaXMuX21hcC5jbGVhcigpOyB9O1xuICAgICAgICAgICAgICAgIFNldC5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX21hcC5rZXlzKCk7IH07XG4gICAgICAgICAgICAgICAgU2V0LnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9tYXAudmFsdWVzKCk7IH07XG4gICAgICAgICAgICAgICAgU2V0LnByb3RvdHlwZS5lbnRyaWVzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fbWFwLmVudHJpZXMoKTsgfTtcbiAgICAgICAgICAgICAgICBTZXQucHJvdG90eXBlW1wiQEBpdGVyYXRvclwiXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMua2V5cygpOyB9O1xuICAgICAgICAgICAgICAgIFNldC5wcm90b3R5cGVbaXRlcmF0b3JTeW1ib2xdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5rZXlzKCk7IH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIFNldDtcbiAgICAgICAgICAgIH0oKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbmFpdmUgV2Vha01hcCBzaGltXG4gICAgICAgIGZ1bmN0aW9uIENyZWF0ZVdlYWtNYXBQb2x5ZmlsbCgpIHtcbiAgICAgICAgICAgIHZhciBVVUlEX1NJWkUgPSAxNjtcbiAgICAgICAgICAgIHZhciBrZXlzID0gSGFzaE1hcC5jcmVhdGUoKTtcbiAgICAgICAgICAgIHZhciByb290S2V5ID0gQ3JlYXRlVW5pcXVlS2V5KCk7XG4gICAgICAgICAgICByZXR1cm4gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIFdlYWtNYXAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleSA9IENyZWF0ZVVuaXF1ZUtleSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBXZWFrTWFwLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0YWJsZSA9IEdldE9yQ3JlYXRlV2Vha01hcFRhYmxlKHRhcmdldCwgLypjcmVhdGUqLyBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0YWJsZSAhPT0gdW5kZWZpbmVkID8gSGFzaE1hcC5oYXModGFibGUsIHRoaXMuX2tleSkgOiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFdlYWtNYXAucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhYmxlID0gR2V0T3JDcmVhdGVXZWFrTWFwVGFibGUodGFyZ2V0LCAvKmNyZWF0ZSovIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhYmxlICE9PSB1bmRlZmluZWQgPyBIYXNoTWFwLmdldCh0YWJsZSwgdGhpcy5fa2V5KSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFdlYWtNYXAucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uICh0YXJnZXQsIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0YWJsZSA9IEdldE9yQ3JlYXRlV2Vha01hcFRhYmxlKHRhcmdldCwgLypjcmVhdGUqLyB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGFibGVbdGhpcy5fa2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFdlYWtNYXAucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhYmxlID0gR2V0T3JDcmVhdGVXZWFrTWFwVGFibGUodGFyZ2V0LCAvKmNyZWF0ZSovIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhYmxlICE9PSB1bmRlZmluZWQgPyBkZWxldGUgdGFibGVbdGhpcy5fa2V5XSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgV2Vha01hcC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE5PVEU6IG5vdCBhIHJlYWwgY2xlYXIsIGp1c3QgbWFrZXMgdGhlIHByZXZpb3VzIGRhdGEgdW5yZWFjaGFibGVcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5ID0gQ3JlYXRlVW5pcXVlS2V5KCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gV2Vha01hcDtcbiAgICAgICAgICAgIH0oKSk7XG4gICAgICAgICAgICBmdW5jdGlvbiBDcmVhdGVVbmlxdWVLZXkoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleTtcbiAgICAgICAgICAgICAgICBkb1xuICAgICAgICAgICAgICAgICAgICBrZXkgPSBcIkBAV2Vha01hcEBAXCIgKyBDcmVhdGVVVUlEKCk7XG4gICAgICAgICAgICAgICAgd2hpbGUgKEhhc2hNYXAuaGFzKGtleXMsIGtleSkpO1xuICAgICAgICAgICAgICAgIGtleXNba2V5XSA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIEdldE9yQ3JlYXRlV2Vha01hcFRhYmxlKHRhcmdldCwgY3JlYXRlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNPd24uY2FsbCh0YXJnZXQsIHJvb3RLZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY3JlYXRlKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgcm9vdEtleSwgeyB2YWx1ZTogSGFzaE1hcC5jcmVhdGUoKSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtyb290S2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIEZpbGxSYW5kb21CeXRlcyhidWZmZXIsIHNpemUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7ICsraSlcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyW2ldID0gTWF0aC5yYW5kb20oKSAqIDB4ZmYgfCAwO1xuICAgICAgICAgICAgICAgIHJldHVybiBidWZmZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBHZW5SYW5kb21CeXRlcyhzaXplKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBVaW50OEFycmF5ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjcnlwdG8gIT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheShzaXplKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbXNDcnlwdG8gIT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbXNDcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50OEFycmF5KHNpemUpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEZpbGxSYW5kb21CeXRlcyhuZXcgVWludDhBcnJheShzaXplKSwgc2l6ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBGaWxsUmFuZG9tQnl0ZXMobmV3IEFycmF5KHNpemUpLCBzaXplKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIENyZWF0ZVVVSUQoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBHZW5SYW5kb21CeXRlcyhVVUlEX1NJWkUpO1xuICAgICAgICAgICAgICAgIC8vIG1hcmsgYXMgcmFuZG9tIC0gUkZDIDQxMjIgwqcgNC40XG4gICAgICAgICAgICAgICAgZGF0YVs2XSA9IGRhdGFbNl0gJiAweDRmIHwgMHg0MDtcbiAgICAgICAgICAgICAgICBkYXRhWzhdID0gZGF0YVs4XSAmIDB4YmYgfCAweDgwO1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIG9mZnNldCA9IDA7IG9mZnNldCA8IFVVSURfU0laRTsgKytvZmZzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJ5dGUgPSBkYXRhW29mZnNldF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChvZmZzZXQgPT09IDQgfHwgb2Zmc2V0ID09PSA2IHx8IG9mZnNldCA9PT0gOClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBcIi1cIjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJ5dGUgPCAxNilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBcIjBcIjtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IGJ5dGUudG9TdHJpbmcoMTYpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gdXNlcyBhIGhldXJpc3RpYyB1c2VkIGJ5IHY4IGFuZCBjaGFrcmEgdG8gZm9yY2UgYW4gb2JqZWN0IGludG8gZGljdGlvbmFyeSBtb2RlLlxuICAgICAgICBmdW5jdGlvbiBNYWtlRGljdGlvbmFyeShvYmopIHtcbiAgICAgICAgICAgIG9iai5fXyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGRlbGV0ZSBvYmouX187XG4gICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9XG4gICAgfSk7XG59KShSZWZsZWN0IHx8IChSZWZsZWN0ID0ge30pKTtcbiIsImludGVyZmFjZSBHYW1lRGF0YSB7XHJcbiAgaW50ZXJlc3RlZEluRmVhdHVyZXM/OiBzdHJpbmdbXTtcclxuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgZW51bSBHYW1lS2V5IHtcclxuICBMZWFndWVPZkxlZ2VuZHMgPSA1NDI2LFxyXG4gIENTMiA9IDIyNzMwLFxyXG4gIFJvY2tldExlYWd1ZSA9IDEwNzk4LFxyXG4gIFBVQkcgPSAxMDkwNixcclxuICBGb3J0bml0ZSA9IDIxMjE2LFxyXG4gIEFwZXhMZWdlbmRzID0gMjE1NjYsXHJcbiAgVmFsb3JhbnQgPSAyMTY0MCxcclxuICBDU0dPID0gNzc2NFxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgR2FtZUZpbGVOYW1lID0ge1xyXG4gIFtHYW1lS2V5LkxlYWd1ZU9mTGVnZW5kc106ICdMZWFndWUgT2YgTGVnZW5kcycsXHJcbiAgW0dhbWVLZXkuQ1MyXTogJ0NvdW50ZXIgU3RyaWtlIDInLFxyXG4gIFtHYW1lS2V5LlJvY2tldExlYWd1ZV06ICdSb2NrZXQgTGVhZ3VlJyxcclxuICBbR2FtZUtleS5QVUJHXTogJ1BVQkcnLFxyXG4gIFtHYW1lS2V5LkZvcnRuaXRlXTogJ0ZvcnRuaXRlJyxcclxuICBbR2FtZUtleS5BcGV4TGVnZW5kc106ICdBcGV4IExlZ2VuZHMnLFxyXG4gIFtHYW1lS2V5LlZhbG9yYW50XTogJ1ZhbG9yYW50JyxcclxuICBbR2FtZUtleS5DU0dPXTogJ0NvdW50ZXIgU3RyaWtlIEdPJyxcclxufVxyXG5cclxuY29uc3QgZGF0YTogeyBbaWQ6IG51bWJlcl06IEdhbWVEYXRhIH0gPSB7XHJcbiAgW0dhbWVLZXkuTGVhZ3VlT2ZMZWdlbmRzXToge1xyXG4gICAgaW50ZXJlc3RlZEluRmVhdHVyZXM6IFtcclxuICAgICAgJ3N1bW1vbmVyX2luZm8nLFxyXG4gICAgICAnZ2FtZU1vZGUnLFxyXG4gICAgICAndGVhbXMnLFxyXG4gICAgICAnbWF0Y2hTdGF0ZScsXHJcbiAgICAgICdraWxsJyxcclxuICAgICAgJ2RlYXRoJyxcclxuICAgICAgJ3Jlc3Bhd24nLFxyXG4gICAgICAnYXNzaXN0JyxcclxuICAgICAgJ21pbmlvbnMnLFxyXG4gICAgICAnbGV2ZWwnLFxyXG4gICAgICAnYWJpbGl0aWVzJyxcclxuICAgICAgJ2Fubm91bmNlcicsXHJcbiAgICAgICdjb3VudGVycycsXHJcbiAgICAgICdtYXRjaF9pbmZvJyxcclxuICAgICAgJ2RhbWFnZScsXHJcbiAgICAgICdoZWFsJyxcclxuICAgICAgJ2xpdmVfY2xpZW50X2RhdGEnLFxyXG4gICAgICAnanVuZ2xlX2NhbXBzJyxcclxuICAgICAgJ3RlYW1fZnJhbWVzJyxcclxuICAgIF0sXHJcbiAgICBkZXNjcmlwdGlvbjogJ0xPTCBkYXRhJyxcclxuICB9LFxyXG4gIFtHYW1lS2V5LkNTMl06IHtcclxuICAgIGludGVyZXN0ZWRJbkZlYXR1cmVzOiBbXHJcbiAgICAgICdnZXBfaW50ZXJuYWwnLFxyXG4gICAgICAnbWF0Y2hfaW5mbycsXHJcbiAgICAgICdsaXZlX2RhdGEnLFxyXG4gICAgXSxcclxuICAgIGRlc2NyaXB0aW9uOiAnQ1M6R08gZGF0YScsXHJcbiAgfSxcclxuICBbR2FtZUtleS5Sb2NrZXRMZWFndWVdOiB7XHJcbiAgICBpbnRlcmVzdGVkSW5GZWF0dXJlczogW1xyXG4gICAgICAnc3RhdHMnLFxyXG4gICAgICAncm9zdGVyJyxcclxuICAgICAgJ21hdGNoJyxcclxuICAgICAgJ21lJyxcclxuICAgICAgJ21hdGNoX2luZm8nLFxyXG4gICAgICAnZGVhdGgnLFxyXG4gICAgICAnZ2FtZV9pbmZvJyxcclxuICAgIF0sXHJcbiAgICBkZXNjcmlwdGlvbjogJ1JvY2tldCBsZWFndWUgZGF0YScsXHJcbiAgfSxcclxuICBbR2FtZUtleS5QVUJHXToge1xyXG4gICAgaW50ZXJlc3RlZEluRmVhdHVyZXM6IFtcclxuICAgICAgJ2tpbGwnLFxyXG4gICAgICAncmV2aXZlZCcsXHJcbiAgICAgICdkZWF0aCcsXHJcbiAgICAgICdraWxsZXInLFxyXG4gICAgICAnbWF0Y2gnLFxyXG4gICAgICAncmFuaycsXHJcbiAgICAgICdsb2NhdGlvbicsXHJcbiAgICAgICdtZScsXHJcbiAgICAgICd0ZWFtJyxcclxuICAgICAgJ3BoYXNlJyxcclxuICAgICAgJ21hcCcsXHJcbiAgICAgICdyb3N0ZXInLFxyXG4gICAgICAnaW52ZW50b3J5JyxcclxuICAgICAgJ21hdGNoX2luZm8nLFxyXG4gICAgICAnY291bnRlcnMnLFxyXG4gICAgXSxcclxuICAgIGRlc2NyaXB0aW9uOiAnUFVCRyBkYXRhJyxcclxuICB9LFxyXG4gIFtHYW1lS2V5LkZvcnRuaXRlXToge1xyXG4gICAgaW50ZXJlc3RlZEluRmVhdHVyZXM6IFtcclxuICAgICAgJ2tpbGwnLFxyXG4gICAgICAna2lsbGVkJyxcclxuICAgICAgJ2tpbGxlcicsXHJcbiAgICAgICdyZXZpdmVkJyxcclxuICAgICAgJ2RlYXRoJyxcclxuICAgICAgJ21hdGNoJyxcclxuICAgICAgJ3JhbmsnLFxyXG4gICAgICAnbWUnLFxyXG4gICAgICAncGhhc2UnLFxyXG4gICAgICAnbG9jYXRpb24nLFxyXG4gICAgICAncm9zdGVyJyxcclxuICAgICAgJ3RlYW0nLFxyXG4gICAgICAnaXRlbXMnLFxyXG4gICAgICAnY291bnRlcnMnLFxyXG4gICAgICAnbWF0Y2hfaW5mbycsXHJcbiAgICAgICdtYXAnLFxyXG4gICAgXSxcclxuICAgIGRlc2NyaXB0aW9uOiAnRm9ydG5pdGUgZGF0YScsXHJcbiAgfSxcclxuICBbR2FtZUtleS5BcGV4TGVnZW5kc106IHtcclxuICAgIGludGVyZXN0ZWRJbkZlYXR1cmVzOiBbXHJcbiAgICAgICdkZWF0aCcsXHJcbiAgICAgICdraWxsJyxcclxuICAgICAgJ21hdGNoX3N0YXRlJyxcclxuICAgICAgJ21lJyxcclxuICAgICAgJ3Jldml2ZScsXHJcbiAgICAgICd0ZWFtJyxcclxuICAgICAgJ3Jvc3RlcicsXHJcbiAgICAgICdraWxsX2ZlZWQnLFxyXG4gICAgICAncmFuaycsXHJcbiAgICAgICdtYXRjaF9zdW1tYXJ5JyxcclxuICAgICAgJ2xvY2F0aW9uJyxcclxuICAgICAgJ21hdGNoX2luZm8nLFxyXG4gICAgICAndmljdG9yeScsXHJcbiAgICAgICdkYW1hZ2UnLFxyXG4gICAgICAnaW52ZW50b3J5JyxcclxuICAgICAgJ2xvY2FsaXphdGlvbicsXHJcbiAgICBdLFxyXG4gICAgZGVzY3JpcHRpb246ICdBcGV4IGRhdGEnLFxyXG4gIH0sXHJcbiAgW0dhbWVLZXkuVmFsb3JhbnRdOiB7XHJcbiAgICBpbnRlcmVzdGVkSW5GZWF0dXJlczogW1xyXG4gICAgICAnZ2FtZV9pbmZvJyxcclxuICAgICAgJ21lJyxcclxuICAgICAgJ21hdGNoX2luZm8nLFxyXG4gICAgICAna2lsbCcsXHJcbiAgICAgICdkZWF0aCcsXHJcbiAgICAgICdnZXBfaW50ZXJuYWwnLFxyXG4gICAgXSxcclxuICAgIGRlc2NyaXB0aW9uOiAnVmFsb3JhbnQgZGF0YScsXHJcbiAgfSxcclxuICBbR2FtZUtleS5DU0dPXToge1xyXG4gICAgaW50ZXJlc3RlZEluRmVhdHVyZXM6IFtcclxuICAgICAgJ2tpbGwnLFxyXG4gICAgICAnZGVhdGgnLFxyXG4gICAgICAnYXNzaXN0JyxcclxuICAgICAgJ2hlYWRzaG90JyxcclxuICAgICAgJ3JvdW5kX3N0YXJ0JyxcclxuICAgICAgJ21hdGNoX3N0YXJ0JyxcclxuICAgICAgJ21hdGNoX2VuZCcsXHJcbiAgICAgICd0ZWFtX3JvdW5kX3dpbicsXHJcbiAgICAgICdib21iX3BsYW50ZWQnLFxyXG4gICAgICAnYm9tYl9jaGFuZ2UnLFxyXG4gICAgICAncmVsb2FkaW5nJyxcclxuICAgICAgJ2ZpcmVkJyxcclxuICAgICAgJ3dlYXBvbl9jaGFuZ2UnLFxyXG4gICAgICAnd2VhcG9uX2FjcXVpcmVkJyxcclxuICAgICAgJ3BsYXllcl9hY3Rpdml0eV9jaGFuZ2UnLFxyXG4gICAgICAndGVhbV9zZXQnLFxyXG4gICAgICAnaW5mbycsXHJcbiAgICAgICdyb3N0ZXInLFxyXG4gICAgICAnc2NlbmUnLFxyXG4gICAgICAnbWF0Y2hfaW5mbycsXHJcbiAgICAgICdyZXBsYXknLFxyXG4gICAgICAnY291bnRlcnMnLFxyXG4gICAgICAnbXZwJyxcclxuICAgICAgJ2tpbGxfZmVlZCcsXHJcbiAgICAgICdzY29yZWJvYXJkJyxcclxuICAgICAgJ3Njb3JlJyxcclxuICAgIF0sXHJcbiAgICBkZXNjcmlwdGlvbjogJ0NTOkdPIGRhdGEnLFxyXG4gIH0sXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkYXRhO1xyXG4iLCIvLyB1c2UgaHR0cDovL2xvY2FsaG9zdDozMDAwIGZvciBkZXYgbW9kZVxyXG4vLyB1c2UgaHR0cHM6Ly9vdmVyd29sZi1kdWVsLWFwaS0yMDcwNzdkZDRhMDkuaGVyb2t1YXBwLmNvbSBmb3IgcHJvZFxyXG5cclxuZXhwb3J0IGNvbnN0IGVudmlyb25tZW50ID0ge1xyXG4gIHVybDogJ2h0dHBzOi8vb3ZlcndvbGYtZHVlbC1hcGktMjA3MDc3ZGQ0YTA5Lmhlcm9rdWFwcC5jb20nLFxyXG59O1xyXG4iLCJpbXBvcnQgJ3JlZmxlY3QtbWV0YWRhdGEnO1xyXG5pbXBvcnQgeyBjb250YWluZXIsIGluamVjdGFibGUgfSBmcm9tICd0c3lyaW5nZSc7XHJcbmltcG9ydCBnYW1lRGF0YSBmcm9tICcuL2NvbmZpZy9nYW1lLWRhdGEnO1xyXG5pbXBvcnQgeyBHRVBTZXJ2aWNlIH0gZnJvbSAnLi9zZXJ2aWNlcy9nZXAtc2VydmljZSc7XHJcbmltcG9ydCB7IEdhbWVEZXRlY3Rpb25TZXJ2aWNlIH0gZnJvbSAnLi9zZXJ2aWNlcy9nYW1lLWRldGVjdGlvbi1zZXJ2aWNlJztcclxuaW1wb3J0IHtcclxuICBHYW1lQ2xvc2VkRXZlbnQsXHJcbiAgR2FtZUxhdW5jaGVkRXZlbnQsXHJcbiAgUG9zdEdhbWVFdmVudCxcclxufSBmcm9tICcuL2ludGVyZmFjZXMvcnVubmluZy1nYW1lJztcclxuaW1wb3J0IHsgR0VQQ29uc3VtZXIgfSBmcm9tICcuL3NlcnZpY2VzL2dlcC1jb25zdW1lcic7XHJcbmltcG9ydCB7IEF1dGhTZXJ2aWNlIH0gZnJvbSAnLi9zZXJ2aWNlcy9hdXRoLXNlcnZpY2UnO1xyXG5cclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuQGluamVjdGFibGUoKVxyXG5leHBvcnQgY2xhc3MgTWFpbiB7XHJcbiAgbG9naW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGlzY29yZC1idXR0b24nKTtcclxuICB1c2VyR3JlZXRpbmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXNlckdyZWV0aW5nJyk7XHJcbiAgc2VydmVyOiBhbnk7XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZ2VwU2VydmljZTogR0VQU2VydmljZSxcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgZ2VwQ29uc3VtZXI6IEdFUENvbnN1bWVyLFxyXG4gICAgcHJpdmF0ZSByZWFkb25seSBnYW1lRGV0ZWN0aW9uU2VydmljZTogR2FtZURldGVjdGlvblNlcnZpY2UsXHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IGF1dGhTZXJ2aWNlOiBBdXRoU2VydmljZSxcclxuICApIHtcclxuICAgIHRoaXMubG9naW5CdXR0b24/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICB0aGlzLmF1dGhTZXJ2aWNlLmxvZ2luKCk7XHJcbiAgICB9KTtcclxuICAgIHRoaXMuY3JlYXRlU2VydmVyKCk7XHJcbiAgICB0aGlzLmluaXQoKTtcclxuICB9XHJcblxyXG4gIGNyZWF0ZVNlcnZlcigpOiB2b2lkIHtcclxuICAgIGNvbnN0IF9wb3J0ID0gNjEyMzQ7XHJcblxyXG4gICAgb3ZlcndvbGYud2ViLmNyZWF0ZVNlcnZlcihfcG9ydCwgKHNlcnZlckluZm8pID0+IHtcclxuICAgICAgaWYgKHNlcnZlckluZm8uZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnRmFpbGVkIHRvIGNyZWF0ZSBzZXJ2ZXInKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnNlcnZlciA9IHNlcnZlckluZm8uc2VydmVyO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuc2VydmVyKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBpdCBpcyBhbHdheXMgZ29vZCBwcmFjdGljZSB0byByZW1vdmVMaXN0ZW5lciBiZWZvcmUgYWRkaW5nIGl0XHJcbiAgICAgICAgdGhpcy5zZXJ2ZXIub25SZXF1ZXN0LnJlbW92ZUxpc3RlbmVyKHRoaXMub25SZXF1ZXN0LmJpbmQodGhpcykpO1xyXG4gICAgICAgIHRoaXMuc2VydmVyLm9uUmVxdWVzdC5hZGRMaXN0ZW5lcih0aGlzLm9uUmVxdWVzdC5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXJ2ZXIubGlzdGVuKChpbmZvOiBhbnkpID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGBTZXJ2ZXIgbGlzdGVuaW5nIHN0YXR1cyBvbiBwb3J0ICR7X3BvcnR9IDogJHtpbmZvfWApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIG9uUmVxdWVzdChpbmZvOiB7IHVybDogc3RyaW5nIH0pIHtcclxuICAgIGNvbnN0IHVybFN0cmluZyA9IGluZm8udXJsO1xyXG4gICAgY29uc3QgdXJsID0gbmV3IFVSTCh1cmxTdHJpbmcpO1xyXG4gICAgY29uc3Qgc2VhcmNoUGFyYW1zID0gdXJsLnNlYXJjaFBhcmFtcztcclxuXHJcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY2FtZWxjYXNlXHJcbiAgICBjb25zdCBhY2Nlc3NfdG9rZW4gPSBzZWFyY2hQYXJhbXMuZ2V0KCdhY2Nlc3NfdG9rZW4nKTtcclxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjYW1lbGNhc2VcclxuICAgIGNvbnN0IHRva2VuX3R5cGUgPSBzZWFyY2hQYXJhbXMuZ2V0KCd0b2tlbl90eXBlJyk7XHJcblxyXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNhbWVsY2FzZVxyXG4gICAgaWYgKGFjY2Vzc190b2tlbiAmJiB0b2tlbl90eXBlKSB7XHJcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhY2Nlc3NfdG9rZW4nLCBhY2Nlc3NfdG9rZW4pO1xyXG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndG9rZW5fdHlwZScsIHRva2VuX3R5cGUpO1xyXG4gICAgICB0aGlzLmF1dGhTZXJ2aWNlLmdldFVzZXIoKS50aGVuKChkYXRhKSA9PiB7XHJcbiAgICAgICAgY29uc3QgdXNlciA9IGRhdGEudXNlcjtcclxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2Jhbi10cy1jb21tZW50XHJcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgIHRoaXMubG9naW5CdXR0b24/LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9iYW4tdHMtY29tbWVudFxyXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICB0aGlzLnVzZXJHcmVldGluZz8uaW5uZXJUZXh0ID0gYEhpLCAke3VzZXIudXNlcm5hbWV9LiBFbmpveSBwbGF5aW5nIGdhbWVzLmA7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhpcyBhcHBcclxuICAgKi9cclxuICBwdWJsaWMgaW5pdCgpOiB2b2lkIHtcclxuICAgIC8vIFJlZ2lzdGVyIGZvciB0aGUgYGdhbWVMYXVuY2hlZGAgZXZlbnQgZnJvbSB0aGUgZ2FtZSBkZXRlY3Rpb24gc2VydmljZVxyXG4gICAgdGhpcy5nYW1lRGV0ZWN0aW9uU2VydmljZS5vbihcclxuICAgICAgJ2dhbWVMYXVuY2hlZCcsXHJcbiAgICAgIChnYW1lTGF1bmNoOiBHYW1lTGF1bmNoZWRFdmVudCkgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBHYW1lIHdhcyBsYXVuY2hlZDogJHtnYW1lTGF1bmNoLm5hbWV9ICR7Z2FtZUxhdW5jaC5pZH1gKTtcclxuICAgICAgICAvLyBHZXQgdGhlIGNvbmZpZ3VyZWQgZGF0YSBmb3IgdGhlIGxhdW5jaGVkIGdhbWVcclxuICAgICAgICBjb25zdCBnYW1lQ29uZmlnID0gZ2FtZURhdGFbZ2FtZUxhdW5jaC5pZF07XHJcbiAgICAgICAgLy8gSWYgdGhlIGRldGVjdGVkIGdhbWUgZXhpc3RzXHJcbiAgICAgICAgaWYgKGdhbWVDb25maWcpIHtcclxuICAgICAgICAgIHRoaXMuZ2VwU2VydmljZS5nYW1lTGF1bmNoSWQgPSBnYW1lTGF1bmNoLmlkO1xyXG4gICAgICAgICAgLy8gUnVuIHRoZSBnYW1lIGxhdW5jaGVkIGxvZ2ljIG9mIHRoZSBnZXAgc2VydmljZVxyXG4gICAgICAgICAgdGhpcy5nZXBTZXJ2aWNlLm9uR2FtZUxhdW5jaGVkKGdhbWVDb25maWcuaW50ZXJlc3RlZEluRmVhdHVyZXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICk7XHJcbiAgICAvLyBSZWdpc3RlciBmb3IgdGhlIGBnYW1lQ2xvc2VkYCBldmVudCBmcm9tIHRoZSBnYW1lRGV0ZWN0aW9uU2VydmljZVxyXG4gICAgdGhpcy5nYW1lRGV0ZWN0aW9uU2VydmljZS5vbihcclxuICAgICAgJ2dhbWVDbG9zZWQnLFxyXG4gICAgICAoZ2FtZUNsb3NlZDogR2FtZUNsb3NlZEV2ZW50KSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYEdhbWUgd2FzIGNsb3NlZDogJHtnYW1lQ2xvc2VkLm5hbWV9YCk7XHJcbiAgICAgICAgLy8gUnVuIGdhbWUgY2xvc2VkIGNsZWFudXAgb2YgdGhlIGdlcCBzZXJ2aWNlXHJcbiAgICAgICAgdGhpcy5nZXBTZXJ2aWNlLm9uR2FtZUNsb3NlZCgpO1xyXG4gICAgICB9LFxyXG4gICAgKTtcclxuICAgIC8vIFJlZ2lzdGVyIGZvciB0aGUgYHBvc3RHYW1lYCBldmVudCBmcm9tIHRoZSBnYW1lRGV0ZWN0aW9uU2VydmljZVxyXG4gICAgdGhpcy5nYW1lRGV0ZWN0aW9uU2VydmljZS5vbigncG9zdEdhbWUnLCAocG9zdEdhbWU6IFBvc3RHYW1lRXZlbnQpID0+IHtcclxuICAgICAgY29uc29sZS5sb2coYFJ1bm5pbmcgcG9zdC1nYW1lIGxvZ2ljIGZvciBnYW1lOiAke3Bvc3RHYW1lLm5hbWV9YCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBSZWdpc3RlciBmb3IgdGhlIGBnYW1lRXZlbnRgLCBgaW5mb1VwZGF0ZWAsIGFuZCBgZXJyb3JgIGdlcFNlcnZpY2UgZXZlbnRzXHJcbiAgICB0aGlzLmdlcFNlcnZpY2Uub24oJ2dhbWVFdmVudCcsIHRoaXMuZ2VwQ29uc3VtZXIub25OZXdHYW1lRXZlbnQpO1xyXG4gICAgdGhpcy5nZXBTZXJ2aWNlLm9uKCdpbmZvVXBkYXRlJywgdGhpcy5nZXBDb25zdW1lci5vbkdhbWVJbmZvVXBkYXRlKTtcclxuICAgIHRoaXMuZ2VwU2VydmljZS5vbignZXJyb3InLCB0aGlzLmdlcENvbnN1bWVyLm9uR0VQRXJyb3IpO1xyXG5cclxuICAgIC8vIEhhbmRsZSBFdmVudHMgdG8gd3JpdGUgZGF0YSBpbnRvIGRhdGFiYXNlXHJcbiAgICB0aGlzLmdlcFNlcnZpY2Uub24oJ2dhbWVFdmVudCcsIHRoaXMuZ2VwU2VydmljZS5vbk5ld0dhbWVFdmVudCk7XHJcbiAgICB0aGlzLmdlcFNlcnZpY2Uub24oJ2luZm9VcGRhdGUnLCB0aGlzLmdlcFNlcnZpY2Uub25HYW1lSW5mb1VwZGF0ZSk7XHJcblxyXG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgZ2FtZSBkZXRlY3Rpb24gc2VydmljZVxyXG4gICAgdGhpcy5nYW1lRGV0ZWN0aW9uU2VydmljZS5pbml0KCk7XHJcbiAgfVxyXG59XHJcblxyXG5jb250YWluZXIucmVzb2x2ZShNYWluKTtcclxuIiwiaW1wb3J0IHsgaW5qZWN0YWJsZSB9IGZyb20gJ3RzeXJpbmdlJztcclxuaW1wb3J0IHsgR2FtZUZpbGVOYW1lIH0gZnJvbSAnLi4vY29uZmlnL2dhbWUtZGF0YSc7XHJcbmltcG9ydCB7IGVudmlyb25tZW50IH0gZnJvbSAnLi4vZW52aXJvbm1lbnQvZW52aXJvbm1lbnQnO1xyXG5cclxuaW50ZXJmYWNlIFRva2VuUmVzcG9uc2Uge1xyXG4gIGFjY2Vzc190b2tlbjogc3RyaW5nO1xyXG4gIHRva2VuX3R5cGU6IHN0cmluZztcclxuICBleHBpcmVzX2luOiBudW1iZXI7XHJcbiAgc2NvcGU6IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIFVzZXIge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgdXNlcm5hbWU6IHN0cmluZztcclxuICBhdmF0YXI6IHN0cmluZztcclxuICBkaXNjcmltaW5hdG9yOiBzdHJpbmc7XHJcbiAgcHVibGljX2ZsYWdzOiBudW1iZXI7XHJcbiAgcHJlbWl1bV90eXBlOiBudW1iZXI7XHJcbiAgZmxhZ3M6IG51bWJlcjtcclxuICBiYW5uZXI6IGFueTtcclxuICBhY2NlbnRfY29sb3I6IGFueTtcclxuICBnbG9iYWxfbmFtZTogYW55O1xyXG4gIGF2YXRhcl9kZWNvcmF0aW9uX2RhdGE6IGFueTtcclxuICBiYW5uZXJfY29sb3I6IGFueTtcclxuICBtZmFfZW5hYmxlZDogYW55O1xyXG4gIGxvY2FsZTogc3RyaW5nO1xyXG59XHJcblxyXG5AaW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBBdXRoU2VydmljZSB7XHJcbiAgdXNlcjogVXNlciB8IG51bGwgPSBudWxsO1xyXG5cclxuICBjb25zdHJ1Y3RvcigpIHt9XHJcblxyXG4gIGFzeW5jIGdldFVzZXIoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGFjY2Vzc1Rva2VuID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FjY2Vzc190b2tlbicpO1xyXG4gICAgICBjb25zdCB0b2tlblR5cGUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndG9rZW5fdHlwZScpO1xyXG5cclxuICAgICAgaWYgKCFhY2Nlc3NUb2tlbiB8fCAhdG9rZW5UeXBlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2ludmFsaWQgdG9rZW4nKTtcclxuICAgICAgICAvLyBSZWplY3QgdGhlIHByb21pc2UgaWYgYWNjZXNzIHRva2VuIG9yIHRva2VuIHR5cGUgaXMgbWlzc2luZ1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgdG9rZW4nKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZW52aXJvbm1lbnQudXJsICsgJy9hdXRoL2Rpc2NvcmQvdXNlcicsIHtcclxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICBhY2Nlc3NfdG9rZW46IGFjY2Vzc1Rva2VuLFxyXG4gICAgICAgICAgICB0b2tlbl90eXBlOiB0b2tlblR5cGUsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0pLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGlmIChyZXNwb25zZS5vaykge1xyXG4gICAgICAgIC8vIFBhcnNlIGFuZCByZXR1cm4gdGhlIEpTT04gZGF0YVxyXG4gICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6JywgcmVzcG9uc2Uuc3RhdHVzVGV4dCk7XHJcbiAgICAgICAgLy8gUmVqZWN0IHRoZSBwcm9taXNlIHdpdGggYW4gZXJyb3IgbWVzc2FnZVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IocmVzcG9uc2Uuc3RhdHVzVGV4dCkpO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOicsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAvLyBSZWplY3QgdGhlIHByb21pc2Ugd2l0aCB0aGUgY2F1Z2h0IGVycm9yXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBsb2dpbigpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZW52aXJvbm1lbnQudXJsICsgJy9hdXRoL2Rpc2NvcmQvbG9naW4nLCB7XHJcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXNwb25zZS5qc29uKCkudGhlbigoZGF0YSkgPT4ge1xyXG4gICAgICAgIG92ZXJ3b2xmLnV0aWxzLm9wZW5VcmxJbkRlZmF1bHRCcm93c2VyKGRhdGEudXJsKTtcclxuICAgICAgfSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOicsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iLCJpbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudHMnO1xyXG5pbXBvcnQgeyBpbmplY3RhYmxlIH0gZnJvbSAndHN5cmluZ2UnO1xyXG5pbXBvcnQge1xyXG4gIEdhbWVDbG9zZWRFdmVudCxcclxuICBHYW1lTGF1bmNoZWRFdmVudCxcclxuICBQb3N0R2FtZUV2ZW50LFxyXG4gIFJ1bm5pbmdHYW1lLFxyXG59IGZyb20gJy4uL2ludGVyZmFjZXMvcnVubmluZy1nYW1lJztcclxuXHJcbkBpbmplY3RhYmxlKClcclxuZXhwb3J0IGNsYXNzIEdhbWVEZXRlY3Rpb25TZXJ2aWNlIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuICAvKipcclxuICAgKiBUaGUgY3VycmVudGx5IHJ1bm5pbmcgZ2FtZSAoaWYgYW55KVxyXG4gICAqL1xyXG4gIHByaXZhdGUgX3J1bm5pbmdHYW1lPzogUnVubmluZ0dhbWUgPSB1bmRlZmluZWQ7XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHVwIEdhbWUgRGV0ZWN0aW9uIGxpc3RlbmVyc1xyXG4gICAqL1xyXG4gIHB1YmxpYyBpbml0KCkge1xyXG4gICAgLy8gUmVnaXN0ZXIgbGlzdGVuZXIgZm9yIHJ1bm5pbmcgZ2FtZSBpbmZvIGNoYW5nZWRcclxuICAgIG92ZXJ3b2xmLmdhbWVzLm9uR2FtZUluZm9VcGRhdGVkLmFkZExpc3RlbmVyKCh1cGRhdGUpID0+XHJcbiAgICAgIHRoaXMuZ2FtZVVwZGF0ZWQodXBkYXRlKSxcclxuICAgICk7XHJcbiAgICAvLyBHZXQgdGhlIGN1cnJlbnRseSBydW5uaW5nIGdhbWUgKGlmIGFueSlcclxuICAgIG92ZXJ3b2xmLmdhbWVzLmdldFJ1bm5pbmdHYW1lSW5mbzIoKGluZm8pID0+IHtcclxuICAgICAgLy8gSWYgdGhlcmUgaXMgYSBydW5uaW5nIGdhbWUsIHJ1biB0aGUgbm9uLWZyZXNoIGdhbWUgbGF1bmNoIGxvZ2ljXHJcbiAgICAgIGlmIChpbmZvLmdhbWVJbmZvPy5pc1J1bm5pbmcpIHRoaXMuZ2FtZUxhdW5jaGVkKGluZm8uZ2FtZUluZm8sIGZhbHNlKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmFuIHdoZW4gYSBuZXcgZ2FtZSB3YXMgbGF1bmNoZWRcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuUnVubmluZ0dhbWVJbmZvfSBnYW1lSW5mb1xyXG4gICAqIC0gVGhlIEdhbWVJbmZvIG9mIHRoZSBuZXcgZ2FtZVxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZnJlc2hMYXVuY2hcclxuICAgKiAtIElzIHRoaXMgYSBcImZyZXNoIGxhdW5jaFwiLCBvciB3YXMgdGhlIGdhbWUgYWxyZWFkeSBvcGVuIGJlZm9yZSBpdCB3YXNcclxuICAgKiBkZXRlY3RlZD8gKEZvciBleGFtcGxlLCB0aGUgYXBwIG9wZW5lZCBhZnRlciB0aGUgZ2FtZSlcclxuICAgKi9cclxuICBwcml2YXRlIGdhbWVMYXVuY2hlZChcclxuICAgIGdhbWVJbmZvOiBvdmVyd29sZi5nYW1lcy5SdW5uaW5nR2FtZUluZm8sXHJcbiAgICBmcmVzaExhdW5jaDogYm9vbGVhbixcclxuICApIHtcclxuICAgIC8vIEVuc3VyZSB0aGF0IGZyZXNoIGxhdW5jaCB3YXMgbm90IGNhbGxlZCB3aGlsZSB0aGVyZSB3YXMgYSBydW5uaW5nIGdhbWVcclxuICAgIGlmIChmcmVzaExhdW5jaCAmJiB0aGlzLl9ydW5uaW5nR2FtZSlcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBtYXgtbGVuXHJcbiAgICAgICAgYEEgZnJlc2ggbGF1bmNoIHdhcyBjYWxsZWQsIGJ1dCBhIHJ1bm5pbmcgZ2FtZSB3YXMgYWxyZWFkeSBkZXRlY3RlZCEgTGF1bmNoZWQgXFxgJHtnYW1lSW5mby50aXRsZX1cXGAsIHdoaWxlIFxcYCR7dGhpcy5fcnVubmluZ0dhbWUubmFtZX1cXGAgd2FzIGFscmVhZHkgcnVubmluZ2AsXHJcbiAgICAgICk7XHJcblxyXG4gICAgLy8gU2V0IHRoZSBjdXJyZW50bHkgcnVubmluZyBnYW1lXHJcbiAgICB0aGlzLl9ydW5uaW5nR2FtZSA9IHtcclxuICAgICAgLy8gR2FtZSBJRFxyXG4gICAgICBpZDogZ2FtZUluZm8uY2xhc3NJZCxcclxuICAgICAgLy8gRGlzcGxheSBuYW1lIG9mIHRoZSBnYW1lXHJcbiAgICAgIG5hbWU6IGdhbWVJbmZvLnRpdGxlLFxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBDb25zdHJ1Y3QgdGhlIGBnYW1lTGF1bmNoZWRgIGV2ZW50XHJcbiAgICBjb25zdCBnYW1lTGF1bmNoZWRFdmVudDogR2FtZUxhdW5jaGVkRXZlbnQgPSB7XHJcbiAgICAgIC4uLnRoaXMuX3J1bm5pbmdHYW1lLFxyXG4gICAgICBmcmVzaExhdW5jaCxcclxuICAgIH07XHJcbiAgICAvLyBFbWl0IHRoZSBgZ2FtZUxhdW5jaGVkYCBldmVudFxyXG4gICAgdGhpcy5lbWl0KCdnYW1lTGF1bmNoZWQnLCBnYW1lTGF1bmNoZWRFdmVudCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSYW4gd2hlbiBhIGdhbWUgd2FzIGNsb3NlZFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBmdWxsU2h1dGRvd24gLSBJcyB0aGlzIGEgZnVsbCBzaHV0ZG93biBvciBub3Q/XHJcbiAgICpcclxuICAgKiAqQWx0ZXJuYXRpdmVseSAtIGRpZCB0aGUgZ2FtZSBzZXNzaW9uIGVuZCwgb3IgZGlkIHRoZSBnYW1lIHNpbXBseSBjaGFuZ2U/KlxyXG4gICAqL1xyXG4gIHByaXZhdGUgZ2FtZUNsb3NlZChmdWxsU2h1dGRvd246IGJvb2xlYW4pIHtcclxuICAgIC8vIEVuc3VyZSB0aGF0IHRoZXJlIGlzIGEgZ2FtZSBydW5uaW5nIGJlZm9yZSBydW5uaW5nIGBnYW1lQ2xvc2VkYCBsb2dpY1xyXG4gICAgaWYgKCF0aGlzLl9ydW5uaW5nR2FtZSlcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICdDYW5ub3QgcnVuIGBnYW1lQ2xvc2VkYCB3aGVuIG5vIGdhbWUgaXMgY3VycmVudGx5IHJ1bm5pbmchJyxcclxuICAgICAgKTtcclxuXHJcbiAgICAvLyBDb25zdHJ1Y3QgdGhlIGBnYW1lQ2xvc2VkYCBldmVudFxyXG4gICAgY29uc3QgZ2FtZUNsb3NlZEV2ZW50OiBHYW1lQ2xvc2VkRXZlbnQgPSB7XHJcbiAgICAgIC4uLnRoaXMuX3J1bm5pbmdHYW1lLFxyXG4gICAgfTtcclxuICAgIC8vIERlbGV0ZSB0aGUgY3VycmVudGx5IHJ1bm5pbmcgZ2FtZVxyXG4gICAgdGhpcy5fcnVubmluZ0dhbWUgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgLy8gRW1pdCB0aGUgYGdhbWVDbG9zZWRgIGV2ZW50XHJcbiAgICB0aGlzLmVtaXQoJ2dhbWVDbG9zZWQnLCBnYW1lQ2xvc2VkRXZlbnQpO1xyXG5cclxuICAgIC8vIElmIHBvc3QtZ2FtZSBsb2dpYyBzaG91bGQgcnVuLCBlbWl0IHRoZSBgcG9zdGdhbWVgIGV2ZW50XHJcbiAgICBpZiAoZnVsbFNodXRkb3duKSB7XHJcbiAgICAgIC8vIENvbnN0cnVjdCB0aGUgYHBvc3RHYW1lYCBldmVudFxyXG4gICAgICBjb25zdCBwb3N0R2FtZUV2ZW50OiBQb3N0R2FtZUV2ZW50ID0ge1xyXG4gICAgICAgIC4uLmdhbWVDbG9zZWRFdmVudCxcclxuICAgICAgfTtcclxuICAgICAgLy8gRW1pdCB0aGUgYHBvc3RHYW1lYCBldmVudFxyXG4gICAgICB0aGlzLmVtaXQoJ3Bvc3RHYW1lJywgcG9zdEdhbWVFdmVudCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSYW4gd2hlbiB0aGUgY3VycmVudGx5IGFjdGl2ZSBnYW1lJ3MgR2FtZUluZm8gaXMgdXBkYXRlZFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvdmVyd29sZi5nYW1lcy5HYW1lSW5mb1VwZGF0ZWRFdmVudH0gdXBkYXRlRXZlbnRcclxuICAgKiAtIFRoZSBHYW1lSW5mbyB1cGRhdGVkIGV2ZW50XHJcbiAgICovXHJcbiAgcHJpdmF0ZSBnYW1lVXBkYXRlZCh1cGRhdGVFdmVudDogb3ZlcndvbGYuZ2FtZXMuR2FtZUluZm9VcGRhdGVkRXZlbnQpIHtcclxuICAgIC8qKlxyXG4gICAgICogRGlkIGEgbmV3IGdhbWUganVzdCBnZXQgbGF1bmNoZWQ/XHJcbiAgICAgKlxyXG4gICAgICogVGhpcyBjb3VsZCB0ZWNobmljYWxseSBiZSBkb25lIHVzaW5nIGBvdmVyd29sZi5nYW1lcy5vbkdhbWVMYXVuY2hlZGAuXHJcbiAgICAgKiBIb3dldmVyLCBhcyB3ZSBhbHJlYWR5IG5lZWQgdG8gdXRpbGl6ZSBgb3ZlcndvbGYuZ2FtZXMub25HYW1lSW5mb1VwZGF0ZWRgXHJcbiAgICAgKiB0byBkZXRlY3QgaWYgYSBnYW1lIHdhcyB0ZXJtaW5hdGVkLCBpdCBpcyBlYXNpZXIgdG8ganVzdCB1c2UgaXQgZm9yIGJvdGguXHJcbiAgICAgKi9cclxuICAgIGlmIChcclxuICAgICAgdXBkYXRlRXZlbnQucmVhc29uLmluY2x1ZGVzKFxyXG4gICAgICAgIG92ZXJ3b2xmLmdhbWVzLmVudW1zLkdhbWVJbmZvQ2hhbmdlUmVhc29uLkdhbWVMYXVuY2hlZCxcclxuICAgICAgKVxyXG4gICAgKSB7XHJcbiAgICAgIC8vIElzIHRoZXJlIGEgZ2FtZSBhbHJlYWR5IHJ1bm5pbmc/XHJcbiAgICAgIGlmICh0aGlzLl9ydW5uaW5nR2FtZSkge1xyXG4gICAgICAgIC8vIFJ1biBnYW1lIGNsb3NlZCBjbGVhbnVwLCB3aXRob3V0IHJ1bm5pbmcgcG9zdC1nYW1lIGxvZ2ljXHJcbiAgICAgICAgdGhpcy5nYW1lQ2xvc2VkKGZhbHNlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyogUnVuIGdhbWUgbGF1bmNoZWQgbG9naWMgZm9yIHRoZSBuZXcgbGF1bmNoZWQgZ2FtZSwgYXMgYSBmcmVzaCBsYXVuY2gsXHJcbiAgICAgICAqIGFzIGl0IHdhcyBkZXRlY3RlZCBmcm9tIHRoZSBtb21lbnQgaXQgd2FzIGxhdW5jaGVkXHJcbiAgICAgICAqL1xyXG4gICAgICB0aGlzLmdhbWVMYXVuY2hlZChcclxuICAgICAgICB1cGRhdGVFdmVudC5nYW1lSW5mbyBhcyBvdmVyd29sZi5nYW1lcy5SdW5uaW5nR2FtZUluZm8sXHJcbiAgICAgICAgdHJ1ZSxcclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIC8vIElmIHRoZSBnYW1lIHdhcyB0ZXJtaW5hdGVkXHJcbiAgICBlbHNlIGlmIChcclxuICAgICAgdXBkYXRlRXZlbnQucmVhc29uLmluY2x1ZGVzKFxyXG4gICAgICAgIG92ZXJ3b2xmLmdhbWVzLmVudW1zLkdhbWVJbmZvQ2hhbmdlUmVhc29uLkdhbWVUZXJtaW5hdGVkLFxyXG4gICAgICApXHJcbiAgICApIHtcclxuICAgICAgLy8gUnVuIGdhbWUgY2xvc2VkIGNsZWFudXAsIGluY2x1ZGluZyBwb3N0LWdhbWUgbG9naWNcclxuICAgICAgdGhpcy5nYW1lQ2xvc2VkKHRydWUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0dGVyIGZvciB0aGUgY3VycmVudGx5IGFjdGl2ZSBnYW1lXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyB7bnVtYmVyIHwgdW5kZWZpbmVkfSBUaGUgY3VycmVudGx5IHJ1bm5pbmcgZ2FtZSAoaWYgYW55KVxyXG4gICAqL1xyXG4gIHB1YmxpYyBjdXJyZW50bHlSdW5uaW5nR2FtZSgpOiBSdW5uaW5nR2FtZSB8IHVuZGVmaW5lZCB7XHJcbiAgICByZXR1cm4gdGhpcy5fcnVubmluZ0dhbWU7XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7IGluamVjdGFibGUgfSBmcm9tICd0c3lyaW5nZSc7XHJcblxyXG5AaW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBHRVBDb25zdW1lciB7XHJcbiAgLyoqXHJcbiAgICogQ29uc3VtZXMgZXJyb3JzIGZpcmVkIGJ5IHRoZSBPdmVyd29sZiBHRVBcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkVycm9yRXZlbnR9IGVycm9yIC0gQSBmaXJlZCBlcnJvciBldmVudFxyXG4gICAqL1xyXG4gIHB1YmxpYyBvbkdFUEVycm9yKGVycm9yOiBvdmVyd29sZi5nYW1lcy5ldmVudHMuRXJyb3JFdmVudCkge1xyXG4gICAgY29uc29sZS5lcnJvcihgR0VQIEVycm9yOiAke3ByZXR0aWZ5KGVycm9yKX1gKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN1bWVzIGdhbWUgaW5mbyB1cGRhdGVzIGZpcmVkIGJ5IHRoZSBPdmVyd29sZiBHRVBcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGVzMkV2ZW50PFxyXG4gICAqICBzdHJpbmcsXHJcbiAgICogIG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlMlxyXG4gICAqID59IGluZm8gLSBBbiBhcnJheSBvZiBmaXJlZCBpbmZvIHVwZGF0ZXNcclxuICAgKi9cclxuICBwdWJsaWMgb25HYW1lSW5mb1VwZGF0ZShcclxuICAgIGluZm86IG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlczJFdmVudDxcclxuICAgICAgc3RyaW5nLFxyXG4gICAgICBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZTJcclxuICAgID4sXHJcbiAgKSB7XHJcbiAgICBjb25zb2xlLmxvZyhgR2FtZSBJbmZvIENoYW5nZWQ6ICR7cHJldHRpZnkoaW5mbyl9YCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdW1lcyB0aGUgZ2FtZSBldmVudHMgZmlyZWQgYnkgdGhlIE92ZXJ3b2xmIEdFUFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvdmVyd29sZi5nYW1lcy5ldmVudHMuTmV3R2FtZUV2ZW50c30gZXZlbnRcclxuICAgKiAtIEFuIGFycmF5IG9mIGZpcmVkIEdhbWUgRXZlbnRzXHJcbiAgICovXHJcbiAgcHVibGljIG9uTmV3R2FtZUV2ZW50KGV2ZW50OiBvdmVyd29sZi5nYW1lcy5ldmVudHMuTmV3R2FtZUV2ZW50cykge1xyXG4gICAgY29uc29sZS5sb2coYEdhbWUgRXZlbnQgRmlyZWQ6ICR7cHJldHRpZnkoZXZlbnQpfWApO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEZvcm1hdC9wcmV0dGlmeSBHRVAgZGF0YSBmb3IgbG9nZ2luZy9kaXNwbGF5XHJcbiAqXHJcbiAqIEBwYXJhbSB7YW55fSBkYXRhIC0gVGhlIGRhdGEgdG8gYmUgcHJldHRpZmllZFxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBBIHByZXR0aWZpZWQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBpbnB1dCBkYXRhXHJcbiAqL1xyXG5jb25zdCBwcmV0dGlmeSA9IChkYXRhOiBhbnkpOiBzdHJpbmcgPT4ge1xyXG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShkYXRhLCB1bmRlZmluZWQsIDQpO1xyXG59O1xyXG4iLCJpbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudHMnO1xyXG5pbXBvcnQgeyBpbmplY3RhYmxlIH0gZnJvbSAndHN5cmluZ2UnO1xyXG5pbXBvcnQgeyBHYW1lRmlsZU5hbWUsIEdhbWVLZXkgfSBmcm9tICcuLi9jb25maWcvZ2FtZS1kYXRhJztcclxuaW1wb3J0IHsgZW52aXJvbm1lbnQgfSBmcm9tICcuLi9lbnZpcm9ubWVudC9lbnZpcm9ubWVudCc7XHJcblxyXG5AaW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBHRVBTZXJ2aWNlIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuICBwcml2YXRlIGV2ZW50czogYW55ID0gW107XHJcbiAgcHJpdmF0ZSBpbmZvOiBhbnkgPSBbXTtcclxuICBwdWJsaWMgZ2FtZUxhdW5jaElkOiBudWxsIHwgbnVtYmVyID0gbnVsbDtcclxuXHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gICAgdGhpcy5vbkVycm9yTGlzdGVuZXIgPSB0aGlzLm9uRXJyb3JMaXN0ZW5lci5iaW5kKHRoaXMpO1xyXG4gICAgdGhpcy5vbkluZm9VcGRhdGVMaXN0ZW5lciA9IHRoaXMub25JbmZvVXBkYXRlTGlzdGVuZXIuYmluZCh0aGlzKTtcclxuICAgIHRoaXMub25HYW1lRXZlbnRMaXN0ZW5lciA9IHRoaXMub25HYW1lRXZlbnRMaXN0ZW5lci5iaW5kKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2F2ZSBkYXRhIHRvIGRiXHJcbiAgICpcclxuICAgKi9cclxuXHJcbiAgYXN5bmMgc2F2ZVRvRGF0YUJhc2UoKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBmaWxlTmFtZSA9IEdhbWVGaWxlTmFtZVt0aGlzLmdhbWVMYXVuY2hJZCBhcyBrZXlvZiB0eXBlb2YgR2FtZUZpbGVOYW1lXTtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChlbnZpcm9ubWVudC51cmwsIHtcclxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgZGF0YTogeyBldmVudHM6IHRoaXMuZXZlbnRzLCBpbmZvOiB0aGlzLmluZm8sIGZpbGVOYW1lOiBmaWxlTmFtZSB8fCBudWxsICB9LFxyXG4gICAgICAgIH0pLFxyXG4gICAgICB9KTtcclxuICAgICAgdGhpcy5ldmVudHMgPSBbXTtcclxuICAgICAgdGhpcy5pbmZvID0gW107XHJcblxyXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc2F2aW5nIHRvIGRhdGFiYXNlOicsIHJlc3BvbnNlLnN0YXR1c1RleHQpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnRGF0YSBzYXZlZCB0byBkYXRhYmFzZTonLCByZXN1bHQpO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzID0gW107XHJcbiAgICAgIHRoaXMuaW5mbyA9IFtdO1xyXG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvcjonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN1bWVzIHRoZSBnYW1lIGV2ZW50cyBmaXJlZCBieSB0aGUgT3ZlcndvbGYgR0VQXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzfSBldmVudFxyXG4gICAqIC0gQW4gYXJyYXkgb2YgZmlyZWQgR2FtZSBFdmVudHNcclxuICAgKi9cclxuICBwdWJsaWMgb25OZXdHYW1lRXZlbnQoZXZlbnQ6IG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzKSB7XHJcbiAgICBzd2l0Y2ggKHRoaXMuZ2FtZUxhdW5jaElkKSB7XHJcbiAgICAgIGNhc2UgR2FtZUtleS5BcGV4TGVnZW5kczpcclxuICAgICAgICB0aGlzLmhhbmRsZUFwZXhMZWdlbmRzRXZlbnRzKGV2ZW50KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBHYW1lS2V5LlJvY2tldExlYWd1ZTpcclxuICAgICAgICB0aGlzLmhhbmRsZVJvY2tldExlYWd1ZUV2ZW50cyhldmVudCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgR2FtZUtleS5Gb3J0bml0ZTpcclxuICAgICAgICB0aGlzLmhhbmRsZUZvcnRuaXRlRXZlbnRzKGV2ZW50KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBHYW1lS2V5LlZhbG9yYW50OlxyXG4gICAgICAgIHRoaXMuaGFuZGxlVmFsb3JhbnRFdmVudHMoZXZlbnQpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEdhbWVLZXkuTGVhZ3VlT2ZMZWdlbmRzOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlTGVhZ3VlT2ZMZWdlbmRzRXZlbnRzKGV2ZW50KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBHYW1lS2V5LlBVQkc6XHJcbiAgICAgICAgdGhpcy5oYW5kbGVQVUJHRXZlbnRzKGV2ZW50KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBHYW1lS2V5LkNTMjpcclxuICAgICAgICB0aGlzLmhhbmRsZUNTMkV2ZW50cyhldmVudCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25zdW1lcyBnYW1lIGluZm8gdXBkYXRlcyBmaXJlZCBieSB0aGUgT3ZlcndvbGYgR0VQXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlczJFdmVudDxcclxuICAgKiAgc3RyaW5nLFxyXG4gICAqICBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZTJcclxuICAgKiA+fSBpbmZvIC0gQW4gYXJyYXkgb2YgZmlyZWQgaW5mbyB1cGRhdGVzXHJcbiAgICovXHJcbiAgcHVibGljIG9uR2FtZUluZm9VcGRhdGUoXHJcbiAgICBpbmZvOiBvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZXMyRXZlbnQ8XHJcbiAgICAgIHN0cmluZyxcclxuICAgICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGUyXHJcbiAgICA+LFxyXG4gICkge1xyXG4gICAgaWYgKCFpbmZvLmluZm8pIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHN3aXRjaCAodGhpcy5nYW1lTGF1bmNoSWQpIHtcclxuICAgICAgY2FzZSBHYW1lS2V5LlJvY2tldExlYWd1ZTpcclxuICAgICAgICB0aGlzLmhhbmRsZVJvY2tldExlYWd1ZUluZm8oaW5mbyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgR2FtZUtleS5Gb3J0bml0ZTpcclxuICAgICAgICB0aGlzLmhhbmRsZUZvcnRuaXRlSW5mbyhpbmZvKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBHYW1lS2V5LlZhbG9yYW50OlxyXG4gICAgICAgIHRoaXMuaGFuZGxlVmFsb3JhbnRJbmZvKGluZm8pO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIEdhbWVLZXkuTGVhZ3VlT2ZMZWdlbmRzOlxyXG4gICAgICAgIHRoaXMuaGFuZGxlTGVhZ3VlT2ZMZWdlbmRzSW5mbyhpbmZvKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBHYW1lS2V5LlBVQkc6XHJcbiAgICAgICAgdGhpcy5oYW5kbGVQVUJHSW5mbyhpbmZvKTtcclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZSBBcGV4IExlZ2VuZHMgZXZlbnRzIGZpcmVkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzfSBldmVudFxyXG4gICAqIC0gQW4gYXJyYXkgb2YgZmlyZWQgR2FtZSBFdmVudHNcclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZUFwZXhMZWdlbmRzRXZlbnRzKFxyXG4gICAgZXZlbnQ6IG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzLFxyXG4gICk6IHZvaWQge1xyXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1sZW5cclxuICAgIGNvbnN0IGtpbGxGZWVkRXZlbnQgPSBldmVudC5ldmVudHMuZmluZChcclxuICAgICAgKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ2tpbGxfZmVlZCcsXHJcbiAgICApO1xyXG4gICAgaWYgKGtpbGxGZWVkRXZlbnQpIHtcclxuICAgICAgY29uc3Qga2lsbEZlZWRFdmVudERhdGFQYXJzZWQgPSBKU09OLnBhcnNlKGtpbGxGZWVkRXZlbnQuZGF0YSk7XHJcbiAgICAgIGNvbnN0IHJlc3VsdERhdGEgPSB7XHJcbiAgICAgICAgbG9jYWxfcGxheWVyX25hbWU6IGtpbGxGZWVkRXZlbnREYXRhUGFyc2VkLmxvY2FsX3BsYXllcl9uYW1lLFxyXG4gICAgICAgIHZpY3RpbU5hbWU6IGtpbGxGZWVkRXZlbnREYXRhUGFyc2VkLnZpY3RpbU5hbWUsXHJcbiAgICAgICAgYWN0aW9uOiBraWxsRmVlZEV2ZW50RGF0YVBhcnNlZC5hY3Rpb24sXHJcbiAgICAgIH07XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2gocmVzdWx0RGF0YSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaEVuZEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoXHJcbiAgICAgIChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdtYXRjaF9lbmQnLFxyXG4gICAgKTtcclxuICAgIGlmIChtYXRjaEVuZEV2ZW50ICYmIHRoaXMuZXZlbnRzLmxlbmd0aCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKHsgbmFtZTogbWF0Y2hFbmRFdmVudC5uYW1lLCBkYXRhOiB7IGRhdGU6IG5ldyBEYXRlKCkgfSB9KTtcclxuICAgICAgdGhpcy5zYXZlVG9EYXRhQmFzZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlIFJvY2tldCBMZWFndWUgZXZlbnRzIGZpcmVkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzfSBldmVudFxyXG4gICAqIC0gQW4gYXJyYXkgb2YgZmlyZWQgR2FtZSBFdmVudHNcclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZVJvY2tldExlYWd1ZUV2ZW50cyhcclxuICAgIGV2ZW50OiBvdmVyd29sZi5nYW1lcy5ldmVudHMuTmV3R2FtZUV2ZW50cyxcclxuICApOiB2b2lkIHtcclxuICAgIGNvbnN0IGdvYWxFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdnb2FsJyk7XHJcbiAgICBpZiAoZ29hbEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goZ29hbEV2ZW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNjb3JlRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnc2NvcmUnKTtcclxuICAgIGlmIChzY29yZUV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goc2NvcmVFdmVudCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaEVuZEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ21hdGNoRW5kJyk7XHJcbiAgICBpZiAobWF0Y2hFbmRFdmVudCAmJiAodGhpcy5pbmZvLmxlbmd0aCB8fCB0aGlzLmV2ZW50cy5sZW5ndGgpKSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goeyBuYW1lOiBtYXRjaEVuZEV2ZW50Lm5hbWUsIGRhdGE6IHsgZGF0ZTogbmV3IERhdGUoKSB9IH0pO1xyXG4gICAgICB0aGlzLnNhdmVUb0RhdGFCYXNlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGUgUm9ja2V0IExlYWd1ZSBpbmZvIHVwZGF0ZXNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGVzMkV2ZW50PFxyXG4gICAqICBzdHJpbmcsXHJcbiAgICogIG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlMlxyXG4gICAqID59IGluZm8gLSBBbiBhcnJheSBvZiBmaXJlZCBpbmZvIHVwZGF0ZXNcclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZVJvY2tldExlYWd1ZUluZm8oaW5mbzogYW55KSB7XHJcbiAgICBpZiAoXHJcbiAgICAgIGluZm8uaW5mby5tYXRjaFN0YXRlICYmXHJcbiAgICAgIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoaW5mby5pbmZvLm1hdGNoU3RhdGUsICdzdGFydGVkJykgfHxcclxuICAgICAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoaW5mby5pbmZvLm1hdGNoU3RhdGUsICdlbmRlZCcpKVxyXG4gICAgKSB7XHJcbiAgICAgIHRoaXMuaW5mby5wdXNoKHsgbWF0Y2hTdGF0ZTogaW5mby5pbmZvLm1hdGNoU3RhdGUsIGRhdGE6IHsgZGF0ZTogbmV3IERhdGUoKSB9IH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpbmZvLmluZm8ucGxheWVyc0luZm8pIHtcclxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGFycmF5LWNhbGxiYWNrLXJldHVyblxyXG4gICAgICBPYmplY3Qua2V5cyhpbmZvLmluZm8ucGxheWVyc0luZm8pLm1hcCgoaXRlbSkgPT4ge1xyXG4gICAgICAgIGlmIChpdGVtLm1hdGNoKC9wbGF5ZXIoWzAtOV0rKS9naSkpIHtcclxuICAgICAgICAgIHRoaXMuaW5mby5wdXNoKGluZm8uaW5mbyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZSBGb3J0bml0ZSBldmVudHMgZmlyZWRcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHN9IGV2ZW50XHJcbiAgICogLSBBbiBhcnJheSBvZiBmaXJlZCBHYW1lIEV2ZW50c1xyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlRm9ydG5pdGVFdmVudHMoXHJcbiAgICBldmVudDogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHMsXHJcbiAgKTogdm9pZCB7XHJcbiAgICBjb25zdCBraWxsZWRFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdraWxsZWQnKTtcclxuICAgIGlmIChraWxsZWRFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKGtpbGxlZEV2ZW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRlYXRoRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnZGVhdGgnKTtcclxuICAgIGlmIChkZWF0aEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goZGVhdGhFdmVudCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaFN0YXJ0RXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnbWF0Y2hTdGFydCcpO1xyXG4gICAgaWYgKG1hdGNoU3RhcnRFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKHsgbmFtZTogbWF0Y2hTdGFydEV2ZW50Lm5hbWUsIGRhdGE6IHsgZGF0ZTogbmV3IERhdGUoKSB9IH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWF0Y2hFbmRFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdtYXRjaEVuZCcpO1xyXG4gICAgaWYgKG1hdGNoRW5kRXZlbnQgJiYgKHRoaXMuaW5mby5sZW5ndGggfHwgdGhpcy5ldmVudHMubGVuZ3RoKSkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKHsgbmFtZTogbWF0Y2hFbmRFdmVudC5uYW1lLCBkYXRhOiB7IGRhdGU6IG5ldyBEYXRlKCkgfSB9KTtcclxuICAgICAgdGhpcy5zYXZlVG9EYXRhQmFzZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlIEZvcnRuaXRlIGluZm8gdXBkYXRlc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZXMyRXZlbnQ8XHJcbiAgICogIHN0cmluZyxcclxuICAgKiAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGUyXHJcbiAgICogPn0gaW5mbyAtIEFuIGFycmF5IG9mIGZpcmVkIGluZm8gdXBkYXRlc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlRm9ydG5pdGVJbmZvKGluZm86IGFueSkge1xyXG4gICAgaWYgKFxyXG4gICAgICBpbmZvLmluZm8ubWF0Y2hfaW5mbyAmJlxyXG4gICAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoaW5mby5pbmZvLm1hdGNoX2luZm8sICdyYW5rJylcclxuICAgICkge1xyXG4gICAgICB0aGlzLmluZm8ucHVzaChpbmZvLmluZm8pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlIFZhbG9yYW50IGV2ZW50cyBmaXJlZFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvdmVyd29sZi5nYW1lcy5ldmVudHMuTmV3R2FtZUV2ZW50c30gZXZlbnRcclxuICAgKiAtIEFuIGFycmF5IG9mIGZpcmVkIEdhbWUgRXZlbnRzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYW5kbGVWYWxvcmFudEV2ZW50cyhcclxuICAgICAgZXZlbnQ6IG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzLFxyXG4gICk6IHZvaWQge1xyXG4gICAgY29uc3QgbWF0Y2hTdGFydEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ21hdGNoX3N0YXJ0Jyk7XHJcbiAgICBpZiAobWF0Y2hTdGFydEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goeyBuYW1lOiBtYXRjaFN0YXJ0RXZlbnQubmFtZSwgZGF0YTogeyBkYXRlOiBuZXcgRGF0ZSgpIH0gfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaEVuZEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ21hdGNoX2VuZCcpO1xyXG4gICAgaWYgKG1hdGNoRW5kRXZlbnQgJiYgKHRoaXMuaW5mby5sZW5ndGggfHwgdGhpcy5ldmVudHMubGVuZ3RoKSkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKHsgbmFtZTogbWF0Y2hFbmRFdmVudC5uYW1lLCBkYXRhOiB7IGRhdGU6IG5ldyBEYXRlKCkgfSB9KTtcclxuICAgICAgdGhpcy5zYXZlVG9EYXRhQmFzZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlIFZhbG9yYW50IGluZm8gdXBkYXRlc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZXMyRXZlbnQ8XHJcbiAgICogIHN0cmluZyxcclxuICAgKiAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGUyXHJcbiAgICogPn0gaW5mbyAtIEFuIGFycmF5IG9mIGZpcmVkIGluZm8gdXBkYXRlc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlVmFsb3JhbnRJbmZvKGluZm86IGFueSkge1xyXG4gICAgaWYgKFxyXG4gICAgICAgIGluZm8uaW5mby5tYXRjaF9pbmZvICYmXHJcbiAgICAgICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGluZm8uaW5mby5tYXRjaF9pbmZvLCAna2lsbF9mZWVkJylcclxuICAgICkge1xyXG4gICAgICB0aGlzLmluZm8ucHVzaChpbmZvLmluZm8pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlIExlYWd1ZSBvZiBMZWdlbmRzIGV2ZW50cyBmaXJlZFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvdmVyd29sZi5nYW1lcy5ldmVudHMuTmV3R2FtZUV2ZW50c30gZXZlbnRcclxuICAgKiAtIEFuIGFycmF5IG9mIGZpcmVkIEdhbWUgRXZlbnRzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYW5kbGVMZWFndWVPZkxlZ2VuZHNFdmVudHMoXHJcbiAgICAgIGV2ZW50OiBvdmVyd29sZi5nYW1lcy5ldmVudHMuTmV3R2FtZUV2ZW50cyxcclxuICApOiB2b2lkIHtcclxuICAgIGNvbnN0IGtpbGxFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdraWxsJyk7XHJcbiAgICBpZiAoa2lsbEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goa2lsbEV2ZW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRlYXRoRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnZGVhdGgnKTtcclxuICAgIGlmIChkZWF0aEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goZGVhdGhFdmVudCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaEVuZEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoXHJcbiAgICAgIChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdhbm5vdW5jZXInLFxyXG4gICAgKTtcclxuICAgIGlmIChcclxuICAgICAgbWF0Y2hFbmRFdmVudCAmJlxyXG4gICAgICAodGhpcy5pbmZvLmxlbmd0aCB8fCB0aGlzLmV2ZW50cy5sZW5ndGgpICYmXHJcbiAgICAgIChtYXRjaEVuZEV2ZW50LmRhdGEuaW5jbHVkZXMoJ3ZpY3RvcnknKSB8fFxyXG4gICAgICAgIG1hdGNoRW5kRXZlbnQuZGF0YS5pbmNsdWRlcygnZGVmZWF0JykpXHJcbiAgICApIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaChtYXRjaEVuZEV2ZW50KTtcclxuICAgICAgdGhpcy5zYXZlVG9EYXRhQmFzZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlIExlYWd1ZSBvZiBMZWdlbmRzIGluZm8gdXBkYXRlc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvdmVyd29sZi5nYW1lcy5ldmVudHMuSW5mb1VwZGF0ZXMyRXZlbnQ8XHJcbiAgICogIHN0cmluZyxcclxuICAgKiAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGUyXHJcbiAgICogPn0gaW5mbyAtIEFuIGFycmF5IG9mIGZpcmVkIGluZm8gdXBkYXRlc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgaGFuZGxlTGVhZ3VlT2ZMZWdlbmRzSW5mbyhpbmZvOiBhbnkpIHtcclxuICAgIGlmIChcclxuICAgICAgICBpbmZvLmluZm8ubGl2ZV9jbGllbnRfZGF0YSAmJlxyXG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBtYXgtbGVuXHJcbiAgICAgICAgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChpbmZvLmluZm8ubGl2ZV9jbGllbnRfZGF0YSwgJ2FsbF9wbGF5ZXJzJykpXHJcbiAgICApIHtcclxuICAgICAgdGhpcy5pbmZvLnB1c2goaW5mby5pbmZvKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZSBQVUJHIGV2ZW50cyBmaXJlZFxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvdmVyd29sZi5nYW1lcy5ldmVudHMuTmV3R2FtZUV2ZW50c30gZXZlbnRcclxuICAgKiAtIEFuIGFycmF5IG9mIGZpcmVkIEdhbWUgRXZlbnRzXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBoYW5kbGVQVUJHRXZlbnRzKFxyXG4gICAgICBldmVudDogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLk5ld0dhbWVFdmVudHMsXHJcbiAgKTogdm9pZCB7XHJcbiAgICBjb25zdCBraWxsRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAna2lsbCcpO1xyXG4gICAgaWYgKGtpbGxFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKGtpbGxFdmVudCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBraWxsZXJFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdraWxsZXInKTtcclxuICAgIGlmIChraWxsZXJFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKGtpbGxlckV2ZW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRlYXRoRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnZGVhdGgnKTtcclxuICAgIGlmIChkZWF0aEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goZGVhdGhFdmVudCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaFN0YXJ0RXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnbWF0Y2hTdGFydCcpO1xyXG4gICAgaWYgKG1hdGNoU3RhcnRFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKHsgbmFtZTogbWF0Y2hTdGFydEV2ZW50Lm5hbWUsIGRhdGE6IHsgZGF0ZTogbmV3IERhdGUoKSB9IH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWF0Y2hTdW1tYXJ5RXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAnbWF0Y2hTdW1tYXJ5Jyk7XHJcbiAgICBpZiAobWF0Y2hTdW1tYXJ5RXZlbnQpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaChtYXRjaFN1bW1hcnlFdmVudCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaEVuZEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ21hdGNoRW5kJyk7XHJcbiAgICBpZiAobWF0Y2hFbmRFdmVudCAmJiAodGhpcy5pbmZvLmxlbmd0aCB8fCB0aGlzLmV2ZW50cy5sZW5ndGgpKSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goeyBuYW1lOiBtYXRjaEVuZEV2ZW50Lm5hbWUsIGRhdGE6IHsgZGF0ZTogbmV3IERhdGUoKSB9IH0pO1xyXG4gICAgICB0aGlzLnNhdmVUb0RhdGFCYXNlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGUgUFVCRyBpbmZvIHVwZGF0ZXNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGVzMkV2ZW50PFxyXG4gICAqICBzdHJpbmcsXHJcbiAgICogIG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlMlxyXG4gICAqID59IGluZm8gLSBBbiBhcnJheSBvZiBmaXJlZCBpbmZvIHVwZGF0ZXNcclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZVBVQkdJbmZvKGluZm86IGFueSkge1xyXG4gICAgaWYgKFxyXG4gICAgICAgIGluZm8uaW5mby5tYXRjaF9pbmZvICYmXHJcbiAgICAgICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGluZm8uaW5mby5tYXRjaF9pbmZvLCAna2lsbHMnKSB8fFxyXG4gICAgICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChpbmZvLmluZm8ubWF0Y2hfaW5mbywgJ2hlYWRzaG90cycpXHJcbiAgICApIHtcclxuICAgICAgdGhpcy5pbmZvLnB1c2goaW5mby5pbmZvKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhhbmRsZSBDUzIgZXZlbnRzIGZpcmVkXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzfSBldmVudFxyXG4gICAqIC0gQW4gYXJyYXkgb2YgZmlyZWQgR2FtZSBFdmVudHNcclxuICAgKi9cclxuICBwcml2YXRlIGhhbmRsZUNTMkV2ZW50cyhcclxuICAgICAgZXZlbnQ6IG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzLFxyXG4gICk6IHZvaWQge1xyXG4gICAgY29uc3Qga2lsbEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ2tpbGwnKTtcclxuICAgIGlmIChraWxsRXZlbnQpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaChraWxsRXZlbnQpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGVhdGhFdmVudCA9IGV2ZW50LmV2ZW50cy5maW5kKChpdGVtKSA9PiBpdGVtLm5hbWUgPT09ICdkZWF0aCcpO1xyXG4gICAgaWYgKGRlYXRoRXZlbnQpIHtcclxuICAgICAgdGhpcy5ldmVudHMucHVzaChkZWF0aEV2ZW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGtpbGxGZWVkRXZlbnQgPSBldmVudC5ldmVudHMuZmluZCgoaXRlbSkgPT4gaXRlbS5uYW1lID09PSAna2lsbF9mZWVkJyk7XHJcbiAgICBpZiAoa2lsbEZlZWRFdmVudCkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKGtpbGxGZWVkRXZlbnQpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbWF0Y2hTdGFydEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ21hdGNoX3N0YXJ0Jyk7XHJcbiAgICBpZiAobWF0Y2hTdGFydEV2ZW50KSB7XHJcbiAgICAgIHRoaXMuZXZlbnRzLnB1c2goeyBuYW1lOiBtYXRjaFN0YXJ0RXZlbnQubmFtZSwgZGF0YTogeyBkYXRlOiBuZXcgRGF0ZSgpIH0gfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtYXRjaEVuZEV2ZW50ID0gZXZlbnQuZXZlbnRzLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubmFtZSA9PT0gJ21hdGNoX2VuZCcpO1xyXG4gICAgaWYgKG1hdGNoRW5kRXZlbnQgJiYgKHRoaXMuaW5mby5sZW5ndGggfHwgdGhpcy5ldmVudHMubGVuZ3RoKSkge1xyXG4gICAgICB0aGlzLmV2ZW50cy5wdXNoKHsgbmFtZTogbWF0Y2hFbmRFdmVudC5uYW1lLCBkYXRhOiB7IGRhdGU6IG5ldyBEYXRlKCkgfSB9KTtcclxuICAgICAgdGhpcy5zYXZlVG9EYXRhQmFzZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRW1pdCB0aGUgZmlyZWQgT3ZlcndvbGYgR0VQIEVycm9yXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5FcnJvckV2ZW50fSBlcnJvciAtIFRoZSBmaXJlZCBHRVAgZXJyb3JcclxuICAgKi9cclxuICBwcml2YXRlIG9uRXJyb3JMaXN0ZW5lcihlcnJvcjogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkVycm9yRXZlbnQpIHtcclxuICAgIHRoaXMuZW1pdCgnZXJyb3InLCBlcnJvcik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFbWl0IHRoZSBmaXJlZCBPdmVyd29sZiBHYW1lIEluZm8gVXBkYXRlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlczJFdmVudDxcclxuICAgKiBzdHJpbmcsXHJcbiAgICogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGUyXHJcbiAgICogPn0gaW5mbyAtIFRoZSBmaXJlZCBpbmZvIHVwZGF0ZWRcclxuICAgKi9cclxuICBwcml2YXRlIG9uSW5mb1VwZGF0ZUxpc3RlbmVyKFxyXG4gICAgaW5mbzogb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLkluZm9VcGRhdGVzMkV2ZW50PFxyXG4gICAgICBzdHJpbmcsXHJcbiAgICAgIG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5JbmZvVXBkYXRlMlxyXG4gICAgPixcclxuICApIHtcclxuICAgIHRoaXMudHJ5RW1pdCgnaW5mb1VwZGF0ZScsIGluZm8pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRW1pdCB0aGUgZmlyZWQgT3ZlcndvbGYgR2FtZSBFdmVudHMgYXMgZXZlbnRzXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge292ZXJ3b2xmLmdhbWVzLmV2ZW50cy5OZXdHYW1lRXZlbnRzfSBldmVudHMgLSBUaGUgZmlyZWQgZ2FtZSBldmVudHNcclxuICAgKi9cclxuICBwcml2YXRlIG9uR2FtZUV2ZW50TGlzdGVuZXIoZXZlbnRzOiBvdmVyd29sZi5nYW1lcy5ldmVudHMuTmV3R2FtZUV2ZW50cykge1xyXG4gICAgdGhpcy50cnlFbWl0KCdnYW1lRXZlbnQnLCBldmVudHMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQXR0ZW1wdCB0byBlbWl0IGFuIGV2ZW50LlxyXG4gICAqIElmIHRoZXJlIGFyZSBubyBsaXN0ZW5lcnMgZm9yIHRoaXMgZXZlbnQsIGxvZyBpdCBhcyBhIHdhcm5pbmcuKlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50XHJcbiAgICogQHBhcmFtIHthbnl9IHZhbHVlIC0gVGhlIHZhbHVlIG9mIHRoZSBldmVudFxyXG4gICAqL1xyXG4gIHByaXZhdGUgdHJ5RW1pdChldmVudDogc3RyaW5nLCB2YWx1ZTogYW55KSB7XHJcbiAgICBpZiAodGhpcy5saXN0ZW5lckNvdW50KGV2ZW50KSkge1xyXG4gICAgICB0aGlzLmVtaXQoZXZlbnQsIHZhbHVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUud2FybihgVW5oYW5kbGVkICR7ZXZlbnR9LCB3aXRoIHZhbHVlICR7dmFsdWV9YCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIYW5kbGVzIGFsbCBHRVAtcmVsYXRlZCBsb2dpYyB3aGVuIGEgZ2FtZSBpcyBsYXVuY2hlZFxyXG4gICAqXHJcbiAgICogSXQgaXMgcG9zc2libGUgdG8gcmVnaXN0ZXIgYWxsIGxpc3RlbmVycyBvbmNlIHdoZW4gc3RhcnRpbmcgdGhlIGFwcCwgYW5kXHJcbiAgICogdGhlbiBvbmx5IGRlLXJlZ2lzdGVyIHRoZW0gd2hlbiBjbG9zaW5nIHRoZSBhcHAgKGlmIGF0IGFsbCkuIFdlIGNob29zZVxyXG4gICAqIHRvIHJlZ2lzdGVyL2RlcmVnaXN0ZXIgdGhlbSBmb3IgZXZlcnkgZ2FtZSwgbW9zdGx5IGp1c3QgdG8gc2hvdyBob3cuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ1tdIHwgdW5kZWZpbmVkfSByZXF1aXJlZEZlYXR1cmVzXHJcbiAgICogLSBPcHRpb25hbCBsaXN0IG9mIHJlcXVpcmVkIGZlYXR1cmVzLiBJZ25vcmVkIGlmIHRoaXMgaXMgYSBHRVAgU0RLIGdhbWVcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmdbXSB8IHVuZGVmaW5lZD59XHJcbiAgICogQSBwcm9taXNlIHJlc29sdmluZyB0byB0aGUgZmVhdHVyZXMgdGhhdCB3ZXJlIHN1Y2Nlc3NmdWxseSBzZXQsXHJcbiAgICogb3IgdG8gbm90aGluZyBpZiB0aGlzIGlzIGEgR0VQIFNESyBnYW1lXHJcbiAgICogQHRocm93cyBFcnJvciBpZiBzZXR0aW5nIHRoZSByZXF1aXJlZCBmZWF0dXJlcyBmYWlsZWQgdG9vIG1hbnkgdGltZXNcclxuICAgKiAobmF0aXZlIEdFUCBvbmx5KVxyXG4gICAqL1xyXG4gIHB1YmxpYyBhc3luYyBvbkdhbWVMYXVuY2hlZChcclxuICAgIHJlcXVpcmVkRmVhdHVyZXM/OiBzdHJpbmdbXSxcclxuICApOiBQcm9taXNlPHN0cmluZ1tdIHwgdW5kZWZpbmVkPiB7XHJcbiAgICBjb25zb2xlLmxvZygnUmVnaXN0ZXJpbmcgR0VQIGxpc3RlbmVycycpO1xyXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50cygpO1xyXG4gICAgaWYgKHJlcXVpcmVkRmVhdHVyZXMpIHtcclxuICAgICAgY29uc29sZS5sb2coJ1JlZ2lzdGVyaW5nIHJlcXVpcmVkIGZlYXR1cmVzJyk7XHJcbiAgICAgIHJldHVybiB0aGlzLnNldFJlcXVpcmVkRmVhdHVyZXMocmVxdWlyZWRGZWF0dXJlcywgMTApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdHRVAgU0RLIGRldGVjdGVkLCBubyBuZWVkIHRvIHNldCByZXF1aXJlZCBmZWF0dXJlcycpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUnVuIGNsZWFudXAgbG9naWMgZm9yIHdoZW4gYSBnYW1lIHdhcyBjbG9zZWRcclxuICAgKi9cclxuICBwdWJsaWMgb25HYW1lQ2xvc2VkKCkge1xyXG4gICAgY29uc29sZS5sb2coJ1JlbW92aW5nIGFsbCBHRVAgbGlzdGVuZXJzJyk7XHJcbiAgICB0aGlzLnVucmVnaXN0ZXJFdmVudHMoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgcmVxdWlyZWQgZmVhdHVyZXMgZm9yIHRoZSBjdXJyZW50IGdhbWVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHJlcXVpcmVkRmVhdHVyZXNcclxuICAgKiAtIEFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIHJlcXVpcmVkIGZlYXR1cmVzIGZvciB0aGlzIGdhbWVcclxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4aW11bVJldHJpZXNcclxuICAgKiAtIFRoZSBtYXhpbXVtIGFtb3VudCBvZiBhdHRlbXB0cyBiZWZvcmUgZ2l2aW5nIHVwIG9uIHNldHRpbmdcclxuICAgKiB0aGUgcmVxdWlyZWQgZmVhdHVyZXNcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmdbXT59XHJcbiAgICogQSBwcm9taXNlIHJlc29sdmluZyB0byB0aGUgZmVhdHVyZXMgdGhhdCB3ZXJlIHN1Y2Nlc3NmdWxseSBzZXRcclxuICAgKiBAdGhyb3dzIEFuIGVycm9yIGlmIHNldHRpbmcgdGhlIHJlcXVpcmVkIGZlYXR1cmVzIGZhaWxlZCB0b28gbWFueSB0aW1lc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgYXN5bmMgc2V0UmVxdWlyZWRGZWF0dXJlcyhcclxuICAgIHJlcXVpcmVkRmVhdHVyZXM6IHN0cmluZ1tdLFxyXG4gICAgbWF4aW11bVJldHJpZXM6IG51bWJlcixcclxuICApOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1heGltdW1SZXRyaWVzOyBpKyspIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBzdWNjZXNzID0gYXdhaXQgdGhpcy50cnlTZXRSZXF1aXJlZEZlYXR1cmVzKHJlcXVpcmVkRmVhdHVyZXMpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBSZXF1aXJlZCBmZWF0dXJlcyBzZXQ6ICR7c3VjY2Vzc31gKTtcclxuICAgICAgICBpZiAoc3VjY2Vzcy5sZW5ndGggPCByZXF1aXJlZEZlYXR1cmVzLmxlbmd0aClcclxuICAgICAgICAgIGNvbnNvbGUud2FybihcclxuICAgICAgICAgICAgYENvdWxkIG5vdCBzZXQgJHtyZXF1aXJlZEZlYXR1cmVzLmZpbHRlcihcclxuICAgICAgICAgICAgICAoZmVhdHVyZSkgPT4gIXN1Y2Nlc3MuaW5jbHVkZXMoZmVhdHVyZSksXHJcbiAgICAgICAgICAgICl9YCxcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgcmV0dXJuIHN1Y2Nlc3M7XHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oYENvdWxkIG5vdCBzZXQgcmVxdWlyZWQgZmVhdHVyZXM6ICR7SlNPTi5zdHJpbmdpZnkoZSl9YCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1JldHJ5aW5nIGluIDIgc2Vjb25kcycpO1xyXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDIwMDApKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRocm93IG5ldyBFcnJvcignQWJvcnRpbmcgcmVxdWlyZWQgZmVhdHVyZXMhJyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBdHRlbXB0cyB0byBzZXQgdGhlIHJlcXVpcmVkIGZlYXR1cmVzIGZvciB0aGlzIHNwZWNpZmljIGdhbWVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHJlcXVpcmVkRmVhdHVyZXNcclxuICAgKiAtIEFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIHJlcXVpcmVkIGZlYXR1cmVzIGZvciB0aGlzIGdhbWVcclxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmdbXT59XHJcbiAgICogQSBwcm9taXNlIHJlc29sdmluZyB0byB0aGUgZmVhdHVyZXMgdGhhdCB3ZXJlIHN1Y2Nlc3NmdWxseSBzZXRcclxuICAgKiBAdGhyb3dzIHtzdHJpbmd9IFRoZSBlcnJvciBtZXNzYWdlIGdpdmVuIGlmIHRoZSBmZWF0dXJlcyBmYWlsZWQgdG8gYmUgc2V0XHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhc3luYyB0cnlTZXRSZXF1aXJlZEZlYXR1cmVzKFxyXG4gICAgcmVxdWlyZWRGZWF0dXJlczogc3RyaW5nW10sXHJcbiAgKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gICAgbGV0IHJlZ2lzdGVyZWQ6IChyZXN1bHQ6IHN0cmluZ1tdKSA9PiB2b2lkO1xyXG4gICAgbGV0IGZhaWxlZDogKHJlYXNvbjogc3RyaW5nKSA9PiB2b2lkO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhIHByb21pc2UsIGFuZCBzYXZlIGl0cyByZXNvbHZlL3JlamVjdCBjYWxsYmFja3NcclxuICAgIGNvbnN0IHByb21pc2U6IFByb21pc2U8c3RyaW5nW10+ID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICByZWdpc3RlcmVkID0gcmVzb2x2ZTtcclxuICAgICAgZmFpbGVkID0gcmVqZWN0O1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gVHJ5IHRvIHNldCB0aGUgcmVxdWlyZWQgZmVhdHVyZXNcclxuICAgIG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5zZXRSZXF1aXJlZEZlYXR1cmVzKHJlcXVpcmVkRmVhdHVyZXMsIChyZXN1bHQpID0+IHtcclxuICAgICAgLy8gSWYgZmVhdHVyZXMgZmFpbGVkIHRvIGJlIHNldFxyXG4gICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XHJcbiAgICAgICAgLy8gRmFpbCB0aGUgY3VycmVudCBhdHRlbXB0IHdpdGggdGhlIGVycm9yIG1lc3NhZ2VcclxuICAgICAgICByZXR1cm4gZmFpbGVkKHJlc3VsdC5lcnJvciBhcyBzdHJpbmcpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBBcHByb3ZlIHRoZSBjdXJyZW50IGF0dGVtcHQsIGFuZCByZXR1cm4gdGhlIGxpc3Qgb2Ygc2V0IGZlYXR1cmVzXHJcbiAgICAgIHJlZ2lzdGVyZWQocmVzdWx0LnN1cHBvcnRlZEZlYXR1cmVzIGFzIHN0cmluZ1tdKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFJldHVybiB0aGUgZHVtbXkgcHJvbWlzZVxyXG4gICAgcmV0dXJuIHByb21pc2U7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWdpc3RlciBhbGwgR0VQIGxpc3RlbmVyc1xyXG4gICAqL1xyXG4gIHB1YmxpYyByZWdpc3RlckV2ZW50cygpIHtcclxuICAgIC8vIFJlZ2lzdGVyIGVycm9ycyBsaXN0ZW5lclxyXG4gICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLm9uRXJyb3IuYWRkTGlzdGVuZXIodGhpcy5vbkVycm9yTGlzdGVuZXIpO1xyXG5cclxuICAgIC8vIFJlZ2lzdGVyIEluZm8gVXBkYXRlIGxpc3RlbmVyXHJcbiAgICBvdmVyd29sZi5nYW1lcy5ldmVudHMub25JbmZvVXBkYXRlczIuYWRkTGlzdGVuZXIodGhpcy5vbkluZm9VcGRhdGVMaXN0ZW5lcik7XHJcblxyXG4gICAgLy8gUmVnaXN0ZXIgR2FtZSBldmVudCBsaXN0ZW5lclxyXG4gICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLm9uTmV3RXZlbnRzLmFkZExpc3RlbmVyKHRoaXMub25HYW1lRXZlbnRMaXN0ZW5lcik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZS1yZWdpc3RlciBhbGwgR0VQIGxpc3RlbmVyc1xyXG4gICAqL1xyXG4gIHB1YmxpYyB1bnJlZ2lzdGVyRXZlbnRzKCkge1xyXG4gICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLm9uRXJyb3IucmVtb3ZlTGlzdGVuZXIodGhpcy5vbkVycm9yTGlzdGVuZXIpO1xyXG4gICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLm9uSW5mb1VwZGF0ZXMyLnJlbW92ZUxpc3RlbmVyKHRoaXMub25JbmZvVXBkYXRlTGlzdGVuZXIpO1xyXG4gICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLm9uTmV3RXZlbnRzLnJlbW92ZUxpc3RlbmVyKHRoaXMub25HYW1lRXZlbnRMaXN0ZW5lcik7XHJcbiAgfVxyXG59XHJcbiIsIi8qISAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5Db3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cclxuXHJcblBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueVxyXG5wdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQuXHJcblxyXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIXHJcblJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWVxyXG5BTkQgRklUTkVTUy4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUiBCRSBMSUFCTEUgRk9SIEFOWSBTUEVDSUFMLCBESVJFQ1QsXHJcbklORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTVxyXG5MT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUlxyXG5PVEhFUiBUT1JUSU9VUyBBQ1RJT04sIEFSSVNJTkcgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgVVNFIE9SXHJcblBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXHJcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXHJcbi8qIGdsb2JhbCBSZWZsZWN0LCBQcm9taXNlICovXHJcblxyXG52YXIgZXh0ZW5kU3RhdGljcyA9IGZ1bmN0aW9uKGQsIGIpIHtcclxuICAgIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcclxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XHJcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XHJcbiAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4dGVuZHMoZCwgYikge1xyXG4gICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fYXNzaWduID0gZnVuY3Rpb24oKSB7XHJcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gX19hc3NpZ24odCkge1xyXG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpIHRbcF0gPSBzW3BdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdDtcclxuICAgIH1cclxuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZXN0KHMsIGUpIHtcclxuICAgIHZhciB0ID0ge307XHJcbiAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkgJiYgZS5pbmRleE9mKHApIDwgMClcclxuICAgICAgICB0W3BdID0gc1twXTtcclxuICAgIGlmIChzICE9IG51bGwgJiYgdHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgcCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocyk7IGkgPCBwLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChlLmluZGV4T2YocFtpXSkgPCAwICYmIE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChzLCBwW2ldKSlcclxuICAgICAgICAgICAgICAgIHRbcFtpXV0gPSBzW3BbaV1dO1xyXG4gICAgICAgIH1cclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xyXG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XHJcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xyXG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XHJcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cclxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxyXG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19nZW5lcmF0b3IodGhpc0FyZywgYm9keSkge1xyXG4gICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZztcclxuICAgIHJldHVybiBnID0geyBuZXh0OiB2ZXJiKDApLCBcInRocm93XCI6IHZlcmIoMSksIFwicmV0dXJuXCI6IHZlcmIoMikgfSwgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIChnW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLCBnO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RlcChbbiwgdl0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKG9wKSB7XHJcbiAgICAgICAgaWYgKGYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuXCIpO1xyXG4gICAgICAgIHdoaWxlIChfKSB0cnkge1xyXG4gICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSBvcFswXSAmIDIgPyB5W1wicmV0dXJuXCJdIDogb3BbMF0gPyB5W1widGhyb3dcIl0gfHwgKCh0ID0geVtcInJldHVyblwiXSkgJiYgdC5jYWxsKHkpLCAwKSA6IHkubmV4dCkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XHJcbiAgICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbb3BbMF0gJiAyLCB0LnZhbHVlXTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcFswXSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDQ6IF8ubGFiZWwrKzsgcmV0dXJuIHsgdmFsdWU6IG9wWzFdLCBkb25lOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICAgICAgY2FzZSA1OiBfLmxhYmVsKys7IHkgPSBvcFsxXTsgb3AgPSBbMF07IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISh0ID0gXy50cnlzLCB0ID0gdC5sZW5ndGggPiAwICYmIHRbdC5sZW5ndGggLSAxXSkgJiYgKG9wWzBdID09PSA2IHx8IG9wWzBdID09PSAyKSkgeyBfID0gMDsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gNiAmJiBfLmxhYmVsIDwgdFsxXSkgeyBfLmxhYmVsID0gdFsxXTsgdCA9IG9wOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ICYmIF8ubGFiZWwgPCB0WzJdKSB7IF8ubGFiZWwgPSB0WzJdOyBfLm9wcy5wdXNoKG9wKTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7IG9wID0gWzYsIGVdOyB5ID0gMDsgfSBmaW5hbGx5IHsgZiA9IHQgPSAwOyB9XHJcbiAgICAgICAgaWYgKG9wWzBdICYgNSkgdGhyb3cgb3BbMV07IHJldHVybiB7IHZhbHVlOiBvcFswXSA/IG9wWzFdIDogdm9pZCAwLCBkb25lOiB0cnVlIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NyZWF0ZUJpbmRpbmcobywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBvW2syXSA9IG1ba107XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4cG9ydFN0YXIobSwgZXhwb3J0cykge1xyXG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAocCAhPT0gXCJkZWZhdWx0XCIgJiYgIWV4cG9ydHMuaGFzT3duUHJvcGVydHkocCkpIGV4cG9ydHNbcF0gPSBtW3BdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX192YWx1ZXMobykge1xyXG4gICAgdmFyIHMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgU3ltYm9sLml0ZXJhdG9yLCBtID0gcyAmJiBvW3NdLCBpID0gMDtcclxuICAgIGlmIChtKSByZXR1cm4gbS5jYWxsKG8pO1xyXG4gICAgaWYgKG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSByZXR1cm4ge1xyXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKG8gJiYgaSA+PSBvLmxlbmd0aCkgbyA9IHZvaWQgMDtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IG8gJiYgb1tpKytdLCBkb25lOiAhbyB9O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHMgPyBcIk9iamVjdCBpcyBub3QgaXRlcmFibGUuXCIgOiBcIlN5bWJvbC5pdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3JlYWQobywgbikge1xyXG4gICAgdmFyIG0gPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb1tTeW1ib2wuaXRlcmF0b3JdO1xyXG4gICAgaWYgKCFtKSByZXR1cm4gbztcclxuICAgIHZhciBpID0gbS5jYWxsKG8pLCByLCBhciA9IFtdLCBlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB3aGlsZSAoKG4gPT09IHZvaWQgMCB8fCBuLS0gPiAwKSAmJiAhKHIgPSBpLm5leHQoKSkuZG9uZSkgYXIucHVzaChyLnZhbHVlKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlcnJvcikgeyBlID0geyBlcnJvcjogZXJyb3IgfTsgfVxyXG4gICAgZmluYWxseSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHIgJiYgIXIuZG9uZSAmJiAobSA9IGlbXCJyZXR1cm5cIl0pKSBtLmNhbGwoaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkgeyBpZiAoZSkgdGhyb3cgZS5lcnJvcjsgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWQoKSB7XHJcbiAgICBmb3IgKHZhciBhciA9IFtdLCBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKylcclxuICAgICAgICBhciA9IGFyLmNvbmNhdChfX3JlYWQoYXJndW1lbnRzW2ldKSk7XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5cygpIHtcclxuICAgIGZvciAodmFyIHMgPSAwLCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKykgcyArPSBhcmd1bWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgZm9yICh2YXIgciA9IEFycmF5KHMpLCBrID0gMCwgaSA9IDA7IGkgPCBpbDsgaSsrKVxyXG4gICAgICAgIGZvciAodmFyIGEgPSBhcmd1bWVudHNbaV0sIGogPSAwLCBqbCA9IGEubGVuZ3RoOyBqIDwgamw7IGorKywgaysrKVxyXG4gICAgICAgICAgICByW2tdID0gYVtqXTtcclxuICAgIHJldHVybiByO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXQodikge1xyXG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBfX2F3YWl0ID8gKHRoaXMudiA9IHYsIHRoaXMpIDogbmV3IF9fYXdhaXQodik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jR2VuZXJhdG9yKHRoaXNBcmcsIF9hcmd1bWVudHMsIGdlbmVyYXRvcikge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBnID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pLCBpLCBxID0gW107XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaWYgKGdbbl0pIGlbbl0gPSBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKGEsIGIpIHsgcS5wdXNoKFtuLCB2LCBhLCBiXSkgPiAxIHx8IHJlc3VtZShuLCB2KTsgfSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHJlc3VtZShuLCB2KSB7IHRyeSB7IHN0ZXAoZ1tuXSh2KSk7IH0gY2F0Y2ggKGUpIHsgc2V0dGxlKHFbMF1bM10sIGUpOyB9IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAocikgeyByLnZhbHVlIGluc3RhbmNlb2YgX19hd2FpdCA/IFByb21pc2UucmVzb2x2ZShyLnZhbHVlLnYpLnRoZW4oZnVsZmlsbCwgcmVqZWN0KSA6IHNldHRsZShxWzBdWzJdLCByKTsgfVxyXG4gICAgZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkgeyByZXN1bWUoXCJuZXh0XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gcmVqZWN0KHZhbHVlKSB7IHJlc3VtZShcInRocm93XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKGYsIHYpIHsgaWYgKGYodiksIHEuc2hpZnQoKSwgcS5sZW5ndGgpIHJlc3VtZShxWzBdWzBdLCBxWzBdWzFdKTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY0RlbGVnYXRvcihvKSB7XHJcbiAgICB2YXIgaSwgcDtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiwgZnVuY3Rpb24gKGUpIHsgdGhyb3cgZTsgfSksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4sIGYpIHsgaVtuXSA9IG9bbl0gPyBmdW5jdGlvbiAodikgeyByZXR1cm4gKHAgPSAhcCkgPyB7IHZhbHVlOiBfX2F3YWl0KG9bbl0odikpLCBkb25lOiBuID09PSBcInJldHVyblwiIH0gOiBmID8gZih2KSA6IHY7IH0gOiBmOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jVmFsdWVzKG8pIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgbSA9IG9bU3ltYm9sLmFzeW5jSXRlcmF0b3JdLCBpO1xyXG4gICAgcmV0dXJuIG0gPyBtLmNhbGwobykgOiAobyA9IHR5cGVvZiBfX3ZhbHVlcyA9PT0gXCJmdW5jdGlvblwiID8gX192YWx1ZXMobykgOiBvW1N5bWJvbC5pdGVyYXRvcl0oKSwgaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGkpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlbbl0gPSBvW25dICYmIGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IHYgPSBvW25dKHYpLCBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCB2LmRvbmUsIHYudmFsdWUpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgZCwgdikgeyBQcm9taXNlLnJlc29sdmUodikudGhlbihmdW5jdGlvbih2KSB7IHJlc29sdmUoeyB2YWx1ZTogdiwgZG9uZTogZCB9KTsgfSwgcmVqZWN0KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tYWtlVGVtcGxhdGVPYmplY3QoY29va2VkLCByYXcpIHtcclxuICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvb2tlZCwgXCJyYXdcIiwgeyB2YWx1ZTogcmF3IH0pOyB9IGVsc2UgeyBjb29rZWQucmF3ID0gcmF3OyB9XHJcbiAgICByZXR1cm4gY29va2VkO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwobW9kLCBrKSkgcmVzdWx0W2tdID0gbW9kW2tdO1xyXG4gICAgcmVzdWx0LmRlZmF1bHQgPSBtb2Q7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnREZWZhdWx0KG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBkZWZhdWx0OiBtb2QgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRHZXQocmVjZWl2ZXIsIHByaXZhdGVNYXApIHtcclxuICAgIGlmICghcHJpdmF0ZU1hcC5oYXMocmVjZWl2ZXIpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImF0dGVtcHRlZCB0byBnZXQgcHJpdmF0ZSBmaWVsZCBvbiBub24taW5zdGFuY2VcIik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcHJpdmF0ZU1hcC5nZXQocmVjZWl2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgcHJpdmF0ZU1hcCwgdmFsdWUpIHtcclxuICAgIGlmICghcHJpdmF0ZU1hcC5oYXMocmVjZWl2ZXIpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImF0dGVtcHRlZCB0byBzZXQgcHJpdmF0ZSBmaWVsZCBvbiBub24taW5zdGFuY2VcIik7XHJcbiAgICB9XHJcbiAgICBwcml2YXRlTWFwLnNldChyZWNlaXZlciwgdmFsdWUpO1xyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG59XHJcbiIsImltcG9ydCB7IF9fZXh0ZW5kcywgX19yZWFkLCBfX3NwcmVhZCB9IGZyb20gXCJ0c2xpYlwiO1xuaW1wb3J0IHsgZ2V0UGFyYW1JbmZvIH0gZnJvbSBcIi4uL3JlZmxlY3Rpb24taGVscGVyc1wiO1xuaW1wb3J0IHsgaW5zdGFuY2UgYXMgZ2xvYmFsQ29udGFpbmVyIH0gZnJvbSBcIi4uL2RlcGVuZGVuY3ktY29udGFpbmVyXCI7XG5pbXBvcnQgeyBpc1Rva2VuRGVzY3JpcHRvciwgaXNUcmFuc2Zvcm1EZXNjcmlwdG9yIH0gZnJvbSBcIi4uL3Byb3ZpZGVycy9pbmplY3Rpb24tdG9rZW5cIjtcbmltcG9ydCB7IGZvcm1hdEVycm9yQ3RvciB9IGZyb20gXCIuLi9lcnJvci1oZWxwZXJzXCI7XG5mdW5jdGlvbiBhdXRvSW5qZWN0YWJsZSgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICB2YXIgcGFyYW1JbmZvID0gZ2V0UGFyYW1JbmZvKHRhcmdldCk7XG4gICAgICAgIHJldHVybiAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgICAgICAgICAgX19leHRlbmRzKGNsYXNzXzEsIF9zdXBlcik7XG4gICAgICAgICAgICBmdW5jdGlvbiBjbGFzc18xKCkge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnc1tfaV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gX3N1cGVyLmFwcGx5KHRoaXMsIF9fc3ByZWFkKGFyZ3MuY29uY2F0KHBhcmFtSW5mby5zbGljZShhcmdzLmxlbmd0aCkubWFwKGZ1bmN0aW9uICh0eXBlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgX2EsIF9iLCBfYztcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1Rva2VuRGVzY3JpcHRvcih0eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1RyYW5zZm9ybURlc2NyaXB0b3IodHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHR5cGUubXVsdGlwbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gKF9hID0gZ2xvYmFsQ29udGFpbmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlc29sdmUodHlwZS50cmFuc2Zvcm0pKS50cmFuc2Zvcm0uYXBwbHkoX2EsIF9fc3ByZWFkKFtnbG9iYWxDb250YWluZXIucmVzb2x2ZUFsbCh0eXBlLnRva2VuKV0sIHR5cGUudHJhbnNmb3JtQXJncykpIDogKF9iID0gZ2xvYmFsQ29udGFpbmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVzb2x2ZSh0eXBlLnRyYW5zZm9ybSkpLnRyYW5zZm9ybS5hcHBseShfYiwgX19zcHJlYWQoW2dsb2JhbENvbnRhaW5lci5yZXNvbHZlKHR5cGUudG9rZW4pXSwgdHlwZS50cmFuc2Zvcm1BcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHlwZS5tdWx0aXBsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBnbG9iYWxDb250YWluZXIucmVzb2x2ZUFsbCh0eXBlLnRva2VuKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBnbG9iYWxDb250YWluZXIucmVzb2x2ZSh0eXBlLnRva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChpc1RyYW5zZm9ybURlc2NyaXB0b3IodHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKF9jID0gZ2xvYmFsQ29udGFpbmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXNvbHZlKHR5cGUudHJhbnNmb3JtKSkudHJhbnNmb3JtLmFwcGx5KF9jLCBfX3NwcmVhZChbZ2xvYmFsQ29udGFpbmVyLnJlc29sdmUodHlwZS50b2tlbildLCB0eXBlLnRyYW5zZm9ybUFyZ3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBnbG9iYWxDb250YWluZXIucmVzb2x2ZSh0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ0luZGV4ID0gaW5kZXggKyBhcmdzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihmb3JtYXRFcnJvckN0b3IodGFyZ2V0LCBhcmdJbmRleCwgZSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSkpKSkgfHwgdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjbGFzc18xO1xuICAgICAgICB9KHRhcmdldCkpO1xuICAgIH07XG59XG5leHBvcnQgZGVmYXVsdCBhdXRvSW5qZWN0YWJsZTtcbiIsImV4cG9ydCB7IGRlZmF1bHQgYXMgYXV0b0luamVjdGFibGUgfSBmcm9tIFwiLi9hdXRvLWluamVjdGFibGVcIjtcbmV4cG9ydCB7IGRlZmF1bHQgYXMgaW5qZWN0IH0gZnJvbSBcIi4vaW5qZWN0XCI7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGluamVjdGFibGUgfSBmcm9tIFwiLi9pbmplY3RhYmxlXCI7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHJlZ2lzdHJ5IH0gZnJvbSBcIi4vcmVnaXN0cnlcIjtcbmV4cG9ydCB7IGRlZmF1bHQgYXMgc2luZ2xldG9uIH0gZnJvbSBcIi4vc2luZ2xldG9uXCI7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGluamVjdEFsbCB9IGZyb20gXCIuL2luamVjdC1hbGxcIjtcbmV4cG9ydCB7IGRlZmF1bHQgYXMgaW5qZWN0QWxsV2l0aFRyYW5zZm9ybSB9IGZyb20gXCIuL2luamVjdC1hbGwtd2l0aC10cmFuc2Zvcm1cIjtcbmV4cG9ydCB7IGRlZmF1bHQgYXMgaW5qZWN0V2l0aFRyYW5zZm9ybSB9IGZyb20gXCIuL2luamVjdC13aXRoLXRyYW5zZm9ybVwiO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBzY29wZWQgfSBmcm9tIFwiLi9zY29wZWRcIjtcbiIsImltcG9ydCB7IGRlZmluZUluamVjdGlvblRva2VuTWV0YWRhdGEgfSBmcm9tIFwiLi4vcmVmbGVjdGlvbi1oZWxwZXJzXCI7XG5mdW5jdGlvbiBpbmplY3RBbGxXaXRoVHJhbnNmb3JtKHRva2VuLCB0cmFuc2Zvcm1lcikge1xuICAgIHZhciBhcmdzID0gW107XG4gICAgZm9yICh2YXIgX2kgPSAyOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgYXJnc1tfaSAtIDJdID0gYXJndW1lbnRzW19pXTtcbiAgICB9XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICAgIHRva2VuOiB0b2tlbixcbiAgICAgICAgbXVsdGlwbGU6IHRydWUsXG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNmb3JtZXIsXG4gICAgICAgIHRyYW5zZm9ybUFyZ3M6IGFyZ3NcbiAgICB9O1xuICAgIHJldHVybiBkZWZpbmVJbmplY3Rpb25Ub2tlbk1ldGFkYXRhKGRhdGEpO1xufVxuZXhwb3J0IGRlZmF1bHQgaW5qZWN0QWxsV2l0aFRyYW5zZm9ybTtcbiIsImltcG9ydCB7IGRlZmluZUluamVjdGlvblRva2VuTWV0YWRhdGEgfSBmcm9tIFwiLi4vcmVmbGVjdGlvbi1oZWxwZXJzXCI7XG5mdW5jdGlvbiBpbmplY3RBbGwodG9rZW4pIHtcbiAgICB2YXIgZGF0YSA9IHsgdG9rZW46IHRva2VuLCBtdWx0aXBsZTogdHJ1ZSB9O1xuICAgIHJldHVybiBkZWZpbmVJbmplY3Rpb25Ub2tlbk1ldGFkYXRhKGRhdGEpO1xufVxuZXhwb3J0IGRlZmF1bHQgaW5qZWN0QWxsO1xuIiwiaW1wb3J0IHsgZGVmaW5lSW5qZWN0aW9uVG9rZW5NZXRhZGF0YSB9IGZyb20gXCIuLi9yZWZsZWN0aW9uLWhlbHBlcnNcIjtcbmZ1bmN0aW9uIGluamVjdFdpdGhUcmFuc2Zvcm0odG9rZW4sIHRyYW5zZm9ybWVyKSB7XG4gICAgdmFyIGFyZ3MgPSBbXTtcbiAgICBmb3IgKHZhciBfaSA9IDI7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICBhcmdzW19pIC0gMl0gPSBhcmd1bWVudHNbX2ldO1xuICAgIH1cbiAgICByZXR1cm4gZGVmaW5lSW5qZWN0aW9uVG9rZW5NZXRhZGF0YSh0b2tlbiwge1xuICAgICAgICB0cmFuc2Zvcm1Ub2tlbjogdHJhbnNmb3JtZXIsXG4gICAgICAgIGFyZ3M6IGFyZ3NcbiAgICB9KTtcbn1cbmV4cG9ydCBkZWZhdWx0IGluamVjdFdpdGhUcmFuc2Zvcm07XG4iLCJpbXBvcnQgeyBkZWZpbmVJbmplY3Rpb25Ub2tlbk1ldGFkYXRhIH0gZnJvbSBcIi4uL3JlZmxlY3Rpb24taGVscGVyc1wiO1xuZnVuY3Rpb24gaW5qZWN0KHRva2VuKSB7XG4gICAgcmV0dXJuIGRlZmluZUluamVjdGlvblRva2VuTWV0YWRhdGEodG9rZW4pO1xufVxuZXhwb3J0IGRlZmF1bHQgaW5qZWN0O1xuIiwiaW1wb3J0IHsgZ2V0UGFyYW1JbmZvIH0gZnJvbSBcIi4uL3JlZmxlY3Rpb24taGVscGVyc1wiO1xuaW1wb3J0IHsgdHlwZUluZm8gfSBmcm9tIFwiLi4vZGVwZW5kZW5jeS1jb250YWluZXJcIjtcbmZ1bmN0aW9uIGluamVjdGFibGUoKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgdHlwZUluZm8uc2V0KHRhcmdldCwgZ2V0UGFyYW1JbmZvKHRhcmdldCkpO1xuICAgIH07XG59XG5leHBvcnQgZGVmYXVsdCBpbmplY3RhYmxlO1xuIiwiaW1wb3J0IHsgX19yZXN0IH0gZnJvbSBcInRzbGliXCI7XG5pbXBvcnQgeyBpbnN0YW5jZSBhcyBnbG9iYWxDb250YWluZXIgfSBmcm9tIFwiLi4vZGVwZW5kZW5jeS1jb250YWluZXJcIjtcbmZ1bmN0aW9uIHJlZ2lzdHJ5KHJlZ2lzdHJhdGlvbnMpIHtcbiAgICBpZiAocmVnaXN0cmF0aW9ucyA9PT0gdm9pZCAwKSB7IHJlZ2lzdHJhdGlvbnMgPSBbXTsgfVxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgIHJlZ2lzdHJhdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgICAgIHZhciB0b2tlbiA9IF9hLnRva2VuLCBvcHRpb25zID0gX2Eub3B0aW9ucywgcHJvdmlkZXIgPSBfX3Jlc3QoX2EsIFtcInRva2VuXCIsIFwib3B0aW9uc1wiXSk7XG4gICAgICAgICAgICByZXR1cm4gZ2xvYmFsQ29udGFpbmVyLnJlZ2lzdGVyKHRva2VuLCBwcm92aWRlciwgb3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH07XG59XG5leHBvcnQgZGVmYXVsdCByZWdpc3RyeTtcbiIsImltcG9ydCBpbmplY3RhYmxlIGZyb20gXCIuL2luamVjdGFibGVcIjtcbmltcG9ydCB7IGluc3RhbmNlIGFzIGdsb2JhbENvbnRhaW5lciB9IGZyb20gXCIuLi9kZXBlbmRlbmN5LWNvbnRhaW5lclwiO1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc2NvcGVkKGxpZmVjeWNsZSwgdG9rZW4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICBpbmplY3RhYmxlKCkodGFyZ2V0KTtcbiAgICAgICAgZ2xvYmFsQ29udGFpbmVyLnJlZ2lzdGVyKHRva2VuIHx8IHRhcmdldCwgdGFyZ2V0LCB7XG4gICAgICAgICAgICBsaWZlY3ljbGU6IGxpZmVjeWNsZVxuICAgICAgICB9KTtcbiAgICB9O1xufVxuIiwiaW1wb3J0IGluamVjdGFibGUgZnJvbSBcIi4vaW5qZWN0YWJsZVwiO1xuaW1wb3J0IHsgaW5zdGFuY2UgYXMgZ2xvYmFsQ29udGFpbmVyIH0gZnJvbSBcIi4uL2RlcGVuZGVuY3ktY29udGFpbmVyXCI7XG5mdW5jdGlvbiBzaW5nbGV0b24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgaW5qZWN0YWJsZSgpKHRhcmdldCk7XG4gICAgICAgIGdsb2JhbENvbnRhaW5lci5yZWdpc3RlclNpbmdsZXRvbih0YXJnZXQpO1xuICAgIH07XG59XG5leHBvcnQgZGVmYXVsdCBzaW5nbGV0b247XG4iLCJpbXBvcnQgeyBfX2F3YWl0ZXIsIF9fZ2VuZXJhdG9yLCBfX3JlYWQsIF9fc3ByZWFkLCBfX3ZhbHVlcyB9IGZyb20gXCJ0c2xpYlwiO1xuaW1wb3J0IHsgaXNDbGFzc1Byb3ZpZGVyLCBpc0ZhY3RvcnlQcm92aWRlciwgaXNOb3JtYWxUb2tlbiwgaXNUb2tlblByb3ZpZGVyLCBpc1ZhbHVlUHJvdmlkZXIgfSBmcm9tIFwiLi9wcm92aWRlcnNcIjtcbmltcG9ydCB7IGlzUHJvdmlkZXIgfSBmcm9tIFwiLi9wcm92aWRlcnMvcHJvdmlkZXJcIjtcbmltcG9ydCB7IGlzQ29uc3RydWN0b3JUb2tlbiwgaXNUb2tlbkRlc2NyaXB0b3IsIGlzVHJhbnNmb3JtRGVzY3JpcHRvciB9IGZyb20gXCIuL3Byb3ZpZGVycy9pbmplY3Rpb24tdG9rZW5cIjtcbmltcG9ydCBSZWdpc3RyeSBmcm9tIFwiLi9yZWdpc3RyeVwiO1xuaW1wb3J0IExpZmVjeWNsZSBmcm9tIFwiLi90eXBlcy9saWZlY3ljbGVcIjtcbmltcG9ydCBSZXNvbHV0aW9uQ29udGV4dCBmcm9tIFwiLi9yZXNvbHV0aW9uLWNvbnRleHRcIjtcbmltcG9ydCB7IGZvcm1hdEVycm9yQ3RvciB9IGZyb20gXCIuL2Vycm9yLWhlbHBlcnNcIjtcbmltcG9ydCB7IERlbGF5ZWRDb25zdHJ1Y3RvciB9IGZyb20gXCIuL2xhenktaGVscGVyc1wiO1xuaW1wb3J0IHsgaXNEaXNwb3NhYmxlIH0gZnJvbSBcIi4vdHlwZXMvZGlzcG9zYWJsZVwiO1xuaW1wb3J0IEludGVyY2VwdG9ycyBmcm9tIFwiLi9pbnRlcmNlcHRvcnNcIjtcbmV4cG9ydCB2YXIgdHlwZUluZm8gPSBuZXcgTWFwKCk7XG52YXIgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIocGFyZW50KSB7XG4gICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgICAgICB0aGlzLl9yZWdpc3RyeSA9IG5ldyBSZWdpc3RyeSgpO1xuICAgICAgICB0aGlzLmludGVyY2VwdG9ycyA9IG5ldyBJbnRlcmNlcHRvcnMoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGVzID0gbmV3IFNldCgpO1xuICAgIH1cbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLnJlZ2lzdGVyID0gZnVuY3Rpb24gKHRva2VuLCBwcm92aWRlck9yQ29uc3RydWN0b3IsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0geyBsaWZlY3ljbGU6IExpZmVjeWNsZS5UcmFuc2llbnQgfTsgfVxuICAgICAgICB0aGlzLmVuc3VyZU5vdERpc3Bvc2VkKCk7XG4gICAgICAgIHZhciBwcm92aWRlcjtcbiAgICAgICAgaWYgKCFpc1Byb3ZpZGVyKHByb3ZpZGVyT3JDb25zdHJ1Y3RvcikpIHtcbiAgICAgICAgICAgIHByb3ZpZGVyID0geyB1c2VDbGFzczogcHJvdmlkZXJPckNvbnN0cnVjdG9yIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwcm92aWRlciA9IHByb3ZpZGVyT3JDb25zdHJ1Y3RvcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNUb2tlblByb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgICAgICAgdmFyIHBhdGggPSBbdG9rZW5dO1xuICAgICAgICAgICAgdmFyIHRva2VuUHJvdmlkZXIgPSBwcm92aWRlcjtcbiAgICAgICAgICAgIHdoaWxlICh0b2tlblByb3ZpZGVyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFRva2VuID0gdG9rZW5Qcm92aWRlci51c2VUb2tlbjtcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5pbmNsdWRlcyhjdXJyZW50VG9rZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRva2VuIHJlZ2lzdHJhdGlvbiBjeWNsZSBkZXRlY3RlZCEgXCIgKyBfX3NwcmVhZChwYXRoLCBbY3VycmVudFRva2VuXSkuam9pbihcIiAtPiBcIikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXRoLnB1c2goY3VycmVudFRva2VuKTtcbiAgICAgICAgICAgICAgICB2YXIgcmVnaXN0cmF0aW9uID0gdGhpcy5fcmVnaXN0cnkuZ2V0KGN1cnJlbnRUb2tlbik7XG4gICAgICAgICAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbiAmJiBpc1Rva2VuUHJvdmlkZXIocmVnaXN0cmF0aW9uLnByb3ZpZGVyKSkge1xuICAgICAgICAgICAgICAgICAgICB0b2tlblByb3ZpZGVyID0gcmVnaXN0cmF0aW9uLnByb3ZpZGVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5Qcm92aWRlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmxpZmVjeWNsZSA9PT0gTGlmZWN5Y2xlLlNpbmdsZXRvbiB8fFxuICAgICAgICAgICAgb3B0aW9ucy5saWZlY3ljbGUgPT0gTGlmZWN5Y2xlLkNvbnRhaW5lclNjb3BlZCB8fFxuICAgICAgICAgICAgb3B0aW9ucy5saWZlY3ljbGUgPT0gTGlmZWN5Y2xlLlJlc29sdXRpb25TY29wZWQpIHtcbiAgICAgICAgICAgIGlmIChpc1ZhbHVlUHJvdmlkZXIocHJvdmlkZXIpIHx8IGlzRmFjdG9yeVByb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCB1c2UgbGlmZWN5Y2xlIFxcXCJcIiArIExpZmVjeWNsZVtvcHRpb25zLmxpZmVjeWNsZV0gKyBcIlxcXCIgd2l0aCBWYWx1ZVByb3ZpZGVycyBvciBGYWN0b3J5UHJvdmlkZXJzXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlZ2lzdHJ5LnNldCh0b2tlbiwgeyBwcm92aWRlcjogcHJvdmlkZXIsIG9wdGlvbnM6IG9wdGlvbnMgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5yZWdpc3RlclR5cGUgPSBmdW5jdGlvbiAoZnJvbSwgdG8pIHtcbiAgICAgICAgdGhpcy5lbnN1cmVOb3REaXNwb3NlZCgpO1xuICAgICAgICBpZiAoaXNOb3JtYWxUb2tlbih0bykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyKGZyb20sIHtcbiAgICAgICAgICAgICAgICB1c2VUb2tlbjogdG9cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyKGZyb20sIHtcbiAgICAgICAgICAgIHVzZUNsYXNzOiB0b1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUucmVnaXN0ZXJJbnN0YW5jZSA9IGZ1bmN0aW9uICh0b2tlbiwgaW5zdGFuY2UpIHtcbiAgICAgICAgdGhpcy5lbnN1cmVOb3REaXNwb3NlZCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3Rlcih0b2tlbiwge1xuICAgICAgICAgICAgdXNlVmFsdWU6IGluc3RhbmNlXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5yZWdpc3RlclNpbmdsZXRvbiA9IGZ1bmN0aW9uIChmcm9tLCB0bykge1xuICAgICAgICB0aGlzLmVuc3VyZU5vdERpc3Bvc2VkKCk7XG4gICAgICAgIGlmIChpc05vcm1hbFRva2VuKGZyb20pKSB7XG4gICAgICAgICAgICBpZiAoaXNOb3JtYWxUb2tlbih0bykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3Rlcihmcm9tLCB7XG4gICAgICAgICAgICAgICAgICAgIHVzZVRva2VuOiB0b1xuICAgICAgICAgICAgICAgIH0sIHsgbGlmZWN5Y2xlOiBMaWZlY3ljbGUuU2luZ2xldG9uIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodG8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWdpc3Rlcihmcm9tLCB7XG4gICAgICAgICAgICAgICAgICAgIHVzZUNsYXNzOiB0b1xuICAgICAgICAgICAgICAgIH0sIHsgbGlmZWN5Y2xlOiBMaWZlY3ljbGUuU2luZ2xldG9uIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcmVnaXN0ZXIgYSB0eXBlIG5hbWUgYXMgYSBzaW5nbGV0b24gd2l0aG91dCBhIFwidG9cIiB0b2tlbicpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB1c2VDbGFzcyA9IGZyb207XG4gICAgICAgIGlmICh0byAmJiAhaXNOb3JtYWxUb2tlbih0bykpIHtcbiAgICAgICAgICAgIHVzZUNsYXNzID0gdG87XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucmVnaXN0ZXIoZnJvbSwge1xuICAgICAgICAgICAgdXNlQ2xhc3M6IHVzZUNsYXNzXG4gICAgICAgIH0sIHsgbGlmZWN5Y2xlOiBMaWZlY3ljbGUuU2luZ2xldG9uIH0pO1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5yZXNvbHZlID0gZnVuY3Rpb24gKHRva2VuLCBjb250ZXh0KSB7XG4gICAgICAgIGlmIChjb250ZXh0ID09PSB2b2lkIDApIHsgY29udGV4dCA9IG5ldyBSZXNvbHV0aW9uQ29udGV4dCgpOyB9XG4gICAgICAgIHRoaXMuZW5zdXJlTm90RGlzcG9zZWQoKTtcbiAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbiA9IHRoaXMuZ2V0UmVnaXN0cmF0aW9uKHRva2VuKTtcbiAgICAgICAgaWYgKCFyZWdpc3RyYXRpb24gJiYgaXNOb3JtYWxUb2tlbih0b2tlbikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkF0dGVtcHRlZCB0byByZXNvbHZlIHVucmVnaXN0ZXJlZCBkZXBlbmRlbmN5IHRva2VuOiBcXFwiXCIgKyB0b2tlbi50b1N0cmluZygpICsgXCJcXFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXhlY3V0ZVByZVJlc29sdXRpb25JbnRlcmNlcHRvcih0b2tlbiwgXCJTaW5nbGVcIik7XG4gICAgICAgIGlmIChyZWdpc3RyYXRpb24pIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB0aGlzLnJlc29sdmVSZWdpc3RyYXRpb24ocmVnaXN0cmF0aW9uLCBjb250ZXh0KTtcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZVBvc3RSZXNvbHV0aW9uSW50ZXJjZXB0b3IodG9rZW4sIHJlc3VsdCwgXCJTaW5nbGVcIik7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc0NvbnN0cnVjdG9yVG9rZW4odG9rZW4pKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5jb25zdHJ1Y3QodG9rZW4sIGNvbnRleHQpO1xuICAgICAgICAgICAgdGhpcy5leGVjdXRlUG9zdFJlc29sdXRpb25JbnRlcmNlcHRvcih0b2tlbiwgcmVzdWx0LCBcIlNpbmdsZVwiKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXR0ZW1wdGVkIHRvIGNvbnN0cnVjdCBhbiB1bmRlZmluZWQgY29uc3RydWN0b3IuIENvdWxkIG1lYW4gYSBjaXJjdWxhciBkZXBlbmRlbmN5IHByb2JsZW0uIFRyeSB1c2luZyBgZGVsYXlgIGZ1bmN0aW9uLlwiKTtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUuZXhlY3V0ZVByZVJlc29sdXRpb25JbnRlcmNlcHRvciA9IGZ1bmN0aW9uICh0b2tlbiwgcmVzb2x1dGlvblR5cGUpIHtcbiAgICAgICAgdmFyIGVfMSwgX2E7XG4gICAgICAgIGlmICh0aGlzLmludGVyY2VwdG9ycy5wcmVSZXNvbHV0aW9uLmhhcyh0b2tlbikpIHtcbiAgICAgICAgICAgIHZhciByZW1haW5pbmdJbnRlcmNlcHRvcnMgPSBbXTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2IgPSBfX3ZhbHVlcyh0aGlzLmludGVyY2VwdG9ycy5wcmVSZXNvbHV0aW9uLmdldEFsbCh0b2tlbikpLCBfYyA9IF9iLm5leHQoKTsgIV9jLmRvbmU7IF9jID0gX2IubmV4dCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnRlcmNlcHRvciA9IF9jLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJjZXB0b3Iub3B0aW9ucy5mcmVxdWVuY3kgIT0gXCJPbmNlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ0ludGVyY2VwdG9ycy5wdXNoKGludGVyY2VwdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpbnRlcmNlcHRvci5jYWxsYmFjayh0b2tlbiwgcmVzb2x1dGlvblR5cGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlXzFfMSkgeyBlXzEgPSB7IGVycm9yOiBlXzFfMSB9OyB9XG4gICAgICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoX2MgJiYgIV9jLmRvbmUgJiYgKF9hID0gX2IucmV0dXJuKSkgX2EuY2FsbChfYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpbmFsbHkgeyBpZiAoZV8xKSB0aHJvdyBlXzEuZXJyb3I7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaW50ZXJjZXB0b3JzLnByZVJlc29sdXRpb24uc2V0QWxsKHRva2VuLCByZW1haW5pbmdJbnRlcmNlcHRvcnMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLmV4ZWN1dGVQb3N0UmVzb2x1dGlvbkludGVyY2VwdG9yID0gZnVuY3Rpb24gKHRva2VuLCByZXN1bHQsIHJlc29sdXRpb25UeXBlKSB7XG4gICAgICAgIHZhciBlXzIsIF9hO1xuICAgICAgICBpZiAodGhpcy5pbnRlcmNlcHRvcnMucG9zdFJlc29sdXRpb24uaGFzKHRva2VuKSkge1xuICAgICAgICAgICAgdmFyIHJlbWFpbmluZ0ludGVyY2VwdG9ycyA9IFtdO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfYiA9IF9fdmFsdWVzKHRoaXMuaW50ZXJjZXB0b3JzLnBvc3RSZXNvbHV0aW9uLmdldEFsbCh0b2tlbikpLCBfYyA9IF9iLm5leHQoKTsgIV9jLmRvbmU7IF9jID0gX2IubmV4dCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnRlcmNlcHRvciA9IF9jLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJjZXB0b3Iub3B0aW9ucy5mcmVxdWVuY3kgIT0gXCJPbmNlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbWFpbmluZ0ludGVyY2VwdG9ycy5wdXNoKGludGVyY2VwdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpbnRlcmNlcHRvci5jYWxsYmFjayh0b2tlbiwgcmVzdWx0LCByZXNvbHV0aW9uVHlwZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVfMl8xKSB7IGVfMiA9IHsgZXJyb3I6IGVfMl8xIH07IH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfYyAmJiAhX2MuZG9uZSAmJiAoX2EgPSBfYi5yZXR1cm4pKSBfYS5jYWxsKF9iKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmluYWxseSB7IGlmIChlXzIpIHRocm93IGVfMi5lcnJvcjsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5pbnRlcmNlcHRvcnMucG9zdFJlc29sdXRpb24uc2V0QWxsKHRva2VuLCByZW1haW5pbmdJbnRlcmNlcHRvcnMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLnJlc29sdmVSZWdpc3RyYXRpb24gPSBmdW5jdGlvbiAocmVnaXN0cmF0aW9uLCBjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuZW5zdXJlTm90RGlzcG9zZWQoKTtcbiAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbi5vcHRpb25zLmxpZmVjeWNsZSA9PT0gTGlmZWN5Y2xlLlJlc29sdXRpb25TY29wZWQgJiZcbiAgICAgICAgICAgIGNvbnRleHQuc2NvcGVkUmVzb2x1dGlvbnMuaGFzKHJlZ2lzdHJhdGlvbikpIHtcbiAgICAgICAgICAgIHJldHVybiBjb250ZXh0LnNjb3BlZFJlc29sdXRpb25zLmdldChyZWdpc3RyYXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpc1NpbmdsZXRvbiA9IHJlZ2lzdHJhdGlvbi5vcHRpb25zLmxpZmVjeWNsZSA9PT0gTGlmZWN5Y2xlLlNpbmdsZXRvbjtcbiAgICAgICAgdmFyIGlzQ29udGFpbmVyU2NvcGVkID0gcmVnaXN0cmF0aW9uLm9wdGlvbnMubGlmZWN5Y2xlID09PSBMaWZlY3ljbGUuQ29udGFpbmVyU2NvcGVkO1xuICAgICAgICB2YXIgcmV0dXJuSW5zdGFuY2UgPSBpc1NpbmdsZXRvbiB8fCBpc0NvbnRhaW5lclNjb3BlZDtcbiAgICAgICAgdmFyIHJlc29sdmVkO1xuICAgICAgICBpZiAoaXNWYWx1ZVByb3ZpZGVyKHJlZ2lzdHJhdGlvbi5wcm92aWRlcikpIHtcbiAgICAgICAgICAgIHJlc29sdmVkID0gcmVnaXN0cmF0aW9uLnByb3ZpZGVyLnVzZVZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzVG9rZW5Qcm92aWRlcihyZWdpc3RyYXRpb24ucHJvdmlkZXIpKSB7XG4gICAgICAgICAgICByZXNvbHZlZCA9IHJldHVybkluc3RhbmNlXG4gICAgICAgICAgICAgICAgPyByZWdpc3RyYXRpb24uaW5zdGFuY2UgfHxcbiAgICAgICAgICAgICAgICAgICAgKHJlZ2lzdHJhdGlvbi5pbnN0YW5jZSA9IHRoaXMucmVzb2x2ZShyZWdpc3RyYXRpb24ucHJvdmlkZXIudXNlVG9rZW4sIGNvbnRleHQpKVxuICAgICAgICAgICAgICAgIDogdGhpcy5yZXNvbHZlKHJlZ2lzdHJhdGlvbi5wcm92aWRlci51c2VUb2tlbiwgY29udGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNDbGFzc1Byb3ZpZGVyKHJlZ2lzdHJhdGlvbi5wcm92aWRlcikpIHtcbiAgICAgICAgICAgIHJlc29sdmVkID0gcmV0dXJuSW5zdGFuY2VcbiAgICAgICAgICAgICAgICA/IHJlZ2lzdHJhdGlvbi5pbnN0YW5jZSB8fFxuICAgICAgICAgICAgICAgICAgICAocmVnaXN0cmF0aW9uLmluc3RhbmNlID0gdGhpcy5jb25zdHJ1Y3QocmVnaXN0cmF0aW9uLnByb3ZpZGVyLnVzZUNsYXNzLCBjb250ZXh0KSlcbiAgICAgICAgICAgICAgICA6IHRoaXMuY29uc3RydWN0KHJlZ2lzdHJhdGlvbi5wcm92aWRlci51c2VDbGFzcywgY29udGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNGYWN0b3J5UHJvdmlkZXIocmVnaXN0cmF0aW9uLnByb3ZpZGVyKSkge1xuICAgICAgICAgICAgcmVzb2x2ZWQgPSByZWdpc3RyYXRpb24ucHJvdmlkZXIudXNlRmFjdG9yeSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc29sdmVkID0gdGhpcy5jb25zdHJ1Y3QocmVnaXN0cmF0aW9uLnByb3ZpZGVyLCBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVnaXN0cmF0aW9uLm9wdGlvbnMubGlmZWN5Y2xlID09PSBMaWZlY3ljbGUuUmVzb2x1dGlvblNjb3BlZCkge1xuICAgICAgICAgICAgY29udGV4dC5zY29wZWRSZXNvbHV0aW9ucy5zZXQocmVnaXN0cmF0aW9uLCByZXNvbHZlZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc29sdmVkO1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5yZXNvbHZlQWxsID0gZnVuY3Rpb24gKHRva2VuLCBjb250ZXh0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChjb250ZXh0ID09PSB2b2lkIDApIHsgY29udGV4dCA9IG5ldyBSZXNvbHV0aW9uQ29udGV4dCgpOyB9XG4gICAgICAgIHRoaXMuZW5zdXJlTm90RGlzcG9zZWQoKTtcbiAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSB0aGlzLmdldEFsbFJlZ2lzdHJhdGlvbnModG9rZW4pO1xuICAgICAgICBpZiAoIXJlZ2lzdHJhdGlvbnMgJiYgaXNOb3JtYWxUb2tlbih0b2tlbikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkF0dGVtcHRlZCB0byByZXNvbHZlIHVucmVnaXN0ZXJlZCBkZXBlbmRlbmN5IHRva2VuOiBcXFwiXCIgKyB0b2tlbi50b1N0cmluZygpICsgXCJcXFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXhlY3V0ZVByZVJlc29sdXRpb25JbnRlcmNlcHRvcih0b2tlbiwgXCJBbGxcIik7XG4gICAgICAgIGlmIChyZWdpc3RyYXRpb25zKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0XzEgPSByZWdpc3RyYXRpb25zLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5yZXNvbHZlUmVnaXN0cmF0aW9uKGl0ZW0sIGNvbnRleHQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmV4ZWN1dGVQb3N0UmVzb2x1dGlvbkludGVyY2VwdG9yKHRva2VuLCByZXN1bHRfMSwgXCJBbGxcIik7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0XzE7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlc3VsdCA9IFt0aGlzLmNvbnN0cnVjdCh0b2tlbiwgY29udGV4dCldO1xuICAgICAgICB0aGlzLmV4ZWN1dGVQb3N0UmVzb2x1dGlvbkludGVyY2VwdG9yKHRva2VuLCByZXN1bHQsIFwiQWxsXCIpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5pc1JlZ2lzdGVyZWQgPSBmdW5jdGlvbiAodG9rZW4sIHJlY3Vyc2l2ZSkge1xuICAgICAgICBpZiAocmVjdXJzaXZlID09PSB2b2lkIDApIHsgcmVjdXJzaXZlID0gZmFsc2U7IH1cbiAgICAgICAgdGhpcy5lbnN1cmVOb3REaXNwb3NlZCgpO1xuICAgICAgICByZXR1cm4gKHRoaXMuX3JlZ2lzdHJ5Lmhhcyh0b2tlbikgfHxcbiAgICAgICAgICAgIChyZWN1cnNpdmUgJiZcbiAgICAgICAgICAgICAgICAodGhpcy5wYXJlbnQgfHwgZmFsc2UpICYmXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQuaXNSZWdpc3RlcmVkKHRva2VuLCB0cnVlKSkpO1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5lbnN1cmVOb3REaXNwb3NlZCgpO1xuICAgICAgICB0aGlzLl9yZWdpc3RyeS5jbGVhcigpO1xuICAgICAgICB0aGlzLmludGVyY2VwdG9ycy5wcmVSZXNvbHV0aW9uLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuaW50ZXJjZXB0b3JzLnBvc3RSZXNvbHV0aW9uLmNsZWFyKCk7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLmNsZWFySW5zdGFuY2VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZV8zLCBfYTtcbiAgICAgICAgdGhpcy5lbnN1cmVOb3REaXNwb3NlZCgpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZm9yICh2YXIgX2IgPSBfX3ZhbHVlcyh0aGlzLl9yZWdpc3RyeS5lbnRyaWVzKCkpLCBfYyA9IF9iLm5leHQoKTsgIV9jLmRvbmU7IF9jID0gX2IubmV4dCgpKSB7XG4gICAgICAgICAgICAgICAgdmFyIF9kID0gX19yZWFkKF9jLnZhbHVlLCAyKSwgdG9rZW4gPSBfZFswXSwgcmVnaXN0cmF0aW9ucyA9IF9kWzFdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlZ2lzdHJ5LnNldEFsbCh0b2tlbiwgcmVnaXN0cmF0aW9uc1xuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChyZWdpc3RyYXRpb24pIHsgcmV0dXJuICFpc1ZhbHVlUHJvdmlkZXIocmVnaXN0cmF0aW9uLnByb3ZpZGVyKTsgfSlcbiAgICAgICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAocmVnaXN0cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2lzdHJhdGlvbi5pbnN0YW5jZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlZ2lzdHJhdGlvbjtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVfM18xKSB7IGVfMyA9IHsgZXJyb3I6IGVfM18xIH07IH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChfYyAmJiAhX2MuZG9uZSAmJiAoX2EgPSBfYi5yZXR1cm4pKSBfYS5jYWxsKF9iKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkgeyBpZiAoZV8zKSB0aHJvdyBlXzMuZXJyb3I7IH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5jcmVhdGVDaGlsZENvbnRhaW5lciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGVfNCwgX2E7XG4gICAgICAgIHRoaXMuZW5zdXJlTm90RGlzcG9zZWQoKTtcbiAgICAgICAgdmFyIGNoaWxkQ29udGFpbmVyID0gbmV3IEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lcih0aGlzKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvciAodmFyIF9iID0gX192YWx1ZXModGhpcy5fcmVnaXN0cnkuZW50cmllcygpKSwgX2MgPSBfYi5uZXh0KCk7ICFfYy5kb25lOyBfYyA9IF9iLm5leHQoKSkge1xuICAgICAgICAgICAgICAgIHZhciBfZCA9IF9fcmVhZChfYy52YWx1ZSwgMiksIHRva2VuID0gX2RbMF0sIHJlZ2lzdHJhdGlvbnMgPSBfZFsxXTtcbiAgICAgICAgICAgICAgICBpZiAocmVnaXN0cmF0aW9ucy5zb21lKGZ1bmN0aW9uIChfYSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb3B0aW9ucyA9IF9hLm9wdGlvbnM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmxpZmVjeWNsZSA9PT0gTGlmZWN5Y2xlLkNvbnRhaW5lclNjb3BlZDtcbiAgICAgICAgICAgICAgICB9KSkge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZENvbnRhaW5lci5fcmVnaXN0cnkuc2V0QWxsKHRva2VuLCByZWdpc3RyYXRpb25zLm1hcChmdW5jdGlvbiAocmVnaXN0cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVnaXN0cmF0aW9uLm9wdGlvbnMubGlmZWN5Y2xlID09PSBMaWZlY3ljbGUuQ29udGFpbmVyU2NvcGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvdmlkZXI6IHJlZ2lzdHJhdGlvbi5wcm92aWRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogcmVnaXN0cmF0aW9uLm9wdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlZ2lzdHJhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZV80XzEpIHsgZV80ID0geyBlcnJvcjogZV80XzEgfTsgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKF9jICYmICFfYy5kb25lICYmIChfYSA9IF9iLnJldHVybikpIF9hLmNhbGwoX2IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmluYWxseSB7IGlmIChlXzQpIHRocm93IGVfNC5lcnJvcjsgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjaGlsZENvbnRhaW5lcjtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUuYmVmb3JlUmVzb2x1dGlvbiA9IGZ1bmN0aW9uICh0b2tlbiwgY2FsbGJhY2ssIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0geyBmcmVxdWVuY3k6IFwiQWx3YXlzXCIgfTsgfVxuICAgICAgICB0aGlzLmludGVyY2VwdG9ycy5wcmVSZXNvbHV0aW9uLnNldCh0b2tlbiwge1xuICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrLFxuICAgICAgICAgICAgb3B0aW9uczogb3B0aW9uc1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUuYWZ0ZXJSZXNvbHV0aW9uID0gZnVuY3Rpb24gKHRva2VuLCBjYWxsYmFjaywgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7IGZyZXF1ZW5jeTogXCJBbHdheXNcIiB9OyB9XG4gICAgICAgIHRoaXMuaW50ZXJjZXB0b3JzLnBvc3RSZXNvbHV0aW9uLnNldCh0b2tlbiwge1xuICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrLFxuICAgICAgICAgICAgb3B0aW9uczogb3B0aW9uc1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHByb21pc2VzO1xuICAgICAgICAgICAgcmV0dXJuIF9fZ2VuZXJhdG9yKHRoaXMsIGZ1bmN0aW9uIChfYSkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoX2EubGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlcy5mb3JFYWNoKGZ1bmN0aW9uIChkaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1heWJlUHJvbWlzZSA9IGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXliZVByb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXMucHVzaChtYXliZVByb21pc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFs0LCBQcm9taXNlLmFsbChwcm9taXNlcyldO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgICAgICBfYS5zZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzJdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEludGVybmFsRGVwZW5kZW5jeUNvbnRhaW5lci5wcm90b3R5cGUuZ2V0UmVnaXN0cmF0aW9uID0gZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgIGlmICh0aGlzLmlzUmVnaXN0ZXJlZCh0b2tlbikpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWdpc3RyeS5nZXQodG9rZW4pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnBhcmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50LmdldFJlZ2lzdHJhdGlvbih0b2tlbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLmdldEFsbFJlZ2lzdHJhdGlvbnMgPSBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgaWYgKHRoaXMuaXNSZWdpc3RlcmVkKHRva2VuKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlZ2lzdHJ5LmdldEFsbCh0b2tlbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucGFyZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQuZ2V0QWxsUmVnaXN0cmF0aW9ucyh0b2tlbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLmNvbnN0cnVjdCA9IGZ1bmN0aW9uIChjdG9yLCBjb250ZXh0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChjdG9yIGluc3RhbmNlb2YgRGVsYXllZENvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gY3Rvci5jcmVhdGVQcm94eShmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLnJlc29sdmUodGFyZ2V0LCBjb250ZXh0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpbnN0YW5jZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcGFyYW1JbmZvID0gdHlwZUluZm8uZ2V0KGN0b3IpO1xuICAgICAgICAgICAgaWYgKCFwYXJhbUluZm8gfHwgcGFyYW1JbmZvLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlmIChjdG9yLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGN0b3IoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlR5cGVJbmZvIG5vdCBrbm93biBmb3IgXFxcIlwiICsgY3Rvci5uYW1lICsgXCJcXFwiXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSBwYXJhbUluZm8ubWFwKF90aGlzLnJlc29sdmVQYXJhbXMoY29udGV4dCwgY3RvcikpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyAoY3Rvci5iaW5kLmFwcGx5KGN0b3IsIF9fc3ByZWFkKFt2b2lkIDBdLCBwYXJhbXMpKSkoKTtcbiAgICAgICAgfSkoKTtcbiAgICAgICAgaWYgKGlzRGlzcG9zYWJsZShpbnN0YW5jZSkpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKGluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfTtcbiAgICBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIucHJvdG90eXBlLnJlc29sdmVQYXJhbXMgPSBmdW5jdGlvbiAoY29udGV4dCwgY3Rvcikge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHBhcmFtLCBpZHgpIHtcbiAgICAgICAgICAgIHZhciBfYSwgX2IsIF9jO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoaXNUb2tlbkRlc2NyaXB0b3IocGFyYW0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1RyYW5zZm9ybURlc2NyaXB0b3IocGFyYW0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW0ubXVsdGlwbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IChfYSA9IF90aGlzLnJlc29sdmUocGFyYW0udHJhbnNmb3JtKSkudHJhbnNmb3JtLmFwcGx5KF9hLCBfX3NwcmVhZChbX3RoaXMucmVzb2x2ZUFsbChwYXJhbS50b2tlbildLCBwYXJhbS50cmFuc2Zvcm1BcmdzKSkgOiAoX2IgPSBfdGhpcy5yZXNvbHZlKHBhcmFtLnRyYW5zZm9ybSkpLnRyYW5zZm9ybS5hcHBseShfYiwgX19zcHJlYWQoW190aGlzLnJlc29sdmUocGFyYW0udG9rZW4sIGNvbnRleHQpXSwgcGFyYW0udHJhbnNmb3JtQXJncykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmFtLm11bHRpcGxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBfdGhpcy5yZXNvbHZlQWxsKHBhcmFtLnRva2VuKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogX3RoaXMucmVzb2x2ZShwYXJhbS50b2tlbiwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaXNUcmFuc2Zvcm1EZXNjcmlwdG9yKHBhcmFtKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKF9jID0gX3RoaXMucmVzb2x2ZShwYXJhbS50cmFuc2Zvcm0sIGNvbnRleHQpKS50cmFuc2Zvcm0uYXBwbHkoX2MsIF9fc3ByZWFkKFtfdGhpcy5yZXNvbHZlKHBhcmFtLnRva2VuLCBjb250ZXh0KV0sIHBhcmFtLnRyYW5zZm9ybUFyZ3MpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLnJlc29sdmUocGFyYW0sIGNvbnRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZm9ybWF0RXJyb3JDdG9yKGN0b3IsIGlkeCwgZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH07XG4gICAgSW50ZXJuYWxEZXBlbmRlbmN5Q29udGFpbmVyLnByb3RvdHlwZS5lbnN1cmVOb3REaXNwb3NlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlzcG9zZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoaXMgY29udGFpbmVyIGhhcyBiZWVuIGRpc3Bvc2VkLCB5b3UgY2Fubm90IGludGVyYWN0IHdpdGggYSBkaXNwb3NlZCBjb250YWluZXJcIik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXI7XG59KCkpO1xuZXhwb3J0IHZhciBpbnN0YW5jZSA9IG5ldyBJbnRlcm5hbERlcGVuZGVuY3lDb250YWluZXIoKTtcbmV4cG9ydCBkZWZhdWx0IGluc3RhbmNlO1xuIiwiaW1wb3J0IHsgX19yZWFkLCBfX3NwcmVhZCB9IGZyb20gXCJ0c2xpYlwiO1xuZnVuY3Rpb24gZm9ybWF0RGVwZW5kZW5jeShwYXJhbXMsIGlkeCkge1xuICAgIGlmIChwYXJhbXMgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIFwiYXQgcG9zaXRpb24gI1wiICsgaWR4O1xuICAgIH1cbiAgICB2YXIgYXJnTmFtZSA9IHBhcmFtcy5zcGxpdChcIixcIilbaWR4XS50cmltKCk7XG4gICAgcmV0dXJuIFwiXFxcIlwiICsgYXJnTmFtZSArIFwiXFxcIiBhdCBwb3NpdGlvbiAjXCIgKyBpZHg7XG59XG5mdW5jdGlvbiBjb21wb3NlRXJyb3JNZXNzYWdlKG1zZywgZSwgaW5kZW50KSB7XG4gICAgaWYgKGluZGVudCA9PT0gdm9pZCAwKSB7IGluZGVudCA9IFwiICAgIFwiOyB9XG4gICAgcmV0dXJuIF9fc3ByZWFkKFttc2ddLCBlLm1lc3NhZ2Uuc3BsaXQoXCJcXG5cIikubWFwKGZ1bmN0aW9uIChsKSB7IHJldHVybiBpbmRlbnQgKyBsOyB9KSkuam9pbihcIlxcblwiKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRFcnJvckN0b3IoY3RvciwgcGFyYW1JZHgsIGVycm9yKSB7XG4gICAgdmFyIF9hID0gX19yZWFkKGN0b3IudG9TdHJpbmcoKS5tYXRjaCgvY29uc3RydWN0b3JcXCgoW1xcdywgXSspXFwpLykgfHwgW10sIDIpLCBfYiA9IF9hWzFdLCBwYXJhbXMgPSBfYiA9PT0gdm9pZCAwID8gbnVsbCA6IF9iO1xuICAgIHZhciBkZXAgPSBmb3JtYXREZXBlbmRlbmN5KHBhcmFtcywgcGFyYW1JZHgpO1xuICAgIHJldHVybiBjb21wb3NlRXJyb3JNZXNzYWdlKFwiQ2Fubm90IGluamVjdCB0aGUgZGVwZW5kZW5jeSBcIiArIGRlcCArIFwiIG9mIFxcXCJcIiArIGN0b3IubmFtZSArIFwiXFxcIiBjb25zdHJ1Y3Rvci4gUmVhc29uOlwiLCBlcnJvcik7XG59XG4iLCJleHBvcnQgeyBkZWZhdWx0IGFzIGluc3RhbmNlQ2FjaGluZ0ZhY3RvcnkgfSBmcm9tIFwiLi9pbnN0YW5jZS1jYWNoaW5nLWZhY3RvcnlcIjtcbmV4cG9ydCB7IGRlZmF1bHQgYXMgaW5zdGFuY2VQZXJDb250YWluZXJDYWNoaW5nRmFjdG9yeSB9IGZyb20gXCIuL2luc3RhbmNlLXBlci1jb250YWluZXItY2FjaGluZy1mYWN0b3J5XCI7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHByZWRpY2F0ZUF3YXJlQ2xhc3NGYWN0b3J5IH0gZnJvbSBcIi4vcHJlZGljYXRlLWF3YXJlLWNsYXNzLWZhY3RvcnlcIjtcbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGluc3RhbmNlQ2FjaGluZ0ZhY3RvcnkoZmFjdG9yeUZ1bmMpIHtcbiAgICB2YXIgaW5zdGFuY2U7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkZXBlbmRlbmN5Q29udGFpbmVyKSB7XG4gICAgICAgIGlmIChpbnN0YW5jZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGluc3RhbmNlID0gZmFjdG9yeUZ1bmMoZGVwZW5kZW5jeUNvbnRhaW5lcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgIH07XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbnN0YW5jZVBlckNvbnRhaW5lckNhY2hpbmdGYWN0b3J5KGZhY3RvcnlGdW5jKSB7XG4gICAgdmFyIGNhY2hlID0gbmV3IFdlYWtNYXAoKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRlcGVuZGVuY3lDb250YWluZXIpIHtcbiAgICAgICAgdmFyIGluc3RhbmNlID0gY2FjaGUuZ2V0KGRlcGVuZGVuY3lDb250YWluZXIpO1xuICAgICAgICBpZiAoaW5zdGFuY2UgPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpbnN0YW5jZSA9IGZhY3RvcnlGdW5jKGRlcGVuZGVuY3lDb250YWluZXIpO1xuICAgICAgICAgICAgY2FjaGUuc2V0KGRlcGVuZGVuY3lDb250YWluZXIsIGluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfTtcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHByZWRpY2F0ZUF3YXJlQ2xhc3NGYWN0b3J5KHByZWRpY2F0ZSwgdHJ1ZUNvbnN0cnVjdG9yLCBmYWxzZUNvbnN0cnVjdG9yLCB1c2VDYWNoaW5nKSB7XG4gICAgaWYgKHVzZUNhY2hpbmcgPT09IHZvaWQgMCkgeyB1c2VDYWNoaW5nID0gdHJ1ZTsgfVxuICAgIHZhciBpbnN0YW5jZTtcbiAgICB2YXIgcHJldmlvdXNQcmVkaWNhdGU7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkZXBlbmRlbmN5Q29udGFpbmVyKSB7XG4gICAgICAgIHZhciBjdXJyZW50UHJlZGljYXRlID0gcHJlZGljYXRlKGRlcGVuZGVuY3lDb250YWluZXIpO1xuICAgICAgICBpZiAoIXVzZUNhY2hpbmcgfHwgcHJldmlvdXNQcmVkaWNhdGUgIT09IGN1cnJlbnRQcmVkaWNhdGUpIHtcbiAgICAgICAgICAgIGlmICgocHJldmlvdXNQcmVkaWNhdGUgPSBjdXJyZW50UHJlZGljYXRlKSkge1xuICAgICAgICAgICAgICAgIGluc3RhbmNlID0gZGVwZW5kZW5jeUNvbnRhaW5lci5yZXNvbHZlKHRydWVDb25zdHJ1Y3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IGRlcGVuZGVuY3lDb250YWluZXIucmVzb2x2ZShmYWxzZUNvbnN0cnVjdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfTtcbn1cbiIsImlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5nZXRNZXRhZGF0YSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcInRzeXJpbmdlIHJlcXVpcmVzIGEgcmVmbGVjdCBwb2x5ZmlsbC4gUGxlYXNlIGFkZCAnaW1wb3J0IFxcXCJyZWZsZWN0LW1ldGFkYXRhXFxcIicgdG8gdGhlIHRvcCBvZiB5b3VyIGVudHJ5IHBvaW50LlwiKTtcbn1cbmV4cG9ydCB7IExpZmVjeWNsZSB9IGZyb20gXCIuL3R5cGVzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9kZWNvcmF0b3JzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9mYWN0b3JpZXNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3Byb3ZpZGVyc1wiO1xuZXhwb3J0IHsgZGVsYXkgfSBmcm9tIFwiLi9sYXp5LWhlbHBlcnNcIjtcbmV4cG9ydCB7IGluc3RhbmNlIGFzIGNvbnRhaW5lciB9IGZyb20gXCIuL2RlcGVuZGVuY3ktY29udGFpbmVyXCI7XG4iLCJpbXBvcnQgeyBfX2V4dGVuZHMgfSBmcm9tIFwidHNsaWJcIjtcbmltcG9ydCBSZWdpc3RyeUJhc2UgZnJvbSBcIi4vcmVnaXN0cnktYmFzZVwiO1xudmFyIFByZVJlc29sdXRpb25JbnRlcmNlcHRvcnMgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhQcmVSZXNvbHV0aW9uSW50ZXJjZXB0b3JzLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFByZVJlc29sdXRpb25JbnRlcmNlcHRvcnMoKSB7XG4gICAgICAgIHJldHVybiBfc3VwZXIgIT09IG51bGwgJiYgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgfHwgdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIFByZVJlc29sdXRpb25JbnRlcmNlcHRvcnM7XG59KFJlZ2lzdHJ5QmFzZSkpO1xuZXhwb3J0IHsgUHJlUmVzb2x1dGlvbkludGVyY2VwdG9ycyB9O1xudmFyIFBvc3RSZXNvbHV0aW9uSW50ZXJjZXB0b3JzID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUG9zdFJlc29sdXRpb25JbnRlcmNlcHRvcnMsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gUG9zdFJlc29sdXRpb25JbnRlcmNlcHRvcnMoKSB7XG4gICAgICAgIHJldHVybiBfc3VwZXIgIT09IG51bGwgJiYgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgfHwgdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIFBvc3RSZXNvbHV0aW9uSW50ZXJjZXB0b3JzO1xufShSZWdpc3RyeUJhc2UpKTtcbmV4cG9ydCB7IFBvc3RSZXNvbHV0aW9uSW50ZXJjZXB0b3JzIH07XG52YXIgSW50ZXJjZXB0b3JzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJbnRlcmNlcHRvcnMoKSB7XG4gICAgICAgIHRoaXMucHJlUmVzb2x1dGlvbiA9IG5ldyBQcmVSZXNvbHV0aW9uSW50ZXJjZXB0b3JzKCk7XG4gICAgICAgIHRoaXMucG9zdFJlc29sdXRpb24gPSBuZXcgUG9zdFJlc29sdXRpb25JbnRlcmNlcHRvcnMoKTtcbiAgICB9XG4gICAgcmV0dXJuIEludGVyY2VwdG9ycztcbn0oKSk7XG5leHBvcnQgZGVmYXVsdCBJbnRlcmNlcHRvcnM7XG4iLCJpbXBvcnQgeyBfX3JlYWQsIF9fc3ByZWFkIH0gZnJvbSBcInRzbGliXCI7XG52YXIgRGVsYXllZENvbnN0cnVjdG9yID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBEZWxheWVkQ29uc3RydWN0b3Iod3JhcCkge1xuICAgICAgICB0aGlzLndyYXAgPSB3cmFwO1xuICAgICAgICB0aGlzLnJlZmxlY3RNZXRob2RzID0gW1xuICAgICAgICAgICAgXCJnZXRcIixcbiAgICAgICAgICAgIFwiZ2V0UHJvdG90eXBlT2ZcIixcbiAgICAgICAgICAgIFwic2V0UHJvdG90eXBlT2ZcIixcbiAgICAgICAgICAgIFwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yXCIsXG4gICAgICAgICAgICBcImRlZmluZVByb3BlcnR5XCIsXG4gICAgICAgICAgICBcImhhc1wiLFxuICAgICAgICAgICAgXCJzZXRcIixcbiAgICAgICAgICAgIFwiZGVsZXRlUHJvcGVydHlcIixcbiAgICAgICAgICAgIFwiYXBwbHlcIixcbiAgICAgICAgICAgIFwiY29uc3RydWN0XCIsXG4gICAgICAgICAgICBcIm93bktleXNcIlxuICAgICAgICBdO1xuICAgIH1cbiAgICBEZWxheWVkQ29uc3RydWN0b3IucHJvdG90eXBlLmNyZWF0ZVByb3h5ID0gZnVuY3Rpb24gKGNyZWF0ZU9iamVjdCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgdGFyZ2V0ID0ge307XG4gICAgICAgIHZhciBpbml0ID0gZmFsc2U7XG4gICAgICAgIHZhciB2YWx1ZTtcbiAgICAgICAgdmFyIGRlbGF5ZWRPYmplY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIWluaXQpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGNyZWF0ZU9iamVjdChfdGhpcy53cmFwKCkpO1xuICAgICAgICAgICAgICAgIGluaXQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gbmV3IFByb3h5KHRhcmdldCwgdGhpcy5jcmVhdGVIYW5kbGVyKGRlbGF5ZWRPYmplY3QpKTtcbiAgICB9O1xuICAgIERlbGF5ZWRDb25zdHJ1Y3Rvci5wcm90b3R5cGUuY3JlYXRlSGFuZGxlciA9IGZ1bmN0aW9uIChkZWxheWVkT2JqZWN0KSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0ge307XG4gICAgICAgIHZhciBpbnN0YWxsID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIGhhbmRsZXJbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW19pXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFyZ3NbMF0gPSBkZWxheWVkT2JqZWN0KCk7XG4gICAgICAgICAgICAgICAgdmFyIG1ldGhvZCA9IFJlZmxlY3RbbmFtZV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1ldGhvZC5hcHBseSh2b2lkIDAsIF9fc3ByZWFkKGFyZ3MpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucmVmbGVjdE1ldGhvZHMuZm9yRWFjaChpbnN0YWxsKTtcbiAgICAgICAgcmV0dXJuIGhhbmRsZXI7XG4gICAgfTtcbiAgICByZXR1cm4gRGVsYXllZENvbnN0cnVjdG9yO1xufSgpKTtcbmV4cG9ydCB7IERlbGF5ZWRDb25zdHJ1Y3RvciB9O1xuZXhwb3J0IGZ1bmN0aW9uIGRlbGF5KHdyYXBwZWRDb25zdHJ1Y3Rvcikge1xuICAgIGlmICh0eXBlb2Ygd3JhcHBlZENvbnN0cnVjdG9yID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkF0dGVtcHQgdG8gYGRlbGF5YCB1bmRlZmluZWQuIENvbnN0cnVjdG9yIG11c3QgYmUgd3JhcHBlZCBpbiBhIGNhbGxiYWNrXCIpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IERlbGF5ZWRDb25zdHJ1Y3Rvcih3cmFwcGVkQ29uc3RydWN0b3IpO1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGlzQ2xhc3NQcm92aWRlcihwcm92aWRlcikge1xuICAgIHJldHVybiAhIXByb3ZpZGVyLnVzZUNsYXNzO1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGlzRmFjdG9yeVByb3ZpZGVyKHByb3ZpZGVyKSB7XG4gICAgcmV0dXJuICEhcHJvdmlkZXIudXNlRmFjdG9yeTtcbn1cbiIsImV4cG9ydCB7IGlzQ2xhc3NQcm92aWRlciB9IGZyb20gXCIuL2NsYXNzLXByb3ZpZGVyXCI7XG5leHBvcnQgeyBpc0ZhY3RvcnlQcm92aWRlciB9IGZyb20gXCIuL2ZhY3RvcnktcHJvdmlkZXJcIjtcbmV4cG9ydCB7IGlzTm9ybWFsVG9rZW4gfSBmcm9tIFwiLi9pbmplY3Rpb24tdG9rZW5cIjtcbmV4cG9ydCB7IGlzVG9rZW5Qcm92aWRlciB9IGZyb20gXCIuL3Rva2VuLXByb3ZpZGVyXCI7XG5leHBvcnQgeyBpc1ZhbHVlUHJvdmlkZXIgfSBmcm9tIFwiLi92YWx1ZS1wcm92aWRlclwiO1xuIiwiaW1wb3J0IHsgRGVsYXllZENvbnN0cnVjdG9yIH0gZnJvbSBcIi4uL2xhenktaGVscGVyc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIGlzTm9ybWFsVG9rZW4odG9rZW4pIHtcbiAgICByZXR1cm4gdHlwZW9mIHRva2VuID09PSBcInN0cmluZ1wiIHx8IHR5cGVvZiB0b2tlbiA9PT0gXCJzeW1ib2xcIjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc1Rva2VuRGVzY3JpcHRvcihkZXNjcmlwdG9yKSB7XG4gICAgcmV0dXJuICh0eXBlb2YgZGVzY3JpcHRvciA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBcInRva2VuXCIgaW4gZGVzY3JpcHRvciAmJlxuICAgICAgICBcIm11bHRpcGxlXCIgaW4gZGVzY3JpcHRvcik7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNUcmFuc2Zvcm1EZXNjcmlwdG9yKGRlc2NyaXB0b3IpIHtcbiAgICByZXR1cm4gKHR5cGVvZiBkZXNjcmlwdG9yID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgIFwidG9rZW5cIiBpbiBkZXNjcmlwdG9yICYmXG4gICAgICAgIFwidHJhbnNmb3JtXCIgaW4gZGVzY3JpcHRvcik7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNDb25zdHJ1Y3RvclRva2VuKHRva2VuKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB0b2tlbiA9PT0gXCJmdW5jdGlvblwiIHx8IHRva2VuIGluc3RhbmNlb2YgRGVsYXllZENvbnN0cnVjdG9yO1xufVxuIiwiaW1wb3J0IHsgaXNDbGFzc1Byb3ZpZGVyIH0gZnJvbSBcIi4vY2xhc3MtcHJvdmlkZXJcIjtcbmltcG9ydCB7IGlzVmFsdWVQcm92aWRlciB9IGZyb20gXCIuL3ZhbHVlLXByb3ZpZGVyXCI7XG5pbXBvcnQgeyBpc1Rva2VuUHJvdmlkZXIgfSBmcm9tIFwiLi90b2tlbi1wcm92aWRlclwiO1xuaW1wb3J0IHsgaXNGYWN0b3J5UHJvdmlkZXIgfSBmcm9tIFwiLi9mYWN0b3J5LXByb3ZpZGVyXCI7XG5leHBvcnQgZnVuY3Rpb24gaXNQcm92aWRlcihwcm92aWRlcikge1xuICAgIHJldHVybiAoaXNDbGFzc1Byb3ZpZGVyKHByb3ZpZGVyKSB8fFxuICAgICAgICBpc1ZhbHVlUHJvdmlkZXIocHJvdmlkZXIpIHx8XG4gICAgICAgIGlzVG9rZW5Qcm92aWRlcihwcm92aWRlcikgfHxcbiAgICAgICAgaXNGYWN0b3J5UHJvdmlkZXIocHJvdmlkZXIpKTtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBpc1Rva2VuUHJvdmlkZXIocHJvdmlkZXIpIHtcbiAgICByZXR1cm4gISFwcm92aWRlci51c2VUb2tlbjtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBpc1ZhbHVlUHJvdmlkZXIocHJvdmlkZXIpIHtcbiAgICByZXR1cm4gcHJvdmlkZXIudXNlVmFsdWUgIT0gdW5kZWZpbmVkO1xufVxuIiwiZXhwb3J0IHZhciBJTkpFQ1RJT05fVE9LRU5fTUVUQURBVEFfS0VZID0gXCJpbmplY3Rpb25Ub2tlbnNcIjtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJhbUluZm8odGFyZ2V0KSB7XG4gICAgdmFyIHBhcmFtcyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCB0YXJnZXQpIHx8IFtdO1xuICAgIHZhciBpbmplY3Rpb25Ub2tlbnMgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKElOSkVDVElPTl9UT0tFTl9NRVRBREFUQV9LRVksIHRhcmdldCkgfHwge307XG4gICAgT2JqZWN0LmtleXMoaW5qZWN0aW9uVG9rZW5zKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcGFyYW1zWytrZXldID0gaW5qZWN0aW9uVG9rZW5zW2tleV07XG4gICAgfSk7XG4gICAgcmV0dXJuIHBhcmFtcztcbn1cbmV4cG9ydCBmdW5jdGlvbiBkZWZpbmVJbmplY3Rpb25Ub2tlbk1ldGFkYXRhKGRhdGEsIHRyYW5zZm9ybSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBfcHJvcGVydHlLZXksIHBhcmFtZXRlckluZGV4KSB7XG4gICAgICAgIHZhciBkZXNjcmlwdG9ycyA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoSU5KRUNUSU9OX1RPS0VOX01FVEFEQVRBX0tFWSwgdGFyZ2V0KSB8fCB7fTtcbiAgICAgICAgZGVzY3JpcHRvcnNbcGFyYW1ldGVySW5kZXhdID0gdHJhbnNmb3JtXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICB0b2tlbjogZGF0YSxcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zZm9ybS50cmFuc2Zvcm1Ub2tlbixcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm1BcmdzOiB0cmFuc2Zvcm0uYXJncyB8fCBbXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiBkYXRhO1xuICAgICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKElOSkVDVElPTl9UT0tFTl9NRVRBREFUQV9LRVksIGRlc2NyaXB0b3JzLCB0YXJnZXQpO1xuICAgIH07XG59XG4iLCJ2YXIgUmVnaXN0cnlCYXNlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBSZWdpc3RyeUJhc2UoKSB7XG4gICAgICAgIHRoaXMuX3JlZ2lzdHJ5TWFwID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBSZWdpc3RyeUJhc2UucHJvdG90eXBlLmVudHJpZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZWdpc3RyeU1hcC5lbnRyaWVzKCk7XG4gICAgfTtcbiAgICBSZWdpc3RyeUJhc2UucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgdGhpcy5lbnN1cmUoa2V5KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlZ2lzdHJ5TWFwLmdldChrZXkpO1xuICAgIH07XG4gICAgUmVnaXN0cnlCYXNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHRoaXMuZW5zdXJlKGtleSk7XG4gICAgICAgIHZhciB2YWx1ZSA9IHRoaXMuX3JlZ2lzdHJ5TWFwLmdldChrZXkpO1xuICAgICAgICByZXR1cm4gdmFsdWVbdmFsdWUubGVuZ3RoIC0gMV0gfHwgbnVsbDtcbiAgICB9O1xuICAgIFJlZ2lzdHJ5QmFzZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbnN1cmUoa2V5KTtcbiAgICAgICAgdGhpcy5fcmVnaXN0cnlNYXAuZ2V0KGtleSkucHVzaCh2YWx1ZSk7XG4gICAgfTtcbiAgICBSZWdpc3RyeUJhc2UucHJvdG90eXBlLnNldEFsbCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3JlZ2lzdHJ5TWFwLnNldChrZXksIHZhbHVlKTtcbiAgICB9O1xuICAgIFJlZ2lzdHJ5QmFzZS5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICB0aGlzLmVuc3VyZShrZXkpO1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVnaXN0cnlNYXAuZ2V0KGtleSkubGVuZ3RoID4gMDtcbiAgICB9O1xuICAgIFJlZ2lzdHJ5QmFzZS5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX3JlZ2lzdHJ5TWFwLmNsZWFyKCk7XG4gICAgfTtcbiAgICBSZWdpc3RyeUJhc2UucHJvdG90eXBlLmVuc3VyZSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9yZWdpc3RyeU1hcC5oYXMoa2V5KSkge1xuICAgICAgICAgICAgdGhpcy5fcmVnaXN0cnlNYXAuc2V0KGtleSwgW10pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gUmVnaXN0cnlCYXNlO1xufSgpKTtcbmV4cG9ydCBkZWZhdWx0IFJlZ2lzdHJ5QmFzZTtcbiIsImltcG9ydCB7IF9fZXh0ZW5kcyB9IGZyb20gXCJ0c2xpYlwiO1xuaW1wb3J0IFJlZ2lzdHJ5QmFzZSBmcm9tIFwiLi9yZWdpc3RyeS1iYXNlXCI7XG52YXIgUmVnaXN0cnkgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhSZWdpc3RyeSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBSZWdpc3RyeSgpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlciAhPT0gbnVsbCAmJiBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gUmVnaXN0cnk7XG59KFJlZ2lzdHJ5QmFzZSkpO1xuZXhwb3J0IGRlZmF1bHQgUmVnaXN0cnk7XG4iLCJ2YXIgUmVzb2x1dGlvbkNvbnRleHQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJlc29sdXRpb25Db250ZXh0KCkge1xuICAgICAgICB0aGlzLnNjb3BlZFJlc29sdXRpb25zID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICByZXR1cm4gUmVzb2x1dGlvbkNvbnRleHQ7XG59KCkpO1xuZXhwb3J0IGRlZmF1bHQgUmVzb2x1dGlvbkNvbnRleHQ7XG4iLCJleHBvcnQgZnVuY3Rpb24gaXNEaXNwb3NhYmxlKHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZS5kaXNwb3NlICE9PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB2YXIgZGlzcG9zZUZ1biA9IHZhbHVlLmRpc3Bvc2U7XG4gICAgaWYgKGRpc3Bvc2VGdW4ubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuIiwiZXhwb3J0IHsgZGVmYXVsdCBhcyBMaWZlY3ljbGUgfSBmcm9tIFwiLi9saWZlY3ljbGVcIjtcbiIsInZhciBMaWZlY3ljbGU7XG4oZnVuY3Rpb24gKExpZmVjeWNsZSkge1xuICAgIExpZmVjeWNsZVtMaWZlY3ljbGVbXCJUcmFuc2llbnRcIl0gPSAwXSA9IFwiVHJhbnNpZW50XCI7XG4gICAgTGlmZWN5Y2xlW0xpZmVjeWNsZVtcIlNpbmdsZXRvblwiXSA9IDFdID0gXCJTaW5nbGV0b25cIjtcbiAgICBMaWZlY3ljbGVbTGlmZWN5Y2xlW1wiUmVzb2x1dGlvblNjb3BlZFwiXSA9IDJdID0gXCJSZXNvbHV0aW9uU2NvcGVkXCI7XG4gICAgTGlmZWN5Y2xlW0xpZmVjeWNsZVtcIkNvbnRhaW5lclNjb3BlZFwiXSA9IDNdID0gXCJDb250YWluZXJTY29wZWRcIjtcbn0pKExpZmVjeWNsZSB8fCAoTGlmZWN5Y2xlID0ge30pKTtcbmV4cG9ydCBkZWZhdWx0IExpZmVjeWNsZTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBkZWZpbml0aW9uKSB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG5cdH1cbn0pKCk7IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqLCBwcm9wKSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTsgfSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSBpcyByZWZlcmVuY2VkIGJ5IG90aGVyIG1vZHVsZXMgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvbWFpbi50c1wiKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==