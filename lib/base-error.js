'use strict';

module.exports = class FormError {
  constructor(key, options, req, res) {
    options = Object.assign({
      type: 'default'
    }, options);
    this.key = key;
    this.type = options.type;
    this.redirect = options.redirect;
    Object.defineProperty(this, 'message', {
      enumerable: true,
      get() {
        return options.message || this.getMessage(key, options, req, res);
      }
    });
    Object.defineProperty(this, 'title', {
      enumerable: true,
      get() {
        return options.title || this.getTitle(key, options, req, res);
      }
    });
  }

  // eslint-disable-next-line no-inline-comments, spaced-comment
  getMessage(/*key, options, req, res*/) {
    return 'Error';
  }

  // eslint-disable-next-line no-inline-comments, spaced-comment
  getTitle(/*key, options, req, res*/) {
    return 'Oops, something went wrong';
  }
};
