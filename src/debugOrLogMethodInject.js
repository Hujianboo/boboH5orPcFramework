
let Ob = require('./Observe')
//添加常用方法
Ob(Ob, {
  slice: Array.prototype.slice,
  splice: Array.prototype.splice,
})
//添加部分调试方法
Ob(Ob, {
  info: function(msg){
    console.log('Info: ' + msg);
  },
  warn: function (msg) {
    console.warn('warn: ' + msg);
  },
  error: function (msg) {
    console.error('error: ' + msg);
  },
})