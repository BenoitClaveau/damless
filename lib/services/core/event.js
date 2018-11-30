/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const EventEmitter = require('events');

//Event will created and linked with giveme instance
class Event extends EventEmitter {
};

exports = module.exports = Event;
