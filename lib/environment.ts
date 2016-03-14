// The MIT License (MIT)
//
// Copyright (c) 2015 Bartosz Krupa
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

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
export function getValue(env:ComplexEnvironment, name:string, shouldReturnContainer:boolean, c, cerr) {
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