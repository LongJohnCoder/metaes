import {mainEvaluate} from "./metaes";
import * as sourcemapSupport from 'source-map-support';

sourcemapSupport.install();

console.log(mainEvaluate("2+2+test", {test: "10"}));