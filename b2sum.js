#!/usr/bin/env node

/**
 * Takes an algorithm name and prints the hex digest of stdin.
 * Example:
 * $ node b2sum.js blake2b < file
 */

"use strict";

if (process.argv.length === 2) {
	const EXIT_USAGE = 1;
	const progname = process.argv[0].concat(' ', process.argv[1]);
	const usageMsg = `Usage: ${progname} <algo>`;
	console.error(usageMsg);
	process.exit(EXIT_USAGE);
}

const algo = process.argv[2];
const blake2 = require('./index');
const hash = new blake2.Hash(algo);
hash.setEncoding('hex');

const stream = process.stdin;
stream.on('end', function() {
	hash.end();
	const digest = hash.read();
	console.log(digest);
});
stream.pipe(hash);
