import request from './request';


const previewUrl = 'http://localhost:7113?id=';
const serverBaseUrl = 'http://140.143.63.112:8051/ant/';
// const baseUrl = 'http://localhost:8051/ant/';

export default {
  query: `${serverBaseUrl}query`,
  save: `${serverBaseUrl}save`,
  get: (url, param) => {
    return request({
      url,
      method: 'get',
      data: param,
    });
  },
  post: (url, param) => {
    return request({
      url,
      method: 'post',
      data: param,
    });
  },
  preview: (id) => {
    window.open(previewUrl + id);
  },
};
