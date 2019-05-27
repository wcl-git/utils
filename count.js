/**
 ** 除法函数，用来得到精确的除法结果
 ** 说明：javascript的除法结果会有误差，在两个浮点数相除的时候会比较明显。这个函数返回较为精确的除法结果。
 ** 调用：accDiv(arg1,arg2)
 ** 返回值：arg1除以arg2的精确结果
 * */
export const accDiv = (arg1, arg2) => {
  let t1 = 0;
  let t2 = 0;
  try { t1 = arg1.toString().split('.')[1].length; } catch (e) { }
  try { t2 = arg2.toString().split('.')[1].length; } catch (e) { }
  const r1 = Number(arg1.toString().replace('.', ''));
  const r2 = Number(arg2.toString().replace('.', ''));
  return (r1 / r2) * Math.pow(10, t2 - t1);
};
/**
** 乘法函数，用来得到精确的乘法结果
** 说明：javascript的乘法结果会有误差，在两个浮点数相乘的时候会比较明显。这个函数返回较为精确的乘法结果。
** 调用：accMul(arg1,arg2)
** 返回值：arg1乘以 arg2的精确结果
* */
export const accMul = (num1, num2) => {
  if (!num1 || !num2) {
    return 0;
  }
  let m = 0;
  try { m += num1.toString().split('.')[1].length; } catch (e) { }
  try { m += num2.toString().split('.')[1].length; } catch (e) { }
  return (Number(num1.toString().replace('.', '')) * Number(num2.toString().replace('.', ''))) / Math.pow(10, m);
};

/**
** 减法函数，用来得到精确的减法结果
** 说明：javascript的减法结果会有误差，在两个浮点数相减的时候会比较明显。这个函数返回较为精确的减法结果。
** 调用：accSub(arg1,arg2)
** 返回值：arg1加上arg2的精确结果
* */
export const accSub = (num1, num2) => {
  let r1;
  let r2;
  try { r1 = num1.toString().split('.')[1].length; } catch (e) { r1 = 0; }
  try { r2 = num2.toString().split('.')[1].length; } catch (e) { r2 = 0; }
  const n = (r1 >= r2) ? r1 : r2;
  const m = Math.pow(10, Math.max(r1, r2));

  return (((num1 * m) - (num2 * m)) / m).toFixed(n);
};

/**
** 加法函数，用来得到精确的加法结果
** 说明：javascript的加法结果会有误差，在两个浮点数相加的时候会比较明显。这个函数返回较为精确的加法结果。
** 调用：accAdd(arg1,arg2)
** 返回值：arg1加上arg2的精确结果
* */
export const accAdd = (num1, num2) => {
  let r1;
  let r2;
  try { r1 = num1.toString().split('.')[1].length; } catch (e) { r1 = 0; }
  try { r2 = num2.toString().split('.')[1].length; } catch (e) { r2 = 0; }
  const m = Math.pow(10, Math.max(r1, r2));
  const n = (r1 >= r2) ? r1 : r2;
  return (((num1 * m) + (num2 * m)) / m).toFixed(n);
};

/*
*  参数说明：
*  number：要格式化的数字
*  decimals：保留几位小数
*  decpoint：小数点符号
*  thousands：千分位符
*/

export const numberformat = (number, decimals, decpoint, thousands) => {
  number = (`${number}`).replace(/[^0-9+-Ee.]/g, '');
  const n = !isFinite(+number) ? 0 : +number;
  const prec = !isFinite(+decimals) ? 0 : Math.abs(decimals);
  const sep = (typeof thousands === 'undefined') ? ',' : thousands;
  const dec = (typeof decpoint === 'undefined') ? '.' : decpoint;
  let s = '';
  const toFixedFix = (num, prc) => {
    const k = Math.pow(10, prc);
    return `${Math.ceil(num * k) / k}`;
  };

  s = (prec ? toFixedFix(n, prec) : `${Math.round(n)}`).split('.');
  const re = /(-?\d+)(\d{3})/;
  while (re.test(s[0])) {
    s[0] = s[0].replace(re, `$1${sep}$2`);
  }

  if ((s[1] || '').length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array((prec - s[1].length) + 1).join('0');
  }
  return s.join(dec);
};
