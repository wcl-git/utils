// 判断数据类型
export const isType = (d, t) => {
  return t && typeof t === 'string' ? Object.toString.call(d) === `[object ${t.replace(/^(\w)/, (a) => { return a.toUpperCase(); })}]` : Object.toString.call(d).replace(/.+(?=\s)\s|]/g, '');
};
// 判断空对象
export const isEmpty = (o) => {
  return this.isType(o, 'array') || this.isType(o, 'object') ? '[]{}'.indexOf(JSON.stringify(o)) > -1 : null;
};
// 表单元素跳至下一个元素
export const formNext = (options = {}, cb = () => null) => {
  if (isType(options, 'function')) {
    cb = options;
    options = {};
  }
  let current;
  let next;
  let context = document;

  const selector2ele = selectorStr => (isType(selectorStr, 'string') && options.search && options.search(/#|\./) === 0 ? document.querySelector(selectorStr) : selectorStr);
  options = selector2ele(options);
  // 检查到传进来的参数可能是一个不存在的节点也或许是null
  if (isType(options, 'null')) {
    return document.activeElement;
  }

  if ((isType(options, 'keyboardEvent') || isType(options, 'object')) && options.target && options.target.nodeType) { // 如果传事件对象过来 默认以enter执行
    if ((options.keyCode || options.which || options.charCode) !== 13) {
      return document.activeElement;
    }
    current = options.target;
  } else if (isType(options, 'object')) {
    current = selector2ele(options.current);
    next = selector2ele(options.next);
    context = options.context && options.context.nodeType ? options.context : context;
  }

  if (options && options.nodeType === 1) {
    next = options;
  }

  const eles = [];
  context.querySelectorAll('input,textarea').forEach((item) => {
    if (item.type !== 'hidden' && !item.disabled) { // 对一些特殊将不会被聚焦元素进行过滤
      eles.push(item);
    }
  });

  if (next && next.nodeType === 1) {
    // 自定义的select, combobox特殊处理
    if (next.className.indexOf('seenew-select-input') > -1) {
      next.click();
    }
    next.focus();
    cb({
      active: document.activeElement,
      eles,
      isLast: document.activeElement === eles[eles.length - 1] || current === eles[eles.length - 1],
    });
    return document.activeElement;
  }

  const active = document.activeElement;
  let setpNum = 0;
  eles.forEach((item, i) => {
    if (setpNum === 0 && (item === current || item === active) && eles[i + 1]) {
      // 自定义的select, combobox特殊处理
      if (eles[i + 1].className.indexOf('seenew-select-input') > -1) {
        eles[i + 1].click();
      }
      eles[i + 1].focus();
      setpNum++;
    }
  });
  cb({
    active: document.activeElement,
    eles,
    isLast: document.activeElement === eles[eles.length - 1] || current === eles[eles.length - 1],
  });
  return document.activeElement;
};

