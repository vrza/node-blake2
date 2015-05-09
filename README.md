node-blake2
===

Why BLAKE2 for hashing?  Because "BLAKE2 outperforms MD5, SHA-1, SHA-2,
and SHA-3 on recent Intel CPUs" and has "no known security issues, whereas
SHA-1, MD5, and SHA-512 are susceptible to length-extension". https://blake2.net/

node-blake2 provides a [stream](https://iojs.org/api/stream.html)-compatible
blake2b, blake2bp, blake2s, and blake2sp `Hash` and `Hmac` for [io.js](https://iojs.org/).

node-blake2 was tested to work on
-	Ubuntu 14.04 (g++ 4.8.2)
-	Ubuntu 15.04 (g++ 4.9.2)
-	Windows 8.1 x64 (VS2013)
-	OS X 10.10 (Apple LLVM 6.1.0)


Install
---

On Windows, first install [Python 2.7.9](https://www.python.org/downloads/release/python-279/) so that node-gyp works.

Run:

```
npm install blake2 --save
```

or to install from the GitHub repo:

```
git clone https://github.com/ludios/node-blake2
cd node-blake2
npm install --verbose
```


Examples
---

`blake2.createHash` and `blake2.createHmac` work just like node's
[`crypto.createHash`](https://iojs.org/api/crypto.html#crypto_crypto_createhash_algorithm) and
[`crypto.createHmac`](https://iojs.org/api/crypto.html#crypto_crypto_createhmac_algorithm_key), except:

-	`blake2.create{Hash,Hmac}` support only algorithms `blake2b`, `blake2bp`,
	`blake2s`, and `blake2sp`.
-	Keys passed to `blake2.createHmac(algo, key)` must be a `Buffer`.
-	Data passed to `.update` on `blake2.{Hash,Hmac}` must be a `Buffer`.

Unkeyed BLAKE2b:

```js
var blake2 = require('blake2');
var h = blake2.createHash('blake2b');
h.update(new Buffer("test"));
console.log(h.digest("hex"));
```

Keyed BLAKE2b:

```js
var blake2 = require('blake2');
var h = blake2.createHmac('blake2b', new Buffer('key - up to 64 bytes for blake2b, 32 for blake2s'));
h.update(new Buffer("test"));
console.log(h.digest("hex"));
```

With streams:

This should work exactly like it does with [`crypto.Hash`](https://iojs.org/api/crypto.html#crypto_crypto_createhash_algorithm).  See [b2sum.js](https://github.com/ludios/node-blake2/blob/master/b2sum.js).


Known issues
---

-	I don't recommend using the multithreaded algorithms blake2bp and blake2sp because
	-	While finishing ~1.8x faster, they use ~3x-4x more CPU time.
	-	They may crash at runtime when compiled with clang:
		https://github.com/BLAKE2/BLAKE2/issues/9
-	On Windows, node-blake2 requires AVX instructions due to some SSE2 build
	problems.  This shouldn't be too hard to fix.
