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

import {clone} from "./utils";
import {EvaluationConfig} from "./types";
import {setValue, getValue} from "./environment";
import {applyInterceptor} from "./interceptor";
import {delayEvaluate, execute} from "./evaluate";

export class MetaFunction {
  public cfg:EvaluationConfig;

  constructor(public e:ESTree.Function, public env) {
    this.cfg = clone(env.cfg);

    let self = this, evaluationResult;

    function MetaInvokerInner() {

      // If metacirtular function is called from native function, it is important to return metacircular value
      // to the native function.
      self.run(this, arguments, c, cerr, self.env);

      // passing c to the `run` function should eventually set up `evaluationResult` variable with evaluated value
      return evaluationResult;
    }

    function cerr(errorType, e) {
      throw e;
    }

    // nowhere to continue
    function c(result) {
      evaluationResult = result;
    }

    let
      functionParamsNames = this.paramsNames = e.params.map((param) => {
        return param.name;
      }),
      functionName = e.id ? e.id.name : "",
      functionSource =
        "(function " + functionName + "(" + functionParamsNames.join(",") + ") {" +
        "return MetaInvokerInner.apply(this,arguments)" +
        "})",
      MetaInvoker = eval(functionSource);

    MetaInvoker.toString = () => {
      return env.cfg.programText.substring(e.range[0], e.range[1]);
    };

    MetaInvoker.metaFunction = this;

    Object.defineProperties(MetaInvoker, {
      "toString": {
        enumerable: false
      },
      "metaFunction": {
        enumerable: false
      }
    });

    this.metaInvoker = MetaInvoker;

    return MetaInvoker;
  }


  run(thisObj, args, c, cerr, prevEnv) {
    function buildArgsObject(input) {
      var mockedArgsObject = {};

      for (var i = 0; i < input.length; i++) {
        mockedArgsObject[i] = input[i];
      }

      Object.defineProperties(mockedArgsObject, {
        "length": {
          enumerable: false,
          value: input.length
        },
        "callee": {
          enumerable: false,
          value: self.metaInvoker
        }
      });
      return mockedArgsObject;
    }

    let self;
    getValue(this.env, 'this', false, (value) => {
      self = value;
    }, cerr);

    let
      cfg = prevEnv.cfg,
      argsObject = buildArgsObject(args),
      env = {
        fn: self,
        cfg: cfg,
        names: {
          this: thisObj || self
        },
        closure: this.env,
        prev: prevEnv,
        variables: {}
      };

    // if function is named, pass its name to environment to allow recursive calls
    if (this.e.id) {
      setValue(env, this.e.id.name, this.metaInvoker, true);
    }

    Object.defineProperty(env.names, "arguments", {
      configurable: false,
      value: argsObject,
      writable: true
    });
    var functionResult;

    // set function scope variables variables based on formal function parameters
    this.e.params.forEach((param, i) => {
      applyInterceptor(param, args[i], env);

      // TODO: clean up
      // create variable
      setValue(env, param.name, args[i], true);

      // assign (or reassign) variable
      setValue(env, param.name, args[i], false);

      env.variables[param.name] = param;
    });

    delayEvaluate(this.e.body, env,
      (result) => {
        c(undefined);
      },
      function (nodeType, result, extraParam) {
        switch (nodeType) {
          case "YieldExpression":
            throw new Error("Handle properly saving continuation here");
          case "ReturnStatement":
            c.call(null, result, extraParam);
            break;
          default:
            cerr.apply(null, arguments);
            break;
        }
      });

    execute();
    applyInterceptor(this.e, this.metaInvoker, env);
    return functionResult;
  }
}
