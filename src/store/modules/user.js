import * as user from "@/utils/user";
export default {
  namespaced: true,
  state: {
    userInfo: user.getUserData()
  },
  mutations: {
    updataUser(state, obj) {
      state.userInfo = obj;
    },
    updateId(state, id) {
      state.userId = id;
    },
    updateName(state, name) {
      state.username = name;
    }
  }
};
