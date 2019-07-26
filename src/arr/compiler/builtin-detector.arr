provide *
provide-types *

import srcloc as SL
import file("compile-structs.arr") as CS
import file("desugar-helpers.arr") as DH
import file("ast.arr") as A
import file("concat-lists.arr") as CL


type Loc = SL.Srcloc
type Expr = A.Expr
type Name = A.Name
type Bind = A.Bind
type Ann = A.Ann

data ImportFlags:
  | flags(
          array-import :: Boolean,
          number-import :: Boolean,
          reactor-import :: Boolean,
          table-import :: Boolean)
end

fun default-import-flags() -> ImportFlags:
  flags(false, false, false, false)
end

fun fuse-flags(lhs, rhs) -> ImportFlags:
  flags(
    lhs.array-import or rhs.array-import,
    lhs.number-import or rhs.number-import,
    lhs.reactor-import or rhs.reactor-import,
    lhs.table-import or rhs.table-import
  )
end

flat-prim-app = A.prim-app-info-c(false)

fun nyi(name):
  raise("Not implemented:" + name)
end

fun check-list(import-flags, exprs):
  if is-empty(exprs):
    import-flags
  else:
    first-flags = check-expr(import-flags, exprs.first)
    rest-flags = check-list(first-flags, exprs.rest)
    rest-flags
  end
end

fun check-seq(import-flags, exprs):
  if is-empty(exprs.rest):
    check-expr(import-flags, exprs.first)
  else:
    first-flags = check-expr(import-flags, exprs.first)
    rest-flags = check-seq(first-flags, exprs.rest)
    rest-flags
  end
end

fun check-expr(import-flags, expr :: A.Expr):
  cases(A.Expr) expr block:
    | s-module(l, answer, dms, dvs, dts, checks) =>
      ans-flags = check-expr(import-flags, answer)

      top-level-flags = for fold(shadow flags from ans-flags, dv from dvs):
        cases(A.DefinedValue) dv:
          | s-defined-value(name, def-v) => fuse-flags(flags, check-expr(flags, def-v))
          | else => flags
        end
      end 

      top-level-flags

    | s-block(l, exprs) => check-list(import-flags, exprs)
    | s-num(l, n) => 
      import-flags.{ number-import: true }

    | s-id(l, id) => import-flags
    | s-id-letrec(l, id, _) => import-flags
    | s-id-modref(l, id, _, field) => import-flags

    | s-prim-app(l, name, args, _) =>
      check-list(import-flags, args)
      
    | s-app-enriched(l, f, args, info) =>
      f-flags = check-expr(import-flags, f)
      check-list(f-flags, args)

    | s-app(l, f, args) =>
      f-flags = check-expr(import-flags, f)
      check-list(import-flags, args)

    | s-srcloc(_, l) => import-flags

    | s-op(l, op-l, op, left, right) =>
      lhs-flags = check-expr(import-flags, left)
      rhs-flags = check-expr(import-flags, right)

      fuse-flags(lhs-flags, rhs-flags)

    | s-lam(l, name, _, args, _, _, body, _, _, _) =>
      check-expr(import-flags, body)

    | s-let-expr(l, binds, body, _) =>

      prelude-flags = for fold(shadow flags from import-flags, v from binds.reverse()):
        check-expr(flags, v.value)
      end

      check-expr(prelude-flags, body)
      
    | s-letrec(l, binds, body, _) =>
      
      prelude-flags = for fold(shadow flags from import-flags, v from binds.reverse()):
        check-expr(flags, v.value)
      end

      check-expr(prelude-flags, body)

    | s-type-let-expr(_, binds, body, _) =>
      # Because if we're taking type seriously, this can't fail! 
      check-expr(import-flags, body)

    | s-data(_, _, _, mixins, _, _, _, _checks) =>
      mixin-flags = check-list(import-flags, mixins)

      cases(Option) _checks:
        | some(checks) => check-expr(mixin-flags, checks)
        | none => mixin-flags
      end

    | s-data-expr(l, name, namet, params, mixins, variants, shared, _check-loc, _check) =>
      mixin-flags = check-list(import-flags, mixins)

      cases(Option) _check:
        | some(checks) => check-expr(mixin-flags, checks)
        | none => mixin-flags
      end 
      
    | s-dot(l, obj, field) =>
      check-expr(import-flags, obj)

    | s-if-else(l, branches, _else, _) =>

      else-flags = check-expr(import-flags, _else)

      
      block-flags = for fold(shadow flags from else-flags, b from branches.reverse()):
        test-flags = check-expr(flags, b.test)
        body-flags = check-expr(flags, b.body)
        fuse-flags(test-flags, body-flags)
      end

      block-flags

    | s-cases-else(l, typ, val, branches, _else, blocky) =>
      
      val-flags = check-expr(import-flags, val)
      switch-flags = for fold(shadow flags from val-flags, b from branches):
        cases(A.CasesBranch) b: 
          | s-cases-branch(_, pl, name, args, body) =>
            check-expr(flags, body)
          | s-singleton-cases-branch(_, pl, name, body) =>
            check-expr(flags, body)
        end
      end

      else-flags = check-expr(switch-flags, _else)
      
      else-flags

    | s-obj(l, fields) =>

      field-flags = for fold(shadow flags from import-flags, f from fields) block:
         check-expr(flags, f.value)
      end
      field-flags

    | s-array(l, elts) =>
      check-list(import-flags, elts)

    | s-construct(l, modifier, constructor, elts) =>
      cons-flags = check-expr(import-flags, constructor)
      elts-flags = check-list(cons-flags, elts)
      elts-flags

    | s-instantiate(l, inner-expr, params) => 
      check-expr(import-flags, inner-expr)

    | s-user-block(l, body) => 
      check-expr(import-flags, body)

    | s-template(l) => import-flags
    | s-method(l, name, params, args, ann, doc, body, _check-loc, _check, blocky) => nyi("s-method")
    | s-type(l, name, params, ann) => import-flags
    | s-newtype(l, name, namet) => import-flags

    | s-when(l, test, body, blocky) =>
      fuse-flags(check-expr(import-flags, test), check-expr(import-flags, body))
      
    | s-if(l, branches, blocky) => 
      check-expr(
        import-flags,
        A.s-if-else(l, 
                    branches,
                    A.s-prim-app(l, 
                      "throwNoBranchesMatched", 
                      [list: A.s-srcloc(l, l), A.s-str(l, "if")], 
                      flat-prim-app),
                    blocky)
      )
    | s-if-pipe(l, branches, blocky) => 
      check-expr(import-flags, 
                 A.s-if(l, 
                        for map(b from branches): b.to-if-branch() end, 
                        blocky))
    | s-if-pipe-else(l, branches, _else, blocky) => 
      check-expr(import-flags, 
                 A.s-if-else(l, 
                             for map(b from branches): b.to-if-branch() end,
                             _else, 
                             blocky))
    | s-cases(l, typ, val, branches, blocky) =>
      check-expr(import-flags, 
                 A.s-cases-else(l, typ, val, branches,
                   A.s-prim-app(l, 
                                "throwNoBranchesMatched",
                                [list: A.s-srcloc(l, l), A.s-str(l, "cases")], 
                                flat-prim-app),
                   blocky))
    | s-assign(l, id, val) => 
      check-expr(import-flags, val)
    | s-bracket(l, obj, key) => nyi("s-bracket")
    | s-get-bang(l, obj, field) => nyi("s-get-bang")
    | s-update(l, obj, fields) => nyi("s-update")
    | s-extend(l, obj, fields) => nyi("s-extend")

    | s-for(l, iter, bindings, ann, body, blocky) => 
      check-expr(import-flags, DH.desugar-s-for(l, iter, bindings, ann, body))

    | s-id-var(l, ident) => 
      import-flags

    | s-frac(l, num, den) => 
      import-flags.{ number-import: true } 

    | s-rfrac(l, num, den) =>
      updated = import-flags.{ number-import: true } 
      check-expr(updated, A.s-frac(l, num, den))

    | s-str(l, str) => import-flags
    | s-bool(l, bool) => import-flags
    | s-tuple(l, fields) =>

      for fold(shadow flags from import-flags, f from fields.reverse()) block:
        check-expr(flags, f)
      end
    | s-tuple-get(l, tup, index, index-loc) => 
      check-expr(import-flags, tup)

    | s-ref(l, ann) => import-flags

    | s-reactor(l, fields) =>
      import-flags.{ reactor-import: true }

    | s-paren(l, e) => 
      check-expr(import-flags, e)

    | s-let(_, _, exp, _) => check-expr(import-flags, exp)

    | s-var(l, name, value) => check-expr(import-flags, value)

    | s-check(l, name, body, keyword-check) => check-expr(import-flags, body)

    | s-check-test(l, op, refinement, left, right) => 
      left-flags = check-expr(import-flags, left)
      check-expr(left-flags, right)

    | s-table(l, headers, rows) =>
      import-flags.{ table-import: true }

    | s-load-table(l, headers, spec) => 
      import-flags.{ table-import: true }

    | s-table-extend(l, column-binds, extensions) => 
      import-flags.{ table-import: true }

    | s-table-update(l, column-binds, updates) => 
      import-flags.{ table-import: true }

    | s-table-select(l, columns, table) => 
      import-flags.{ table-import: true }

    | s-table-extract(l, column, table) => 
      import-flags.{ table-import: true }

    | s-table-order(l, table, ordering) => 
      import-flags.{ table-import: true }

    | s-table-filter(l, column-binds, predicate) => 
      import-flags.{ table-import: true }

    | s-spy-block(l, message, contents) => import-flags

    | s-fun(
        _,
        _,
        _,
        _,
        _,
        _,
        body :: A.Expr,
        _,
        _check :: Option<A.Expr>,
        _
      ) => 
      # TODO(alex): check _check?
      check-expr(import-flags, body)

    | s-hint-expr(_, _, exp) => check-expr(import-flags, exp)

    | s-rec(l :: Loc, name :: Bind, value :: Expr) => check-expr(import-flags, value)

    | s-contract(l :: Loc, name :: Name, params :: List<Name>, ann :: Ann) => import-flags

    | s-check-expr(l :: Loc, exp :: Expr, ann :: Ann) => check-expr(import-flags, exp)

    | s-prim-val(l :: Loc, name :: String) => import-flags

    | s-id-var-modref(l :: Loc, id :: Name, uri :: String, name :: String) => import-flags

    | s-undefined(l :: Loc) => import-flags

    | else => raise("NYI (builtin syntax detector): " + torepr(expr))
  end

end


fun get-import-flags(prog :: A.Program) -> ImportFlags:
  result = check-expr(default-import-flags(), prog.block)
  flags(
    result.array-import,
    result.number-import,
    result.reactor-import,
    result.table-import)
end

fun apply-import-flags(prog :: A.Program, current-deps :: List<CS.Dependency>) -> List<CS.Dependency>:
  import-flags = get-import-flags(prog)

  new-deps = current-deps
  
  table-dep = CS.builtin("tables")
  reactor-dep = CS.builtin("reactors")
  number-dep = CS.builtin("number")
  array-dep = CS.builtin("array")


  shadow new-deps = if import-flags.table-import and not(new-deps.member(table-dep)):
    new-deps.append([list: table-dep])
  else:
    new-deps
  end

  # TODO(alex): Handle rest of import flags
  #|
  shadow new-deps = if import-flags.reactor-import and not(new-deps.member(reactor-dep)):
    raise("NYI: auto reactor import")
  else:
    new-deps
  end

  shadow new-deps = if import-flags.number-import and not(new-deps.member(number-dep)):
    raise("NYI: auto number import")
  else:
    new-deps
  end

  shadow new-deps = if import-flags.array-import and not(new-deps.member(array-dep)):
    raise("NYI: auto array import")
  else:
    new-deps
  end
  |#

  new-deps
end
