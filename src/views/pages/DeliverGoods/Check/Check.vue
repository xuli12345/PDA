<template>
  <div>
    <nav-bar :title="title"></nav-bar>
    复核
    </div>
</template>

<script>
import navBar from "@/components/navBar.vue";

export default {
  components:{
    navBar
  },
  data(){
    return{
      title:'复核清点'
    }
  }
}
</script>

<style>

</style>