// node:events
var SymbolFor = Symbol.for;
var kCapture = Symbol("kCapture");
var kErrorMonitor = SymbolFor("events.errorMonitor");
var kMaxEventTargetListeners = Symbol("events.maxEventTargetListeners");
var kMaxEventTargetListenersWarned = Symbol("events.maxEventTargetListenersWarned");
var kRejection = SymbolFor("nodejs.rejection");
var captureRejectionSymbol = SymbolFor("nodejs.rejection");
var ArrayPrototypeSlice = Array.prototype.slice;
var defaultMaxListeners = 10;
var EventEmitter = function(opts) {
  if (this._events === undefined || this._events === this.__proto__._events)
    this._events = { __proto__: null }, this._eventsCount = 0;
  if (this._maxListeners ??= undefined, this[kCapture] = opts?.captureRejections ? Boolean(opts?.captureRejections) : EventEmitterPrototype[kCapture])
    this.emit = emitWithRejectionCapture;
};
var EventEmitterPrototype = EventEmitter.prototype = {};
EventEmitterPrototype._events = undefined;
EventEmitterPrototype._eventsCount = 0;
EventEmitterPrototype._maxListeners = undefined;
EventEmitterPrototype.setMaxListeners = function(n) {
  return validateNumber(n, "setMaxListeners", 0), this._maxListeners = n, this;
};
EventEmitterPrototype.constructor = EventEmitter;
EventEmitterPrototype.getMaxListeners = function() {
  return this?._maxListeners ?? defaultMaxListeners;
};
function emitError(emitter, args) {
  var { _events: events } = emitter;
  if (args[0] ??= Error("Unhandled error."), !events)
    throw args[0];
  var errorMonitor = events[kErrorMonitor];
  if (errorMonitor)
    for (var handler of ArrayPrototypeSlice.call(errorMonitor))
      handler.apply(emitter, args);
  var handlers = events.error;
  if (!handlers)
    throw args[0];
  for (var handler of ArrayPrototypeSlice.call(handlers))
    handler.apply(emitter, args);
  return true;
}
function addCatch(emitter, promise, type, args) {
  promise.then(undefined, function(err) {
    queueMicrotask(() => emitUnhandledRejectionOrErr(emitter, err, type, args));
  });
}
function emitUnhandledRejectionOrErr(emitter, err, type, args) {
  if (typeof emitter[kRejection] === "function")
    emitter[kRejection](err, type, ...args);
  else
    try {
      emitter[kCapture] = false, emitter.emit("error", err);
    } finally {
      emitter[kCapture] = true;
    }
}
var emitWithoutRejectionCapture = function(type, ...args) {
  if (type === "error")
    return emitError(this, args);
  var { _events: events } = this;
  if (events === undefined)
    return false;
  var handlers = events[type];
  if (handlers === undefined)
    return false;
  let maybeClonedHandlers = handlers.length > 1 ? handlers.slice() : handlers;
  for (let i = 0, { length } = maybeClonedHandlers;i < length; i++) {
    let handler = maybeClonedHandlers[i];
    switch (args.length) {
      case 0:
        handler.call(this);
        break;
      case 1:
        handler.call(this, args[0]);
        break;
      case 2:
        handler.call(this, args[0], args[1]);
        break;
      case 3:
        handler.call(this, args[0], args[1], args[2]);
        break;
      default:
        handler.apply(this, args);
        break;
    }
  }
  return true;
};
var emitWithRejectionCapture = function(type, ...args) {
  if (type === "error")
    return emitError(this, args);
  var { _events: events } = this;
  if (events === undefined)
    return false;
  var handlers = events[type];
  if (handlers === undefined)
    return false;
  let maybeClonedHandlers = handlers.length > 1 ? handlers.slice() : handlers;
  for (let i = 0, { length } = maybeClonedHandlers;i < length; i++) {
    let handler = maybeClonedHandlers[i], result;
    switch (args.length) {
      case 0:
        result = handler.call(this);
        break;
      case 1:
        result = handler.call(this, args[0]);
        break;
      case 2:
        result = handler.call(this, args[0], args[1]);
        break;
      case 3:
        result = handler.call(this, args[0], args[1], args[2]);
        break;
      default:
        result = handler.apply(this, args);
        break;
    }
    if (result !== undefined && typeof result?.then === "function" && result.then === Promise.prototype.then)
      addCatch(this, result, type, args);
  }
  return true;
};
EventEmitterPrototype.emit = emitWithoutRejectionCapture;
EventEmitterPrototype.addListener = function(type, fn) {
  checkListener(fn);
  var events = this._events;
  if (!events)
    events = this._events = { __proto__: null }, this._eventsCount = 0;
  else if (events.newListener)
    this.emit("newListener", type, fn.listener ?? fn);
  var handlers = events[type];
  if (!handlers)
    events[type] = [fn], this._eventsCount++;
  else {
    handlers.push(fn);
    var m = this._maxListeners ?? defaultMaxListeners;
    if (m > 0 && handlers.length > m && !handlers.warned)
      overflowWarning(this, type, handlers);
  }
  return this;
};
EventEmitterPrototype.on = EventEmitterPrototype.addListener;
EventEmitterPrototype.prependListener = function(type, fn) {
  checkListener(fn);
  var events = this._events;
  if (!events)
    events = this._events = { __proto__: null }, this._eventsCount = 0;
  else if (events.newListener)
    this.emit("newListener", type, fn.listener ?? fn);
  var handlers = events[type];
  if (!handlers)
    events[type] = [fn], this._eventsCount++;
  else {
    handlers.unshift(fn);
    var m = this._maxListeners ?? defaultMaxListeners;
    if (m > 0 && handlers.length > m && !handlers.warned)
      overflowWarning(this, type, handlers);
  }
  return this;
};
function overflowWarning(emitter, type, handlers) {
  handlers.warned = true;
  let warn = Error(`Possible EventEmitter memory leak detected. ${handlers.length} ${String(type)} listeners added to [${emitter.constructor.name}]. Use emitter.setMaxListeners() to increase limit`);
  warn.name = "MaxListenersExceededWarning", warn.emitter = emitter, warn.type = type, warn.count = handlers.length, console.warn(warn);
}
function onceWrapper(type, listener, ...args) {
  this.removeListener(type, listener), listener.apply(this, args);
}
EventEmitterPrototype.once = function(type, fn) {
  checkListener(fn);
  let bound = onceWrapper.bind(this, type, fn);
  return bound.listener = fn, this.addListener(type, bound), this;
};
EventEmitterPrototype.prependOnceListener = function(type, fn) {
  checkListener(fn);
  let bound = onceWrapper.bind(this, type, fn);
  return bound.listener = fn, this.prependListener(type, bound), this;
};
EventEmitterPrototype.removeListener = function(type, fn) {
  checkListener(fn);
  var { _events: events } = this;
  if (!events)
    return this;
  var handlers = events[type];
  if (!handlers)
    return this;
  var length = handlers.length;
  let position = -1;
  for (let i = length - 1;i >= 0; i--)
    if (handlers[i] === fn || handlers[i].listener === fn) {
      position = i;
      break;
    }
  if (position < 0)
    return this;
  if (position === 0)
    handlers.shift();
  else
    handlers.splice(position, 1);
  if (handlers.length === 0)
    delete events[type], this._eventsCount--;
  return this;
};
EventEmitterPrototype.off = EventEmitterPrototype.removeListener;
EventEmitterPrototype.removeAllListeners = function(type) {
  var { _events: events } = this;
  if (type && events) {
    if (events[type])
      delete events[type], this._eventsCount--;
  } else
    this._events = { __proto__: null };
  return this;
};
EventEmitterPrototype.listeners = function(type) {
  var { _events: events } = this;
  if (!events)
    return [];
  var handlers = events[type];
  if (!handlers)
    return [];
  return handlers.map((x) => x.listener ?? x);
};
EventEmitterPrototype.rawListeners = function(type) {
  var { _events } = this;
  if (!_events)
    return [];
  var handlers = _events[type];
  if (!handlers)
    return [];
  return handlers.slice();
};
EventEmitterPrototype.listenerCount = function(type) {
  var { _events: events } = this;
  if (!events)
    return 0;
  return events[type]?.length ?? 0;
};
EventEmitterPrototype.eventNames = function() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};
EventEmitterPrototype[kCapture] = false;
function once2(emitter, type, options) {
  var signal = options?.signal;
  if (validateAbortSignal(signal, "options.signal"), signal?.aborted)
    throw new AbortError(undefined, { cause: signal?.reason });
  let { resolve, reject, promise } = $newPromiseCapability(Promise), errorListener = (err) => {
    if (emitter.removeListener(type, resolver), signal != null)
      eventTargetAgnosticRemoveListener(signal, "abort", abortListener);
    reject(err);
  }, resolver = (...args) => {
    if (typeof emitter.removeListener === "function")
      emitter.removeListener("error", errorListener);
    if (signal != null)
      eventTargetAgnosticRemoveListener(signal, "abort", abortListener);
    resolve(args);
  };
  if (eventTargetAgnosticAddListener(emitter, type, resolver, { once: true }), type !== "error" && typeof emitter.once === "function")
    emitter.once("error", errorListener);
  function abortListener() {
    eventTargetAgnosticRemoveListener(emitter, type, resolver), eventTargetAgnosticRemoveListener(emitter, "error", errorListener), reject(new AbortError(undefined, { cause: signal?.reason }));
  }
  if (signal != null)
    eventTargetAgnosticAddListener(signal, "abort", abortListener, { once: true });
  return promise;
}
function getEventListeners(emitter, type) {
  return emitter.listeners(type);
}
function setMaxListeners2(n, ...eventTargets) {
  validateNumber(n, "setMaxListeners", 0);
  var length;
  if (eventTargets && (length = eventTargets.length))
    for (let i = 0;i < length; i++)
      eventTargets[i].setMaxListeners(n);
  else
    defaultMaxListeners = n;
}
function listenerCount2(emitter, type) {
  return emitter.listenerCount(type);
}
function eventTargetAgnosticRemoveListener(emitter, name, listener, flags) {
  if (typeof emitter.removeListener === "function")
    emitter.removeListener(name, listener);
  else
    emitter.removeEventListener(name, listener, flags);
}
function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === "function")
    if (flags.once)
      emitter.once(name, listener);
    else
      emitter.on(name, listener);
  else
    emitter.addEventListener(name, listener, flags);
}

class AbortError extends Error {
  constructor(message = "The operation was aborted", options = undefined) {
    if (options !== undefined && typeof options !== "object")
      throw ERR_INVALID_ARG_TYPE("options", "Object", options);
    super(message, options);
    this.code = "ABORT_ERR", this.name = "AbortError";
  }
}
function ERR_INVALID_ARG_TYPE(name, type, value) {
  let err = TypeError(`The "${name}" argument must be of type ${type}. Received ${value}`);
  return err.code = "ERR_INVALID_ARG_TYPE", err;
}
function ERR_OUT_OF_RANGE(name, range, value) {
  let err = RangeError(`The "${name}" argument is out of range. It must be ${range}. Received ${value}`);
  return err.code = "ERR_OUT_OF_RANGE", err;
}
function validateAbortSignal(signal, name) {
  if (signal !== undefined && (signal === null || typeof signal !== "object" || !("aborted" in signal)))
    throw ERR_INVALID_ARG_TYPE(name, "AbortSignal", signal);
}
function validateNumber(value, name, min, max) {
  if (typeof value !== "number")
    throw ERR_INVALID_ARG_TYPE(name, "number", value);
  if (min != null && value < min || max != null && value > max || (min != null || max != null) && Number.isNaN(value))
    throw ERR_OUT_OF_RANGE(name, `${min != null ? `>= ${min}` : ""}${min != null && max != null ? " && " : ""}${max != null ? `<= ${max}` : ""}`, value);
}
function checkListener(listener) {
  if (typeof listener !== "function")
    throw TypeError("The listener must be a function");
}
function validateBoolean(value, name) {
  if (typeof value !== "boolean")
    throw ERR_INVALID_ARG_TYPE(name, "boolean", value);
}
function getMaxListeners2(emitterOrTarget) {
  return emitterOrTarget?._maxListeners ?? defaultMaxListeners;
}
function addAbortListener(signal, listener) {
  if (signal === undefined)
    throw ERR_INVALID_ARG_TYPE("signal", "AbortSignal", signal);
  if (validateAbortSignal(signal, "signal"), typeof listener !== "function")
    throw ERR_INVALID_ARG_TYPE("listener", "function", listener);
  let removeEventListener;
  if (signal.aborted)
    queueMicrotask(() => listener());
  else
    signal.addEventListener("abort", listener, { __proto__: null, once: true }), removeEventListener = () => {
      signal.removeEventListener("abort", listener);
    };
  return { __proto__: null, [Symbol.dispose]() {
    removeEventListener?.();
  } };
}
Object.defineProperties(EventEmitter, { captureRejections: { get() {
  return EventEmitterPrototype[kCapture];
}, set(value) {
  validateBoolean(value, "EventEmitter.captureRejections"), EventEmitterPrototype[kCapture] = value;
}, enumerable: true }, defaultMaxListeners: { enumerable: true, get: () => {
  return defaultMaxListeners;
}, set: (arg) => {
  validateNumber(arg, "defaultMaxListeners", 0), defaultMaxListeners = arg;
} }, kMaxEventTargetListeners: { value: kMaxEventTargetListeners, enumerable: false, configurable: false, writable: false }, kMaxEventTargetListenersWarned: { value: kMaxEventTargetListenersWarned, enumerable: false, configurable: false, writable: false } });
Object.assign(EventEmitter, { once: once2, getEventListeners, getMaxListeners: getMaxListeners2, setMaxListeners: setMaxListeners2, EventEmitter, usingDomains: false, captureRejectionSymbol, errorMonitor: kErrorMonitor, addAbortListener, init: EventEmitter, listenerCount: listenerCount2 });

// src/RequestManager.ts
var defaultNextRequest = () => {
  let lastId = -1;
  return () => ++lastId;
};

class RequestManager {
  transports;
  connectPromise;
  batch = [];
  requestChannel;
  requests;
  batchStarted = false;
  lastId = -1;
  nextID;
  constructor(transports, nextID = defaultNextRequest()) {
    this.transports = transports;
    this.requests = {};
    this.connectPromise = this.connect();
    this.requestChannel = new EventEmitter;
    this.nextID = nextID;
  }
  connect() {
    return Promise.all(this.transports.map(async (transport) => {
      transport.subscribe("error", this.handleError.bind(this));
      transport.subscribe("notification", this.handleNotification.bind(this));
      await transport.connect();
    }));
  }
  getPrimaryTransport() {
    return this.transports[0];
  }
  async request(requestObject, notification = false, timeout) {
    const internalID = this.nextID().toString();
    const id = notification ? null : internalID;
    const payload = {
      request: this.makeRequest(requestObject.method, requestObject.params || [], id),
      internalID
    };
    if (this.batchStarted) {
      const result = new Promise((resolve, reject) => {
        this.batch.push({ resolve, reject, request: payload });
      });
      return result;
    }
    return this.getPrimaryTransport().sendData(payload, timeout);
  }
  close() {
    this.requestChannel.removeAllListeners();
    this.transports.forEach((transport) => {
      transport.unsubscribe();
      transport.close();
    });
  }
  startBatch() {
    this.batchStarted = true;
  }
  stopBatch() {
    if (this.batchStarted === false) {
      throw new Error("cannot end that which has never started");
    }
    if (this.batch.length === 0) {
      this.batchStarted = false;
      return;
    }
    this.getPrimaryTransport().sendData(this.batch);
    this.batch = [];
    this.batchStarted = false;
  }
  makeRequest(method, params, id) {
    if (id) {
      return { jsonrpc: "2.0", id, method, params };
    }
    return { jsonrpc: "2.0", method, params };
  }
  handleError(data) {
    this.requestChannel.emit("error", data);
  }
  handleNotification(data) {
    this.requestChannel.emit("notification", data);
  }
}
var RequestManager_default = RequestManager;

// src/Error.ts
var ERR_TIMEOUT = 7777;
var ERR_UNKNOWN = 7979;

class JSONRPCError extends Error {
  message;
  code;
  data;
  constructor(message, code, data) {
    super(message);
    this.message = message;
    this.code = code;
    this.data = data;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
var convertJSONToRPCError = (payload) => {
  if (payload.error) {
    const { message, code, data } = payload.error;
    return new JSONRPCError(message, code, data);
  }
  return new JSONRPCError("Unknown error", ERR_UNKNOWN, payload);
};

// src/transports/TransportRequestManager.ts
class TransportRequestManager {
  transportEventChannel;
  pendingRequest;
  pendingBatchRequest;
  constructor() {
    this.pendingRequest = {};
    this.pendingBatchRequest = {};
    this.transportEventChannel = new EventEmitter;
  }
  addRequest(data, timeout) {
    this.transportEventChannel.emit("pending", data);
    if (data instanceof Array) {
      this.addBatchReq(data, timeout);
      return Promise.resolve();
    }
    return this.addReq(data.internalID, timeout);
  }
  settlePendingRequest(request, error) {
    request.forEach((req) => {
      const resolver = this.pendingRequest[req.internalID];
      delete this.pendingBatchRequest[req.internalID];
      if (resolver === undefined) {
        return;
      }
      if (error) {
        resolver.reject(error);
        return;
      }
      resolver.resolve();
      if (req.request.id === null || req.request.id === undefined) {
        delete this.pendingRequest[req.internalID];
      }
    });
  }
  isPendingRequest(id) {
    return Object.prototype.hasOwnProperty.call(this.pendingRequest, id);
  }
  resolveResponse(payload, emitError2 = true) {
    let data = payload;
    try {
      data = JSON.parse(payload);
      if (this.checkJSONRPC(data) === false) {
        return;
      }
      if (data instanceof Array) {
        return this.resolveBatch(data, emitError2);
      }
      return this.resolveRes(data, emitError2);
    } catch (e) {
      const err = new JSONRPCError("Bad response format", ERR_UNKNOWN, payload);
      if (emitError2) {
        this.transportEventChannel.emit("error", err);
      }
      return err;
    }
  }
  addBatchReq(batches, _timeout) {
    batches.forEach((batch) => {
      const { resolve, reject } = batch;
      const { internalID } = batch.request;
      this.pendingBatchRequest[internalID] = true;
      this.pendingRequest[internalID] = { resolve, reject };
    });
    return Promise.resolve();
  }
  addReq(id, timeout) {
    return new Promise((resolve, reject) => {
      if (timeout !== null && timeout) {
        this.setRequestTimeout(id, timeout, reject);
      }
      this.pendingRequest[id] = { resolve, reject };
    });
  }
  checkJSONRPC(data) {
    let payload = [data];
    if (data instanceof Array) {
      payload = data;
    }
    return payload.every((datum) => datum.result !== undefined || datum.error !== undefined || datum.method !== undefined);
  }
  processResult(payload, prom) {
    if (payload.error) {
      const err = convertJSONToRPCError(payload);
      prom.reject(err);
      return;
    }
    prom.resolve(payload.result);
  }
  resolveBatch(payload, emitError2) {
    const results = payload.map((datum) => {
      return this.resolveRes(datum, emitError2);
    });
    const errors = results.filter((result) => result);
    if (errors.length > 0) {
      return errors[0];
    }
    return;
  }
  resolveRes(data, emitError2) {
    const { id, error } = data;
    const status = this.pendingRequest[id];
    if (status) {
      delete this.pendingRequest[id];
      this.processResult(data, status);
      this.transportEventChannel.emit("response", data);
      return;
    }
    if (id === undefined && error === undefined) {
      this.transportEventChannel.emit("notification", data);
      return;
    }
    let err;
    if (error) {
      err = convertJSONToRPCError(data);
    }
    if (emitError2 && error && err) {
      this.transportEventChannel.emit("error", err);
    }
    return err;
  }
  setRequestTimeout(id, timeout, reject) {
    setTimeout(() => {
      delete this.pendingRequest[id];
      reject(new JSONRPCError(`Request timeout request took longer than ${timeout} ms to resolve`, ERR_TIMEOUT));
    }, timeout);
  }
}

// src/transports/Transport.ts
class Transport {
  transportRequestManager;
  constructor() {
    this.transportRequestManager = new TransportRequestManager;
    this.transportRequestManager.transportEventChannel.on("error", () => {});
  }
  subscribe(event, handler) {
    this.transportRequestManager.transportEventChannel.addListener(event, handler);
  }
  unsubscribe(event, handler) {
    if (!event) {
      return this.transportRequestManager.transportEventChannel.removeAllListeners();
    }
    if (event && handler) {
      this.transportRequestManager.transportEventChannel.removeListener(event, handler);
    }
  }
  parseData(data) {
    if (data instanceof Array) {
      return data.map((batch) => batch.request.request);
    }
    return data.request;
  }
}

// src/Request.ts
var isNotification = (data) => {
  return data.request.id === undefined || data.request.id === null;
};
var getBatchRequests = (data) => {
  if (data instanceof Array) {
    return data.filter((datum) => {
      const id = datum.request.request.id;
      return id !== null && id !== undefined;
    }).map((batchRequest) => {
      return batchRequest.request;
    });
  }
  return [];
};
var getNotifications = (data) => {
  if (data instanceof Array) {
    return data.filter((datum) => {
      return isNotification(datum.request);
    }).map((batchRequest) => {
      return batchRequest.request;
    });
  }
  if (isNotification(data)) {
    return [data];
  }
  return [];
};

// src/transports/EventEmitterTransport.ts
class EventEmitterTransport extends Transport {
  connection;
  reqUri;
  resUri;
  constructor(destEmitter, reqUri, resUri) {
    super();
    this.connection = destEmitter;
    this.reqUri = reqUri;
    this.resUri = resUri;
  }
  connect() {
    this.connection.on(this.resUri, (data) => {
      this.transportRequestManager.resolveResponse(data);
    });
    return Promise.resolve();
  }
  sendData(data, timeout = null) {
    const prom = this.transportRequestManager.addRequest(data, timeout);
    const notifications = getNotifications(data);
    const parsedData = this.parseData(data);
    try {
      this.connection.emit(this.reqUri, parsedData);
      this.transportRequestManager.settlePendingRequest(notifications);
      return prom;
    } catch (e) {
      const error = e;
      const responseErr = new JSONRPCError(error.message, ERR_UNKNOWN, error);
      this.transportRequestManager.settlePendingRequest(notifications, responseErr);
      return Promise.reject(responseErr);
    }
  }
  close() {
    this.connection.removeAllListeners();
  }
}
var EventEmitterTransport_default = EventEmitterTransport;

// src/transports/HTTPTransport.ts
class HTTPTransport extends Transport {
  uri;
  credentials;
  headers;
  injectedFetcher;
  constructor(uri, options) {
    super();
    this.uri = uri;
    this.credentials = options && options.credentials;
    this.headers = HTTPTransport.setupHeaders(options && options.headers);
    this.injectedFetcher = options?.fetcher;
  }
  connect() {
    return Promise.resolve();
  }
  async sendData(data, timeout = null) {
    const prom = this.transportRequestManager.addRequest(data, timeout);
    const notifications = getNotifications(data);
    const batch = getBatchRequests(data);
    const fetcher = this.injectedFetcher || fetch;
    try {
      const result = await fetcher(this.uri, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(this.parseData(data)),
        credentials: this.credentials
      });
      this.transportRequestManager.settlePendingRequest(notifications);
      if (this.onlyNotifications(data)) {
        return Promise.resolve();
      }
      const body = await result.text();
      const responseErr = this.transportRequestManager.resolveResponse(body);
      if (responseErr) {
        this.transportRequestManager.settlePendingRequest(batch, responseErr);
        return Promise.reject(responseErr);
      }
    } catch (e) {
      const error = e;
      const responseErr = new JSONRPCError(error.message, ERR_UNKNOWN, error);
      this.transportRequestManager.settlePendingRequest(notifications, responseErr);
      this.transportRequestManager.settlePendingRequest(getBatchRequests(data), responseErr);
      return Promise.reject(responseErr);
    }
    return prom;
  }
  close() {}
  onlyNotifications = (data) => {
    if (data instanceof Array) {
      return data.every((datum) => datum.request.request.id === null || datum.request.request.id === undefined);
    }
    return data.request.id === null || data.request.id === undefined;
  };
  static setupHeaders(headerOptions) {
    const headers = new Headers(headerOptions);
    headers.set("Content-Type", "application/json");
    return headers;
  }
}
var HTTPTransport_default = HTTPTransport;

// node_modules/isomorphic-ws/browser.js
var ws = null;
if (typeof WebSocket !== "undefined") {
  ws = WebSocket;
} else if (typeof MozWebSocket !== "undefined") {
  ws = MozWebSocket;
} else if (typeof global !== "undefined") {
  ws = global.WebSocket || global.MozWebSocket;
} else if (typeof window !== "undefined") {
  ws = window.WebSocket || window.MozWebSocket;
} else if (typeof self !== "undefined") {
  ws = self.WebSocket || self.MozWebSocket;
}
var browser_default = ws;

// src/transports/WebSocketTransport.ts
class WebSocketTransport extends Transport {
  connection;
  uri;
  constructor(uri) {
    super();
    this.uri = uri;
    this.connection = new browser_default(uri);
  }
  connect() {
    return new Promise((resolve, _reject) => {
      const cb = () => {
        this.connection.removeEventListener("open", cb);
        resolve(undefined);
      };
      this.connection.addEventListener("open", cb);
      this.connection.addEventListener("message", (message) => {
        const { data } = message;
        this.transportRequestManager.resolveResponse(data);
        return;
      });
    });
  }
  async sendData(data, timeout = 5000) {
    let prom = this.transportRequestManager.addRequest(data, timeout);
    const notifications = getNotifications(data);
    try {
      this.connection.send(JSON.stringify(this.parseData(data)));
      this.transportRequestManager.settlePendingRequest(notifications);
    } catch (err) {
      const jsonError = new JSONRPCError(err.message, ERR_UNKNOWN, err);
      this.transportRequestManager.settlePendingRequest(notifications, jsonError);
      this.transportRequestManager.settlePendingRequest(getBatchRequests(data), jsonError);
      prom = Promise.reject(jsonError);
    }
    return prom;
  }
  close() {
    this.connection.close();
  }
}
var WebSocketTransport_default = WebSocketTransport;

// src/transports/PostMessageWindowTransport.ts
var openPopup = (url) => {
  const width = 400;
  const height = window.screen.height;
  const left = 0;
  const top = 0;
  return window.open(url, "inspector:popup", `left=${left},top=${top},width=${width},height=${height},resizable,scrollbars=yes,status=1`);
};

class PostMessageTransport extends Transport {
  uri;
  frame;
  postMessageID;
  constructor(uri) {
    super();
    this.uri = uri;
    this.postMessageID = `post-message-transport-${Math.random()}`;
  }
  createWindow(uri) {
    return new Promise((resolve, _reject) => {
      let frame;
      frame = openPopup(uri);
      setTimeout(() => {
        resolve(frame);
      }, 3000);
    });
  }
  messageHandler = (ev) => {
    this.transportRequestManager.resolveResponse(JSON.stringify(ev.data));
  };
  async connect() {
    const urlRegex = /^(http|https):\/\/.*$/;
    if (!urlRegex.test(this.uri)) {
      throw new Error("Bad URI");
    }
    this.frame = await this.createWindow(this.uri);
    window.addEventListener("message", this.messageHandler);
  }
  async sendData(data, _timeout = 5000) {
    const prom = this.transportRequestManager.addRequest(data, null);
    const notifications = getNotifications(data);
    if (this.frame) {
      this.frame.postMessage(data.request, this.uri);
      this.transportRequestManager.settlePendingRequest(notifications);
    }
    return prom;
  }
  close() {
    if (this.frame) {
      window.removeEventListener("message", this.messageHandler);
      this.frame.close();
    }
  }
}
var PostMessageWindowTransport_default = PostMessageTransport;

// src/transports/PostMessageIframeTransport.ts
class PostMessageIframeTransport extends Transport {
  uri;
  frame;
  postMessageID;
  constructor(uri) {
    super();
    this.uri = uri;
    this.postMessageID = `post-message-transport-${Math.random()}`;
  }
  createWindow(uri) {
    return new Promise((resolve, _reject) => {
      let frame;
      const iframe = document.createElement("iframe");
      iframe.setAttribute("id", this.postMessageID);
      iframe.setAttribute("width", "0px");
      iframe.setAttribute("height", "0px");
      iframe.setAttribute("style", "visiblity:hidden;border:none;outline:none;");
      iframe.addEventListener("load", () => {
        resolve(frame);
      });
      iframe.setAttribute("src", uri);
      window.document.body.appendChild(iframe);
      frame = iframe.contentWindow;
    });
  }
  messageHandler = (ev) => {
    this.transportRequestManager.resolveResponse(JSON.stringify(ev.data));
  };
  async connect() {
    const urlRegex = /^(http|https):\/\/.*$/;
    if (!urlRegex.test(this.uri)) {
      throw new Error("Bad URI");
    }
    this.frame = await this.createWindow(this.uri);
    window.addEventListener("message", this.messageHandler);
  }
  async sendData(data, _timeout = 5000) {
    const prom = this.transportRequestManager.addRequest(data, null);
    const notifications = getNotifications(data);
    if (this.frame) {
      this.frame.postMessage(data.request, "*");
      this.transportRequestManager.settlePendingRequest(notifications);
    }
    return prom;
  }
  close() {
    const el = document.getElementById(this.postMessageID);
    el?.remove();
    window.removeEventListener("message", this.messageHandler);
  }
}
var PostMessageIframeTransport_default = PostMessageIframeTransport;

// src/transports/framing/NewlineDelimitedMessageFramer.ts
class NewlineDelimitedMessageFramer {
  encoder = new TextEncoder;
  decoder = new TextDecoder("utf-8");
  buffer = "";
  encode(message) {
    return this.encoder.encode(`${message}
`);
  }
  decode(chunk) {
    this.buffer += this.decoder.decode(chunk, { stream: true });
    const parts = this.buffer.split(`
`);
    this.buffer = parts.pop() ?? "";
    return parts.map((part) => part.trim()).filter((part) => part.length > 0);
  }
  reset() {
    this.buffer = "";
    this.decoder.decode();
  }
}

// src/transports/StreamTransport.ts
class StreamTransport extends Transport {
  provider;
  framer;
  onLog;
  streams;
  writer;
  reader;
  logReader;
  closed = false;
  connecting;
  closing;
  constructor(options) {
    super();
    this.provider = options.provider;
    this.framer = options.framer ?? new NewlineDelimitedMessageFramer;
    this.onLog = options.onLog;
  }
  async connect() {
    if (!this.closed && this.streams)
      return;
    if (!this.connecting) {
      const attempt = this.reopen().finally(() => {
        if (this.connecting === attempt)
          this.connecting = undefined;
      });
      this.connecting = attempt;
    }
    return this.connecting;
  }
  async reopen() {
    if (this.closing) {
      await this.closing;
      this.closing = undefined;
    }
    this.closed = false;
    await this.open();
  }
  async open() {
    const streams = await this.provider();
    this.streams = streams;
    this.writer = streams.writable.getWriter();
    this.reader = streams.readable.getReader();
    this.pump(this.reader);
    if (streams.logStream && this.onLog) {
      this.logReader = streams.logStream.getReader();
      this.pumpLog(this.logReader);
    }
  }
  async sendData(data, timeout = null) {
    const prom = this.transportRequestManager.addRequest(data, timeout);
    const notifications = getNotifications(data);
    try {
      await this.write(this.framer.encode(JSON.stringify(this.parseData(data))));
      this.transportRequestManager.settlePendingRequest(notifications);
    } catch (e) {
      const error = e;
      const responseErr = new JSONRPCError(error.message, ERR_UNKNOWN, error);
      this.transportRequestManager.settlePendingRequest(notifications, responseErr);
      this.transportRequestManager.settlePendingRequest(getBatchRequests(data), responseErr);
      return Promise.reject(responseErr);
    }
    return prom;
  }
  sendRaw(payload) {
    return this.write(this.framer.encode(payload));
  }
  close() {
    if (this.closed)
      return;
    this.closed = true;
    const pending = this.connecting;
    this.connecting = undefined;
    if (!pending) {
      this.teardown();
      this.closing = Promise.resolve();
      return;
    }
    const teardown = () => this.teardown();
    this.closing = pending.then(teardown, teardown);
  }
  teardown() {
    const streams = this.streams;
    this.streams = undefined;
    this.reader?.cancel().catch(() => {
      return;
    });
    this.reader = undefined;
    this.logReader?.cancel().catch(() => {
      return;
    });
    this.logReader = undefined;
    if (this.writer) {
      try {
        this.writer.releaseLock();
      } catch {}
      this.writer = undefined;
    }
    Promise.resolve(streams?.dispose?.()).catch(() => {
      return;
    });
  }
  write(frame) {
    if (this.closed || !this.writer) {
      return Promise.reject(new Error("Transport is not connected"));
    }
    return this.writer.write(frame);
  }
  async pump(reader) {
    try {
      for (;; ) {
        const { value, done } = await reader.read();
        if (done)
          break;
        if (!value)
          continue;
        for (const message of this.framer.decode(value)) {
          this.transportRequestManager.resolveResponse(message);
        }
      }
    } catch (e) {
      if (this.closed)
        return;
      const error = e;
      this.transportRequestManager.transportEventChannel.emit("error", new JSONRPCError(error.message, ERR_UNKNOWN, error));
    }
  }
  async pumpLog(reader) {
    const decoder = new TextDecoder("utf-8");
    try {
      for (;; ) {
        const { value, done } = await reader.read();
        if (done)
          break;
        if (value && this.onLog) {
          this.onLog(decoder.decode(value, { stream: true }));
        }
      }
    } catch {}
  }
  static fromStreams(readable, writable, framer) {
    return new StreamTransport({
      provider: () => ({ readable, writable }),
      framer
    });
  }
}
var StreamTransport_default = StreamTransport;

// src/transports/framing/MessageFramer.ts
var concatBytes = (a, b) => {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
};
var indexOfSubarray = (haystack, needle, start = 0) => {
  if (needle.length === 0)
    return start;
  const last = haystack.length - needle.length;
  for (let i = start;i <= last; i++) {
    let matched = true;
    for (let j = 0;j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        matched = false;
        break;
      }
    }
    if (matched)
      return i;
  }
  return -1;
};

// src/transports/framing/ContentLengthMessageFramer.ts
var HEADER_TERMINATOR = new Uint8Array([13, 10, 13, 10]);

class ContentLengthMessageFramer {
  encoder = new TextEncoder;
  decoder = new TextDecoder("utf-8");
  buffer = new Uint8Array(0);
  encode(message) {
    const body = this.encoder.encode(message);
    const header = this.encoder.encode(`Content-Length: ${body.length}\r
\r
`);
    return concatBytes(header, body);
  }
  decode(chunk) {
    this.buffer = concatBytes(this.buffer, chunk);
    const messages = [];
    for (;; ) {
      const headerEnd = indexOfSubarray(this.buffer, HEADER_TERMINATOR);
      if (headerEnd === -1)
        break;
      const bodyStart = headerEnd + HEADER_TERMINATOR.length;
      const header = this.decoder.decode(this.buffer.subarray(0, headerEnd));
      const match = /content-length:\s*(\d+)/i.exec(header);
      if (!match) {
        this.buffer = this.buffer.subarray(bodyStart);
        continue;
      }
      const length = parseInt(match[1], 10);
      if (this.buffer.length < bodyStart + length)
        break;
      const body = this.buffer.subarray(bodyStart, bodyStart + length);
      messages.push(this.decoder.decode(body));
      this.buffer = this.buffer.subarray(bodyStart + length);
    }
    return messages;
  }
  reset() {
    this.buffer = new Uint8Array(0);
  }
}

// src/Client.ts
class Client {
  requestManager;
  constructor(requestManager) {
    this.requestManager = requestManager;
  }
  startBatch() {
    return this.requestManager.startBatch();
  }
  stopBatch() {
    return this.requestManager.stopBatch();
  }
  async request(requestObject, timeout) {
    if (this.requestManager.connectPromise) {
      await this.requestManager.connectPromise;
    }
    return this.requestManager.request(requestObject, false, timeout);
  }
  async notify(requestObject) {
    if (this.requestManager.connectPromise) {
      await this.requestManager.connectPromise;
    }
    return this.requestManager.request(requestObject, true, null);
  }
  onNotification(callback) {
    this.requestManager.requestChannel.addListener("notification", callback);
  }
  onError(callback) {
    this.requestManager.requestChannel.addListener("error", callback);
  }
  close() {
    this.requestManager.close();
  }
}
var Client_default = Client;

// src/index.ts
var src_default = Client_default;
export {
  Client_default as Client,
  ContentLengthMessageFramer,
  EventEmitterTransport_default as EventEmitterTransport,
  HTTPTransport_default as HTTPTransport,
  JSONRPCError,
  NewlineDelimitedMessageFramer,
  PostMessageIframeTransport_default as PostMessageIframeTransport,
  PostMessageWindowTransport_default as PostMessageWindowTransport,
  RequestManager_default as RequestManager,
  StreamTransport_default as StreamTransport,
  WebSocketTransport_default as WebSocketTransport,
  src_default as default
};

//# debugId=E5A96A95274462DB64756E2164756E21
