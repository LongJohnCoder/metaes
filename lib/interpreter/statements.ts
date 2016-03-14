import {delayEvaluate, evaluate} from "../evaluate";
import {PutValue, GetValue} from "../environment";
import {clone} from "../utils";
import {applyInterceptor} from "../interceptor";
import {EnvironmentTypeAnnotation, ComplexEnvironment} from "../types";
import {MetaFunction} from "../metafunction";

export function LabeledStatement(e:ESTree.LabeledStatement, env, c, cerr) {
  delayEvaluate(e.body, env, c, function (type, labelName, continuation) {
    if (e.label.name && e.label.name === labelName) {
      if (type === "ContinueStatement") {
        continuation();
      } else if (type === "BreakStatement") {
        c();
      }
    } else {
      cerr.apply(null, arguments);
    }
  });
}

export function ForStatement(e:ESTree.ForStatement, env, c, cerr) {
  var bodyResults = [];
  if (e.init) {
    delayEvaluate(e.init, env, loop_, cerr);
  } else if (e.type === "WhileStatement") {
    loop_();
  } else {
    startBody();
  }

  function bodyC(result) {
    bodyResults.push(result);
    if (e.update) {
      delayEvaluate(e.update, env, loop_, cerr);
    } else {
      loop_();
    }
  }

  function updateAndContinue(c) {
    if (e.update) {
      delayEvaluate(e.update, env, () => {
        c.apply(null, bodyResults.reverse());
      }, cerr);
    } else {
      c.apply(null, bodyResults.reverse());
    }
  }

  function bodyCerr(errorType, value, extra) {
    switch (errorType) {
      case "BreakStatement":
        if (typeof value === "undefined") {
          c.apply(null, extra.length ? extra : [bodyResults.pop()]);
        } else {
          cerr(errorType, value, loop_);
        }
        break;
      case "ContinueStatement":
        if (typeof value === "undefined") {
          updateAndContinue(loop_);
        } else {
          // update first
          updateAndContinue(() => {
            cerr(errorType, value, loop_);
          });
        }
        break;
      default:
        cerr.apply(null, arguments);
        break;
    }
  }

  function evaluateBody() {
    delayEvaluate(e.body, env, bodyC, bodyCerr);
  }

  function loop_() {
    if (e.test) {
      delayEvaluate(e.test, env, (bool) => {
        if (bool) {
          evaluateBody();
        } else {
          c(bodyResults.reverse());
        }
      }, cerr);
    } else {
      evaluateBody();
    }
  }

  function startBody() {
    evaluateBody();
  }
}

export function BreakStatement(e:ESTree.BreakStatement, env, c, cerr) {
  cerr(e.type, (e.label ? e.label.name : undefined));
}

export function ContinueStatement(e:ESTree.ContinueStatement, env, c, cerr) {
  cerr(e.type, (e.label ? e.label.name : undefined));
}

export function ForInStatement(e:ESTree.ForInStatement, env, c, cerr) {
  function rightHandSide() {
    delayEvaluate(e.right, env, (right) => {

      /**
       * Collect results into an array. Inconsistent with native implementation,
       * because all the getters would be called immediately at the very beginning
       */
      let
        leftHandSide = e.left.type === "VariableDeclaration" ?
          (e.left as ESTree.VariableDeclaration).declarations[0].id :
          e.left,
        results = [];

      for (let i in right) {
        results.push(e.type === 'ForOfStatement' ? right[i] : i);
      }

      /**
       * Haven't found yet a better way to follow semantics of let-hand-side expression updates.
       * Remember that
       *
       * for(var x in z) {}
       * for(x in z) {}
       * for(x.y in z) {}
       *
       * are all valid programs.
       *
       * TODO: what about values attached to the original AST?
       */
      function assignment(value) {
        return {
          "type": "AssignmentExpression",
          "operator": "=",
          "left": leftHandSide,
          "right": {
            "type": "Literal",
            "value": value,
            "raw": "\"" + value + "\""
          }
        }
      }

      function bodyCerr(errorType, value, extra) {
        switch (errorType) {
          case "BreakStatement":
            if (typeof value === "undefined") {
              c();
            } else {
              cerr(errorType, value);
            }
            break;
          case "ContinueStatement":
            if (typeof value === "undefined") {
              loop_();
            } else {
              cerr(errorType, value);
            }
            break;
          default:
            cerr.apply(null, arguments);
            break;
        }
      }

      let loopResults;

      function loop_(result?:any) {
        if (loopResults) {
          loopResults.push(result);
        } else {
          loopResults = [];
        }
        if (results.length) {
          delayEvaluate(assignment(results.shift()), env, () => {
            delayEvaluate(e.body, env, loop_, bodyCerr);
          }, cerr);
        } else {
          c(loopResults.pop());
        }
      }

      loop_();
    }, cerr)
  }

  delayEvaluate(e.left, env, rightHandSide, function (errorType, value) {
    if (errorType === "Error" && (value instanceof ReferenceError)) {
      PutValue(env, (e.left).name, undefined, false);
      rightHandSide();
    } else {
      cerr.apply(null, arguments);
    }
  })
}

export function WhileStatement(e:ESTree.WhileStatement, env, c, cerr) {
  ForStatement(e, env, c, cerr);
}

export function DoWhileStatement(e:ESTree.DoWhileStatement, env, c, cerr) {
  // TODO: create base function for all loops and call it with functions as configuration arguments
  ForStatement(e, env, c, cerr);
}

export function ExpressionStatement(e:ESTree.ExpressionStatement, env, c, cerr) {
  delayEvaluate(e.expression, env, c, cerr);
}

export function WithStatement(e:ESTree.WithStatement, env, c, cerr) {
  delayEvaluate(e.object, env, (object) => {

    // TODO: simplify
    if (typeof object == "undefined" || object === null ||
      typeof object === "number" || object === true || object === false) {

      cerr("Error", new TypeError(object + " has no properties"));
    } else {
      if (typeof object === "string") {
        object = new String(object);
      }
      var withCfg = clone(env.cfg),
        withEnv = {
          names: object,
          prev: env,
          cfg: withCfg,
          type: e.type
        };
      delayEvaluate(e.body, withEnv, c, cerr);
    }
  }, cerr);
}

export function BlockStatement(e:ESTree.BlockStatement, env, c, cerr) {

  function runHoisting(e) {
    var declarations = [];

    if (e.declarations) {
      declarations = e.declarations;
    } else {
      function isToken(o) {
        return o && o.type;
      }

      function search(e) {
        if (["FunctionDeclaration", "VariableDeclarator"].indexOf(e.type) >= 0) {
          declarations.push(e);
        } else if (["FunctionExpression", "FunctionDeclaration"].indexOf(e.type) === -1) {
          Object.keys(e).forEach((key) => {
            var child = e[key];
            if (child &&
              child.type && key !== "test") {
              search(child);

            } else if (Array.isArray(child)) {
              child.filter(isToken).forEach(search);
            }
          });
        }
      }

      e.forEach(search);
    }

    declarations.forEach((e) => {
      var value;
      switch (e.type) {
        case "FunctionDeclaration":
        case "FunctionExpression":
          value = new MetaFunction(e, env);
          break;
      }
      PutValue(env, e.id.name, value, true);
    });

    // TODO: warning: optimization that can corrupt live coding
    e.declarations = declarations;
  }

  // 1st pass, hoisting. Just collect declarations and bind them to values.
  runHoisting(e.body);

  function errorHandler(errorType, result, extraParam) {
    switch (errorType) {
      case "ReturnStatement":
      case "YieldExpression":
      case "ContinueStatement":
      case "BreakStatement":
      case "ThrowStatement":
      case "Error":
        cerr.apply(null, arguments);
        break;
      default:
        c.apply(null, arguments);
        break;
    }
  }

  // 2nd pass, execution.
  evaluate(e.body, env, (results) => {
    c(results.reverse()[0]);
  }, errorHandler);
}

export function IfStatement(e:ESTree.IfStatement, env, c, cerr) {
  delayEvaluate(e.test, env, (test) => {
    if (test) {
      delayEvaluate(e.consequent, env, c, cerr);
    } else if (e.alternate) {
      delayEvaluate(e.alternate, env, c, cerr);
    } else {
      c();
    }
  }, cerr);
}


export function SwitchStatement(e:ESTree.SwitchStatement, env, c, cerr) {
  function cleanup(c) {
    return () => {

      // TODO: clean up casePassed concept
      env.casePassed = false;
      c();
    }
  }

  delayEvaluate(e.discriminant, env, (discriminant) => {
    PutValue(env, "discriminant", discriminant, true);

    // TODO: block discriminant access and remove after switch is finished
    function maybeBreak(value) {
      if (value === "BreakStatement") {
        c();
      } else {
        cerr.apply(null, arguments);
      }
    }

    env.casePassed = false;
    delayEvaluate(e.cases, env, cleanup(c), maybeBreak);
  }, cleanup(cerr));
}

export function SwitchCase(e:ESTree.SwitchCase, env, c, cerr) {
  GetValue(env, "discriminant", false, (discriminant) => {
    if (e.test) {
      delayEvaluate(e.test, env, (test) => {
        if (env.casePassed || test === discriminant) {
          env.casePassed = true;
          delayEvaluate(e.consequent, env, c, cerr);
        } else {
          c();
        }
      }, cerr);
    } else if (env.casePassed) {
      // "default:" case
      delayEvaluate(e.consequent, env, c, cerr);
    }

  }, cerr);
}

export function TryStatement(e:ESTree.TryStatement, env, c, cerr) {
  function finalizer(c) {
    if (e.finalizer) {
      delayEvaluate(e.finalizer, env, c, cerr);
    } else {
      c();
    }
  }

  function continueOrFinalize(result) {
    finalizer(c.bind(null, result));
  }

  function maybeCatch(errorType, throwArgument) {
    switch (errorType) {

      case "ReturnStatement":
      case "ContinueStatement":
      case "BreakStatement":
        var args = arguments;
        finalizer(() => {
          cerr.apply(null, args);
        });
        break;
      case "ThrowStatement":
      case "Error":
        // TODO: mark `throwArgument` as inacessible
        PutValue(env, 'throwArgument', throwArgument, true);
        if (e.handler) {
          delayEvaluate(e.handler, env, (result) => {
              // TODO: tidy up throwArgument here
              delete env.names.throwArgument;
              finalizer(c.bind(null, result));
            },
            (...args) => {
              finalizer(() => {
                cerr.apply(null, args);
              });
            });
        } else {
          finalizer(c);
        }
        break;
      default:
        cerr.apply(null, arguments);
        break;
    }
  }

  delayEvaluate(e.block, env, continueOrFinalize, maybeCatch);
}

export function ThrowStatement(e:ESTree.ThrowStatement, env, c, cerr) {
  delayEvaluate(e.argument,
    env,
    function (argument) {
      cerr(e.type, argument);
    },
    cerr);
}

export function CatchClause(e:ESTree.CatchClause, env, c, cerr) {
  function foundName(value) {
    // assign catched variable value to the given reference name
    var catchEnv:ComplexEnvironment = {
      prev: env,
      names: {},
      type: <EnvironmentTypeAnnotation>e.type,
      cfg: env.cfg
    };
    catchEnv.names[e.param.name] = value;

    delayEvaluate(e.body, catchEnv, c, cerr);
  }

  GetValue(env, 'throwArgument', false, foundName, cerr);
}

export function ReturnStatement(e:ESTree.ReturnStatement, env, c, cerr, pause) {
  if (e.argument) {
    delayEvaluate(e.argument, env, (result) => {
      applyInterceptor(e, result, env, pause);
      cerr(e.type, result);
    }, cerr);
  } else {
    applyInterceptor(e, undefined, env, pause);
    cerr(e.type);
  }
}

export function DebuggerStatement(e:ESTree.DebuggerStatement, env, c, cerr) {
  debugger;
  c();
}

export function ForOfStatement(e:ESTree.ForOfStatement, env, c, cerr) {
  // TODO: create base function for all loops and call it with functions as configuration arguments
  ForInStatement(e, env, c, cerr);
}

export function EmptyStatement(e:ESTree.EmptyStatement, env, c, cerr) {
  c();
}

export function Program(e:ESTree.Program, env, c, cerr) {
  BlockStatement(e, env, c, cerr);
}