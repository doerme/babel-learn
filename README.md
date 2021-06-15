## 辅助工具
https://astexplorer.net/

## todo

情况1 done
处理 export default Hello1  ==>  export default ErrorBoundaryWrap(Hello1)

情况2 done
处理 export default {Hello1, ...}
==>
export default {Hello1: ErrorBoundary(Hello1), ...}

情况3 done
处理 export {Hello1, ...}
==>
const Hello1ErrorBoundary = ErrorBoundaryWrap(Hello1)
export {Hello1ErrorBoundary as Hello1, ...}

情况4 done
处理 export const Hello1 = ()=>{...}
==>
export const Hello1 = ErrorBoundaryWrap(()=>{...})