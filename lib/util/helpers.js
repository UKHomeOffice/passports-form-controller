'use strict';

const _ = require('underscore');

const helpers = {
    // single
    makePromise(fn, args) {
        return new Promise((resolve) => {
            fn.apply(this, args.concat([resolve]), (err, values) => {
                resolve(values);
            });
        });
    },

    // multi
    makePromises(methods) {
        let promises = [];
        _.each(methods, (method) => {
            let promise = new Promise((resolve) => {
                method.fn.apply(this, method.args.concat([resolve]), (err, values) => {
                    resolve(values);
                });
            });
            promises.push(promise);
        });
        return promises;
    },

    // return parent or child in array format
    getArray(obj, selector) {
        if (!obj) { return []; }
        let target = selector ? obj[selector] : obj;
        if (!target) { return []; }
        return !Array.isArray(target) ? [ target ] : target;
    }

};

module.exports = helpers;
