<template>
  <div style="padding-bottom:77px">
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
    <template v-else><router-view></router-view></template>
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
      title: "出库管理",
      menu: [
        {
          MenuName: "拣货",
          icon: "pick-note",
          pageUrl: "/deliverGoods/Picking"
        },
        {
          MenuName: "复核清单",
          icon: "qingdian",
          pageUrl: "/deliverGoods/Check"
        }
      ],
      isRouter:true
    };
  },
  methods: {
    toItem(url) {
      // console.log(url);
      this.isRouter=false
      this.$router.push(url);
    }
  },
  destoryed(){
    console.log('销毁')
  },
  mounted(){
    // console.log(this.$route)
  },
  computed:{
    iShow:function(){
      let path = this.$route.path
      if(path=='/deliverGoods'){
        return true
      }else{
        return false
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