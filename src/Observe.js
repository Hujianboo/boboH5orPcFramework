(function (){
  let root = this;
  let Observe = function () {
    return Object.assign.apply(this,arguments)
  }
  if(module){
    module.exports = Observe;
  }else{
    root.Observe = Observe;
  }
}.call(this))