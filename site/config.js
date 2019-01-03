import request from './request';


const baseUrl = 'http://140.143.63.112:8051/ant/';
// const baseUrl = 'http://localhost:8051/ant/';

export default {
  query: `${baseUrl}query`,
  save: `${baseUrl}save`,
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
};
