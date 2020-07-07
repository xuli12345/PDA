import Vue from "vue";
import router from "@/router";
import store from "@/store/store";

/**
 * 是否有权限
 * @param {*} key
 */
export function isAuth(key) {
  return (
    JSON.parse(sessionStorage.getItem("permissions") || "[]").indexOf(key) !==
      -1 || false
  );
}

/**
 * 截取数据
 * 
 */

 export function chunk(array, size) {
    const length = array.length;
    if (!length || !size || size < 1) {
      return [];
    }
    let index = 0;
    let resIndex = 0;
    let result = new Array(Math.ceil(length / size));
    while (index < length) {
      result[resIndex++] = array.slice(index, (index += size));
    }
    //输出新数组
    return result;
  }
 


/**
 * 清除登录信息
 */
export function clearLoginInfo() {
  window.sessionStorage.removeItem("user");
  store.commit("user/updataUser", {}); // 重置vuex本地储存状态
  router.options.isAddDynamicMenuRoutes = false; // 是否已经添加动态(菜单)路由
}
