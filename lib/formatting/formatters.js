var formatters = {

    trim: function trim(value) {
        return typeof value === 'string' ? value.trim() : value;
    },

    boolean: function boolean(value) {
        if (value === true || value === 'true') { return true; }
        else if (value === false || value === 'false') { return false; }
        else { return undefined; }
    },

    uppercase: function uppercase(value) {
        return typeof value === 'string' ? value.toUpperCase() : value;
    },

    lowercase: function lowercase(value) {
        return typeof value === 'string' ? value.toLowerCase() : value;
    },

    removespaces: function removespaces(value) {
        return typeof value === 'string' ? value.replace(/\s+/g, '') : value;
    },

    singlespaces: function singlespaces(value) {
        return typeof value === 'string' ? value.replace(/\s+/g, ' ') : value;
    },

    hyphens: function hyphens(value) {
        return typeof value === 'string' ? value.replace(/[–—]+/g, '-') : value;
    },

    removeroundbrackets: function removeroundbrackets(value) {
        return typeof value === 'string' ? value.replace(/[\(\)]/g, '') : value;
    },

    removehyphens: function removehyphens(value) {
        return typeof value === 'string' ? value.replace(/\-/g, '') : value;
    },

    removeslashes: function removeslashes(value) {
        return typeof value === 'string' ? value.replace(/[\/\\]/g, '') : value;
    },

    ukphoneprefix: function ukphoneprefix(value) {
        return typeof value === 'string' ? value.replace(/^\+44\(?0?\)?/, '0') : value;
    },
    base64decode: function base64decode(value) {
        return new Buffer(value, 'base64').toString();
    }

};

module.exports = formatters;
