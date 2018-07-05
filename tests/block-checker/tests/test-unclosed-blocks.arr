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

