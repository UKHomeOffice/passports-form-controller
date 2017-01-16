'use strict';

const debug = require('debug')('hmpo:components');
const _ = require('underscore');
const helpers = require('../util/helpers');

const componentHandler = {
    // apply component config to field config
    set(config) {
        _.each(config, (field, key) => {
            debug('Checking component settings for field', key);
            let components = helpers.getArray(field.components);
            if (!_.isEmpty(components)) {
                debug('Components found');
                debug('Old field:', field);
                config[key] = this.buildField(field, components);
                debug('New field:', config[key]);
            }
        });
        return config;
    },

    buildField(field, components) {
        _.each(components, (component) => {
            /*
            field attributes can be one of the following types:
             - string (eg formatter, className)
             - array (eg validate, options)
             - object (eg legend, controller)
            */
            _.each(component, (value, attr) => {
                /*
                - string: field config value take precedence over any component values
                - array: build up array to include values from field config and components
                - object: extend field config properties with those provided by components
                */
                if (typeof value === 'string') {
                    field[attr] = field[attr] || value || undefined;
                } else if (_.isArray(value)) {
                    field[attr] = _.union(field[attr], value);
                } else if (typeof value === 'object') {
                    // 'controller' object is an array of all the different method types (which can themselves be an array of methods)
                    field[attr] = (attr === 'controller') ? this.deepObjMerge(value, field[attr]) : _.extend({}, field[attr], value);
                }
            });
        });
        return field;
    },

    deepObjMerge(add, object) {
        _.each(add, (value, key) => {
            value = helpers.getArray(value);
            object[key] = _.union(value, helpers.getArray(object[key]));
        });
        return object;
    }

};

module.exports = componentHandler;
