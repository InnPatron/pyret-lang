import file("../test-block-checker-helpers.arr") as B

does-pass = B.does-pass

check "block checker should not pass unclosed lets and letrecs":
  does-pass("let: 10") is false
  does-pass("letrec: 10") is false 
  does-pass("let x = 10, y = 12: x + y") is false 
  does-pass("let x = 10, y = 12, z = 13: BAMBOOZLE") is false
  does-pass("letrec x = 10, y = 12: x + y") is false
  does-pass("letrec z = 62, x = 10, y = 12: x + y") is false
end

check "complex examples":
  does-pass(
```
examples:
  f(2) is 4
  f(3) is 9

  fun f(x):
    x * x
  end
```
) is false

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

examples:

end
```
) is false
end
