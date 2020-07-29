node-blake2
===

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]

Why BLAKE2 for hashing?  Because "BLAKE2 outperforms MD5, SHA-1, SHA-2,
and SHA-3 on recent Intel CPUs" and has "no known security issues, whereas
SHA-1, MD5, and SHA-512 are susceptible to length-extension".
[https://blake2.net/](https://blake2.net/)

node-blake2 provides a [stream](https://nodejs.org/api/stream.html)-compatible
blake2b, blake2bp, blake2s, and blake2sp `Hash` and `KeyedHash` for node 8+.

node-blake2 was tested to work on
-	GNU/Linux Ubuntu 16.04 (g++ 5.4.0)
-	GNU/Linux Gentoo (g++ 8.3.0)
-	macOS 10.13 (Apple LLVM 9.1.0)
-	Windows 10 x64 (VS2015)


Prerequisites for building on Windows
---

Python is required by [node-gyp](https://github.com/nodejs/node-gyp).

You will also need [build tools from Visual Studio 2015](https://github.com/felixrieseberg/windows-build-tools).

Starting with node 12, Windows installer can automatically install Python and Visual Studio build tools.

Install
---

In your project, run:

```
npm install blake2 --save
```

or install from the GitHub repo:

```
npm install vrza/node-blake2 --save
```


Examples
---

### Unkeyed BLAKE2b

```js
var blake2 = require('blake2');
var h = blake2.createHash('blake2b');
h.update(Buffer.from("test"));
console.log(h.digest("hex"));
```

`blake2.createHash` works like node's
[`crypto.createHash`](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options).

### Keyed BLAKE2b

```js
var blake2 = require('blake2');
var h = blake2.createKeyedHash('blake2b', Buffer.from('key - up to 64 bytes for blake2b, 32 for blake2s'));
h.update(Buffer.from("test"));
console.log(h.digest("hex"));
```

`blake2.createKeyedHash` takes a key argument like
[`crypto.createHmac`](https://nodejs.org/api/crypto.html#crypto_crypto_createhmac_algorithm_key_options).
Although it is not an HMAC, a keyed hash serves the same purpose.

### Important notes

-	`blake2.create{Hash,KeyedHash}` support algorithms `blake2b`, `blake2bp`,
	`blake2s`, and `blake2sp`.
-	Data passed to `.update` on `blake2.{Hash,KeyedHash}` must be a `Buffer`.
-	Keys passed to `blake2.createKeyedHash(algo, key)` must be a `Buffer`.
-	Just as with `crypto.Hash`, `.digest()` can only be called once.

### With streams

This works exactly like it does with [`crypto.Hash`](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options).  See [b2sum.js](https://github.com/vrza/node-blake2/blob/master/b2sum.js).

### Custom digest length

BLAKE2 can generate digests between 1-64 bytes for BLAKE2b and 1-32 bytes for
BLAKE2s.  Pass `digestLength` as an option to use a digest shorter than the
default (maximum length):

```js
var blake2 = require('blake2');
var h = blake2.createHash('blake2b', {digestLength: 16});
h.update(Buffer.from("test"));
h.digest(); // Returns a Buffer with 16 bytes
```

or with a key:

```js
var blake2 = require('blake2');
var h = blake2.createKeyedHash('blake2b', Buffer.from('my key'), {digestLength: 16});
h.update(Buffer.from("test"));
h.digest(); // Returns a Buffer with 16 bytes
```

Note that BLAKE2 will generate completely different digests for shorter digest
lengths; they are not simply a slice of the default digest.

### Copying a hash object

You can call `.copy()` on a `Hash` or `KeyedHash`, which will return a new object with all of the internal BLAKE2 state copied from the source object.

```js
var blake2 = require('blake2');
var h = blake2.createHash('blake2b');
h.update(Buffer.from("test"));

// Call .copy() before .digest(), because .digest() finalizes internal state
var j = h.copy();

// h is unaffected by updates to j
j.update(Buffer.from("more"));

console.log(h.digest());
console.log(j.digest());
```

Known issues
---

-	On Windows, node-blake2 requires enabling AVX instructions as a workaround for the way upstream build preprocessor detects support for SSE2.

[npm-image]: https://img.shields.io/npm/v/blake2.svg
[npm-url]: https://npmjs.org/package/blake2
[travis-image]: https://img.shields.io/travis/vrza/node-blake2.svg
[travis-url]: https://travis-ci.org/vrza/node-blake2
