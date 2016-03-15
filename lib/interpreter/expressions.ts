import {apply, evaluate, evaluateArray} from "../evaluate";
import {GetValue, PutValue} from "../environment";
import {applyInterceptor} from "../interceptor";
import {IfStatement} from "./statements";
import {FunctionExpression} from "./function";
import {Environment} from "../types";

export async function BinaryExpression(e:ESTree.BinaryExpression, env) {
  let [left, right] = [
    (await evaluate(e.left, env)).value,
    (await evaluate(e.right, env)).value];

  switch (e.operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "===":
      return left === right;
    case "==":
      return left == right;
    case "!==":
      return left !== right;
    case "!=":
      return left != right;
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    case ">":
      return left > right;
    case ">=":
      return left >= right;
    case "*":
      return left * right;
    case "/":
      return left / right;
    case "instanceof":
      return left instanceof right;
    case "in":
      return left in right;
    case "^":
      return left ^ right;
    case "<<":
      return left << right;
    case ">>":
      return left >> right;
    case ">>>":
      return left >>> right;
    case "%":
      return left % right;
    case "&":
      return left & right;
    case "|":
      return left | right;
    default:
      throw new Error(e.type + " not implemented " + e.operator);
  }
}

export async function LogicalExpression(e:ESTree.LogicalExpression, env) {
  let left = (await evaluate(e.left, env)).value;
  if (!left && e.operator === "&&") {
    return left;
  } else if (left && e.operator === "||") {
    return left;
  } else {
    return await evaluate(e.right, env);
  }
}

export async function UnaryExpression(e:ESTree.UnaryExpression, env:Environment) {
  let global;
  let WithStatementEnvironment;
  let argument = (await evaluate(e.argument, env)).value;

  // find root environment
  while (env.prev) {
    if (env.type === "WithStatement") {
      WithStatementEnvironment = env;
    }
    global = env = env.prev;
  }

  switch (e.operator) {
    case "delete":
      let propName = (<ESTree.Identifier>e.argument).name;
      let value = GetValue(env, propName);
      if (value && value.container === env && propName !== "length") {
        env.names[propName] = undefined;
      }

      if (["Literal", "CallExpression", "ObjectExpression"].indexOf(e.argument.type) >= 0) {
        return true;
      } else if (WithStatementEnvironment) {
        var obj2 = value.container;
        if (propName in WithStatementEnvironment.names) {
          obj2 = WithStatementEnvironment.names;
        }
        return delete obj2[propName];
      } else if (value.container === global.names || e.argument.type !== "Identifier") {
        // always try to delete in global object or from object
        return delete value.container[propName];
      } else {
        // identifier not in global object, don't delete it, but return false
        return false;
      }
    case "typeof":
      return typeof argument;
    case "-":
      return -argument;
    case "!":
      return !argument;
    case "+":
      return +argument;
    case "~":
      return ~argument;
    case "void":
      return void argument;
    default:
      throw new Error("not implemented " + e.operator);
  }
}

export async function ObjectExpression(e:ESTree.ObjectExpression, env) {
  let properties = (await evaluateArray(e.properties, env)).map(r=>r.value);

  var objectProperties = Object.create(null);

  for (var i = 0; i < properties.length; i++) {
    var key = properties[i].key,
      kind = e.properties[i].kind;
    if (["get", "set"].indexOf(kind) >= 0) {
      objectProperties[key] = objectProperties[key] || {};

      // defaults
      objectProperties[key].enumerable = true;
      objectProperties[key].configurable = true;

      objectProperties[key][kind] = properties[i].value;
    } else {
      objectProperties[properties[i].key] = {
        value: properties[i].value,
        configurable: true,
        writable: true,
        enumerable: true
      };
    }
  }
  return Object.create(Object.prototype, objectProperties);
}

// TODO: clean up
export function AssignmentExpression(e:ESTree.AssignmentExpression, env, c, cerr) {
  delayEvaluate(e.right, env, (right) => {
    // TODO: integrate with case below using env names containers (?) or something else
    function assignToMemberExpression(obj, propName, c) {
      var value;
      switch (e.operator) {
        case "=":
          value = obj[propName] = right;
          break;
        case "+=":
          value = obj[propName] += right;
          break;
        case "-=":
          value = obj[propName] -= right;
          break;
        case "*=":
          value = obj[propName] *= right;
          break;
        case "/=":
          value = obj[propName] /= right;
          break;
        case "%=":
          value = obj[propName] %= right;
          break;
        case "<<=":
          value = obj[propName] <<= right;
          break;
        case ">>=":
          value = obj[propName] >>= right;
          break;
        case ">>>=":
          value = obj[propName] >>>= right;
          break;
        case "&=":
          value = obj[propName] &= right;
          break;
        case "|=":
          value = obj[propName] |= right;
          break;
        case "^=":
          value = obj[propName] ^= right;
          break;
        default:
          throw new Error(e.type + " not implemented " + e.operator);
      }
      if ('arguments' in env &&
        obj === env.arguments &&
        typeof env.paramsNames[propName] !== "undefined") {
        PutValue(env, env.paramsNames[propName], value, false);
      }
      c(value);
    }

    if (e.left.name) {
      function foundName(left) {
        var value;
        switch (e.operator) {
          case "=":
            value = left = right;
            break;
          case "+=":
            value = left += right;
            break;
          case "-=":
            value = left -= right;
            break;
          case "*=":
            value = left *= right;
            break;
          case "/=":
            value = left /= right;
            break;
          case "%=":
            value = left %= right;
            break;
          case "<<=":
            value = left <<= right;
            break;
          case ">>=":
            value = left >>= right;
            break;
          case ">>>=":
            value = left >>>= right;
            break;
          case "&=":
            value = left &= right;
            break;
          case "|=":
            value = left |= right;
            break;
          case "^=":
            value = left ^= right;
            break;
          default:
            throw new Error(e.type + " not implemented " + e.operator);
        }
        PutValue(env, e.left.name, value, false);
        if ('arguments' in env) {
          var index = env.paramsNames.indexOf(e.left.name);
          if (index >= 0) {
            env.names.arguments[index] = value;
          }
        }
        c(value);
      }

      function notFoundNameButAssignToGlobal(errorType, error, flag, env) {
        // PutValue in global environment only if this is a simple assignment expression
        if (e.operator === "=") {
          // find global env
          var global = env;
          while (global.prev) {
            global = global.prev;
          }
          assignToMemberExpression(global.names, e.left.name, c);
        } else {
          cerr.apply(null, arguments);
        }
      }

      GetValue(env, e.left.name, false, foundName, notFoundNameButAssignToGlobal);

    } else {
      delayEvaluate(e.left, env, (prop, obj, propName) => {
        assignToMemberExpression(obj, propName, c);
      }, cerr);
    }
  }, cerr);
}

export function UpdateExpression(e:ESTree.UnaryExpression, env, c, cerr) {
  delayEvaluate(e.argument, env, (argument, container, propName) => {
    try {
      var value;
      if (e.prefix) {
        switch (e.operator) {
          case "++":
            value = ++container[propName];
            break;
          case "--":
            value = --container[propName];
            break;
          default:
            throw new Error("Implement me, " + e.operator);
        }
      } else {
        switch (e.operator) {
          case "++":
            value = container[propName]++;
            break;
          case "--":
            value = container[propName]--;
            break;
          default:
            throw new Error("Implement me, " + e.operator);
        }
      }
      c(value);
    } catch (e) {
      cerr("Error", e);
    }
  }, cerr);
}

export function ThisExpression(e:ESTree.ThisExpression, env, c, cerr) {
  function foundName(pair) {
    var
      value = pair[0],
      container = pair[1];
    c(value, container, 'this');
  }

  GetValue(env, 'this', true, foundName, cerr);
}

export function CallExpression(e:ESTree.CallExpression, env, c, cerr) {
  delayEvaluate(e.callee, env, (callee, thisObj, calleeName) => {
    delayEvaluate(e.arguments, env, (args) => {
      if (e.callee.type === "MemberExpression" && typeof callee === "undefined" || typeof callee !== "function") {
        cerr("Error", new TypeError(typeof callee + " is not a function"));
      } else {
        thisObj = e.callee.type === "MemberExpression" ? thisObj : null;
        if (env.type === "WithStatement" && env.names[calleeName] === callee) {
          thisObj = env.names;
        }
        delayApply(e, thisObj, callee, args, c, cerr, env);
      }
    }, cerr);
  }, cerr);
}

export function MemberExpression(e:ESTree.MemberExpression, env, c, cerr, pause) {
  delayEvaluate(e.object, env, (object, name) => {

    function extractor(obj, prop, propName) {

      // no support for arguments.callee.caller
      // TODO: optimize
      var value;
      if (typeof obj === "function" && propName === "caller") {
        value = void 0;
      } else {
        value = obj[prop];
      }
      applyInterceptor(e.property, value, env, pause);
      return value;
    }

    try {
      // check if `value` belongs to the object and is not taken from its prototype
      if (e.property.hasOwnProperty("value")) {
        c(extractor(object, e.property.value, e.property.name), object, e.property.value);
      } else if (e.computed) {
        delayEvaluate(e.property, env, (member, property) => {
          c(extractor(object, member, e.property.name), object, member);
        }, cerr);
      } else {
        c(extractor(object, e.property.name, e.property.name), object, e.property.name);
      }
    } catch (e) {
      cerr("Error", e);
    }
  }, cerr);
}

export function NewExpression(e:ESTree.NewExpression, env, c, cerr) {
  delayEvaluate(e.arguments, env, (args) => {
    delayEvaluate(e.callee, env, (ctor) => {
      var obj;
      if (typeof ctor !== "function") {
        cerr("Error", new TypeError(typeof ctor + " is not a function"));
      } else if (ctor.metaFunction) {
        // delay constructor evaluation so don't use native `new`.
        if (typeof ctor.prototype === "object" || typeof ctor.prototype === "function") {
          obj = Object.create(ctor.prototype);
        } else {
          obj = Object.create(Object.prototype);
        }

        delayEvaluate(apply, e, obj, ctor, args, (result) => {
          // if constructor function returns object, then this object is the result of NewExpression
          c(typeof result === "object" || typeof result === "function" ? result : obj);
        }, cerr, env);
      } else {
        try {
          // create new object using given constructor function and unknown number of arguments
          obj = new (Function.prototype.bind.apply(ctor, [undefined].concat(args)));
          c(obj);
        } catch (e) {
          // possible TypeError
          cerr("Error", e);
        }
      }
    }, cerr);
  }, cerr);
}

export function ArrayExpression(e:ESTree.ArrayExpression, env, c, cerr) {
  delayEvaluate(e.elements, env,
    (result) => {
      result.forEach((r, index) => {
        if (typeof result[index] === "undefined") {
          // example: [,,] - in this case all indexes are not enumerable
          // TODO: what about reasigning value to index?
          Object.defineProperty(result, index, {
            enumerable: false
          });
        }
      });
      c(result);
    },
    cerr);
}

export function SequenceExpression(e:ESTree.SequenceExpression, env, c, cerr) {
  delayEvaluate(e.expressions, env,
    (results) => {
      c(results[results.length - 1]);
    },
    cerr);
}

export function ConditionalExpression(e:ESTree.ContinueStatement, env, c, cerr) {
  IfStatement(<ESTree.IfStatement>e, env, c, cerr);
}

// ES6
export function ArrowFunctionExpression(e:ESTree.ArrowFunctionExpression, env, c, cerr) {
  // TODO: track `this` properly
  FunctionExpression(e, env, c, cerr);
}

export function YieldExpression(e:ESTree.YieldExpression, env, c, cerr) {
  delayEvaluate(e.argument, env,
    function (result) {
      cerr(e.type, result, c);
    },
    cerr)
}