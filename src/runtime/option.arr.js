module.exports = {
  "some": function(e) {
    return e;
  },

  "none": function() {
    return null;
  },

  "Option": {
    "is-some": function(option) {
      return false;
    },

    "is-none": function(option) {
      return false;
    }
  },
}
