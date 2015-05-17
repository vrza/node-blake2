#!/usr/bin/env iojs

/**
 * Takes an algorithm name and prints the hex digest of stdin.
 * Example:
 * cat file | ./b2sum.js blake2b
 */

"use strong";
"use strict";

const blake2 = require('./index');

const algo = process.argv[2];
const hash = new blake2.Hash(algo);
hash.setEncoding('hex');

const stream = process.stdin;

stream.on('end', function() {
	hash.end();
	const digest = hash.read();
	console.log(digest);
});

stream.pipe(hash);
