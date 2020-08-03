module.exports = {
  'raw-array': {
    'make': function(arr) {
      return arr;
    }
  },
  'get': function( arr, index ) {
    return arr[index];
  },
  'push': function( arr, elm ) {
    arr.push( elm );
    return arr;
  },
  'fold': function( fun, val, arr ) {
    return arr.reduce( fun, val );
  },
  'sum': function( arr ) {
    return arr.reduce( function( x, y ) { return x + y; }, 0 );
  },
  'min': function( arr ) {
    return arr.reduce( function( x, y ) { return Math.min( x, y ); }, arr[0] );
  },
  'max': function( arr ) {
    return arr.reduce( function( x, y ) { return Math.max( x, y ); }, arr[0] );
  }
}
