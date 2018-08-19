import file("../test-block-checker-helpers.arr") as B

does-pass = B.does-pass

check "block checker should pass lets and letrecs":
  does-pass("let: 10 end") is true
  does-pass("letrec: 10 end") is true 
  does-pass("let x = 10, y = 12: x + y end") is true
  does-pass("let x = 10, y = 12, z = 13: BAMBOOZLE end") is true
  does-pass("letrec x = 10, y = 12: x + y end") is true
  does-pass("letrec z = 62, x = 10, y = 12: x + y end") is true
end

check "block checker should pass type-lets":
  does-pass("type-let t1 = Number, t2 = String: 5 end") is true
  does-pass("type-let t1 = Number: 10 end") is true
  does-pass("type-let: 10 end") is true
  does-pass("type-let newtype List as ListT: {} end") is true
  does-pass("type-let newtype List as ListT, thing = foo: {} end") is true
end

check "block checker should pass if/ask expressions":
  does-pass(
```
  ask:
    | foo
    | bar
  end
```) is true

  does-pass(
```
  if true:
  end
```) is true

  does-pass(
```
  if true:
  else false:
  end
```) is true
end

check "block checker should pass embedded blocks":
  does-pass(
```
  if x == 1:
    if y == 2:
      1
    else:
      2
    end
  else:
    3
  end
```
) is true
end

check "block checker should pass provide statements":
  does-pass(
```
  provide *

  fun foo():
  1 
  end
```) is true

  does-pass(
```
  provide {
    set: list-set,
    list-set: list-set,
    tree-set: tree-set,
    empty-set: empty-list-set,
    empty-list-set: empty-list-set,
    empty-tree-set: empty-tree-set,
    list-to-set: list-to-list-set,
    list-to-list-set: list-to-list-set,
    list-to-tree-set: list-to-tree-set,
    fold: set-fold,
    all: set-all,
    any: set-any
  } end

  fun foo():
  1 
  end
```
) is true
end

check "block checker should pass more complex examples":
  does-pass(
```
examples:
  f(2) is 4
  f(3) is 9
end

fun f(x):
  x * x
end
```
) is true

  does-pass(
```
examples:
  update-player(5, "up") is 5 + 5
  update-player(5, "down") is 5 - 5
end

fun update-player(x, key):
  if key == "up": x + 5
  else if key == "down": x - 5
  else: x
  end
end

examples:
  
end
```
) is true
end
