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

import * as esprima from "esprima";
import {ComplexEnvironment, EvaluationConfig, SuccessCallback, SimpleEnvironment, ErrorCallback} from "./types";
import {runVM, execute} from "./evaluate";
import {parseConfig} from "./parse";

let VMsCounter = 0;

export function mainEvaluate(text:string,
                             rootEnvironment:ComplexEnvironment | SimpleEnvironment = {},
                             cfg:EvaluationConfig = {},
                             c?:SuccessCallback,
                             cerr?:ErrorCallback) {
  if (typeof text === "function") {
    text = "(" + text.toString() + ")";
  }
  var evaluationResult;

  cfg.programText = text;
  cfg.name = cfg.name || "VM" + VMsCounter++;

  try {
    var
      e = esprima.parse(text, parseConfig),
      env;
    if ('names' in rootEnvironment) {
      env = rootEnvironment;
      env.cfg = cfg;
    } else {
      env = {
        prev: null,
        names: rootEnvironment || {},
        cfg: cfg
      };
    }

    Object.defineProperty(env.names, 'this', {
      configurable: false,
      value: env.names
    });

    function wrapResult(continuation) {
      return function (ast, result, result2) {
        evaluationResult = result2 || result;
        if (continuation) {
          continuation.apply(null, arguments);
        } else if (result === "Error") {
          throw result2;
        }
      }
    }

    runVM(e, env, wrapResult(c), wrapResult(cerr));
    execute();
  } catch (err) {
    if (cerr) {
      cerr(null, err);
    } else {
      throw err;
    }
  }

  return evaluationResult;
}
