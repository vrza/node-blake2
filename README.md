node-blake2
===

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]

Why BLAKE2 for hashing?  Because "BLAKE2 outperforms MD5, SHA-1, SHA-2,
and SHA-3 on recent Intel CPUs" and has "no known security issues, whereas
SHA-1, MD5, and SHA-512 are susceptible to length-extension".
[https://blake2.net/](https://blake2.net/)

node-blake2 provides a [stream](https://nodejs.org/api/stream.html)-compatible
blake2b, blake2bp, blake2s, and blake2sp `Hash` and `KeyedHash` for node 4+.

node-blake2 was tested to work on
-	Ubuntu 14.04 (g++ 4.8.2)
-	Ubuntu 14.04 (clang++ 3.6.2-svn238746-1~exp1)
-	Ubuntu 15.04 (g++ 4.9.2)
-	Windows 8.1 x64 (VS2013)
-	OS X 10.10 (Apple LLVM 6.1.0)


Install
---

On Windows, first install [Python 2.7.13](https://www.python.org/downloads/release/python-2713/) so that node-gyp works.

In your project, run:

```
npm install blake2 --save
```

or install from the GitHub repo:

```
npm install ludios/node-blake2 --save
```


Examples
---

### Unkeyed BLAKE2b

```js
var blake2 = require('blake2');
var h = blake2.createHash('blake2b');
h.update(new Buffer("test"));
console.log(h.digest("hex"));
```

`blake2.createHash` works like node's
[`crypto.createHash`](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm).

### Keyed BLAKE2b

```js
var blake2 = require('blake2');
var h = blake2.createKeyedHash('blake2b', new Buffer('key - up to 64 bytes for blake2b, 32 for blake2s'));
h.update(new Buffer("test"));
console.log(h.digest("hex"));
```

`blake2.createKeyedHash` takes a key argument like
[`crypto.createHmac`](https://nodejs.org/api/crypto.html#crypto_crypto_createhmac_algorithm_key).
Although it is not an HMAC, a keyed hash serves the same purpose.

### Important notes

-	`blake2.create{Hash,KeyedHash}` support algorithms `blake2b`, `blake2bp`,
	`blake2s`, and `blake2sp`.
-	Data passed to `.update` on `blake2.{Hash,KeyedHash}` must be a `Buffer`.
-	Keys passed to `blake2.createKeyedHash(algo, key)` must be a `Buffer`.
-	Just as with `crypto.Hash`, `.digest()` can only be called once.

### With streams

This works exactly like it does with [`crypto.Hash`](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm).  See [b2sum.js](https://github.com/ludios/node-blake2/blob/master/b2sum.js).

### Custom digest length

BLAKE2 can generate digests between 1-64 bytes for BLAKE2b and 1-32 bytes for
BLAKE2s.  Pass `digestLength` as an option to use a digest shorter than the
default (maximum length):

```js
var blake2 = require('blake2');
var h = blake2.createHash('blake2b', {digestLength: 16});
h.update(new Buffer("test"));
h.digest(); // Returns a Buffer with 16 bytes
```

or with a key:

```js
var blake2 = require('blake2');
var h = blake2.createKeyedHash('blake2b', new Buffer('my key'), {digestLength: 16});
h.update(new Buffer("test"));
h.digest(); // Returns a Buffer with 16 bytes
```

Note that BLAKE2 will generate completely different digests for shorter digest
lengths; they are not simply a slice of the default digest.

### Copying a hash object

You can call `.copy()` on a `Hash` or `KeyedHash`, which will return a new object with all of the internal BLAKE2 state copied from the source object.

```js
var blake2 = require('blake2');
var h = blake2.createHash('blake2b');
h.update(new Buffer("test"));

// Call .copy() before .digest(), because .digest() finalizes internal state
var j = h.copy();

// h is unaffected by updates to j
j.update(new Buffer("more"));

console.log(h.digest());
console.log(j.digest());
```

Known issues
---

-	On Windows, node-blake2 requires AVX instructions due to some SSE2 build
	problems.  This shouldn't be too hard to fix.

[npm-image]: https://img.shields.io/npm/v/blake2.svg
[npm-url]: https://npmjs.org/package/blake2
[travis-image]: https://img.shields.io/travis/ludios/node-blake2.svg
[travis-url]: https://travis-ci.org/ludios/node-blake2
