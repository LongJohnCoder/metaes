import {MetaFunction} from "./metafunction";
import {Environment, EvaluatedNode} from "./types";
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
export function apply(e:ESTree.Node, thisObj, fn:Function, args, c, cerr, env) {
  if (fn === eval) {
    if (typeof args[0] === "string") {
      // here is the case where `eval` is executed in metacircular space, therefore it has to be
      // handled in special way
      function cc({e, result}) {
        c(result);
      }

      metaEval(e, args, env).then(cc).catch(cerr);
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
 */
export async function evaluate<T extends ESTree.Node>(e:T, env:Environment):Promise<EvaluatedNode<T>> {
  if (e.type in tokens) {
    let result = await tokens[e.type](e, env);
    if (e.range) {
      result.subProgram = env.cfg.programText.substring(e.range[0], e.range[1]);
    }
    return result;
  } else {
    var error = new Error(e.type + " token is not yet implemented.");
    throw error;
  }
}

function metaEval(node, programText:string, env:Environment):Promise<any> {
  return new Promise((resolve, reject)=> {
    // take only first argument that should be a text
    programText = programText[0];

    try {
      var e = parse(programText),
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
        reject.apply(null, [].slice.call(arguments, 1));
      }

      function metaC() {
        resolve.apply(null, arguments);
      }

      runVM(e, env2, metaC, metaCerr);

    } catch (error) {
      if (error.message.indexOf("Invalid left-hand side in assignment") >= 0) {
        reject({message: "Error", error: new ReferenceError(error.message)});
      } else {
        reject({message: "Error", error: new SyntaxError(error.message)});
      }
    }
  });

}

export let runVM = (e, env, c, cerr) => evaluate(e, env).then(c).catch(cerr);
