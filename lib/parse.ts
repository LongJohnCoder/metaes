import * as esprima from "esprima";

export let parseConfig = {
  loc: true,
  range: true
};

export function parse(source:string) {
  return esprima.parse(source, parseConfig);
}