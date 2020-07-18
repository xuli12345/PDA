import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store/store'
import Vant from 'vant';
import 'vant/lib/index.css';

// 引入公共样式
// import './assets/css/common.css'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import "./assets/iconFont/iconfont.css";

import 'lib-flexible/flexible.js'
import Mui from 'vue-awesome-mui';
Vue.use(Mui);

Vue.use(Vant);
Vue.use(ElementUI);
Vue.config.productionTip = false
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
