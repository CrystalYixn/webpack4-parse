#! /usr/bin/env node
// Hashbang 注释, 当在 shell 中运行时, 指定 shell 去调用解释器
// 注意路径是 /usr 而不是 /user
// 需要在根目录执行 npm link, 将这个包链接到全局上, 等同于 npm i -g
// 在需要 my-pack 命令的仓库, 执行 npm link my-pack 进行链接

const path = require('path')
const config = require(path.resolve('webpack.config.js'))

const Compiler = require('../lib/Compiler')
const compiler = new Compiler(config)
compiler.run()
