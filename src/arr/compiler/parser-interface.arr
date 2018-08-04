provide *

import either as E
import parse-pyret as P
import block-checker as BCK
import render-error-display as RED

left = E.left
right = E.right
type Either = E.Either

fun surface-parse(content, uri):
  result = P.maybe-surface-parse(content, uri)
  cases(Either) result:
    | left(err) => error-handling(content, uri, err)
    | right(code) => code
  end
end

fun error-handling(content, uri, default-err):
  cases(Option) BCK.maybe-block-check(content, uri):
    | some(err) => handle-error(err)
    | none => handle-error(default-err)
  end
end

fun handle-error(err):
  raise(RED.display-to-string(err.exn.render-reason(), torepr, empty))
end
