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

import {TokensMap} from "./types";
import {VariableDeclaration, VariableDeclarator} from "./interpreter/variables";
import {FunctionExpression, FunctionDeclaration} from "./interpreter/function";
import {
  BinaryExpression,
  LogicalExpression,
  UnaryExpression,
  ObjectExpression,
  UpdateExpression,
  ThisExpression,
  MemberExpression,
  NewExpression,
  ArrayExpression,
  SequenceExpression,
  ConditionalExpression,
  ArrowFunctionExpression,
  YieldExpression
} from "./interpreter/expressions";
import {
  LabeledStatement,
  ForStatement,
  BreakStatement,
  ContinueStatement,
  ForInStatement,
  WhileStatement,
  DoWhileStatement,
  ExpressionStatement,
  WithStatement,
  BlockStatement,
  IfStatement,
  SwitchStatement,
  SwitchCase,
  TryStatement,
  ThrowStatement,
  CatchClause,
  ReturnStatement,
  DebuggerStatement,
  ForOfStatement,
  EmptyStatement,
  Program
} from "./interpreter/statements";
import {Literal, Identifier, Property} from "./interpreter/base";

export let tokens:TokensMap = {

  Literal,
  Identifier,
  Property,

  VariableDeclaration,
  VariableDeclarator,

  FunctionExpression,
  FunctionDeclaration,

  BinaryExpression,
  LogicalExpression,
  UnaryExpression,
  ObjectExpression,
  UpdateExpression,
  ThisExpression,
  MemberExpression,
  NewExpression,
  ArrayExpression,
  SequenceExpression,
  ConditionalExpression,
  ArrowFunctionExpression,
  YieldExpression,

  EmptyStatement,
  LabeledStatement,
  ForStatement,
  BreakStatement,
  ContinueStatement,
  ForInStatement,
  WhileStatement,
  DoWhileStatement,
  ExpressionStatement,
  WithStatement,
  BlockStatement,
  IfStatement,
  SwitchStatement,
  SwitchCase,
  TryStatement,
  ThrowStatement,
  CatchClause,
  ReturnStatement,
  DebuggerStatement,
  ForOfStatement,
  Program
};
