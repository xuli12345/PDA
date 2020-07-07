<template>
  <div id="app">
    <router-view />
  </div>
</template>
<script>
import { Dialog } from "vant";
export default {
  data() {
    return {
      backnum: 1
    };
  },
  methods: {
    // 扩展API准备完成后要执行的操作
    plusReady() {
      let _this = this;
      // let backnum=1
      var ws = plus.webview.currentWebview(); //pw回车可输出plus.webview
      plus.key.addEventListener("backbutton", () => {
        let path = _this.$router.history.current.path;
        // 在home或者登录页面退出程序
        if (path == "/home" || path == "/login") {
          // Dialog.confirm({
          //   // title: "标题",
          //   message: "退出程序"
          // })
          //   .then(() => {
          //     plus.runtime.quit();
          //   })
          //   .catch(() => {
          //     // on cancel
          //   });
          if (_this.backnum < 2) {
            plus.nativeUI.toast("再按一次退出应用");
            _this.backnum++;
          } else {
            // plus.runtime.quit()
            var _self = plus.webview.currentWebview();
            _self.close();
          }
        } else {
          _this.$router.back();
          try {
            setTimeout(() => {
              let apath = window.location.hash.slice(1);
              _this.$router.replace(apath);
            }, 1);
            return false;
          } catch (e) {}
        }
      });
    }
  },
  created() {
    if (window.plus) {
      this.plusReady();
    } else {
      document.addEventListener("plusready", this.plusReady, false); //
    }
  },
  destoryed() {
    document.removeEventListener("plusready", this.plusReady, false);
  },
  watch: {
    $route(to, from) {
      // console.log(to.path,from.path)
      if (to.path == "/home" || to.path == "/login") {
        this.backnum = 1;
      }
    }
  }
};
</script>
<style>
.iconfont {
  font-family: "iconfont" !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
