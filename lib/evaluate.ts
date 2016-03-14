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

// Global accumulator of expression to be executed
// TODO: should be local for each subsequent VM?
import {applyInterceptor} from "./interceptor";
import {createPausable} from "./pausable";
import {MetaFunction} from "./metafunction";
import {ComplexEnvironment} from "./types";
import {clone} from "./utils";
import {tokens} from "./tokens";
import {parseConfig} from "./parse";

let tasksStack = [];

export function delayEvaluate(e, env, c, cerr, ...more) {
  var _c = c;
  c = (...args) => {
    var continuation = createPausable(_c, _c, execute, args);
    // give a change to the client code to pause and modify the execution after evaluation
    applyInterceptor(e, args, env, continuation.pauser);
    tasksStack.push(continuation.delayed);
  };
  var pausableEvaluate = createPausable(evaluate, c, execute, arguments);

  // give a change to the client code to pause the execution before evaluation
  applyInterceptor(e, undefined, env, pausableEvaluate.pauser);
  pausableEvaluate.delayed();
  tasksStack.push(pausableEvaluate.delayed);
}

export function delayApply(e, thisObj, callee, args, c, cerr, env) {
  var pausable = createPausable(apply, c, execute, arguments);
  applyInterceptor(e, {this: thisObj, callee: callee, arguments: args}, env, pausable.pauser);
  tasksStack.push(pausable.delayed);
}

export function execute() {
  while (tasksStack.length) {
    tasksStack.pop()();
  }
}

/**
 * In here the function is called from metacircular space. Therefore it's possible to give it some settings.
 */
export function apply(e, thisObj, fn, args, c, cerr, env) {
  if (fn === eval) {
    if (typeof args[0] === "string") {
      // here is the case where `eval` is executed in metacircular space, therefore it has to be
      // handled in special way
      function cc(e, result) {
        c(result);
      }

      metaEval(e, args, parseConfig, env, cc, cerr);
    } else {
      c(args[0]);
    }
  } else if (fn.metaFunction instanceof MetaFunction) {
    fn.metaFunction.run(thisObj, args, c, cerr, env);
  } else {
    try {
      c(fn.apply(thisObj, args));
    } catch (e) {
      cerr("Error", e);
    }
  }
}


/**
 * Evaluates given AST node.
 *
 * @param e - currently evaluated AST node
 * @param env - current execution environment
 * @param c - continuation function
 * @param cerr - alternative continuation function, used by try/catch, return, break, continue
 */
export function evaluate(e, env, c, cerr) {
  if (Array.isArray(e)) {
    var results = [];

    function next(e) {
      if (e.length) {
        delayEvaluate(e[0], env,
          function (result) {
            results.push(result);
            next(e.slice(1));
          },
          function (errorType) {
            if (errorType === "BreakStatement") {
              cerr.apply(null, [].slice.call(arguments).concat([results]));
            } else {
              cerr.apply(null, arguments);
            }
          });
      } else {
        c(results);
      }
    }

    next(e);
  } else {
    // e can be null in [,,]
    if (e) {
      function success(result) {
        if (arguments.length > 1) {
          c.apply(null, arguments);
        } else {
          c(result);
        }
      }

      if (e.type in tokens) {
        if (e.range) {
          e.subProgram = env.cfg.programText.substring(e.range[0], e.range[1]);
        }
        tokens[e.type](e, env, success, cerr);
      } else {
        var error = new Error(e.type + " token is not yet implemented.");
        throw error;
      }
    } else {
      c();
    }
  }
}

function metaEval(node, programText, parseConfig, env:ComplexEnvironment, c, cerr) {
  // take only first argument that should be a text
  programText = programText[0];

  try {
    var e = esprima.parse(programText, parseConfig),
      env2,
      cfg = clone(env.cfg);

    cfg.programText = programText;

    // indirect eval call is run in global context
    if (node.callee.name !== "eval") {
      while (env.prev) {
        env = env.prev;
      }
    }
    env2 = clone(env);
    env2.cfg = cfg;

    function metaCerr() {
      // by pass 1st argument (ast)
      cerr.apply(null, [].slice.call(arguments, 1));
    }

    function metaC() {
      c.apply(null, arguments);
    }

    runVM(e, env2, metaC, metaCerr);

  } catch (error) {
    if (error.message.indexOf("Invalid left-hand side in assignment") >= 0) {
      cerr("Error", new ReferenceError(error.message));
    } else {
      cerr("Error", new SyntaxError(error.message));
    }
  }
}

export function runVM(e, env, c, cerr) {
  evaluate(e, env, c.bind(null, e), cerr.bind(null, e));
}