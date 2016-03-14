import {delayEvaluate} from "../evaluate";
import {getValue} from "../environment";

export function Literal(e:ESTree.Literal, env, c, cerr) {
  c(e.value);
}

export function Identifier(e:ESTree.Identifier, env, c, cerr) {
  try {
    function foundName(pair) {
      var value = pair[0],
        container = pair[1];
      c(value, container, e.name);
    }

    getValue(env, e.name, true, foundName, cerr);
  } catch (error) {
    cerr("Error", error, e);
  }
}

export function Property(e:ESTree.Property, env, c, cerr) {
  function continueToValue(key) {
    key = e.key.name || key;
    delayEvaluate(e.value, env, (value) => {
      c({
        key: key,
        value: value
      });
    }, cerr);
  }

  delayEvaluate(e.key, env, continueToValue, continueToValue);
}