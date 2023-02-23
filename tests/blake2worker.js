"use strict";

const assert = require('assert');
const {Worker} = require('worker_threads');
const blake2 = require('../index');

const MAX_WORKERS = 100;

function newWorker (data) {
	return new Promise((resolve, reject) => {
		const worker = new Worker('./tests/worker/blake2hash-worker.js', {
			workerData: {
				data: data
			},
	  });
	  worker.on('message', (hash) => {
			resolve(hash);
	  });
	  worker.on('error', (msg) => {
			reject(msg);
	  });
	});
}

const blake2Hash = (data) => {
	const context = blake2.createHash('blake2b');
	context.update(Buffer.from(data));
	const hash = context.digest('hex');
	return hash;
};

describe('worker', function() {
	this.timeout(30000);
	it('returns the correct digest for blake2b after 0 updates', async function () {
		const datas = [];
		for (let ix = 0; ix < MAX_WORKERS; ix++) {
			const data = `${ix}`;
			datas.push(data);
		}
		const expectedresults = [];
		for (let ix = 0; ix < MAX_WORKERS; ix++) {
			expectedresults.push(blake2Hash(datas[ix]));
		}

		const workers = [];
		for (let ix = 0; ix < MAX_WORKERS; ix++) {
			workers.push(newWorker(datas[ix]));
		}
		const actualResults = await Promise.all(workers);
		for (let ix = 0; ix < MAX_WORKERS; ix++) {
			assert.equal(actualResults[ix], expectedresults[ix]);
		}
	});
});
