import {PutValue} from "../environment";
import {evaluate} from "../evaluate";

export async function VariableDeclaration(e:ESTree.VariableDeclaration, env) {
  return await evaluate(e.declarations, env);
}

export function VariableDeclarator(e:ESTree.VariableDeclarator, env) {
  if ('name' in e.id) {
    PutValue(env, e.id['name'], undefined, true);
    env.variables = env.variables || {};
    env.variables[e.id['name']] = e.id;
  } else {
    throw new Error("handle me")
  }

  if (e.init) {
    delayEvaluate(e.init, env, (val) => {
      if ('name' in e.id) {
        PutValue(env, e.id['name'], val, false);
        c(val, e.id['name']);
      } else {
        throw new Error("handle me")
      }

    }, cerr);
  } else {
    if ('name' in e.id) {
      c(undefined, e.id['name']);
    } else {
      throw new Error("handle me")
    }
  }
};