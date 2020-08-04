// Pyret wrapper around equality.ts


const EQUALITY_CORE = require('./equality.js');


// Hack needed b/c of interactions with the 'export' keyword
// Pyret instantiates singleton data varaints by taking a reference to the value
// TODO(alex): Should Pyret perform a function call to create a singleton data variant
module.exports["Equal"] = EQUALITY_CORE.Equal();
module.exports["NotEqual"] = EQUALITY_CORE.NotEqual;
module.exports["Uknown"] = EQUALITY_CORE.Unknown;

// Hack needed to match generate Pyret-code
module.exports["is-Equal"] = EQUALITY_CORE.isEqual;
module.exports["is-NotEqual"] = EQUALITY_CORE.isNotEqual;
module.exports["is-Unknown"] = EQUALITY_CORE.isUnknown;

module.exports["to-boolean"] = EQUALITY_CORE.to_boolean;
module.exports["equal-or"] = EQUALITY_CORE.equal_or;
module.exports["equal-and"] = EQUALITY_CORE.equal_and;

module.exports["within"] = EQUALITY.withinRel;
module.exports["within-rel"] = EQUALITY.withinRel;
module.exports["within-abs"] = EQUALITY.withinAbs;
module.exports["within-rel-now"] = EQUALITY.withinRelNow;
module.exports["within-abs-now"] = EQUALITY.withinAbsNow;

module.exports["equal-now"] = EQUALITY.equalNow;
module.exports["equal-now3"] = EQUALITY.equalNow3;

module.exports["identical"] = EQUALITY.identical;
module.exports["identical3"] = EQUALITY.identical3;

module.exports["equal-always"] = EQUALITY.equalAlways;
module.exports["equal-always3"] = EQUALITY.equalAlways3;

