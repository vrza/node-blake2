"use strict";

const assert = require('assert');
const {Worker} = require('worker_threads');

const DIGEST_HEX_01 = '1ced8f5be2db23a6513eba4d819c73806424748a7bc6fa0d792cc1c7d1775a9778e894aa91413f6eb79ad5ae2f871eafcc78797e4c82af6d1cbfb1a294a10d10';

const DIGEST_HEX_02 = 'c5faca15ac2f93578b39ef4b6bbb871bdedce4ddd584fd31f0bb66fade3947e6bb1353e562414ed50638a8829ff3daccac7ef4a50acee72a5384ba9aeb604fc9';

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

describe('worker', function() {
	it('returns correct digest for blake2b after 0 updates', async function () {
		const workers = [];
		workers.push(newWorker('1'));
		workers.push(newWorker('2'));
		const thread_results = await Promise.all(workers);

		assert.equal(thread_results[0], DIGEST_HEX_01);
		assert.equal(thread_results[1], DIGEST_HEX_02);
	});

});

