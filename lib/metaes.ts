import {ComplexEnvironment, EvaluationConfig, SuccessCallback, SimpleEnvironment, ErrorCallback} from "./types";
import {runVM, execute} from "./evaluate";
import {parse} from "./parse";

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
      e = parse(text),
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
