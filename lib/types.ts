/**
 * Metacircular function representation in MetaES VM.
 */
export interface MetaFunction extends Function {
  e:ESTree.Function;
  env:Env;
  cfg:EvaluationConfig;
}

/**
 * Key-valued object of all the names in existing environment (scope).
 */
export interface SimpleEnvironment {
  [key:string]:any
}

export type EnvironmentTypeAnnotation = 'CatchClause' | 'WithStatement';
export interface ComplexEnvironment {
  prev?:Env;
  names?:SimpleEnvironment;
  cfg?:EvaluationConfig;
  type?:EnvironmentTypeAnnotation;

  // reference to metacircular function that was called and produced new scope od execution.
  fn?:MetaFunction

  // Reference to closure of `fn` function
  closure?:ComplexEnvironment
}

/**
 * Environment can be both simple or complex.
 */
export type Env = SimpleEnvironment | ComplexEnvironment;

export type SuccessCallback = (ast:ESTree.Node, value:any) => void;
export type ErrorCallback = (ast:ESTree.Node, errorType:String, error?:Error)=>void

/**
 * When pause() is called it returns function that should be used for resuming the execution. For example:
 *
 * var resume = pause();
 * setTimeout(resume, 1000, "resumeValue");
 */
export interface Interceptor {
  (e:ESTree.Node, val:any, env:Env, pause?:() => (resumeValue:any) => void):void;
}

export interface EvaluationConfig {
  interceptor?:Interceptor;

  programText?:string;

  // name of the VM, can be filename or just any arbitrary name.
  // Leaving it undefined will by default assign name like VMx where `x` is next natural number.
  name?:string
}

export type TokenHandler = (e:ESTree.Node, env:ComplexEnvironment, c:()=>void, cerr:()=>void, pause?:()=>void)=>void;
export type TokensMap = {
  [key:string]:TokenHandler;
  ForStatement:TokenHandler;
  IfStatement:TokenHandler;
  BlockStatement:TokenHandler;
  FunctionExpression:TokenHandler;
  ForInStatement:TokenHandler;
};