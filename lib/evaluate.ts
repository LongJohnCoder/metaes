import {Environment, EvaluatedNode, ErrorCallback, SuccessCallback, ExecutionError} from "./types";
import {clone} from "./utils";
import {tokens} from "./tokens";
import {parse} from "./parse";

let tasksStack = [];

export function execute() {
  while (tasksStack.length) {
    tasksStack.pop()();
  }
}

/**
 * In here the function is called from metacircular space. Therefore it's possible to give it some settings.
 */
export async function apply(e:ESTree.Node,
                            thisObj:Object,
                            fn:Function,
                            args:any[],
                            env:Environment) {
  if (fn === eval) {
    if (typeof args[0] === "string") {
      // here is the case where `eval` is executed in metacircular space, therefore it has to be
      // handled in special way
      return await metaEval(e, args[0], env);
    } else {
      return args[0];
    }
  } else if ('__metaFunction__' in fn) {
    // TODO: typecheck this
    return await fn['__metaFunction__']['run'](thisObj, args, env);
  } else {
    try {
      return fn.apply(thisObj, args);
    } catch (error) {
      throw new ExecutionError(e, error);
    }
  }
}

/**
 * Evaluates given AST node.
 *
 * @param e - currently evaluated AST node
 * @param env - current execution environment
 */
export async function evaluate<T extends ESTree.Node>(e:T, env:Environment):Promise<EvaluatedNode<T>> {
  if (e.type in tokens) {
    let result = await tokens[e.type](e, env);
    if (e.range) {
      result.subProgram = env.cfg.programText.substring(e.range[0], e.range[1]);
    }
    return result;
  } else {
    throw new Error(e.type + " token is not yet implemented.");
  }
}

export async function evaluateArray<T extends ESTree.Node>(eArray:T[], env:Environment):Promise<EvaluatedNode<T>[]> {
  let results = [];
  for (let e of eArray) {
    results.push(await (evaluate(e, env)));
  }
  return results;
}

async function metaEval(node, programText:string, env:Environment) {
  try {
    let e = parse(programText);
    let cfg = clone(env.cfg);
    cfg.programText = programText;

    // indirect eval call is run in global context
    if (node.callee.name !== "eval") {
      while (env.prev) {
        env = env.prev;
      }
    }
    return await evaluate(e, env)
  } catch (error) {
    if (error.message.indexOf("Invalid left-hand side in assignment") >= 0) {
      throw new ReferenceError(error.message);
    } else if (error instanceof ExecutionError) {
      throw error;
    } else {
      throw new SyntaxError(error.message);
    }
  }
}
