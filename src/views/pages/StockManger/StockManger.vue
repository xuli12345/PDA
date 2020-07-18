<template>
  <div>
    <!-- <router-view></router-view> -->
    <template v-if="iShow">
      <nav-bar :title="title"></nav-bar>
      <div class="box">
        <div class="box-item" v-for="(item,idx) in menu" :key="idx" @click="toItem(item.pageUrl)">
          <van-icon class-prefix="iconfont" :name="item.icon" size="1rem" />
          <div class="text">{{item.MenuName}}</div>
        </div>
      </div>
    </template>
    <template v-else>
      <router-view></router-view>
    </template>
  </div>
</template>

<script>
import navBar from "@/components/navBar.vue";
import bottomNav from "@/components/bottomNav";
export default {
  components: {
    navBar,
    bottomNav
  },
  data() {
    return {
      title: "库存管理",
      menu: [
        {
          MenuName: "移库",
          icon: "yiku",
          pageUrl: "/stockManger/moveStore"
        },
        {
          MenuName: "盘点",
          icon: "navicon-kcpdd",
          pageUrl: "/stockManger/inventory"
        }
      ],
      iShow: true
    };
  },
  methods: {
    toItem(url) {
      this.$router.push(url);
    }
  },
  mounted() {
    let path = this.$route.path;
    if (path == "/stockManger") {
      this.iShow = true;
    } else {
      this.iShow = false;
    }
  },
  watch: {
    $route: function() {
      let path = this.$route.path;
      if (path == "/stockManger") {
        this.iShow = true;
      } else {
        this.iShow = false;
      }
    }
  }
};
</script>

<style scoped>
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