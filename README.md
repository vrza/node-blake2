node-blake2
===

node-blake2 provides a stream-compatible blake2b, blake2bp, blake2s, and blake2sp for io.js.

node-blake2 was tested to work on Ubuntu 14.04 (g++ 4.8.2), Windows 8.1 (VS2013), and OS X 10.10 (Apple LLVM 6.1.0).


Install
===

```
npm install blake2
```

or from the GitHub repo:

```
git clone https://github.com/ludios/node-blake2
cd node-blake2
npm install --verbose
```


Examples
===

```

```


Known issues
===

- I don't recommend using the multithreaded algorithms blake2bp and blake2sp because
	- While finishing ~1.8x faster, they use ~3x-4x more CPU time.
	- They may crash at runtime when compiled with clang: https://github.com/BLAKE2/BLAKE2/issues/9
- On Windows, node-blake2 requires AVX instructions due to some SSE2 build problems.  This shouldn't be too hard to fix.
- On Windows, node-blake2 requires io.js 2.0.1 or newer.
