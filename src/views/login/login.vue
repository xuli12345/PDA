<template>
  <div class="wrap">
    <h2 class="title">知行易通</h2>
    <van-form @submit="onSubmit">
      <van-field
        v-model="username"
        name="userName"
        left-icon="manager"
        placeholder="账号"
        :rules="[{ required: true, message: '请填写账号' }]"
      />
      <van-field
        v-model="password"
        type="password"
        name="userPassword"
        left-icon="lock"
        placeholder="密码"
        :rules="[{ required: true, message: '请填写密码' }]"
      />
      <van-field
        readonly
        clickable
        name="store"
        :value="value"
        placeholder="点击选择公司"
        left-icon="map-marked"
        @click="showPicker = true"
      />
      <van-popup v-model="showPicker" position="bottom">
        <van-picker
          show-toolbar
          :columns="store"
          @confirm="onConfirm"
          @cancel="showPicker = false"
        />
      </van-popup>
      <div style="margin: 16px;">
        <van-button round block type="info" native-type="submit">登录</van-button>
      </div>
    </van-form>
  </div>
</template>

<script>
import axios from "axios";
import md5 from "js-md5";
import { userLogin } from "@/api/user";
import { decryptDesCbc } from "@/utils/cryptoJs.js";
import { Notify, Toast } from "vant";
export default {
  data() {
    return {
      username: "",
      password: "",
      value: "",
      showPicker: false,
      store: [],
      options: []
    };
  },
  methods: {
    async onSubmit(values) {
      // console.log("submit", values);
      let res = await userLogin({
        username: this.username,
        password: md5(this.password)
      });
      // console.log(res)
      if (res.userLoginResult.State) {
        // console.log(res.userLoginResult)
        let user = {
          username: res.userLoginResult.UserName,
          userId: res.userLoginResult.UserID,
          usercode: res.userLoginResult.UserCode,
          userDes: decryptDesCbc(res.userLoginResult.DESCode, "d#s87@28")
        };
        window.sessionStorage.setItem("user", JSON.stringify(user));
        this.$store.commit("user/updataUser", user);
        Toast({
          type: "success",
          message: "登录成功"
        });
        this.$router.replace({ name: "home" });
      } else {
        Toast({
          type: "fail",
          message: res.userLoginResult.Message
        });
      }
    },
    onConfirm(value) {
      this.value = value;
      this.showPicker = false;
    }
  },
  async created() {
    axios
      .post("http://8.129.208.95:8001/Service.svc/GetCompanyData")
      .then(res => {
        // console.log(res);
        if (res.data.getCompanyDataResult.State) {
          let resCom = res.data.getCompanyDataResult.lstRet;
          this.options = resCom;
          this.value = resCom[0].fCompanyName;
          resCom.forEach(element => {
            this.store.push(element.fCompanyName);
          });
        }
      })
      .catch(err => {
        alert(err);
      });
  },
  watch: {
    value(newVal, oldVal) {
      // console.log(newVal,'1')
      this.options.forEach(el => {
        if (el.fCompanyName == newVal) {
          sessionStorage.setItem("requestUrl", el.fServiceUrl);
          sessionStorage.setItem("sqlConn", JSON.stringify(el.fSqlConn));
        }
      });
    }
  }
};
</script>

<style scoped>
.wrap {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.title{
  font-size: 30px;
}
</style>