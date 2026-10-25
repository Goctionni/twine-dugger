// The code uses Map.prototype.getOrInsert and getOrInsertComputed (Chrome 145, Firefox 144), but
// the Node that runs the tests may not have them yet
for (const Collection of [Map, WeakMap] as const) {
  const prototype = Collection.prototype as Map<unknown, unknown>;

  prototype.getOrInsert ??= function (key, value) {
    if (!this.has(key)) this.set(key, value);
    return this.get(key);
  };
  prototype.getOrInsertComputed ??= function (key, callback) {
    if (!this.has(key)) this.set(key, callback(key));
    return this.get(key);
  };
}
