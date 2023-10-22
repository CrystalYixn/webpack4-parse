const path = require('path')
const fs = require('fs')

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
    return fs.readFileSync(modulePath, 'utf-8')
  }

  buildModule(modulePath, isEntry) {
    const source = this.getSource(modulePath)
    // 获取相对路径, 两个绝对路径之间的差
    const moduleRelativePath = './' + path.relative(this.root, modulePath)
    if (isEntry) this.entryId = moduleRelativePath
    console.log(this.root)
    console.log(source, moduleRelativePath)
  }

  run() {
    this.buildModule(path.resolve(this.root, this.entry), true)
  }
}

module.exports = Compiler
