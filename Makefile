.PHONY: all clean build parser web

all: build parser

build:
	pyret -c src/arr/compiler/pyret.arr -o build/phaseA/pyret.jarr

web: 
	mkdir -p build/worker; 
	make build/worker/bundled-node-compile-deps.js
	make build/worker/pyret-api.js
	make build/worker/page.html
	make build/worker/browserfs.min.js
	pyret --standalone-file src/webworker/worker-standalone.js --deps-file build/worker/bundled-node-compile-deps.js -c src/arr/compiler/webworker.arr -o build/worker/pyret.jarr

build/worker/bundled-node-compile-deps.js: src/js/trove/require-node-compile-dependencies.js
	browserify src/js/trove/require-node-compile-dependencies.js -o $@

build/phaseA/pyret-grammar.js: lib/jglr/parser-generator.js 
	mkdir -p build/phaseA 
	mkdir -p build/worker 
	node lib/jglr/parser-generator.js src/js/base/pyret-grammar.bnf build/phaseA/pyret-grammar.js "../../lib/jglr" "jglr/jglr" "pyret-base/js/pyret-parser" 
 
src/arr/compiler/pyret-parser.js: build/phaseA/pyret-grammar.js 
	node build/phaseA/pyret-grammar.js src/arr/compiler/pyret-parser.js 
 
build/worker/pyret-grammar.js: build/phaseA/pyret-grammar.js 
	cp build/phaseA/pyret-grammar.js build/worker/pyret-grammar.js 
 
parser: build/phaseA/pyret-grammar.js build/worker/pyret-grammar.js

build/worker/pyret-api.js: src/webworker/pyret-api.js
	browserify src/webworker/pyret-api.js -o $@

build/worker/browserfs.min.js: src/webworker/browserfs.min.js
	cp $< $@

build/worker/page.html: src/webworker/page.html
	cp $< $@

clean:
	rm -r -f build/phaseA build/worker
	rm -f src/arr/compiler/pyret-parser.js
