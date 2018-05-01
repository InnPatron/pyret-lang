provide *

import either as E
import parse-pyret as P
import parse-balanced as PB

left = E.left
right = E.right
type Either = E.Either

fun surface-parse(content, uri):
  result = P.maybe-surface-parse(content, uri)
  cases(Either) result:
    | left(err) => parser-err(content, uri, err)
    | right(code) => code
  end
end

fun parser-err(content, uri, fallback):
  result = PB.maybe-balanced-parse(content, uri)
  block:
    cases(Either) result:
      | left(_) => "Failed balance check"
      | right(_) => fallback
    end
  end
end
