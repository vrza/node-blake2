'use strict';
const blake2 = require('../../index.js');
const {workerData, parentPort} = require('worker_threads');
const blake2Hash = (data) => {
	const context = blake2.createHash('blake2b');
	context.update(Buffer.from(data));
	const hash = context.digest('hex');
	return hash;
};

const hash = blake2Hash(workerData.data);

parentPort.postMessage(hash);
