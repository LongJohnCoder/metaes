/**
 * Creates a version of `fn` that is uncallable until it's allowed.
 *
 * @param fn - default function to be called
 * @param c - alternative function that can be called with a value instead of `fn`
 * @param args - arguments to `fn` if `fn` is called
 * @returns {{pauser: Function, delayed: Function}}
 */
export function createPausable(fn, c, execute, args) {
  var
    locked = false,
    delayed = function () {
      if (!locked) {
        locked = true;
        if (arguments.length) {
          // alternative call with given continuation
          c.apply(null, arguments);
        } else {
          // normal call
          fn.apply(null, args);
        }
      }
    },
    resume = function () {
      locked = false;
      delayed.apply(null, arguments);

      // rerun the VM
      execute();
    },
    pauser = function () {
      locked = true;
      return function () {
        resume.apply(null, arguments);
      }
    };

  return {pauser: pauser, delayed: delayed};
}