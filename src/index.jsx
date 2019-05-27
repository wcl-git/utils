/**
 ** @Author: wuchunlei
 ** @Update: 2018-05-10
 ** @Description: ajax/fetch//getScript数据请求方法封装   不支持jsonp如果后期有这需求可以添加
 ** 因在request添加cookie, conent-type等字段信
 ** special: intactModel<取整个respnse数据>   customTip<自定义异常提示框>   noHeaders<不带header信息>   cover<默认无,传false不需要loading层>   duration<提示框延迟关闭>
 ** hasFetchLoading=false<项目不需要loading层>
 */
import './index.scss';
// 取运行环境
export const getIsLocal = (type) => {
  const isLocal = location.hostname.search(/\.fh\.|localhost|127\.0\.0\.1/) > -1;
  return type ? type === 'devhost' && isLocal ? getIsLocal.devHostName : '' : isLocal;
};
getIsLocal.devHostName = `${location.protocol}//dev-his.seenew.cn`;

const G = window;
G.fetchingCount;
let fetchingCount;
let coverElement = null;
const SPECIALS = ['intactModel', 'customTip', 'noHeaders', 'cover']; // 特殊处理集合
const DATATYPES = ['json', 'text', 'blob', 'arrayBuffer']; // 数据流转换类型
// 获取cookie信息 用于后期通过request传给后端
const getCookie = function (cName) {
  const reg = new RegExp(`${cName}=([^$;]*)`);
  const result = reg.exec(document.cookie);
  return result && result.length ? result[1] : result;
};
// 获取url参数
const getUrlParams = function (key) {
  const reg = new RegExp(`${key}=([^&$]+)`);
  const ret = reg.exec(G.location.search);
  return ret && ret[1];
};

// [k1, k2, k3]
const URLKEYS = (getUrlParams('k') || '').split('-');

const baseUrl = G.localStorage.getItem('ajaxBaseUrl') || getIsLocal('devhost');

const isPlat = /\Wplat\./.test(G.location.hostname); // 兼容运营平台

const request = function (options) {
  let { url = location.pathname, type: method = 'get', data = {}, headers = {}, dataType = 'json', special = {}, beforeSend = _ => null, success = _ => null, error = _ => null, complete = _ => null } = options;
  let isMockDev = G.location.hostname.indexOf('mock.') > -1;
  special.duration = special.duration || 0;

  dataType = DATATYPES.indexOf(dataType) > -1 ? dataType : 'text';
  if (url.indexOf('//') === -1) {
    if (baseUrl) {
      url = baseUrl + url;
    } else {
      url = location.origin + url;
    }
  }
  method = method.toUpperCase();

  let body = typeof data === 'string' ? data : JSON.stringify(data);
  if (method === 'GET') {
    url += (url.indexOf('?') > 0 ? '&' : '?') + queryString(data);
    url = url.replace(/(?:\?|\&)$/, '');
    body = null;
  }

  const baseHeaders = { Accept: 'application/json' };
  // let tokenName = /[\w]+token/i.exec(document.cookie);

  // 多用户登录
  const browserTabId = URLKEYS[2];
  let userTokens = getCookie('xnTokens');
  let userToken = getCookie('xnToken');
  if (!isPlat && browserTabId && userTokens && userTokens.indexOf('{"') === 0) {
    userTokens = JSON.parse(userTokens);
    userToken = userTokens[browserTabId] ? userTokens[browserTabId].xnToken : 'null';
  }

  if (!isPlat && userToken) { // his系统
    baseHeaders.Authorization = `Bearer ${userToken}`;
    baseHeaders.k1 = URLKEYS[0] || '';
    baseHeaders.k2 = URLKEYS[1] || '';
    baseHeaders.WebUrl = G.document.URL;
  } else { // 运营平台或其它系统
    baseHeaders.session_token = getCookie('xnPlatToken');
  }

  const mixHeaders = Object.assign(baseHeaders, method === 'POST' ? { 'Content-Type': 'application/json; charset=UTF-8' } : {}, headers);

  let response;

  beforeSend();
  if (url.indexOf('//mocks.') > -1) { isMockDev = true; }
  const isHasCover = special.cover === true || (dQuery.isType(special.cover, 'undefined') && G.hasFetchLoading === true);
  if (isHasCover) {
    protectedLayer('begin');
  }
  return fetch(new Request(url, { method, headers: isMockDev ? {} : special.noHeaders ? headers : mixHeaders, credentials: 'omit', body }))
    .then((res) => {
      response = res;
      // 404 500状态处理
      if (res.ok === false) {
        throw new Error(res.status == 404 ? '系统网络异常,请稍后再试' : '系统繁忙,请稍后再试');
      } else if (res.status >= 200 && res.status < 300) {
        return res[dataType]();
      }
      const err = new Error(ResStatusMessage[res.status] || res.statusText);
      err.res = res;
      throw err;
    })
    .then((res) => {
      const codeStatus = `${res.code}`;
      if (codeStatus === '4002') {
        alertMsg(1, '登录已失效，请重新登录', 0, () => G.location.href = `${G.location.origin}/login.html?url=${window.location.pathname}`);
      } else if (codeStatus === '4005') {
        return res;
      } else if (codeStatus.indexOf('400') === 0) {
        if (special.customTip !== true) { // 自定义弹框提示的情况
          const errMsg = dealErrMsg(res.message) || ResCodeMessage[res.code] || '系统繁忙,请稍后再试!';
          alertMsg(2, errMsg, special.duration);
        }
        // throw new Error(res.message || ResCodeMessage[res.code]);
      }
      return res;
    })
    .then((res) => {
      success(res.body, res, response);
      return dQuery.isType(res) !== 'Object' && dQuery.isType(res) !== 'Array' || special.intactModel === true ? res : res.body;
    }, (err) => {
      error(err, response);
      console.warn('获取接口数据产生异常:', err && err.message);
    })
    // .catch((err) => { error(err); return err; })
    .finally((res) => {
      if (isHasCover) {
        protectedLayer('done');
      }
      complete(res);
      return res;
    });
};

// 如果有一些自定义提示框 想获取整个response数据情况最好走ajax方法
const $ajax = function (options) {
  if (options.special && dQuery.isType(options.special, 'string') || dQuery.isType(options.special, 'array')) {
    const special = {};
    if (dQuery.isType(options.special, 'string')) {
      options.special = options.special.replace(/\s/g, '');
    }
    SPECIALS.forEach((item) => {
      if (options.special.indexOf(item) > -1) {
        const reg = new RegExp(`${item}=([^,$]+)`);
        const ret = reg.exec(options.special);
        special[item] = ret ? ret[1] == 'true' ? true : ret[1] == 'false' ? false : ret[1] : true;
      }
    });
    options.special = special;
  }
  return request(options);
};

// 供代码开发阶段调试所用
$ajax.setBaseUrl = function (ajaxBaseUrl) {
  if (ajaxBaseUrl && typeof ajaxBaseUrl === 'string' && ajaxBaseUrl.indexOf('//') === -1) { ajaxBaseUrl = `//${ajaxBaseUrl}`; }
  localStorage.setItem('ajaxBaseUrl', ajaxBaseUrl);
};

/**
 *
 * @param {*} js或者css服务端或cdn远程地址
 * @param {*} 是否移除
 * @param {*} 加载成功之后回调
 */
const $getScript = function (attachSrc, cb = _ => null, remove = true) {
  const doc = G.document;
  const ohead = doc.documentElement.firstElementChild || doc.getElementsByTagName('head')[0];
  const inspect = function (type, src) {
    // 不考虑低版本浏览 提高性能就不用for循环了
    return doc.querySelector(type === 'script' ? `script[src="${src}"]` : `link[href="${src}"]`) === null;
  };
  const addAttach = function (src) {
    const type = /\.js$|\.js\?/.test(src) ? 'script' : /\.css$|\.css\?/.test(src) ? 'link' : null;
    if (!type) {
      throw new Error('请传入js或者css地址');
    }
    if (!inspect(type, src)) {
      console.log('已经查检到之前有添加过该文件', type, src);
      return false;
    }
    const os = doc.createElement(type);
    if (type === 'script') {
      os.onload = function () {
        cb();
        remove === true && ohead.removeChild(os);
      };
      os.async = true;
      os.src = src;
      ohead.appendChild(os);
    } else {
      os.setAttribute('rel', 'stylesheet');
      os.href = src;
      ohead.insertBefore(os, ohead.getElementsByTagName('title')[0]);
    }
  };

  if (Array.isArray(attachSrc)) {
    attachSrc.forEach((srcUrl) => {
      addAttach(srcUrl);
    });
  } else if (typeof attachSrc === 'string') {
    addAttach(attachSrc);
  } else {
    throw new Error('传入的参数类型不正确!');
  }
};

function queryString(params) {
  if (G.URLSearchParams) {
    return new G.URLSearchParams(params).toString();
  }

  let result = '';
  const encode = function (v) {
    return typeof v === 'string' ? v.replace(/\&/gm, '%26').replace(/\?/gm, '%3F') : v;
  };
  Object.keys(params).forEach((v) => {
    result += `&${v}=${encode(params[v])}`;
  });
  return result.slice(1);
}


// 返回数据状态信息
const ResCodeMessage = {
  2000: '服务器成功返回请求的数据',
  4000: '程序异常',
  4001: '参数验证错误',
  4002: '未登陆',
  // 4007 后端断言异常
};

// 返回状态信息
const ResStatusMessage = {
  200: '服务器成功返回请求的数据',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据,的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器',
  502: '网关错误',
  503: '服务不可用，服务器暂时过载或维护',
  504: '网关超时',
};

// 弹框提示
const alertMsg = function (type, msg, duration, cb = _ => null) { // type 1, 2
  let popup = G.document.getElementById(type === 1 ? 'fetch-msg-tip' : 'fetch-err-tip');
  const callfn = function () {
    if (popup) {
      let delay = 0;
      if (type === 2) {
        popup.className = popup.className.replace('bounce', 'zoomOut');
        delay = 820;
      }
      setTimeout(() => {
        G.document.body.removeChild(popup);
      }, delay);
    }
    cb();
  };
  if (!popup) {
    popup = G.document.createElement('div');
    popup.id = type === 1 ? 'fetch-msg-tip' : 'fetch-err-tip';
    G.document.body.appendChild(popup);
    if (type === 1) {
      popup.innerHTML = `<div class="popup-box"><div class="dialog-title">系统温馨提示</div><div class="dialog-content">${msg}</div><div class="dialog-handler"><button onclick="document.getElementById('fetch-msg-tip').ecb()">确定</button></div></div>`;
    } else {
      popup.className = `${popup.className || ''}animated bounce`;
      popup.innerHTML = `<div class="popup-box"><div class="dialog-title"><a href="javascript:;" class="close-btn" onclick="document.getElementById('fetch-err-tip').ecb()">&times;</a></div><div class="dialog-content"><i class="seenewIconfont icon-shibai"></i><div class="content-text">${msg}</div></div></div>`;
      // popup.style.width = Math.min(popup.querySelector('.content-text').offsetWidth+90,234+90)+'px';
      popup.style.height = `${Math.max(popup.querySelector('.dialog-content').offsetHeight + 38, 75)}px`;
      duration > 0 && setTimeout(() => { callfn(); }, 4000); // 自动关闭
    }
    popup.ecb = callfn;
  } else {
    const msgTipPop = G.document.querySelector('#fetch-msg-tip .dialog-content');
    if (msgTipPop) {
      msgTipPop.innerHTML = msg;
      popup.ecb = callfn;
    }
  }
};

// 对error message各种错误格式的兼容处理
const dealErrMsg = function (msg) {
  if (!msg) {
    return msg;
  }
  if (typeof msg === 'string' && msg.indexOf('[') === 0) {
    msg = JSON.parse(msg);
  }
  if (Array.isArray(msg)) {
    if (dQuery.isType(msg[0], 'string') && msg[0].indexOf('{') === 0 && msg[0].lastIndexOf('}') === msg[0].length - 1) {
      msg = msg.map(err => JSON.parse(err));
    }
    if (dQuery.isType(msg[0], 'object') && msg[0].value) {
      msg = msg.map((err, index) => (msg.length === 1 ? err.value : `${index + 1}、${err.value}`)).join(' ');
    } else {
      msg = msg.map((err, index) => (msg.length === 1 ? err : `${index + 1}、${err}`)).join(' ');
    }
  }
  return msg;
};

// 数据请求之前 加蒙板处理
let protectedLayerTimer1 = null;
let protectedLayerTimer2 = null;
const protectedLayer = function (actionType) {
  fetchingCount = fetchingCount || 0;
  G.fetchingCount = G.fetchingCount || 0;

  const addCover = function () {
    if (coverElement) {
      return false;
    }
    coverElement = G.document.createElement('div');
    coverElement.id = 'fetch-loading-cover';
    if (!G.document.getElementById('fetch-loading-cover')) {
      G.document.body.appendChild(coverElement);
    }
    clearTimeout(protectedLayerTimer1);
    protectedLayerTimer1 = setTimeout(() => {
      if (coverElement) {
        coverElement.className = `${coverElement.className || ''}runAnt`;
      }
    }, 500);
  };

  const removeCover = function () {
    if (fetchingCount < 1 && coverElement) {
      coverElement.className = '';
      clearTimeout(protectedLayerTimer2);
      protectedLayerTimer2 = setTimeout(() => {
        if (fetchingCount < 1 && coverElement && G.document.getElementById('fetch-loading-cover')) {
          G.document.body.removeChild(coverElement);
          coverElement = null;
        }
      }, 700);
    }
  };

  if (actionType === 'begin') {
    fetchingCount++;
    G.fetchingCount++;
    addCover();
  } else if (actionType === 'done') {
    fetchingCount--;
    G.fetchingCount--;
    removeCover();
  }
};

export default $ajax;

export const $get = function (url, params, callback, dataType) {
  if (dQuery.isType(params, 'function')) { callback = params; params = {}; }
  if (dQuery.isType(params, 'string') && DATATYPES.indexOf(params) > -1) { dataType = params; params = {}; }
  if (dQuery.isType(callback, 'string') && DATATYPES.indexOf(callback) > -1) { dataType = callback; callback = undefined; }

  // === 后期打算废除的用法
  const special = {};
  if (params && dQuery.isType(params.__callSpecial__, 'object')) {
    Object.assign(special, params.__callSpecial__);
    delete params.__callSpecial__;
  }
  // ===
  return request({ url, data: params, special, dataType, success: callback });
};

export const $post = function (url, params, callback, dataType) {
  if (dQuery.isType(params, 'function')) { callback = params; params = {}; }
  if (dQuery.isType(params, 'string') && DATATYPES.indexOf(params) > -1) { dataType = params; params = {}; }
  if (dQuery.isType(callback, 'string') && DATATYPES.indexOf(callback) > -1) { dataType = callback; callback = undefined; }

  // === 后期打算废除的用法
  const special = {};
  if (params && dQuery.isType(params.__callSpecial__, 'object')) {
    Object.assign(special, params.__callSpecial__);
    delete params.__callSpecial__;
  }
  // ===
  return request({ url, data: params, special, type: 'post', dataType, success: callback });
};


export { $getScript };
