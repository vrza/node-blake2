#!/usr/bin/env iojs

/**
 * Creates Hashes and Hmacs in an infinite loop; use `ps u | grep leaktest`
 * to verify lack of memory leaks
 */

"use strong";
"use strict";

const blake2 = require('./index');

function randomElement(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

const algos = ['blake2b', 'blake2s', 'blake2bp', 'blake2sp'];
const encodings = [undefined, 'hex', 'base64', 'binary'];
let input = new Buffer(String(Math.random()));
while(1) {
	let hash = new blake2.Hash(randomElement(algos));
	hash.update(input);
	input = hash.digest(randomElement(encodings));
	if(typeof input === 'string') {
		input = new Buffer(input.substr(0, 16));
	}

	let hmac = new blake2.Hmac(randomElement(algos), new Buffer(String(Math.random())));
	hmac.update(input);
	input = hmac.digest(randomElement(encodings));
	if(typeof input === 'string') {
		input = new Buffer(input.substr(0, 16));
	}
}
