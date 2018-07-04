({
  requires: [],
  nativeRequires: [
    "pyret-base/js/pyret-tokenizer",
  ],
  provides: {},
  theModule: function(RUNTIME, NAMESPACE, uri, tokenizer) {

    const END_DELIMITED = {
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
      "IF": ["BLOCK", "ELSE IF", "ELSE"], 
      "WHEN": ["BLOCK"],
      "FUN": ["BLOCK", "WHERE"], 
      "METHOD": ["BLOCK", "WHERE"], 
      "LAM": ["BLOCK"],
      "FOR": ["BLOCK", "DO"], 
      "LET": ["BLOCK"], 
      "LETREC": ["BLOCK"], 
      "TYPE-LET": ["BLOCK"],
      "CASES": ["BLOCK"], 
      "ASK": ["BLOCK", "THEN", "OTHERWISE"],
      "DATA": ["SHARING", "WHERE"], 
      "TABLE": ["ROW"], 
      "LOAD-TABLE": ["SANITIZE", "SOURCE"]
    };

    const STATEMENT_BLOCK_STARTS = new Set([
      "SPY",
      "FUN",
      "DATA",
      "WHEN",
      "CHECK",
      "EXAMPLES",
      "CHECKCOLON",
      "EXAMPLESCOLON",
    ]);

    const EXPR_BLOCK_STARTS = new Set([
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
    ]);

    function start(state, toks) {

      popHandler(state); // Remove self

      if (toks.hasNext()) {
        pushHandler(state, topLevelScanner);
      }
    }

    function provideHandler(state, toks) {
      if (!toks.hasNext()) {
        // TODO ERROR: Encountered PROVIDE, expected more tokens
        return;
      }

      var next = toks.next().name;
      if (next == "STAR") {
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
      var nextName = nextTok.name;

      var nextHandler = END_DELIMITED[nextName];
      if (nextHandler !== undefined) {
        pushHandler(state, nextHandler);
        pushTok(state, nextTok);
      }
    }

    function genericBlockHandler(state, toks) {
      if (!toks.hasNext()) {
        // TODO ERROR: Expected an END
        return;
      }

      var nextTok = toks.next();
      var nextName = nextTok.name;

      while (nextName != "END") {
        var nextHandler = END_DELIMITED[nextName];
        if (nextHandler !== undefined) {
          // Found a keyword
          var subkeywords = SUBKEYWORDS[peekTok(state)];

          if (subkeywords === undefined) {
            // TODO: Found a keyword not allowed
            return;
          }

          if (!subkewords.includes(nextName)) {
            // TODO: Found a keyword not allowed
            return;
          }

          // Subkeyword allowed
          pushTok(state, nextTok);
          pushHandler(state, nextHandler);
          return;
        }

        // Scan next token
        if (!toks.hasNext()) {
          // TODO ERROR: Expected an end
          return;
        }
        nextTok = toks.next();
        nextName = nextTok.name;
      }

      // Remove this block
      popTok(state);
      popHandler(state);
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
      state.handler.push(start);
      state.delimiters = [];
      state.end = false;

      while (state.handler.length > 0) {
        // Ugly hack for peek functionality
        var currentHandler = state.handler.pop();
        state.handler.push(currentHandler);
        currentHandler(state, toks);

        if (state.err !== undefined) {
          return state.err;
        }
      }
    }

    function blockCheck(data, fileName) {
      RUNTIME.ffi.checkArity(2, arguments, "blockCheck", false);
      RUNTIME.checkString(data);
      RUNTIME.checkString(fileName);
      return check(RUNTIME.unwrap(data), RUNTIME.unwrap(fileName));
    }

    return RUNTIME.makeModuleReturn({
          'block-check': RUNTIME.makeFunction(blockCheck, "block-check"),
        }, {});
  }
})
