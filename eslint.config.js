const { defineConfig } = require("eslint/config");

module.exports = defineConfig([{
	languageOptions: {
		ecmaVersion: 8
	},

	rules: {
		indent: [2, "tab"],
		"linebreak-style": [2, "unix"],
		semi: [2, "always"],
		"no-shadow": 1,
		"no-unused-vars": 1,
		"no-underscore-dangle": 0,
		strict: 0,
		"global-strict": 0,
		quotes: 0,
		"comma-spacing": 0,
		"no-mixed-spaces-and-tabs": 0,
		"no-constant-condition": 0,
		"space-infix-ops": 0,
		"no-loop-func": 0,
		"no-new": 0,
	},
}]);
