<template>
  <div style="padding: 16px;" class="bottom" v-if="isShow">
    <van-button round type="info" native-type="button" @click="submit">{{title}}</van-button>
    <van-button round type="danger" @click.stop="BackPage" native-type="button">返回</van-button>
  </div>
</template>

<script>
export default {
  props:['title'],
  data(){
    return{
      isShow:true,
      screenHeight:document.documentElement.clientHeight ||document.body.clientHeight,
      originHeight:document.documentElement.clientHeight ||document.body.clientHeight
    }
  },
  mounted(){
    const that = this
    window.addEventListener('resize',()=>{
      that.screenHeight=document.documentElement.clientHeight || document.body.clientHeight
    })
  },
  watch:{
    screenHeight:function(newValue){
      if(this.originHeight>this.screenHeight){
        this.isShow=false
      }else{
        this.isShow = true
      }
    }
  },
  methods: {
    BackPage() {
      this.$router.back();
        // console.log('路由跳转')
      try {
        setTimeout(() => {
          let path = window.location.hash.slice(1);
          this.$router.replace(path);
        }, 10);
        return false;
      } catch (e) {}
    },
    // 提交
    submit(){
      this.$emit("onSubmit")
    }
  }
};
</script>

<style scoped>
.bottom {
  width: 100%;
  box-sizing: border-box;
  background-color: #fff;
  border-top: 1px solid #eee;
  position: fixed;
  left: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  z-index: 10;
}
.bottom .van-button {
  min-width: 100px !important;
}
</style>