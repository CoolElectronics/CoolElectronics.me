module.exports = {
	"env": {
		"node": true,
		"browser": true,
		"commonjs": true,
		"jquery": true,
		"es2021": true
	},
	"globals": {
		"io": "writable",
		"Cookies": "writable",
		"Alpine": "writable",
		"run": "writable",

	},
	"extends": "eslint:recommended",
	"parserOptions": {
		"ecmaVersion": "latest"
	},
	"rules": {
		"no-case-declarations": 1,
		"no-empty": 0,
		"no-unused-vars": 0,
		"indent": [
			"off",
			"tab"
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": [
			"error",
			"double"
		],
		"semi": [
			"error",
			"always"
		]
	}
};
