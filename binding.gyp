{
	"targets": [
		{
			"target_name": "binding",
			"win_delay_load_hook": "true",
			"sources": [
				 "src/binding.cpp"
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
				,"-Wno-unused-function"
				,"-Wno-unused-const-variable"
			],
			"cflags_cc": [
				 "-Wstrict-aliasing"
				,"-Wextra"
				,"-Wno-unused-function"
				,"-Wno-unused-const-variable"
				,"-Wno-unused-parameter"
			],
			'xcode_settings': {
				'OTHER_CFLAGS': [
					 "-Wstrict-aliasing"
					,"-Wextra"
					,"-Wno-unused-function"
					,"-Wno-unused-const-variable"
					,"-Wno-unused-parameter"
				]
			},
			"msvs_settings": {
				"VCCLCompilerTool": {
					"AdditionalOptions": ["/arch:AVX"]
				}
			}
		}
	]
}
