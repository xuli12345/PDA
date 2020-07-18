<template>
  <div class="wrap">
    <nav-bar :title="title"></nav-bar>
    <template v-for="(item,i) in formData">
      <van-cell-group :key="i">
        <van-field
          v-model="form[item.fColumn]"
          :name="item.fColumn"
          :label="item.fColumnDes"
          :placeholder="item.fReadOnly==0?'点击扫描或输入':''"
          clearable
          @change="judge(item.fColumn,form[item.fColumn])"
          :disabled="item.fReadOnly==1?true:false"
          @click="item.fColumn=='fCarrierName'?clickTran(item.fColumn):''"
          :readonly="item.fColumn=='fCarrierName'?true:false"
        ></van-field>
        <template v-if="item.fColumn=='fCarrierName'">
          <van-popup v-model="showPicker" position="bottom">
            <van-picker
              show-toolbar
              :columns="columns"
              @confirm="onConfirm"
              @cancel="showPicker = false"
            />
          </van-popup>
        </template>
      </van-cell-group>
    </template>
    <bottomNav :title="'确定'" @onSubmit="onSubmit"></bottomNav>
  </div>
</template>

<script>
import navBar from "@/components/navBar.vue";
import bottomNav from "@/components/bottomNav.vue";
import {
  getTableBodyData,
  collectionData,
  getTableHeadData
} from "@/api/index";
import { decryptDesCbc } from "@/utils/cryptoJs.js"; //解密
import { compare, setDefaultForm } from "@/utils/common.js";
import { timeCycle } from "@/utils/updateTime.js"; //格式化时间
import { Notify, Toast, Dialog } from "vant";
export default {
  components: {
    navBar,
    bottomNav
  },
  data() {
    return {
      title: "装车",
      formData: [
        { fColumn: "fCarrierName", fColumnDes: "承运商", fReadOnly: 0 },
        { fColumn: "fSendCarNo", fColumnDes: "派车单号", fReadOnly: 0 },
        { fColumn: "fContactName", fColumnDes: "司机", fReadOnly: 1 },
        { fColumn: "fContactMobile", fColumnDes: "电话", fReadOnly: 1 },
        { fColumn: "fVehicleModel", fColumnDes: "车型", fReadOnly: 1 },
        { fColumn: "fLicenseNo", fColumnDes: "车牌", fReadOnly: 1 },
        { fColumn: "fOutboundOrderNo", fColumnDes: "出库单号", fReadOnly: 0 }
      ],
      form: {
        fCarrierName: "",
        fSendCarNo: "",
        fContactName: "",
        fContactMobile: "",
        fVehicleModel: "",
        fLicenseNo: "",
        fOutboundOrderNo: ""
      },
      showPicker: false,
      columns: [],
      //   当前picker选择器字段
      currentPick: "",
      user: JSON.parse(sessionStorage.getItem("user")),
      CarrierHead: [],
      insertForm: {},
      CarrierData: [],
      //出库单号是否正确
      Wrong: false
    };
  },
  methods: {
    judge(str, value) {
      // 出库单号
      if (str == "fOutboundOrderNo") {
        return this.getStock(value);
      } else if (str == "fCarrierName") {
        // 承运商
        return this.getCarrierID(str, value);
      } else if (str == "fSendCarNo") {
        // 派车单号
        return this.getInfo(str, value);
      } else {
        return false;
      }
    },
    // 输入承运商，获取承运商ID
    async getCarrierID(str, v) {
      console.log(str, v);
      return;
    },
    // 根据承运商/派车单号获取装车信息
    async getInfo(str, v) {
      console.log(str, v);
    },
    // 检测输入的出库单号是否正确
    async getStock(value) {
      let searchWhere = {
        Computer: "=",
        DataFile: "fOutboundOrderNo",
        Value: value
      };
      let res = await getTableBodyData("v_OutboundOrder_Mst", [searchWhere]);
      res = JSON.parse(
        decryptDesCbc(res.qureyDataResult, String(this.user.userDes))
      );
      let data;
      if (res.State) {
        if (res.Data == "[]") {
          Toast("该单号不存在，请确认单号是否正确");
          this.Wrong = true;
          return;
        }
        return;
      } else {
        Toast(res.Message);
        return;
      }
    },
    // 点击确定
    onSubmit() {
      console.log("点击确定");
      if (this.form.fSendCarNo == "") {
        Toast("请输入派车单号");
        return;
      }
      if (this.form.fOutboundOrderNo == "") {
        Toast("请输入出库单号");
        return;
      }
      if (this.Wrong) {
        Toast("出库单号不正确，请检查");
        return;
      }
      this.insertForm = setDefaultForm(this.CarrierHead);
      for (const key1 in this.form) {
        for (const key2 in this.insertForm) {
          if (key1 == key2) {
            this.insertForm[key2] = this.form[key1];
          }
        }
      }

      this.insertForm.fCreater = this.user.userId;
      this.insertForm.fCreaterCode = this.user.usercode;
      // 因为保存承运商时需要保存承运商的ID
      // 根据承运商名称获取承运商ID
      let cName = this.form.fCarrierName;
      this.CarrierData.forEach(child => {
        if (child.fCarrierName == cName) {
          this.insertForm.fCarrierID = child.fID;
        }
      });
      // console.log(this.insertForm);
      // return;
      this.saveData(this.insertForm);
    },
    // 发送请求，提交数据
    async saveData(insertData) {
      let res = await collectionData([
        {
          TableName: "t_Vehicle_Loading",
          IdentityColumn: "fID",
          insertData: [insertData],
          headData: this.CarrierHead
        }
      ]);
      res = JSON.parse(
        decryptDesCbc(res.saveDataResult, String(this.user.userDes))
      );
      console.log(res);
      if (res.state) {
        Toast.success("装车完成");
        // // 清空数据
        for (const key in this.form) {
          this.form[key] = "";
        }
      } else {
        Toast(res.errstr);
      }
    },
    // 点击承运商，弹出框选择承运商
    clickTran(v) {
      // console.log("1");
      this.showPicker = true;
      this.currentPick = v;
    },
    onConfirm(value) {
      //   this.value = value;
      console.log(value);
      //   将选中的值赋给表单对应的字段
      this.form[this.currentPick] = value;
      // console.log(this.form)
      // return
      this.showPicker = false;
      // 根据选中的承运商，匹配对应的数据
      let obj = {};
      this.CarrierData.forEach(item => {
        if (item.fCarrierName == value) {
          obj = item;
        }
      });
      // 遍历form表单赋值相应信息
      for (const key1 in obj) {
        for (const key2 in this.form) {
          if (key1 == key2) {
            this.form[key2] = obj[key1];
          }
        }
      }
      // console.log(this.form)
    },
    // 获取承运商，可供选择
    async getCarrierInfo() {
      let goodsRes = await getTableBodyData("v_Carrier");
      goodsRes = JSON.parse(
        decryptDesCbc(goodsRes.qureyDataResult, String(this.user.userDes))
      );
      let CarrierData = [];
      if (goodsRes.State) {
        CarrierData = JSON.parse(goodsRes.Data);
        this.CarrierData = CarrierData;
        console.log(this.CarrierData);
      }
      CarrierData.forEach(element => {
        this.columns.push(element.fCarrierName);
      });
    },
    //获取装车接口的表头
    async getCarrierHead() {
      let res = await getTableHeadData("t_Vehicle_Loading");
      res = JSON.parse(
        decryptDesCbc(res.getInterfaceEntityResult, String(this.user.userDes))
      );
      if (res.State) {
        this.CarrierHead = res.lstRet.sort(compare);
        // console.log(this.CarrierHead);
      }
    }
  },
  created() {
    this.getCarrierHead();
    this.getCarrierInfo();
  }
};
</script>

<style scoped>
.wrap {
  padding-bottom: 77px;
}
</style>