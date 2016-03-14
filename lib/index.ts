import {mainEvaluate} from "./metaes";
import * as sourcemapSupport from "source-map-support";

sourcemapSupport.install();

let program1 = `let a, b, c;
[a, b, c] = [1, 2, 3];

a === 1 && b === 2 && c === 3;`;

console.log(mainEvaluate(program1, {test: "10"}));