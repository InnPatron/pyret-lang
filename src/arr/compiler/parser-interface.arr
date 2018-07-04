provide *

import either as E
import parse-pyret as P
import block-checker as BCK

left = E.left
right = E.right
type Either = E.Either

fun surface-parse(content, uri):
  result = P.maybe-surface-parse(content, uri)
  cases(Either) result:
    | left(err) => BCK.block-check(content, uri)
    | right(code) => code
  end
end
