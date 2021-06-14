const { transformFromAstSync, parseSync } = require('@babel/core');
const  parser = require('@babel/parser');
const reactBoundaryPlugin = require('./plugin/react_boundary');
const fs = require('fs');
const path = require('path');

const sourceCode = fs.readFileSync(path.join(__dirname, './code/code1.jsx'), {
    encoding: 'utf-8'
});

const ast = parser.parse(sourceCode, {
    sourceType: 'unambiguous',
    plugins: ['jsx']
});

const { code } = transformFromAstSync(ast, sourceCode, {
    plugins: [reactBoundaryPlugin]
});

console.log('final code:');
console.log(code)
