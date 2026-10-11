const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
    js.configs.recommended,
    {
        // The library is a plain script (and a module when required): a page gives it a window and doT.
        files: ['src/doTRoute.js'],
        languageOptions: {
            sourceType: 'script',
            globals: { ...globals.browser, ...globals.commonjs, doT: 'readonly' }
        }
    },
    {
        files: ['src/test/**/*.js', 'eslint.config.js'],
        languageOptions: { sourceType: 'commonjs', globals: globals.node }
    }
]
