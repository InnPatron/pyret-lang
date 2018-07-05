provide *

import block-checker as BCK

fun does-pass(input :: String):
  cases(Option) BCK.maybe-block-check(input, "foo"):
    | some(_) => false

    | none => true
  end
end
