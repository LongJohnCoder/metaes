import {Environment} from "./types";

export function PutValue(env:Environment, name:string, value:any, isDeclaration:boolean) {
  if (isDeclaration) {
    while (env.locked) {
      env = env.prev;
    }
    if (!(name in env.names)) {
      Object.defineProperty(env.names, name, {
        value: value,
        configurable: false,
        enumerable: true,
        writable: true
      });
    } else if (typeof value !== "undefined") {
      env.names[name] = value;
    }
  } else {
    while (true) {
      if (!env.prev) {
        env.names[name] = value;
        break;
      } else if (name in env.names) {
        env.names[name] = value;
        break;
      }
    }
  }
}

export function GetValue(env:Environment, name:string) {
  do {
    if (!env) {
      throw new ReferenceError(name + " is not defined.");
    }
    if (name in env.names) {
      return {value: env.names[name], container: env.names};
    }
  } while (env = env.prev);
}