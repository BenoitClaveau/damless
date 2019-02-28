/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * JSON is define as a service to easily orverride it. 
 * Inject in yours services.json
 */
class JsonService {

    stringify(value, source) {
        return JSON.stringify(value, (key, value) => this.replacer(key, value, source), 4);
    }

    parse(text, source) {
        return JSON.parse(text, (key, value) => this.reviver(key, value, source))
    };

    typed(obj, source) {
        for (let [key, value] of Object.entries(obj)) {
            const type = typeof value;
            if (type == "object") {
                const typedValue = this.typed(value, source);
                obj[key] = this.reviver(key, typedValue, source);
            }
            else
                obj[key] = this.reviver(key, value, source);
        };
        return obj;
    }

    reviver(key, value, source) {
        return this.onValue(key, value, source);
    }

    onValue(key, value, source) {
        switch (typeof value) {
            case "string":
                if (/^false$/.test(value)) return false;
                if (/^true$/.test(value)) return true;
                if (value != "" && !Number.isNaN(+value)) return +value;
                if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return new Date(value);
                return value;
            default:
                return value;
        }
    }

    replacer(key, value, source) {
        // if (!value) return value;

        // if (value.constructor == Object) return value;
        // if (value.constructor == Array) return value;
        // if (value.constructor == Number) return value;
        // if (value.constructor == RegExp) return value.toString();
        // if (value.constructor == String) return value;
        // if (value.constructor == Date) return value;
        // if (value.constructor == Boolean) return value;
        // if (value.constructor == Error) return value;
        return value;
    }
};

exports = module.exports = JsonService;