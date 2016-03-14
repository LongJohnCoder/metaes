import {delayEvaluate} from "../evaluate";
import {setValue} from "../environment";

export function VariableDeclaration(e:ESTree.VariableDeclaration, env, c, cerr) {
  delayEvaluate(e.declarations, env, c, cerr);
}

export function VariableDeclarator(e:ESTree.VariableDeclarator, env, c, cerr) {
  if ('name' in e.id) {
    setValue(env, e.id['name'], undefined, true);
    env.variables = env.variables || {};
    env.variables[e.id['name']] = e.id;
  } else {
    throw new Error("handle me")
  }

  if (e.init) {
    delayEvaluate(e.init, env, (val) => {
      if ('name' in e.id) {
        setValue(env, e.id['name'], val, false);
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