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

/**
 * Creates a version of `fn` that is uncallable until it's allowed.
 *
 * @param fn - default function to be called
 * @param c - alternative function that can be called with a value instead of `fn`
 * @param args - arguments to `fn` if `fn` is called
 * @returns {{pauser: Function, delayed: Function}}
 */
export function createPausable(fn:Function, c, execute, args) {
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