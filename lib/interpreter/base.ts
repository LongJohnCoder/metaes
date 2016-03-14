import {GetValue} from "../environment";
import {evaluate} from "../evaluate";

export async function Literal(e:ESTree.Literal, env):Promise<any> {
  return e.value;
}

export async function Identifier(e:ESTree.Identifier, env) {
  return GetValue(env, e.name);
}

export async function Property(e:ESTree.Property, env) {
  e.key
  function continueToValue(key) {
    key = e.key.name || key;
    delayEvaluate(e.value, env, (value) => {
      c({
        key: key,
        value: value
      });
    }, cerr);
  }

  let value = await evaluate(e.key, env);

}

export function ArrayPattern(e:ESTree.ArrayPattern, env) {
  console.log(e);
}