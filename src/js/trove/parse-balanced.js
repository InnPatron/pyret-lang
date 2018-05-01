({
  requires: [
    { "import-type": "builtin", name: "srcloc" },
    { "import-type": "builtin", name: "ast" },
    { "import-type": "builtin", name: "lists" }
  ],
  nativeRequires: [
    "pyret-base/js/balanced-tokenizer",
    "pyret-base/js/balanced-parser"
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
    
    

    const opLookup = {
      "+":   RUNTIME.makeString("op+"),
      "-":   RUNTIME.makeString("op-"),
      "*":   RUNTIME.makeString("op*"),
      "/":   RUNTIME.makeString("op/"),
      "$":   RUNTIME.makeString("op^"),
      "^":   RUNTIME.makeString("op^"),
      "<=":  RUNTIME.makeString("op<="),
      "<":   RUNTIME.makeString("op<"),
      ">=":  RUNTIME.makeString("op>="),
      ">":   RUNTIME.makeString("op>"),
      "==":  RUNTIME.makeString("op=="),
      "=~":  RUNTIME.makeString("op=~"),
      "<=>": RUNTIME.makeString("op<=>"),
      "<>":  RUNTIME.makeString("op<>"),
      "and": RUNTIME.makeString("opand"),
      "or":  RUNTIME.makeString("opor"),

      "is":                function(l){return RUNTIME.getField(ast, "s-op-is").app(l);},
      "is-roughly":        function(l){return RUNTIME.getField(ast, "s-op-is-roughly").app(l);},
      "is==":              function(l){return RUNTIME.getField(ast, "s-op-is-op").app(l, "op==");},
      "is=~":              function(l){return RUNTIME.getField(ast, "s-op-is-op").app(l, "op=~");},
      "is<=>":             function(l){return RUNTIME.getField(ast, "s-op-is-op").app(l, "op<=>");},
      "is-not":            function(l){return RUNTIME.getField(ast, "s-op-is-not").app(l);},
      "is-not==":          function(l){return RUNTIME.getField(ast, "s-op-is-not-op").app(l, "op==");},
      "is-not=~":          function(l){return RUNTIME.getField(ast, "s-op-is-not-op").app(l, "op=~");},
      "is-not<=>":         function(l){return RUNTIME.getField(ast, "s-op-is-not-op").app(l, "op<=>");},
      "satisfies":         function(l){return RUNTIME.getField(ast, "s-op-satisfies").app(l);},
      "violates":          function(l){return RUNTIME.getField(ast, "s-op-satisfies-not").app(l);},
      "raises":            function(l){return RUNTIME.getField(ast, "s-op-raises").app(l);},
      "raises-other-than": function(l){return RUNTIME.getField(ast, "s-op-raises-other").app(l);},
      "does-not-raise":    function(l){return RUNTIME.getField(ast, "s-op-raises-not").app(l);},
      "raises-satisfies":  function(l){return RUNTIME.getField(ast, "s-op-raises-satisfies").app(l);},
      "raises-violates":   function(l){return RUNTIME.getField(ast, "s-op-raises-violates").app(l);},
    }

    function parseDataRaw(data, fileName) {
      var message = "";
      try {
        const toks = tokenizer.Tokenizer;
        const grammar = parser.BalancedGrammar;
        toks.tokenizeFrom(data);
        // while (toks.hasNext())
        //   console.log(toks.next().toString(true));
        var parsed = grammar.parse(toks);
        //console.log("Result:");
        var countParses = grammar.countAllParses(parsed);
        if (countParses == 0) {
          return RUNTIME.ffi.makeLeft("Failed balance check");
        }
        //console.log("There were " + countParses + " potential parses");
        if (countParses === 1) {
          return RUNTIME.ffi.makeRight(null);
        } else {
          return RUNTIME.ffi.makeRight(null);
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

    function maybeParseBalanced(data, fileName) {
      RUNTIME.ffi.checkArity(2, arguments, "maybe-balanced-parse", false);
      RUNTIME.checkString(data);
      RUNTIME.checkString(fileName);
      return parseDataRaw(RUNTIME.unwrap(data), RUNTIME.unwrap(fileName));
    }

    return RUNTIME.makeModuleReturn({
          'maybe-balanced-parse': RUNTIME.makeFunction(maybeParseBalanced, "maybe-balanced-parse"),
        }, {});
  }
})
