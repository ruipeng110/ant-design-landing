
import AV from 'leancloud-storage';
import queryString from 'query-string';
import { getURLData, setURLData } from '../theme/template/utils';
import defaultData from './default.template.config.js';

import { get, query } from '../config';

export const appId = 'ogaJShC9qJERt8LqGO80z2pO-gzGzoHsz';
export const appKey = '8e5H5xBF86hI9vItQI1pt4kP';
const fileName = 'Edit';
const userAvName = 'EditUser';


AV.init({
  appId,
  appKey,
});
export const userName = 'antd-landing-user-name';

let t = 0;
let localNum = 0;
export const postType = {
  POST_DEFAULT: 'default',
  POST_SET: 'set',
  POST_SUCCESS: 'success',
  POST_ERROR: 'error',
  SET_TEMPLATE: 'setTemplate',
  SET_EDIT: 'setEdit',
  SET_MEDIA: 'setMedia',
  SET_USER: 'setUser',
  SET_USERTEMPLATE: 'setUserTemplate',
};
export const removeTemplate = (key) => {
  const TemplateObject = AV.Object.createWithoutData(fileName, key);
  TemplateObject.destroy().then(() => {
    console.log('删除成功');
  });
};
function dataToLocalStorage(obj) {
  window.localStorage.setItem(obj.id, JSON.stringify({
    id: obj.id,
    attributes: obj.attributes,
  }));
}

export const newTemplate = (cb, data = {
  template: [
    'Nav0_0', 'Banner0_0', 'Content0_0',
    'Content1_0', 'Content3_0', 'Footer0_0',
  ],
  config: {},
  style: [],
  other: {},
}) => {
  const TemplateObject = AV.Object.extend(fileName);
  const tempData = new TemplateObject();
  tempData.set('template', data.template);
  tempData.set('config', data.config);
  tempData.set('style', data.style);
  tempData.set('other', data.other);
  tempData.save().then((obj) => {
    setURLData('uid', obj.id);
    window.localStorage.setItem(userName, `${obj.id},${
      window.localStorage.getItem(userName) || ''}`);
    dataToLocalStorage(obj);
    cb(obj);
  }, (error) => {
    console.error(error);
  });
};

export const switchTemplate = (key) => {
  setURLData('uid', key);
  location.reload();
};

export const getMongoData = (dispatch) => {
  const param = queryString.parse(location.search);
  get(query, param).then((response) => {
    dispatch({
      type: postType.POST_SUCCESS,
      templateData: { attributes: response && response.content },
    });
  });
};

export const getMongoData1 = (param, dispatch, cb) => {
  get(query, param).then((response) => {
    if (!response || !response.content) {
      cb('查询失败');
      return;
    }
    dispatch({
      type: postType.POST_SUCCESS,
      templateData: { attributes: response && response.content },
    });
  }).catch((error) => {
    cb(error);
  });
};


export const getUserData = data => (dispatch) => {
  // 获取 url 上是否有 user id;
  const hash = getURLData('uid');
  const cloneId = getURLData('cloneId');
  const previewId = getURLData('previewId');
  if (previewId) {
    dispatch({
      type: postType.POST_SUCCESS,
      templateData: {
        id: previewId,
        attributes: defaultData[previewId],
      },
    });
    return;
  }
  if (cloneId) {
    const d = defaultData[cloneId];
    setURLData('cloneId');
    if (d) {
      getUserData(d)(dispatch);
      return;
    }
    console.warn(`error: cloneId(${cloneId}) Incorrect, please check it.`);
  }
  /**
   * 进入页面:
   * 1. 如果 hash 里有值, 请求 hash 里的值，当值没有返回数据，依次往下取 localStorage 里的值，没有将删除再新建。
   * 2. 空 hash 进入, 依次往下取 localStorage 里的值, 没有将删除再新建。
   */
  // 获取本地是否有数据存在 localStorage;
  const userId = data ? [] : (window.localStorage.getItem(userName)
    && window.localStorage.getItem(userName).split(',').filter(c => c)) || [];
  const uid = hash || userId[localNum];
  localNum += 1;
  if (!hash && uid) {
    setURLData('uid', uid);
  }
  let userIsLogin;
  if (!uid) {
    newTemplate((obj) => {
      dispatch({
        type: postType.POST_SUCCESS,
        templateData: obj,
      });
    }, data);
  } else {
    const storageDataStr = window.localStorage.getItem(uid);
    if (storageDataStr) {
      const obj = JSON.parse(storageDataStr);
      userIsLogin = obj.attributes.user
        && obj.attributes.user.userId
        && window.localStorage.getItem(`antd-landing-login-${obj.attributes.user.userId}`);
      dispatch({
        type: postType.POST_SUCCESS,
        templateData: obj,
        userIsLogin,
      });
    } else {
      const tempData = new AV.Query(fileName);
      tempData.get(uid).then((obj) => {
        const inLocal = userId.some(key => key === uid);
        let localStr = userId.join(',');
        if (!inLocal) {
          localStr = `${uid},${localStr}`;
        }
        window.localStorage.setItem(userName, localStr);
        dataToLocalStorage(obj);
        userIsLogin = obj.attributes.user
          && obj.attributes.user.userId
          && window.localStorage.getItem(`antd-landing-login-${obj.attributes.user.userId}`);
        dispatch({
          type: postType.POST_SUCCESS,
          templateData: obj,
          userIsLogin,
        });
      }, (error) => {
        if (error.code === 101) {
          window.localStorage.setItem(userName, userId.filter(key => key !== uid).join(','));
          setURLData('uid');
          return getUserData()(dispatch);
        } if (error.code === -1) {
          t += 1;
          if (t < 3) {
            getUserData()(dispatch);
          } else {
            console.error('数据请求错误：请检查你的 uid 和网络, 再刷新网页。');
          }
        } else if (error.code === 100) {
          console.error('数据挂了，请稍后。');
        }
      });
    }
  }
};

export const setTemplateData = (data) => {
  dataToLocalStorage({
    id: data.uid,
    attributes: data.data,
  });
  return {
    type: postType.SET_TEMPLATE,
    data: data.data,
  };
};

export const saveData = (templateData, dispatch, cb) => {
  const { uid, data } = templateData;
  const { user } = data;
  const saveFile = (d) => {
    const templateObject = AV.Object.createWithoutData(fileName, uid);
    Object.keys(data).forEach((key) => {
      templateObject.set(key, data[key]);
    });
    templateObject.save().then((e) => {
      dispatch(setTemplateData(d));
      cb(e);
    }, cb);
  };
  let userData;
  if (user && !user.userId) {
    const password = user.password;
    delete user.password;
    const UserObject = AV.Object.extend(userAvName);
    userData = new UserObject();
    userData.set('username', templateData.uid);
    userData.set('password', password);
    userData.save().then((obj) => {
      user.userId = obj.id;
      window.localStorage.setItem(`antd-landing-login-${obj.id}`, 'true');
      saveFile(templateData);
    }, (error) => {
      console.log(JSON.stringify(error));
    });
  } else if (user && user.userId && user.password) {
    userData = AV.Object.createWithoutData(userAvName, user.userId);
    userData.set('password', user.password);
    delete user.password;
    userData.save().then(() => {
      saveFile(templateData);
    });
  } else if (user && user.delete) {
    userData = AV.Object.createWithoutData(userAvName, user.userId);
    userData.destroy().then(() => {
      window.localStorage.setItem(`antd-landing-login-${user.userId}`, '');
      delete templateData.data.user;
      saveFile(templateData);
    }, (error) => {
      console.log(JSON.stringify(error));
    });
  } else {
    saveFile(templateData);
  }
};

export const setUserData = (data) => {
  return {
    type: postType.SET_USER,
    data,
  };
};

export const setUserAndTemplateData = (data) => {
  dataToLocalStorage({
    id: data.templateData.uid,
    attributes: data.templateData.data,
  });
  return {
    type: postType.SET_USERTEMPLATE,
    data,
  };
};

export const signUpUser = (templateData, password, dispatch, cb) => {
  templateData.data.user = templateData.data.user || {
    username: templateData.uid,
    userId: null,
  };
  templateData.data.user.password = password;
  delete templateData.data.user.delete;
  cb();
  dispatch(setUserAndTemplateData({ userIsLogin: true, templateData }));
};

export const removeUser = (templateData, dispatch, cb) => {
  if (templateData.data.user && templateData.data.user.userId) {
    templateData.data.user.delete = true;
  } else {
    delete templateData.data.user;
  }
  cb();
  dispatch(setUserAndTemplateData({ userIsLogin: false, templateData }));
};

export const loginIn = (password, id, dispatch, cb) => {
  const user = AV.Object.createWithoutData(userAvName, id);
  user.fetch().then(() => {
    if (password === user.get('password')) {
      window.localStorage.setItem(`antd-landing-login-${id}`, 'true');
      dispatch(setUserData(true));
      cb(true);
    } else {
      cb();
    }
  });
};

// 编辑 props
export const setCurrentData = (data) => {
  return {
    type: postType.SET_EDIT,
    data,
  };
};

// 编辑 media 状态
export const setCurrentMediaData = (data) => {
  return {
    type: postType.SET_MEDIA,
    data,
  };
};
