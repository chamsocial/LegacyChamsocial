'use strict';

/**
 * Create a tree from items with parent ID
 *
 * @param  {object | array} options Options object or an array with the values
 * @return {array}                  An sorted array
 */
var _makeTree = function (options) {
  var e, _i, output = [],
      id = options.id || 'id',
      pid = options.parentid || 'parent_id',
      children = options.children || 'children',
      temp = {},
      _ref = options.q || options,
      _len = _ref.length;

  // Pre set the temp var
  for (_i = 0; _i < _len; _i++) {
    e = _ref[_i];
    e[children] = [];
    temp[e[id]] = e;
  }

  for (_i = 0; _i < _len; _i++) {
    e = _ref[_i];

    if (temp[e[pid]] !== undefined) {
      temp[e[pid]][children].push(e);
    } else {
      output.push(e);
    }
  }
  return output;
};


module.exports = {
  makeTree: _makeTree
};
