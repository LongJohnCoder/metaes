import {PutValue, GetValue} from "./environment";
import {applyInterceptor} from "./interceptor";
import {execute} from "./evaluate";
import {Environment, SuccessCallback, ErrorCallback} from "./types";

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

  let metaFunction = this;

  // If metacirtular function is called from native function, it is important to return metacircular value
  // to the native function.
  return function () {
    let evaluationResult;

    metaFunction.run(
      this,
      [...arguments],
      (result) => {
        evaluationResult = result;
      },
      (errorType, e)=> {
        throw e;
      },
      env);
    return evaluationResult;
  }
}

MetaFunction.prototype.run = function (thisObj:any, 
                                       args:any[], 
                                       prevEnv:Environment, 
                                       c:SuccessCallback, 
                                       cerr:ErrorCallback) {
  
  let self = GetValue(this.env, 'this').value;

  let
    env:Environment = {
      fn: self,
      cfg: prevEnv.cfg,
      names: {
        this: thisObj || self
      },
      closure: this.env,
      prev: prevEnv,
      variables: {}
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
  var functionResult;

  // set function scope variables variables based on formal function parameters
  this.e.params.forEach((param, i) => {
    applyInterceptor(param, args[i], env);

    // TODO: clean up
    // create variable
    PutValue(env, param.name, args[i], true);

    // assign (or reassign) variable
    PutValue(env, param.name, args[i], false);

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

