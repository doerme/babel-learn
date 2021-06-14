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
    const wrapFunctionNode = template.statements({ plugins: ['jsx'] })(
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
            ExportNamedDeclaration(path, state) {
                // 处理 export {Hello1, ...}
                // ==>
                // const Hello1ErrorBoundary = ErrorBoundaryWrap(Hello1)
                // export {Hello1ErrorBoundary as Hello1, ...}
                
            },
            ExportSpecifier(path, state) {
                // 处理 export {Hello1, ...}
                // ==>
                // const Hello1ErrorBoundary = ErrorBoundaryWrap(Hello1)
                // export {Hello1ErrorBoundary as Hello1, ...}
                console.log(`#path parent:`, path.parent)
                if(path.parent && path.parent.type === 'ExportNamedDeclaration' && !path.parent.isdeal){
                    // const replaceNode = types.arrayExpression([newNode, path.node]);
                    const replaceNodeList = []
                    const parentNode = path.parent
                    let replaceNodeString = `export {`
                    let adot = ``
                    parentNode.specifiers.forEach(element => {
                        const componentName = element.local.name;
                        console.log(`element.local.name:`,componentName)
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
            },
        }
    }
}
module.exports = reactBoundaryPlugin;
