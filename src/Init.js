var Ob = require('./Observe')
require('./debugOrLogMethodInject');
Ob(Ob,{
  // 已安装的模块名称
  installModule: [],
  //实例化对象
  instances: {},
  // 模块类集合
  ModuleClass:{},
  EventListener: function(){
    let _message = {};
    return {
      /**
       * @description: 注册事件方法
       * @param {type string 消息类型 }
       * @param {callback function 回调函数 }
       * @param {context Object 作用域}
       * 
       * @return {this Object}
       */
      on: function (type,callback,context){
        if(_message[type]){
          _message[type].push({
            context: context || null,
            callback:  callback || function(){}
          })
        }else{
          _message[type] = [];
          this.on(type,callback,context)
        }
        return this;
      },
      once: function (){},
      /**
       * @description: 
       * @param {type string 消息类型 }
       * @param {messageObjOrFuncOrFunc Object 消息对象或者回调函数}
       * @return {this Object}
       */
      remove: function(type,messageObjOrFunc){
        if(!type){
          _message = {};
          return this;
        }
        if(_message[type]){
          if(messageObjOrFunc){
            _message[type] = _message[type].filter(
              (item) => {
                if(typeof messageObjOrFunc === 'function'){
                  
                  return item.callback !== messageObjOrFunc
                }else{
                  return item.callback !== messageObjOrFunc.callback || item.context !== messageObjOrFunc.context;
                }
              }
            )
          }else{
            _message[type] = {}
          }
        }
        return this;
      },
      /**
       * @description: 触发事件
       * @param {type string 消息类型}
       * @param {context Object 作用域}
       * @return {res array 结果数组}
       */
      trigger: function(type){
        let args = Ob.slice.call(arguments,1);
        let res = []
        if(_message[type]){
          _message[type].forEach(element => {
            res.push(element.callback.apply(element.context,args))
          });
        } else {
          Ob.error('不存在此类消息类型')
          return null;
        }

        return res;
      }
    }
  }(),
  destory: function(instance) {
    let msg = Ob({},instance._message_,instace.message);
    for(let key in msg){
      instance.remove(key,{context: instance, callback: instance[msg[key]]});
    }
  },
  isPropertyObject: function(obj) {
    return obj.value && (obj.enumerable !== undefined || obj.writable !== undefined || obj.configurable !== undefined)
  },
  propertiesExtend: function (target) {
    let args = Ob.slice.call(arguments, 1);
    let ipo = this.isPropertyObject;
    args.forEach((obj) => {
      Object.keys(obj).forEach(function(key,index) {
        let descriptor = {
          enumerable: obj[key].enumerable || false,
          configurable: true,
        }
        if(obj[key].set || obj[key].get){
          obj[key].set && (descriptor.set = obj[key].set);
          obj[key].get && (descriptor.get = obj[key].get);
        }else if(ipo(obj[key])){
          descriptor.value = obj[key].value;
          descriptor.writable = obj[key].writable;
        }else {
          descriptor.value = obj[key];
          descriptor.writable = true;
        }
        Object.defineProperty(target,key,descriptor);
      })
    });
    return target;
  },
  module: function(name){
    if(!/[A-Z]/.test(name[0])){
      Ob.error(name + ' 模块名称首字母大写')
    }
    if(Ob.ModuleClass[name]){
      Ob.error(name + ' 模块已经安装')
    }
    let Parent = this.Base;
    let slice = this.slice;
    let Module = function() {
      let args = Array.from(arguments);
      args.unshift(this);
      this.beforeCreate.apply(Module,args);
      return Parent.apply(this,arguments);
    }
    let protos = Module.prototype = Object.create(Parent && Parent.prototype, {
      constructor: {
        value: Module,
        enumerable: false,
        writable: true,
        configurable: true
      }
    })
    let args = slice.call(arguments,1);
    let callbacks = [];
    args.forEach((proto) => {
      proto && typeof proto._hooks === 'function' && callbacks.push(proto._hooks);
    })
    args.push({_hookCallbacks: callbacks})
    args.unshift(Module.prototype)
    this.propertiesExtend.apply(this,args)
    protos.beforeInstall.call(Module,Module)
    Ob.ModuleClass[name] = Module;
    this.installModule.push(name);
    return this;
  },
  /**
   * @description: 开始函数
   * @param {*}
   * @return {*}
   */
  ready: function() {
    if(this.installModule && this.installModule.length){
      this.installModule = this.installModule.filter(function(module){
        this.create(module)
      }.bind(this))
    }
    this.EventListener.trigger('Ob.ready');
    return this;
  },
  /**
   * @description: 模块创建函数
   * @param {*} moduleName  模块名称
   * @return {*}
   */
  create: function (moduleName) {
    let arg = this.slice.call(arguments,1);
    let instance = new (Ob.ModuleClass[moduleName].bind(Ob.ModuleClass[moduleName], arg));
    this.install(moduleName,instance);
    return instance;
  },
  /**
   * @description: 模块安装函数
   * @param {*} moduleName 模块名称
   * @param {*} instance 模块实例化对象
   * @return {*}
   */
  install: function (moduleName,instance) {
    let moduleInstances = (this.instances[moduleName.toLowerCase()] = this.instances[moduleName.toLowerCase()] || [])
    moduleInstances.push(instance);
    instance.afterCreated();
  },
  /**
   * @description: 模块卸载函数
   * @param {*} moduleName 模块名称
   * @param {*} instance 模块实例化对象
   * @return {*}
   */
  uninstall: function(moduleName,instance){
    if(this.instances[moduleName]){
      this.instances[moduleName].some(function(obj,index,arr){
        if( obj === instance){
          let result = arr.splice(index,1);
          result.destory();
          return true;
        }
      })
    }
  }
})
Ob(Ob,Ob.EventListener);
Ob(Ob,{
  msgSerialization: function() {},
  Base: function(){    
    Ob.msgSerialization.call(this);
    this._hookCallbacks.forEach(function(fn) {
      fn.call(this)
    }.bind(this))
    this.initialize.apply(this,arguments);
  }
})
//扩展模块的基本类型
Ob.propertiesExtend(Ob.Base.prototype, 
  Ob.EventListener, {
    _message_: {},
    message: {},
    _hooks: function(){},
    beforeInstall: function(){},
    beforeCreate: function(){},
    initialize: function(){},
    afterCreated: function(){},
    ready: function(){},
    beforeDestory:function(){},
    consts: function (key,value){
    },
    destory: function() {
      this.beforeDestory();
      Ob.destory();
    }
  }
)
module.exports = function(key){
  if(arguments.length) {
    if(typeof key === 'string'){
      Ob.module.apply(Ob,arguments)
    }else{
      return Object.assign.apply(this,arguments)
    }
  }else{
    Ob.ready()
  }
  return Ob;
};