/**
 * @Description: 快捷键 注解
 * @Author: wuchunlei
 * @Update: 2018-07-10
 * 编写背景: 此次项目中发现用到了大量的快捷键, 包括组合快捷键, 所以花点时间写共用方法
 */
// 事件注入函数
const inject = function (g, doc) {
  if (g.bindKeyfuncs) {
    return false;
  }
  const keyCodes = [];
  const evts = [];
  let funcs;
  g.bindKeyfuncs = {};
  inject.keydown = function (ev) {
    // ev.target.nodeName === 'BODY'
    const keyCode = ev.keyCode || ev.which || ev.charCode;
    funcs = g.bindKeyfuncs;
    if (keyCodes[keyCodes.length - 1] !== keyCode) {
      keyCodes.push(keyCode);
      evts.push(ev);
      if (funcs && typeof funcs[`${keyCodes}`] === 'function') {
        ev.preventDefault();
        ev.stopPropagation();
        funcs[`${keyCodes}`].apply(g, evts);
      }
    }
  };
  inject.keyup = function (ev) {
    const keyCode = ev.keyCode || ev.which || ev.charCode;
    const codeIndex = keyCodes.findIndex(v => v === keyCode);
    keyCodes.splice(codeIndex, 1);
    evts.splice(codeIndex, 1);
  };
  doc.addEventListener('keydown', inject.keydown);
  doc.addEventListener('keyup', inject.keyup);
};
inject(window, document);

export default function (dealCls) {
  const g = window;
  const fn = dealCls.prototype;
  fn.addKeyEvent = function (fKeyName, callback) {
    fKeyName += '';
    // 检查是否已经注入绑定键盘事件,没有再绑定一次
    if (!inject.keydown) {
      inject(window, document);
    }
    if (/^[\d,]+$/g.test(fKeyName) && typeof callback === 'function') {
      if (typeof g.bindKeyfuncs[fKeyName] === 'function') {
        console.log(`"${fKeyName}"方法,已经被注册过了.`);
      }
      g.bindKeyfuncs[fKeyName] = callback;
    } else {
      throw new TypeError('参数格式不正确!');
    }
  };
  fn.removeKeyEvent = function (fKeyName) {
    delete g.bindKeyfuncs[fKeyName];
    g.bindKeyfuncs[fKeyName] = null;
  };
  fn.destroyKeyEvent = function () {
    delete g.bindKeyfuncs;
    g.bindKeyfuncs = null;
    g.document.removeEventListener('keydown', inject.keydown);
    g.document.removeEventListener('keyup', inject.keyup);
    inject.keydown = null;
    inject.keyup = null;
  };
  // 在不知道key时用来测试keyCode，调试完之后记得不要调用该函数，该函数只是做来做测试所用
  fn.showKeyCode = function (showAll = false) {
    window.document.body.addEventListener('keydown', (ev) => {
      ev.preventDefault();
      console.log(showAll === true ? ev : `您刚才的按键Key值为: ${ev.keyCode || ev.which || ev.charCode}`);
    });
  };
  const componentWillUnmount = fn.componentWillUnmount || function () { };
  fn.componentWillUnmount = function () {
    componentWillUnmount.call(this);
    this.destroyKeyEvent();
  };
  return dealCls;
}
