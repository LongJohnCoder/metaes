import {MetaFunction} from "./metafunction";

/**
 * Key-valued object of all the names in existing environment (scope).
 */
export interface NamesMap {
  [key:string]:any
}

export interface Environment {
  prev?:Environment;
  names?:NamesMap;
  cfg?:EvaluationConfig;
  
  // means you can't set `names` on it env. Use `prev` instead
  locked?:boolean;
  // reference to metacircular function that was called and produced new scope od execution.
  fn?:MetaFunction

  // Reference to closure of `fn` function
  closure?:Environment
}

export type SuccessCallback = (ast:ESTree.Node, value:any) => void;
export type ErrorCallback = (ast:ESTree.Node, errorType:String, error?:Error)=>void

/**
 * When pause() is called it returns function that should be used for resuming the execution. For example:
 *
 * var resume = pause();
 * setTimeout(resume, 1000, "resumeValue");
 */
export interface Interceptor {
  (e:ESTree.Node, value:any, env:Environment, pause?:() => (resumeValue:any) => void):void;
}

export interface EvaluationConfig {
  interceptor?:Interceptor;

  programText?:string;

  // name of the VM, can be filename or just any arbitrary name.
  // Leaving it undefined will by default assign name like VMx where `x` is next natural number.
  name?:string
}


export type EvaluatedNode<T extends ESTree.Node> = {node:T, value:any, subProgram:string};
export type TokenHandler<T extends ESTree.Node>  = (e:T, env:Environment)=>Promise<any>;
export type TokensMap = {
  [key:string]:TokenHandler<any>
};
