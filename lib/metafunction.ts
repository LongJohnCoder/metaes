import {clone} from "./utils";
import {EvaluationConfig, ComplexEnvironment} from "./types";
import {PutValue, GetValue} from "./environment";
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


  run(thisObj, args, c, cerr, prevEnv:ComplexEnvironment) {
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
    GetValue(this.env, 'this', false, (value) => {
      self = value;
    }, cerr);

    let
      cfg = prevEnv.cfg,
      argsObject = buildArgsObject(args),
      env:ComplexEnvironment = {
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
      PutValue(env, this.e.id.name, this.metaInvoker, true);
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
}
