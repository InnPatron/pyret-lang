import either as E
import json as J
import option as O
import pathlib as P
import string-dict as SD
import render-error-display as RED
import file("./ast-util.arr") as AU
import file("./cli-module-loader.arr") as CLI
import file("./compile-structs.arr") as CS
import file("./compile-lib.arr") as CL
import file("./compile-options.arr") as CO
import file("./file.arr") as F
import file("./js-of-pyret.arr") as JSP
import file("./locators/builtin.arr") as B
import file("locators/file.arr") as FL
import file("./message.arr") as M
import file("./repl.arr") as R
import js-file("webworker") as W

pyret-dir = "."

fun compile(options, this-pyret-dir):
  outfile = cases(Option) options.get("outfile"):
    | some(v) => v
    | none => options.get-value("program") + ".jarr"
  end
  compile-opts = CO.populate-options(options, this-pyret-dir)
  CLI.build-runnable-standalone(
    options.get-value("program"),
    compile-opts.require-config,
    outfile,
    compile-opts
    )
end

var repl :: Option<R.ChunkyRepl> = none

compile-handler = lam(msg, send-message) block:
  spy: msg end
  # TODO(alex): Need to simplify compile request option parsing
  #   Ideally, parse-request loads extra flags into a regular string-dict and passes to populate-options
  #   Goal: reduce the message parser's awareness of compiler options
  #     Awareness causes needless code duplication converting options -> Requst compile-program fields -> string dictionary
  #   Maybe needs to happen to other fields on Request compile-program
  cases(O.Option) M.parse-request(msg):
    | none =>
      nothing
    | some(request) =>
      cases(M.Request) request block:
        | lint-program(program, program-source) =>
          opts = request.get-options()
          spy: opts end
          cases(E.Either) CLI.lint(program-source, program) block:
            | left(errors) =>
              err-list = for map(e from errors):
                J.j-str(RED.display-to-string(e.render-reason(), tostring, empty))
              end
              M.lint-failure(program-source, err-list).send-using(send-message)
            | right(_) =>
              M.lint-success(program-source).send-using(send-message)
              nothing
          end
        | compile-program(
            program,
            base-dir,
            builtin-js-dir,
            checks,
            type-check,
            recompile-builtins) =>
          opts = request.get-options()
          spy: opts end
          fun log(s, to-clear):
            clear-first = cases(Option) to-clear:
              | none =>
                M.clear-false
              | some(n) =>
                M.clear-number(n)
            end
            M.echo-log(s, clear-first).send-using(send-message)
          end
          fun err(s):
            M.err(s).send-using(send-message)
          end
          # enable-spies = not(opts.has-key("no-spies"))
          with-logger = opts.set("log", log)
          with-error = with-logger.set("log-error", err)
          # compile-opts = CO.populate-options(with-error, pyret-dir)

          cases(E.Either) run-task(lam(): compile(with-error, pyret-dir) end):
            | right(exn) =>
              err-str = RED.display-to-string(exn-unwrap(exn).render-reason(), tostring, empty)
              err-list = [list: J.j-str(err-str)]
              M.compile-failure(err-list).send-using(send-message)
            | left(val) =>
              cases(E.Either) val block:
                | left(errors) =>
                  err-list = for map(e from errors):
                    J.j-str(RED.display-to-string(e.render-reason(), tostring, empty))
                  end
                  M.compile-failure(err-list).send-using(send-message)
                | right(value) =>
                  M.compile-success.send-using(send-message)
                  nothing
              end
          end
        | compile-interaction(program) =>
          cases(O.Option) repl block:
            | none =>
              M.compile-interaction-failure(program).send-using(send-message)
              nothing
            | some(the-repl) =>
              the-locator = FL.file-locator(program, CS.standard-globals)
              the-repl.compile-interaction(the-locator)
              M.compile-interaction-success(program).send-using(send-message)
          end
        | create-repl =>
          builtin-js-dir = "/compiled/builtin"

          fun make-find-module() -> (String, CS.Dependency -> CL.Located<String>):
            locator-cache = [SD.mutable-string-dict: ]
            fun find-module(unused-context, dependency):
              uri :: String = cases(CS.Dependency) dependency:
                | builtin(modname) =>
                  "builtin://" + modname
                | dependency(protocol, arguments) =>
                  #raise("non-builtin dependencies not yet implemented")
                  #arr = array-from-list(arguments)
                  #if protocol == "my-gdrive":
                  #  "my-gdrive://" + arr.get-now(0)
                  #else if protocol == "shared-gdrive":
                  #  "shared-gdrive://" + arr.get-now(0) + ":" + arr.get-now(1)
                  #else if protocol == "gdrive-js":
                  #  "gdrive-js://" + arr.get-now(1)
                  #else:
                  #  print("Unknown import: " + dependency + "\n")
                  protocol + "://" + arguments.join-str(":")
                  #end
              end
              if locator-cache.has-key-now(uri) block:
                CL.located(locator-cache.get-now(uri), nothing)
              else:
                l = cases(CS.Dependency) dependency:
                  | builtin(name) =>
                    B.make-builtin-js-locator(builtin-js-dir, name)
                  | dependency(protocol, args) =>
                    # TODO(michael): don't assume that this is a file locator
                    FL.file-locator(args.join-str("/"), CS.standard-globals)
                    #raise("non-builtin dependencies not yet implemented")
                end
                locator-cache.set-now(uri, l)
                CL.located(l, nothing)
              end
            end
            find-module
          end

          #modules = get-builtin-modules()
          modules = [SD.mutable-string-dict: ]
          compile-context = "anchor-context-currently-unused"
          make-finder = make-find-module
          repl := some(R.make-chunky-repl(modules, compile-context, make-finder))
          M.create-repl-success.send-using(send-message)
      end
  end
end

W.setupHandlers(compile-handler)
