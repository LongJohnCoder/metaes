import {Environment, EvaluationConfig, SuccessCallback, NamesMap, ErrorCallback} from "./types";
import {runVM, execute} from "./evaluate";
import {parse} from "./parse";

let VMsCounter = 0;

export function mainEvaluate(text:string,
                             rootEnvironment:Environment | NamesMap = {},
                             config:EvaluationConfig = {},
                             c?:SuccessCallback,
                             cerr?:ErrorCallback) {
  if (typeof text === "function") {
    text = "(" + text.toString() + ")";
  }
  config.programText = text;
  config.name = config.name || "VM" + VMsCounter++;

  let evalResult;

  try {
    let
      e = parse(text),
      env:Environment;

    if ('names' in rootEnvironment) {
      env = rootEnvironment;
      env.cfg = config;
    } else {
      env = {
        prev: null,
        names: rootEnvironment || {},
        cfg: config
      };
    }
    env.names['this'] = env.names;

    function wrapResult(continuation) {
      return function ({ast, errorType, error}) {
        evalResult = error || errorType;
        if (continuation) {
          continuation.apply(null, arguments);
        } else if (errorType === "Error") {
          throw error;
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

  return evalResult;
}
