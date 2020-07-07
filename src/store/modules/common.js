export default {
  namespaced: true,
  state: {
    // 页面文档可视高度(随窗口改变大小)
    documentClientHeight: 0,
    // 侧边栏, 折叠状态
    sidebarFold: false,
    // 侧边栏, 菜单
    menuList: [],
    //侧边栏 菜单宽度
    menusWidth: "230px",
    //侧边栏 当前激活菜单的index
    menuActiveName: "",
    // 内容, 是否需要刷新
    contentIsNeedRefresh: false,
    // 主入口标签页
    mainTabs: [],
    //tab栏当前激活的index
    mainTabsActiveName: "",
    //loading的状态
    loadingStatus: false,
  },
  mutations: {
    updateSidebarFold(state, fold) {
      if (fold === true) {
        state.menusWidth = "64px";
      } else {
        state.menusWidth = "230px";
      }
      state.sidebarFold = fold;
    },
    updateMenuList(state, list) {
      state.menuList = list;
    },
    updateMenuActiveName(state, name) {
      // console.log(name)
      state.menuActiveName = name;
    },
    updateContentIsNeedRefresh(state, status) {
      state.contentIsNeedRefresh = status;
    },
    updateMainTabs(state, tabs) {
      state.mainTabs = tabs;
    },
    updateMainTabsActiveName(state, name) {
      state.mainTabsActiveName = name;
    },
    //更改loading的状态
    updateLoadingStatus(state, value) {
      // console.log(value)
      state.loadingStatus = value
    }
  }
};
