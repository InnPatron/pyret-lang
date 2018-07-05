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
