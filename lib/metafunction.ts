import {PutValue, GetValue} from "./environment";
import {evaluate} from "./evaluate";
import {Environment, ExecutionError} from "./types";

function createArgumentslike(args:any[], callee:Function) {
  let argumentsLike = {};

  for (let i = 0; i < args.length; i++) {
    argumentsLike[i] = args[i];
  }

  Object.defineProperties(argumentsLike, {
    "length": {
      enumerable: false,
      value: args.length
    },
    "callee": {
      enumerable: false,
      value: callee
    }
  });
  return argumentsLike;
}

export function MetaFunction(e:ESTree.Function, env:Environment) {
  this.e = e;
  this.env = env;
  let MetaFunctionInstance = this;

  // If metacirtular function is called from native function, it is important to return metacircular value
  // to the native function.
  function Inner() {
    let evaluationResult;

    MetaFunctionInstance.run(
      this,
      [...arguments],
      (result) => {
        evaluationResult = result;
      },
      (ast, errorType, e)=> {
        throw e;
      },
      env);
    return evaluationResult;
  }

  Inner['__metaFunction__'] = MetaFunctionInstance;
  return Inner;
}

MetaFunction.prototype.run = async function (thisObj:any,
                                             args:any[],
                                             prevEnv:Environment) {

  let self = GetValue(this.env, 'this').value;

  let
    env:Environment = {
      fn: self,
      cfg: prevEnv.cfg,
      names: {
        this: thisObj || self
      },
      closure: this.env,
      prev: prevEnv
    };

  // if function is named, pass its name to environment to allow recursive calls
  if (this.e.id) {
    PutValue(env, this.e.id.name, this.metaInvoker, true);
  }

  Object.defineProperty(env.names, "arguments", {
    configurable: false,
    value: createArgumentslike(args, self.metaInvoker),
    writable: true
  });

  // set function scope variables variables based on formal function parameters
  this.e.params.forEach((param, i) => {
    PutValue(env, param.name, args[i], true);
  });

  try {
    return await evaluate(this.e.body, env);
  } catch (error) {
    if (error instanceof ExecutionError) {
      switch (error.errorType) {
        case "YieldExpression":
          throw new Error("Handle properly saving continuation here");
        default:
          throw error;
      }
    }
  }
};

