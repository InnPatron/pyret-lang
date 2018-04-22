define("pyret-base/js/err-tokenizer", ["jglr/jglr"], function(E) {
  const Grammar = E.Grammar
  const Nonterm = E.Nonterm
  const Token = E.Token
  const SrcLoc = E.SrcLoc
  const GenTokenizer = E.Tokenizer;
  const STICKY_REGEXP = E.STICKY_REGEXP;

  function Tokenizer(ignore_ws, Tokens) {
    GenTokenizer.call(this, ignore_ws, Tokens);
    this.parenIsForExp = true; // initialize this at the beginning of file to true
  }


  function kw(str) { return "^(?:" + str + ")(?![-_a-zA-Z0-9])"; }

  Tokenizer.prototype = Object.create(GenTokenizer.prototype);
  Tokenizer.prototype.tokenizeFrom = function(str) {
    GenTokenizer.prototype.tokenizeFrom.call(this, str);
    this.parenIsForExp = "PARENSPACE";
  }

  
  const Tokens = [
    {name: "ERRR", val: new RegExp(kw("ERRR"), STICKY_REGEXP)}
  ];

  return {
    'Tokenizer': new Tokenizer(true, Tokens)
  };
})
