({
  requires: [
    { "import-type": "builtin", name: "srcloc" },
    { "import-type": "builtin", name: "ast" },
    { "import-type": "builtin", name: "lists" }
  ],
  nativeRequires: [
    "pyret-base/js/err-tokenizer",
    "pyret-base/js/err-parser"
  ],
  provides: {},
  theModule: function(RUNTIME, NAMESPACE, uri, srclocLib, astLib, listsLib, tokenizer, parser) {
    var srcloc = RUNTIME.getField(srclocLib, "values");
    var ast = RUNTIME.getField(astLib, "values");
    var lists = RUNTIME.getField(listsLib, "values");

    var link = RUNTIME.getField(lists, "link");
    var empty = RUNTIME.getField(lists, "empty");

    //var data = "#lang pyret\n\nif (f(x) and g(y) and h(z) and i(w) and j(u)): true else: false end";
    function makePyretPos(fileName, p) {
      var n = RUNTIME.makeNumber;
      return RUNTIME.getField(srcloc, "srcloc").app(
        RUNTIME.makeString(fileName),
        n(p.startRow),
        n(p.startCol),
        n(p.startChar),
        n(p.endRow),
        n(p.endCol),
        n(p.endChar)
      );
    }
    function combinePyretPos(fileName, p1, p2) {
      var n = RUNTIME.makeNumber;
      return RUNTIME.getField(srcloc, "srcloc").app(
        RUNTIME.makeString(fileName),
        n(p1.startRow),
        n(p1.startCol),
        n(p1.startChar),
        n(p2.endRow),
        n(p2.endCol),
        n(p2.endChar)
      );
    }
    function isSignedNumberAsStmt(stmt) {
      var node = stmt;
      if (node.name !== "stmt") return false;       node = node.kids[0];
      if (node.name !== "check-test") return false; node = node.kids[0];
      if (node.name !== "binop-expr") return false; node = node.kids[0];
      if (node.name !== "expr") return false;       node = node.kids[0];
      if (node.name !== "prim-expr") return false;  node = node.kids[0];
      if (node.name !== "num-expr") return false;   node = node.kids[0];
      if (node.name !== "NUMBER") return false;
      return node.value[0] === '-' || node.value[0] === '+';
    }
    function translate(node, fileName) {
      // NOTE: This translation could blow the stack for very deep ASTs
      // We might have to rewrite the whole algorithm
      // One possibility is to reuse a stack of {todo: [...], done: [...], doing: fn} nodes
      // where each AST kid that needs to be recursively processed pushes a new frame on the stack
      // (it can eagerly process any primitive values, and defer the rest),
      // and returns a function to be called when all the new todos are done (which gets put into doing)
      // if a todo item is a Pyret value, it just gets pushed across to done
      // if a todo item is an array, then doing = RUNTIME.makeList and it creates a stack frame
      function tr(node) {
        if (translators[node.name] === undefined)
          throw new Error("Cannot find " + node.name + " in translators");
        return translators[node.name](node);
      }
      var pos = function(p) { return makePyretPos(fileName, p); };
      var pos2 = function(p1, p2) { return combinePyretPos(fileName, p1, p2); };
      function makeListTr(arr, start, end, onto, f) {
        var ret = onto || empty;
        start = start || 0;
        end = end || arr.length;
        f = f || tr;
        for (var i = end - 1; i >= start; i--)
          ret = link.app(f(arr[i]), ret);
        return ret;
      }
      function makeListComma(arr, start, end, f) {
        var ret = empty;
        start = start || 0;
        end = end || arr.length;
        f = f || tr;
        for (var i = end - 1; i >= start; i -= 2)
          ret = link.app(f(arr[i]), ret);
        return ret;
      }
      function makeList(arr, start, end, onto) {
        var ret = onto || empty;
        start = start || 0;
        end = end || arr.length;
        for (var i = end - 1; i >= start; i--)
          ret = link.app(arr[i], ret);
        return ret;
      }
      function name(tok) {
        if (tok.value === "_")
          return RUNTIME.getField(ast, 's-underscore').app(pos(tok.pos));
        else
          return RUNTIME.getField(ast, 's-name').app(pos(tok.pos), RUNTIME.makeString(tok.value));
      }
      function symbol(tok) {
        return RUNTIME.makeString(tok.value);
      }
      function string(tok) {
        if (tok.value.substring(0, 3) === "```")
          return RUNTIME.makeString(tok.value.slice(3, -3).trim());
        else
          return RUNTIME.makeString(tok.value.slice(1, -1));
      }
      function number(tok) { return RUNTIME.makeNumberFromString(tok.value); }
      const translators = {
        
      };
      return tr(node);
    }

    function parseDataRaw(data, fileName) {
      var message = "";
      try {
        const toks = tokenizer.Tokenizer;
        const grammar = parser.PyretGrammar;
        toks.tokenizeFrom(data);
        // while (toks.hasNext())
        //   console.log(toks.next().toString(true));
        var parsed = grammar.parse(toks);
        //console.log("Result:");
        var countParses = grammar.countAllParses(parsed);
        if (countParses == 0) {
          var nextTok = toks.curTok;
          message = "There were " + countParses + " potential parses.\n" +
                      "Parse failed, next token is " + nextTok.toString(true) +
                      " at " + fileName + ", " + nextTok.pos.toString(true);
          if (toks.isEOF(nextTok))
            RUNTIME.ffi.throwParseErrorEOF(makePyretPos(fileName, nextTok.pos));
          else if (nextTok.name === "UNTERMINATED-STRING")
            RUNTIME.ffi.throwParseErrorUnterminatedString(makePyretPos(fileName, nextTok.pos));
          else if (nextTok.name === "BAD-NUMBER")
            RUNTIME.ffi.throwParseErrorBadNumber(makePyretPos(fileName, nextTok.pos));
          else if (nextTok.name === "BAD-OPER")
            RUNTIME.ffi.throwParseErrorBadOper(makePyretPos(fileName, nextTok.pos));
          else if (nextTok.name === "COLONCOLON")
            RUNTIME.ffi.throwParseErrorColonColon(makePyretPos(fileName, nextTok.pos));
          else if (typeof opLookup[String(nextTok.value).trim()] === "function")
            RUNTIME.ffi.throwParseErrorBadCheckOper(makePyretPos(fileName, nextTok.pos));
          else
            RUNTIME.ffi.throwParseErrorNextToken(makePyretPos(fileName, nextTok.pos), nextTok.value || nextTok.toString(true));
        }
        //console.log("There were " + countParses + " potential parses");
        if (countParses === 1) {
          var ast = grammar.constructUniqueParse(parsed);
          //          console.log(ast.toString());
          return RUNTIME.ffi.makeRight(translate(ast, fileName));
        } else {
          var asts = grammar.constructAllParses(parsed);
          throw "Non-unique parse";
          for (var i = 0; i < asts.length; i++) {
            //console.log("Parse " + i + ": " + asts[i].toString());
            //            console.log(("" + asts[i]) === ("" + asts2[i]));
          }
          return RUNTIME.ffi.makeRight(translate(ast, fileName));
        }
      } catch(e) {
        if (RUNTIME.isPyretException(e)) {
          return RUNTIME.ffi.makeLeft(RUNTIME.makeObject({
            exn: e.exn,
            message: RUNTIME.makeString(message)
          }));
        } else {
          throw e;
        }
      }
    }

    function errParsePyret(data, fileName) {
      RUNTIME.ffi.checkArity(2, arguments, "err-surface-parse", false);
      RUNTIME.checkString(data);
      RUNTIME.checkString(fileName);
      var result = parseDataRaw(RUNTIME.unwrap(data), RUNTIME.unwrap(fileName));
      return RUNTIME.ffi.cases(RUNTIME.ffi.isEither, "is-Either", result, {
        left: function(err) {
          var exn = RUNTIME.getField(err, "exn");
          var message = RUNTIME.getField(err, "message");
          console.error(message);
          RUNTIME.raise(exn);
        },
        right: function(ast) {
          return ast;
        }
      });
    }

    function errMaybeParsePyret(data, fileName) {
      RUNTIME.ffi.checkArity(2, arguments, "err-maybe-surface-parse", false);
      RUNTIME.checkString(data);
      RUNTIME.checkString(fileName);
      return parseDataRaw(RUNTIME.unwrap(data), RUNTIME.unwrap(fileName));
    }

    return RUNTIME.makeModuleReturn({
          'err-surface-parse': RUNTIME.makeFunction(errParsePyrer, "err-surface-parse"),
          'err-maybe-surface-parse': RUNTIME.makeFunction(errMaybeParsePyret, "err-maybe-surface-parse"),
        }, {});
  }
})
