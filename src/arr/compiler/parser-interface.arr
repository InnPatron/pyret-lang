provide *

import either as E
import parse-pyret-err as EP
import parse-pyret as P

left = E.left
right = E.right
type Either = E.Either

fun surface-parse(content, uri):
  result = P.maybe-surface-parse(content, uri)
  cases(Either) result:
    | left(err) => raise(err)
    | right(code) => code
  end
end
