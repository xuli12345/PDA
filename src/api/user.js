//引入axios网络请求库
import http from "@/http/http";
/**
 *
 *   封装获取用户登录
 *
 */
function userLogin(obj) {
  let arr = [];
  arr.push(obj.username);
  arr.push(obj.password);
  return http({
    url: "/UserLogin",
    method: "POST",
    loading:"true",
    data: JSON.stringify(arr)
  });
}
export { userLogin };
