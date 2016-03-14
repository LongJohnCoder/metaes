import {mainEvaluate} from "./metaes";
import * as sourcemapSupport from "source-map-support";

sourcemapSupport.install();

let program1 = `x=2`;

console.log(mainEvaluate(program1));