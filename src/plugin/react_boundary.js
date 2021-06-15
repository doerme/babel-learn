const targetCalleeName = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`);

const reactBoundaryPlugin = ({ types, template }, options, dirname) => {
    const warpClassNode = template.expression({ plugins: ['jsx'] })(`
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(error) {
        return { hasError: true };
      }

      componentDidCatch(error, errorInfo) {
      }

      render() {
        if (this.state.hasError) {
          return <h1>Something went wrong.</h1>;
        }

        return this.props.children;
      }
    }`)()
    const wrapFunctionNode = template.statement({ plugins: ['jsx'] })(
    `const ErrorBoundaryWrap = (Child) => {
        return (props) => (
          <ErrorBoundary>
            <Child {...props} />
          </ErrorBoundary>
        )
    }`)()
    
    // console.log(`#wrapFunctionNode:`, wrapFunctionNode)
    // console.log(`#warpClassNode:`, warpClassNode)
    return {
        visitor: {
            Program(path, state){
                // console.log(`Program !!`, path)
                let insertAfterNode = null
                path.node.body.forEach(item => {
                    // console.log('##=>',item.type)
                    if(item.type === `ImportDeclaration`) {
                        insertAfterNode = item
                    }
                })
                // console.log(`insertAfterNode`, [warpClassNode,wrapFunctionNode])
                // insertAfterNode.insertAfter([warpClassNode,wrapFunctionNode])
                insertAfterNode.needInsertAfter = true
            },
            ImportDeclaration(path, state){
                // console.log(`ImportDeclaration`, path.node)
                if(path.node.needInsertAfter){
                    path.insertAfter([warpClassNode,wrapFunctionNode])
                }
            },
            ArrowFunctionExpression(path, state) {
                if(path.parent.type==='VariableDeclarator' && path.parentPath.parent.type==='VariableDeclaration' && path.parentPath.parentPath.parent.type==='ExportNamedDeclaration'){
                  // console.log(`## VariableDeclarator`, path.toString())
                  path.replaceWith(template.expression({ plugins: ['jsx'] })(`ErrorBoundaryWrap(${path.toString()})`)())
                }
            },
            ExportSpecifier(path, state) {
                // console.log(`#path parent:`, path.parent)
                if(path.parent && path.parent.type === 'ExportNamedDeclaration' && !path.parent.isdeal){
                    // const replaceNode = types.arrayExpression([newNode, path.node]);
                    const replaceNodeList = []
                    const parentNode = path.parent
                    let replaceNodeString = `export {`
                    let adot = ``
                    parentNode.specifiers.forEach(element => {
                        const componentName = element.local.name;
                        // console.log(`element.local.name:`,componentName)
                        replaceNodeList.push(template.statement(`const ${componentName}ErrorBoundary = ErrorBoundaryWrap(${componentName})`)())
                        replaceNodeString +=` ${adot} ${componentName}ErrorBoundary as ${componentName}`
                        adot = `,`
                    });
                    replaceNodeString += '}'
                    const newDeclarationNode = template.statement(replaceNodeString)()
                    newDeclarationNode.isdeal = true
                    replaceNodeList.push(newDeclarationNode)
                    // console.log(`#replaceNodeList:`, replaceNodeList)
                    path.parentPath.replaceWithMultiple(replaceNodeList)
                }
            },
            ExportDefaultDeclaration(path, state) {
                // console.log('ExportDefaultDeclaration path, state', path, state)
                // console.log(`##ExportDefaultDeclaration`,path.node)
                if(path?.node?.declaration?.properties && !path?.node?.isdeal){
                  let replaceNodeString = `export default {`
                  let adot = ``
                  path.node.declaration.properties.forEach(item=>{
                    // console.log(`##=>`,item.value.name)
                    if(item?.value?.name){
                      replaceNodeString += ` ${adot} ${item.value.name}: ErrorBoundary(${item.value.name})`
                      adot = `,`
                    }
                  })
                  replaceNodeString += '}'
                  const newNode = template.statement(replaceNodeString)()
                  newNode.isdeal = true
                  // console.log(`newNode`, newNode)
                  path.replaceWithMultiple([newNode])
                } else if(path?.node?.declaration?.type === 'Identifier'){
                  path.replaceWith(template.statement(`export default ErrorBoundaryWrap(${path?.node?.declaration?.name})`)())
                }

                // if()
            },
        }
    }
}
module.exports = reactBoundaryPlugin;
