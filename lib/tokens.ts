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
  YieldExpression, AssignmentExpression
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
import {Literal, Identifier, Property, ArrayPattern} from "./interpreter/base";

export let tokens:TokensMap = {
  Literal,
  Identifier,
  Property,
  ArrayPattern,

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
  AssignmentExpression,

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
