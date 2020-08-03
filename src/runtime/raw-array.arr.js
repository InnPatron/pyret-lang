module.exports = {
  'raw-array': {
    'make': function(arr) {
      return arr;
    }
  },
  'raw-array-get': function( arr, index ) {
    return arr[index];
  },
  'raw-array-push': function( arr, elm ) {
    arr.push( elm );
    return arr;
  },
  'raw-array-fold': function( fun, val, arr ) {
    return arr.reduce( fun, val );
  },
  'raw-array-sum': function( arr ) {
    return arr.reduce( function( x, y ) { return x + y; }, 0 );
  },
  'raw-array-min': function( arr ) {
    return arr.reduce( function( x, y ) { return Math.min( x, y ); }, arr[0] );
  },
  'raw-array-max': function( arr ) {
    return arr.reduce( function( x, y ) { return Math.max( x, y ); }, arr[0] );
  }
}
