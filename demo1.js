import parser from '@babel/parser';
import traverseModule from '@babel/traverse'
import generateModule from '@babel/generator'
import types from '@babel/types'
const traverse = traverseModule.default
const generate = generateModule.default

const sourceCode = `
    console.log(1);

    function func() {
        console.info(2);
    }

    export default class Clazz {
        say() {
            console.debug(3);
        }
        render() {
            return <div>{console.error(4)}</div>
        }
    }
`;

const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['jsx']
});

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

const targetCalleeName = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`);
traverse(ast, {
    CallExpression(path, state) {
        const calleeName = generate(path.node.callee).code;
         if (targetCalleeName.includes(calleeName)) {
            const { line, column } = path.node.loc.start;
            path.node.arguments.unshift(types.stringLiteral(`##2: (${line}, ${column})`))
        }
    }
});

const { code, map } = generate(ast);
console.log(code);