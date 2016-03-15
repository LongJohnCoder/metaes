import {GetValue} from "../environment";
import {evaluate} from "../evaluate";

export async function Literal(e:ESTree.Literal, env):Promise<number | string | RegExp | boolean> {
  return await e.value;
}

export async function Identifier(e:ESTree.Identifier, env) {
  return await GetValue(env, e.name);
}

export async function Property(e:ESTree.Property, env) {
  let key = (await evaluate(e.key, env)).value;
  let value = (await evaluate(e.value, env)).value;

  return {key, value};
}

export function ArrayPattern(e:ESTree.ArrayPattern, env) {
  console.log(e);
}