// The MIT License (MIT)
//
// Copyright (c) 2015 Bartosz Krupa
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import {MetaFunction} from "./metafunction";
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