({
  requires: [],
  nativeRequires: [
    "pyret-base/js/pyret-tokenizer",
  ],
  provides: {},
  theModule: function(RUNTIME, NAMESPACE, uri, tokenizer) {

    const END_DELIMITED = new Map(
        [
        ["PROVIDE", genericBlockHandler],
        ["SPY", genericBlockHandler ],
        ["LET", genericBlockHandler],
        ["LETREC", genericBlockHandler],
        ["TYPE-LET", genericBlockHandler],
        ["FUN", genericBlockHandler],
        ["CHECK", genericBlockHandler],
        ["EXAMPLES", genericBlockHandler],
        ["CHECKCOLON", genericBlockHandler],
        ["EXAMPLESCOLON", genericBlockHandler],
        ["DATA", genericBlockHandler],
        ["WHEN", genericBlockHandler],
        ["LAM", genericBlockHandler],
        ["METHOD", genericBlockHandler],
        ["TABLE", genericBlockHandler],
        ["REACTOR", genericBlockHandler],
        ["IF", genericBlockHandler],
        ["ASK", genericBlockHandler],
        ["CASES", genericBlockHandler],
        ["FOR", genericBlockHandler],
        ["TABLE-SELECT", genericBlockHandler],
        ["TABLE-FILTER", genericBlockHandler],
        ["TABLE-ORDER", genericBlockHandler],
        ["TABLE-EXTRACT", genericBlockHandler],
        ["TABLE-UPDATE", genericBlockHandler],
        ["TABLE-EXTEND", genericBlockHandler],
        ["LOAD-TABLE", genericBlockHandler],
        ["BLOCK", genericBlockHandler],
        ]);

    const EMBEDDABLE = new Set(
        [
        "BLOCK",
        // TODO: Add more end-delimited, embeddable block starters
        ]);

    function start(state, toks) {

      state.handler.pop(); // Remove self

      if (toks.hasNext()) {
        state.handler.push(topLevelScanner);
      }
    }

    function topLevelScanner(state, toks) { 
      if (!toks.hasNext()) {
        state.handler.pop();
        return;
      }

      var nextTok = toks.next().name;

      var nextHandler = END_DELIMITED[nextName];
      if (nextHandler !== undefined) {
        state.handler.push(nextHandler);
      }
    }

    function genericBlockHandler(state, toks) {
      // TODO: Implement
    }

    function check(data, fileName) {
      const toks = tokenizer.Tokenizer;
      toks.tokenizeFrom(data);

      var state = new Object();
      state.handler = [];
      state.handler.push(start);
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
