{
	"targets": [
		{
			"target_name": "binding",
			"win_delay_load_hook": "true",
			"conditions": [
				["target_arch == 'x64' or target_arch == 'ia32'", {
					"sources": [
						"src/binding.cpp",
						"src/BLAKE2/sse/blake2b.c",
						"src/BLAKE2/sse/blake2bp.c",
						"src/BLAKE2/sse/blake2s.c",
						"src/BLAKE2/sse/blake2sp.c"
					],
					"include_dirs": [
						"<!(node -e \"require('nan')\")",
						"src/BLAKE2/sse"
					]
				}],
				["target_arch == 'arm64'", {
					"sources": [
						"src/binding.cpp",
						"src/BLAKE2/neon/blake2b-neon.c",
						"src/BLAKE2/neon/blake2bp.c",
						"src/BLAKE2/neon/blake2s-neon.c",
						"src/BLAKE2/neon/blake2sp.c"
					],
					"include_dirs": [
						"<!(node -e \"require('nan')\")",
						"src/BLAKE2/neon"
					]
				}],
				["target_arch != 'x64' and target_arch != 'ia32' and target_arch != 'arm64'", {
					"sources": [
						"src/binding.cpp",
						"src/BLAKE2/ref/blake2b-ref.c",
						"src/BLAKE2/ref/blake2bp-ref.c",
						"src/BLAKE2/ref/blake2s-ref.c",
						"src/BLAKE2/ref/blake2sp-ref.c"
					],
					"include_dirs": [
						"<!(node -e \"require('nan')\")",
						"src/BLAKE2/ref"
					]
				}]
			],
			"cflags_c": [
				"-std=c99",
				"-Wstrict-aliasing",
				"-Wextra",
				"-Wno-unused-function",
				"-Wno-unused-const-variable"
			],
			"cflags_cc": [
				"-Wstrict-aliasing",
				"-Wextra",
				"-Wno-unused-function",
				"-Wno-unused-const-variable",
				"-Wno-unused-parameter"
			],
			'xcode_settings': {
				'OTHER_CFLAGS': [
					"-Wstrict-aliasing",
					"-Wextra",
					"-Wno-unused-function",
					"-Wno-unused-const-variable",
					"-Wno-unused-parameter"
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
