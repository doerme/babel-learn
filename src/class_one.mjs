import parser from '@babel/parser'; // 代码转语法树
import traverseModule from '@babel/traverse' // 语法树转目标语法树
import generateModule from '@babel/generator' // 语法树转代码
import types from '@babel/types' // 创建ast节点
import template from '@babel/template' // 创建复杂的ast节点
import fs from 'fs';
import path from 'path';
const traverse = traverseModule.default
const generate = generateModule.default
const __dirname = path.resolve();

const sourceCode = fs.readFileSync(path.join(__dirname, './src/code/sourceCode.js'), {
    encoding: 'utf-8'
});

const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['jsx']
});

// 不使用generate
// traverse(ast, {
//     CallExpression (path, state) {
//         if ( types.isMemberExpression(path.node.callee) 
//             && path.node.callee.object.name === 'console' 
//             && ['log', 'info', 'error', 'debug'].includes(path.node.callee.property.name) 
//            ) {
//             const { line, column } = path.node.loc.start;
//             path.node.arguments.unshift(types.stringLiteral(`##1: (${line}, ${column})`))
//         }
//     }
// });

//使用generate
// const targetCalleeName = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`);
// traverse(ast, {
//     CallExpression(path, state) {
//         const calleeName = generate(path.node.callee).code;
//          if (targetCalleeName.includes(calleeName)) {
//             const { line, column } = path.node.loc.start;
//             path.node.arguments.unshift(types.stringLiteral(`##2: (${line}, ${column})`))
//         }
//     }
// });

// 新需求 插入参数改为，插入一个 console.log的ast
const targetCalleeName = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`);
traverse(ast, {
    CallExpression(path, state) {
        if (path.node.isNew) {
            console.log('是新节点 跳过')
            return;
        }
        const calleeName = generate(path.node.callee).code;
         if (targetCalleeName.includes(calleeName)) {
            const { line, column } = path.node.loc.start;
            const newNode = template.expression(`console.log("filename: (${line}, ${column})")`)();
            newNode.isNew = true;

            if (path.findParent(path => path.isJSXElement())) {
                console.log('jsx 跳过子节点')
                path.replaceWith(types.arrayExpression([newNode, path.node]))
                path.skip();
            } else {
                console.log('不是jsx 前面插入')
                path.insertBefore(newNode);
            }
        }
    }
});

const { code, map } = generate(ast);
console.log('最终结果:')
console.log(code);