import parse-pyret as P
import pprint as PP

check "parse and print":
   x = P.surface-parse("{1; 2}", "test")
   x.tosource().pretty(80) is [list: "{ 1; 2 }"]
end


check "basic tuple access":
   x = {1; 3; 10}
   y = x.{2}
   x.{0} is 1
   x.{1} is 3
   x.{2} is 10
   x.{10000} raises "Index too large"
#|   x.{3} raises "lookup-too-large"
   y.{0} raises "lookup-non-tuple" |#
end 


check "print tuple":
  x = {13; 1 + 4; 41; 1}
  torepr(x) is "{ 13; 5; 41; 1 }"
end 

check "tuple equals":
 x = {1; 3; 5; 2}
 y = {1; 3; 5; 2}
 z = {1; 3; 4; 2}
 a = {1; 3}
 x is y
 x is-not z
 x is x
 a is-not z
end

check "parse and print tuple-get":
   x = P.surface-parse("tup.{2}", "test")
   x.tosource().pretty(80) is [list: "tup.{2}"]
end

check "pase and print tuple-let":
   x = P.surface-parse("{x;y} = {1;2}", "test")
   x.tosource().pretty(80) is [list: "{x; y} ={ 1; 2 }"]
end

#| check "tuple binding":
  {x;y} = {1; 2}
  x is 1
  y is 2
end |#
