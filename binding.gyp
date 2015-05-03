{
	"targets": [
		{
			"target_name": "blake2",
			"sources": [
				 "src/blake2.cpp"
				,"src/BLAKE2/sse/blake2b.c"
				,"src/BLAKE2/sse/blake2bp.c"
				,"src/BLAKE2/sse/blake2s.c"
				,"src/BLAKE2/sse/blake2sp.c"
			],
			"include_dirs": [
				 "<!(node -e \"require('nan')\")"
				,"src/BLAKE2/sse"
			],
			"cflags_c": [
				 "-std=c99"
				,"-Wstrict-aliasing"
				,"-Wextra"
			],
			"cflags_cc": [
				 "-Wstrict-aliasing"
				,"-Wextra"
			],
			"msvs_settings": {
				"VCCLCompilerTool": {
					"AdditionalOptions": ["/arch:AVX2"]
				}
			}
		}
	]
}
