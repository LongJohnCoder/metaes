import {Environment} from "./types";

export function applyInterceptor(e:ESTree.Node, val:any, env:Environment, pause?) {
  if ('interceptor' in env.cfg && e.type) {
    env.cfg.interceptor(e, val, env, pause);
  }
}