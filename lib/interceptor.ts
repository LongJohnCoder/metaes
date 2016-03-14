import {ComplexEnvironment} from "./types";

export function applyInterceptor(e:ESTree.Node, val:any, env:ComplexEnvironment, pause?) {
  if ('interceptor' in env.cfg && e.type) {
    env.cfg.interceptor(e, val, env, pause);
  }
}