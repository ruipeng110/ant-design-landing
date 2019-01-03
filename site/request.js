/* global window */
import axios from 'axios';
import qs from 'qs';
import jsonp from 'jsonp';
import lodash from 'lodash';
import pathToRegexp from 'path-to-regexp';
import { message } from 'antd';

const fetch = (options) => {
  let {
    method = 'get',
    data,
    fetchType,
    url,
    withCredentials = false,
  } = options;

  const cloneData = lodash.cloneDeep(data);

  try {
    let domin = '';
    if (url.match(/[a-zA-z]+:\/\/[^/]*/)) {
      [domin] = url.match(/[a-zA-z]+:\/\/[^/]*/);
      url = url.slice(domin.length);
    }
    const match = pathToRegexp.parse(url);
    url = pathToRegexp.compile(url)(data);
    for (const item of match) {
      if (item instanceof Object && item.name in cloneData) {
        delete cloneData[item.name];
      }
    }
    url = domin + url;
  } catch (e) {
    message.error(e.message);
  }

  switch (method.toLowerCase()) {
    case 'get':
      return axios.get(url, {
        params: cloneData,
      });
    case 'delete':
      return axios.delete(url, {
        data: cloneData,
      });
    case 'post':
      return axios.post(url, cloneData, {
        withCredentials,
      });
    case 'put':
      return axios.put(url, cloneData);
    case 'patch':
      return axios.patch(url, cloneData);
    case 'blob':
      options.method = 'post';
      return axios(options);
    default:
      return axios(options);
  }
};

export default function request(options) {
  return fetch(options).then((response) => {
    const { statusText, status, headers } = response;
    let data = response.data;
    if (data instanceof Array) {
      data = {
        list: data,
      };
    }
    if (headers['content-type'] === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });


      const url = window.URL.createObjectURL(blob);
      window.open(url, '_self');
    } else {
      return Promise.resolve({
        success: true,
        message: statusText,
        statusCode: status,
        ...data,
      });
    }
  }).catch((error) => {
    const { response } = error;
    let msg;
    let statusCode;
    if (response && response instanceof Object) {
      const { data, statusText } = response;
      statusCode = response.status;
      msg = data.message || statusText;
    } else {
      statusCode = 600;
      msg = error.message || 'Network Error';
    }

    /* eslint-disable */
    console.error({success: false, statusCode, message: msg})
    //     return Promise.reject({ success: false, statusCode, message: msg })

  })
}
