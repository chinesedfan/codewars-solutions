# codewars-solutions

So many online algorithms training platforms, so poor my skills is.

Anyway, I jumped into a new pit!

### Katas

#### [6 By 6 Skyscrapers](https://www.codewars.com/kata/6-by-6-skyscrapers)

Backtracing with optimization. This solution can also pass the 7x7 kata.

1. Use all permutations as candidates of each row and column
1. Maintain a mask grid of impossible numbers (using bits), which can be initialized by clues
1. Repeat following steps,
    1. Filter candidates by the mask grid (if nothing happens then break)
    1. Update the mask grid and try to confirm numbers if it is the unique possible value among its cell/row/column
1. Confirm permutations of each row by backtracing
    1. Pick the next candidate and check
    1. If valid then move on (solved when it is the last row or unable to be solved if it is the first one)

#### [Check and Mate](https://www.codewars.com/kata/check-and-mate)

Simple.

#### [Decode the Morse code, for real](https://www.codewars.com/kata/decode-the-morse-code-for-real)

Core algorithm is K-means. But how to choose the right initial centers? By coincidence, standard lengthes (1/3/7) solves this kata.

#### [Functional SQL](https://www.codewars.com/kata/functional-sql)

Simple. Cache operations and excute at last.

#### [Hard Sudoku Solver](https://www.codewars.com/kata/hard-sudoku-solver-1)

(TODO)

#### [Metaprogramming: Lisp-style Generic Functions](https://www.codewars.com/kata/metaprogramming-lisp-style-generic-functions)

English is harder than the algorithm.

#### [Molecule to atoms](https://www.codewars.com/kata/molecule-to-atoms)

All parsing katas share similar steps to solve,

1. Parse as different kinds of tokens first
1. Then deal with tokens

#### [The maximum sum value of ranges -- Ultimate version](https://www.codewars.com/kata/the-maximum-sum-value-of-ranges-ultimate-version)

RMQ problem. But need to optimize very carefully.

- Only build the tree among changed elements, which reduces from O(NLogN) to O(N + RLogR)
- Different versions of Node.js behave a bit differently

#### [Regular Expression for Binary Numbers Divisible by n](https://www.codewars.com/kata/regular-expression-for-binary-numbers-divisible-by-n)

FSM (Finite State Machine) to regular expression is really an interesting problem. There are 2 main kinds of ways: removing paths or states. I implemented the second one.

Notice non-captured groups save so much performance.

#### [The builder of things](https://www.codewars.com/kata/the-builder-of-things)

Learn `Proxy` usage.

#### [The position of a digital string in a infinite digital string](https://www.codewars.com/kata/the-position-of-a-digital-string-in-a-infinite-digital-string)

(TODO) Forget details.
