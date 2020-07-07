import axios from "axios";
//导入store获取token在请求头中添加headers
import store from "@/store/store";

// let url = window.sessionStorage.getItem("requestUrl");
// console.log(url,"00000")

let url="http://8.129.208.95:8001/Service.svc"
// 设置基地址
// const url = process.env.BASE_API;
// console.log(process.env)

const request = axios.create({
  baseURL: url
});

//请求拦截器
request.interceptors.request.use(
  function(config) {
    if (config.loading) {
      store.commit("common/updateLoadingStatus", true);
    }

    let token = window.localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `${token}`;
    }
    return config;
  },
  function(error) {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  function(response) {
    store.commit("common/updateLoadingStatus", false);

    return response.data || response;
  },
  async function(error) {
    return Promise.reject(error);
  }
);

export default request;
