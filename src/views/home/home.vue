<template>
  <div class="wrap">
    <div class="headUser">
      <span class="headSpan"><van-icon class-prefix="iconfont" name="yonghu" color="#ffffff" size='0.533333rem' style="padding-right:5px"/>&nbsp;&nbsp;{{user.username}}</span>
      <span @click="Logout"><van-icon class-prefix="iconfont" name="tuichu" color="#ffffff" size='0.533333rem'/></span>
    </div>
    <div class="box">
      <div class="box-item" v-for="(item,idx) in menu" :key="idx" @click="toItem(item.pageUrl)">
        <img :src="item.iconUrl" :alt="item.MenuName" />
        <div class="text">{{item.MenuName}}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { Dialog } from "vant";
import imgs1 from "@/assets/icon/20200626191648.png";
import imgs2 from "@/assets/icon/20200626191708.png";
import imgs3 from "@/assets/icon/20200626191715.png";
import imgs4 from "@/assets/icon/20200626191721.png";
export default {
  data() {
    return {
      menu: [
        {
          MenuName: "收货管理",
          icon: "records",
          iconUrl: imgs1,
          pageUrl: "/receiptGoods"
        },
        {
          MenuName: "上架管理",
          icon: "upgrade",
          iconUrl: imgs2,
          pageUrl: "/uploadGoods"
        },
        {
          MenuName: "出库管理",
          icon: "exchange",
          iconUrl: imgs3,
          pageUrl: "/deliverGoods"
        },
        {
          MenuName: "库存管理",
          icon: "close",
          iconUrl: imgs4,
          pageUrl: "/stockManger"
        }
      ],
      // active: -1,
      user: JSON.parse(sessionStorage.getItem("user"))
    };
  },
  methods: {
    Logout() {
      Dialog.confirm({
        title: "提示",
        message: "确认退出登录吗？"
      })
        .then(() => {
          // on confirm
          window.sessionStorage.removeItem("user");
          this.$router.push("/login");
        })
        .catch(() => {
          // on cancel
        });
    },
    //路由跳转
    toItem(url) {
      this.$router.push(url);
    },
  },
};
</script>

<style scoped>
.wrap {
  width: 100%;
  height: 100%;
}
.headUser {
  width: 100%;
  height: 50px;
  line-height: 50px;
  display: flex;
  justify-content: space-around;
  background-color: #1989fa;
  color: #fff;
  font-size: 20px;
}
.headUser span {
  padding: 0 20px;
}
.headSpan{
  display: flex;
  justify-content: center;
  align-items: center;
}
.box {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
.box .box-item {
  width: 187.5px;
  height: 187.5px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  font-size: 20px;
}
.box .box-item img {
  width: 50%;
}
.box .box-item .text {
  padding: 10px;
}
</style>