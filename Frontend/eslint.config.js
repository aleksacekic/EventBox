import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

// Flat config (ESLint 9). Namerno blago podeseno za zatecen kod:
// react-hooks pravila su 'warn' a ne 'error' da lint ne bude zid od 200 gresaka.
// Cilj Faze 0: da `npm run lint` uopste radi i da pokaze gde su useEffect problemi.
export default [
  { ignores: ['dist/', 'build/', 'public/', 'node_modules/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...react.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // React 17+ JSX transform
      'react/prop-types': 'off',
      // Namerno NE ukljucujemo ceo reactHooks "recommended" set - to je novi
      // React Compiler skup pravila (immutability/purity/static-components...)
      // koji na zatecenom kodu daje stotine gresaka. Drzimo dva klasicna:
      'react-hooks/rules-of-hooks': 'error', // hvata prave bugove
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
]
