provide *
provide-types *

import runtime-facade as _

data Pick<a, b>:
  | pick-none
  | pick-some(elt :: a, rest :: b)
end
