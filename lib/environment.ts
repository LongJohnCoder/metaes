import {ComplexEnvironment} from "./types";

export function setValue(env:ComplexEnvironment, name:string, value:any, isDeclaration:boolean) {
  if (isDeclaration) {
    while (env.type === "CatchClause" || env.type === "WithStatement") {
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
    return value;
  } else {
    function loop_(env) {
      if (!env.prev) {
        return env.names;
      } else {
        if (name in env.names) {
          return env.names;
        } else {
          return loop_(env.prev);
        }
      }
    }

    return loop_(env)[name] = value;
  }
}

/**
 * Gets a value from an environment.
 *
 * @param env
 * @param name
 * @param shouldReturnContainer - If true, then return value and object that contains that value.
 * @param c
 * @param cerr
 */
export function getValue(env, name, shouldReturnContainer, c, cerr) {
  var envs = [];

  function getValueHelper(container, key) {
    var value = container[key];
    return shouldReturnContainer ? [value, container] : value;
  }

  function loop_(env) {

    if (!env) {
      if (cerr) {
        cerr("Error", new ReferenceError(name + " is not defined."), true, envs[0]);
      }
    } else {
      envs.push(env);
      if (name in env.names) {
        c(getValueHelper(env.names, name))
      } else {
        loop_(env.prev);
      }
    }
  }

  loop_(env);
}