export function clone<T>(from:T):T {
  var to = {} as T;
  for (var i in from) {
    if (from.hasOwnProperty(i)) {
      to[i] = from[i];
    }
  }
  return to;
}