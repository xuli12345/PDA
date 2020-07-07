<template>
  <van-sticky>
    <div class="navHead">
      <van-icon class="icon" name="arrow-left" size="25" @click="backPage" />
      <div class="title">{{title}}</div>
    </div>
  </van-sticky>
</template>

<script>
export default {
  props: ["title"],
  methods: {
    backPage() {
      this.$router.back();
      try {
        setTimeout(() => {
          let path = window.location.hash.slice(1);
          this.$router.replace(path);
        }, 10);
        _this.$store.commit("changeActive", 1);
        // return false;
      } catch (e) {}
    }
  }
};
</script>

<style scoped>
.navHead {
  width: 100%;
  height: 50px;
  line-height: 50px;
  position: relative;
  background-color: #1989fa;
  color: #fff;
}
/* .navHead span {
  padding: 0 20px;
} */
.navHead .icon {
  position: absolute;
  left: 10px;
  top: 0;
  transform: translateY(50%);
  z-index: 10;
}
.navHead .title {
  font-size: 20px;
  width: 100%;
  height: 100%;
  text-align: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
}
</style>