const BrowserFS = require("browserfs");

const myWorker = new Worker('pyret.jarr');

window["projectsDir"] = "./projects";

// How to use BrowserFS with Web Workers: https://github.com/jvilk/BrowserFS/issues/210
BrowserFS.install(window);
BrowserFS.configure({
  fs: "LocalStorage"
}, function(e) {
  BrowserFS.FileSystem.WorkerFS.attachRemoteListener(myWorker);

  let fs = BrowserFS.BFSRequire("fs");
  if (fs.existsSync(window["projectsDir"]) === false) {
    fs.mkdirSync(window["projectsDir"]);
  }

  if (e) {
    throw e;
  }
});

// Setup HTML output
// NOTE(alex): May need to CTRL + F5 (refresh and clear cache) in order to see HTML logs
var consoleOutputElement = document.getElementById("consoleOut");
var outputList = document.createElement("ul");
consoleOutputElement.appendChild(outputList);
const oldLog = console.log;

const genericLog = function(prefix, ...args: any[]) {
  var outputLine = prefix;
  let logArgs = arguments[1];

  for (let i = 0; i < logArgs.length; i++) {
    var separator = ",";
    if (i === logArgs.length - 1) {
      separator = "";
    }

    var arg = logArgs[i];
    if (typeof arg === "object") {
      outputLine += JSON.stringify(arg, null, 4) + separator;
    } else {
      outputLine += arg + separator;
    }
  }
   
  
  var li = document.createElement("li");
  li.innerHTML = outputLine;
  outputList.appendChild(li);

  consoleOutputElement.scrollTop = consoleOutputElement.scrollHeight;
};

console.log = function(...args) {
  genericLog("[LOG]", args);
  oldLog.apply(console, args);
}

const workerLog = function(...args) {
  genericLog("[WORKER]", args);
  args.unshift("Worker:");
  oldLog.apply(console, args);
};

window["BrowserFS"] = BrowserFS;
module.exports = {
  BrowserFS: BrowserFS,
  worker: myWorker,
  workerLog: workerLog
};
