({
  requires: [],
  nativeRequires: [
    "pyret-base/js/pyret-tokenizer",
  ],
  provides: {},
  theModule: function(RUNTIME, NAMESPACE, uri, tokenizer) {

    const UNHANDLED = "_UNHANDLED_";

    const EXPR_BLOCK_STARTS = [
      "LAM",
      "METHOD",
      "IF",
      "ASK",
      "CASES",
      "FOR",
      "BLOCK",
      "LET",
      "LETREC",
      "TYPE-LET",
      "TABLE-SELECT",
      "TABLE-SELECT",
      "TABLE-FILTER",
      "TABLE-ORDER",
      "TABLE-EXTRACT",
      "TABLE-UPDATE",
      "TABLE-EXTEND",
      "LOAD-TABLE",
      "REACTOR",
    ];

    const STMT_BLOCK_STARTS = [
      "SPY",
      "FUN",
      "DATA",
      "WHEN",
      "CHECK",
      "EXAMPLES",
      "CHECKCOLON",
      "EXAMPLESCOLON",
    ].concat(EXPR_BLOCK_STARTS);

    const END_DELIMITED = {
        "UNTERMINATED-STRING": ustringHandler,
        "PROVIDE": provideHandler,
        "SPY": genericBlockHandler ,
        "LET": genericBlockHandler,
        "LETREC": genericBlockHandler,
        "TYPE-LET": genericBlockHandler,
        "FUN": genericBlockHandler,
        "CHECK": genericBlockHandler,
        "EXAMPLES": genericBlockHandler,
        "CHECKCOLON": genericBlockHandler,
        "EXAMPLESCOLON": genericBlockHandler,
        "DATA": genericBlockHandler,
        "WHEN": genericBlockHandler,
        "LAM": genericBlockHandler,
        "METHOD": genericBlockHandler,
        "TABLE": genericBlockHandler,
        "REACTOR": genericBlockHandler,
        "IF": genericBlockHandler,
        "ASK": genericBlockHandler,
        "CASES": genericBlockHandler,
        "FOR": genericBlockHandler,
        "TABLE-SELECT": genericBlockHandler,
        "TABLE-FILTER": genericBlockHandler,
        "TABLE-ORDER": genericBlockHandler,
        "TABLE-EXTRACT": genericBlockHandler,
        "TABLE-UPDATE": genericBlockHandler,
        "TABLE-EXTEND": genericBlockHandler,
        "LOAD-TABLE": genericBlockHandler,
        "BLOCK": genericBlockHandler,
    };

    const SUBKEYWORDS = {
        "PROVIDE": STMT_BLOCK_STARTS,
        "SPY": EXPR_BLOCK_STARTS ,
        "LET": EXPR_BLOCK_STARTS,
        "LETREC": EXPR_BLOCK_STARTS,
        "TYPE-LET": EXPR_BLOCK_STARTS,
        "FUN": EXPR_BLOCK_STARTS,
        "CHECK": EXPR_BLOCK_STARTS,
        "EXAMPLES": EXPR_BLOCK_STARTS,
        "CHECKCOLON": EXPR_BLOCK_STARTS,
        "EXAMPLESCOLON": EXPR_BLOCK_STARTS,
        "DATA": EXPR_BLOCK_STARTS,
        "WHEN": EXPR_BLOCK_STARTS,
        "LAM": ["BLOCK"],
        "METHOD": ["BLOCK"],
        "TABLE": EXPR_BLOCK_STARTS,
        "REACTOR": EXPR_BLOCK_STARTS,
        "IF": EXPR_BLOCK_STARTS,
        "ASK": EXPR_BLOCK_STARTS,
        "CASES": EXPR_BLOCK_STARTS,
        "FOR": EXPR_BLOCK_STARTS,
        "TABLE-SELECT": EXPR_BLOCK_STARTS,
        "TABLE-FILTER": EXPR_BLOCK_STARTS,
        "TABLE-ORDER": EXPR_BLOCK_STARTS,
        "TABLE-EXTRACT": EXPR_BLOCK_STARTS,
        "TABLE-UPDATE": EXPR_BLOCK_STARTS,
        "TABLE-EXTEND": EXPR_BLOCK_STARTS,
        "LOAD-TABLE": EXPR_BLOCK_STARTS,
        "BLOCK": STMT_BLOCK_STARTS,
    };

    function sanitizeName(name) {
      // Remove any leading single quote
      // NOTE: I cannot trace where the single quote is being inserted in
      // According to the Token constructor in rnglr.js:382, the name field is NOT being modified
      if (name.charAt(0) === '\'') {
        return name.substring(1);
      } else {
        return name;
      }
    }

    function provideHandler(state, toks) {
      if (!toks.hasNext()) {
        state.err = null;
        return;
      }

      var next = toks.next();
      var nextName = sanitizeName(next.name);
      if (nextName == "STAR") {
        popHandler(state);
        popTok(state);
      } else {
        // Assume provide statement. Take until END
        genericBlockHandler(state, toks);
      }

      popTok(state);
      popHandler(state);
    }

    function topLevelScanner(state, toks) { 
      if (!toks.hasNext()) {
        state.handler.pop();
        return;
      }

      var nextTok = toks.next();
      var nextName = sanitizeName(nextTok.name);

      var nextHandler = END_DELIMITED[nextName];
      if (nextHandler !== undefined) {
        pushHandler(state, nextHandler);
        pushTok(state, nextTok);
      }
    }

    function genericBlockHandler(state, toks) {
      if (!toks.hasNext()) {
        state.err = null;
        return;
      }

      var nextTok = toks.next();
      var nextName = sanitizeName(nextTok.name);

      while (nextName != "END") {
        var nextHandler = END_DELIMITED[nextName];
        if (nextHandler !== undefined) {
          // Found a keyword
          var currentTok = peekTok(state);
          var currentName = sanitizeName(currentTok.name);
          var subkeywords = SUBKEYWORDS[currentName];

          if (subkeywords === undefined) {
            state.err = nextTok;
            return;
          }

          if (!subkewords.includes(nextName)) {
            state.err = nextTok;
            return;
          }

          // Subkeyword allowed
          pushTok(state, nextTok);
          pushHandler(state, nextHandler);
          return;
        }

        // Scan next token
        if (!toks.hasNext()) {
          state.err = null;
          return;
        }
        nextTok = toks.next();
        nextName = sanitizeName(nextTok.name);
      }

      // Remove this block
      popTok(state);
      popHandler(state);
    }

    function ustringHandler(state, toks) {
      state.err = UNHANDLED;
      return;
    }

    function popHandler(state) {
      return state.handler.pop();
    }

    function pushHandler(state, handler) {
      state.handler.push(handler);
    }

    function popTok(state) {
      return state.delimiters.pop();
    }

    function pushTok(state, tokenName) {
      state.delimiters.push(tokenName);
    }
    
    function peekTok(state) {
      var result = state.delimiters.pop();
      state.delimiters.push(result);
      return result;
    }

    function check(data, fileName) {
      const toks = tokenizer.Tokenizer;
      toks.tokenizeFrom(data);

      var state = new Object();
      state.handler = [];
      state.handler.push(topLevelScanner);
      state.delimiters = [];
      state.end = false;

      while (state.handler.length > 0) {
        // Ugly hack for peek functionality
        var currentHandler = state.handler.pop();
        state.handler.push(currentHandler);
        currentHandler(state, toks);

        if (state.err !== undefined) {

          if (state.err === UNHANDLED) {
            return null;
          }

          return {
            errToken: state.err,
            lastDelim: peekTok(state),
          };
        }
      }

      return null;
    }

    function errorHandling(fileName, errorObject) {
      // Missing 'end' extended to EOF with no hints
      if (errorObject.errToken === null) {
        RUNTIME.ffi.throwMissingEnd(RUNTIME.ffi.makePyretPos(fileName, errorObject.lastDelim.pos));
      }

      // Generic error message
      RUNTIME.ffi.throwMissingEndHint(
          RUNTIME.ffi.makePyretPos(fileName, errorObject.lastDelim.pos), 
          RUNTIME.ffi.makePyretPos(fileName, errorObject.errToken.pos));
    }

    function blockCheckRaw(data, fileName) {
      try {
        var result = check(RUNTIME.unwrap(data), RUNTIME.unwrap(fileName));

        if (result === null) {
          return RUNTIME.ffi.makeNone();
        } else {
          errorHandling(fileName, result);
        }
      } catch(e) {
        if (RUNTIME.isPyretException(e)) {
          return RUNTIME.ffi.makeSome(RUNTIME.makeObject({
            exn: e.exn,
          }));
        } else {
          throw e;
        }
      }
    }

    function blockCheck(data, fileName) {
      RUNTIME.ffi.checkArity(2, arguments, "block-check", false);
      RUNTIME.checkString(data);
      RUNTIME.checkString(fileName);
      var result = blockCheckRaw(RUNTIME.unwrap(data), RUNTIME.unwrap(fileName));
      return RUNTIME.ffi.cases(RUNTIME.ffi.isOption, "is-Option", result, {
        left: function(err) {
          var exn = RUNTIME.getField(err, "exn");
          console.error(message);
          RUNTIME.raise(exn);
        },
        right: function(ast) {
          return ast;
        }
      });
    }

    function maybeBlockCheck(data, fileName) {
      RUNTIME.ffi.checkArity(2, arguments, "maybe-block-check", false);
      RUNTIME.checkString(data);
      RUNTIME.checkString(fileName);

      return blockCheckRaw(RUNTIME.unwrap(data), RUNTIME.unwrap(fileName));
    }

    return RUNTIME.makeModuleReturn({
          'block-check': RUNTIME.makeFunction(blockCheck, "block-check"),
          'maybe-block-check': RUNTIME.makeFunction(maybeBlockCheck, "maybe-block-check"),
        }, {});
  }
})
