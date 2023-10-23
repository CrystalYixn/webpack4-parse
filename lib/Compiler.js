const path = require('path')
const fs = require('fs')
// 将源码转换为 AST
const babylon = require('babylon')
// 遍历 AST 节点
const traverse = require('@babel/traverse').default
const t = require('@babel/types')
const generator = require('@babel/generator').default
const ejs = require('ejs')

class Compiler {
  constructor(config) {
    this.config = config
    this.entry = config.entry
    this.entryId = null
    // QA 执行命令的位置?, D:\code\javascript\webpack\webpack4
    this.root = process.cwd()
    this.modules = {}
  }

  getSource(modulePath) {
    const { rules } = this.config.module
    let content = fs.readFileSync(modulePath, 'utf-8')
    // 遍历所有规则
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i]
      // 拿到当前规则信息
      const { test, use } = rule
      let len = use.length - 1
      // 规则匹配通过, 需要通过 loader 转换
      if (test.test(modulePath)) {
        // 递归调用 loader 处理内容
        function normalLoader() {
          // 倒序获取 loader
          const loader = require(use[len--])
          content = loader(content)
          if (len >= 0) {
            normalLoader()
          }
        }
        normalLoader()
      }
    }
    return content
  }

  parse(source, parentPath) {
    const ast = babylon.parse(source)
    const dependencies = []
    traverse(ast, {
      CallExpression(p) {
        const { node } = p
        if (node.callee.name === 'require') {
          // 修改调用函数名
          node.callee.name = '__webpack_require__'
          // ./a
          let moduleName = node.arguments[0].value
          // ./a.js
          moduleName = moduleName + (path.extname(moduleName) ? '' : '.js')
          // ./src\a.js
          moduleName = './' + path.join(parentPath, moduleName)
          dependencies.push(moduleName)
          // 修改参数
          node.arguments = [t.stringLiteral(moduleName)]
        }
      }
    })
    // 转换后的源码
    const sourceCode = generator(ast).code
    return { sourceCode, dependencies }
  }

  buildModule(modulePath, isEntry) {
    const source = this.getSource(modulePath)
    // 获取相对路径, 两个绝对路径之间的差
    const moduleRelativePath = './' + path.relative(this.root, modulePath)
    if (isEntry) this.entryId = moduleRelativePath
    const {
      sourceCode,
      dependencies,
    } = this.parse(source, path.dirname(moduleRelativePath))
    // 将路径与转换后的源码对应起来
    this.modules[moduleRelativePath] = sourceCode
    // 递归解析所有依赖模块
    dependencies.forEach(dep => {
      this.buildModule(path.join(this.root, dep))
    })
  }

  emitFile() {
    const { config, entryId, modules } = this
    const { output } = config
    const emitPath = path.join(output.path, output.filename)
    const template = this.getSource(path.join(__dirname, 'template.ejs'))
    const code = ejs.render(template, { entryId, modules })
    this.assets = {}
    this.assets[emitPath] = code
    fs.writeFileSync(emitPath, code)
  }

  run() {
    // 从主入口递归加载所有模块
    this.buildModule(path.resolve(this.root, this.entry), true)
    // 发射打包后的文件
    this.emitFile()
  }
}

module.exports = Compiler
