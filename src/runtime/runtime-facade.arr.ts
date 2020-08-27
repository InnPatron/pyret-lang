const runtime = require('./runtime.js');

module.exports = {
    '_plus': runtime["_plus"],
    '_minus': runtime["_minus"],
    '_times': runtime["_times"],
    '_divide': runtime["_divide"],
    '_lessthan': runtime["_lessthan"],
    '_greaterthan': runtime["_greaterthan"],
    '_lessequal': runtime["_lessequal"],
    '_greaterequal': runtime["_greaterequal"],

    "nothing": runtime["nothing"],

    print: function(v) {
        process.stdout.write(String(v));
    }
};
