import {MetaFunction} from "../metafunction";

export function FunctionExpression(e:ESTree.FunctionExpression, env, c, cerr) {
  c(new MetaFunction(e, env));
}

export function FunctionDeclaration(e:ESTree.FunctionDeclaration, env, c, cerr) {
  c(new MetaFunction(e, env));
}