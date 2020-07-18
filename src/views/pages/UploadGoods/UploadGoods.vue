<template>
  <div class="wrap">
    <nav-bar :title="title"></nav-bar>
    <van-tabs>
      <van-tab title="整箱上架">
        <van-field
          v-for="(item,index) in formData"
          :key="index"
          v-model="allForm[item.fColumn]"
          :name="item.fColumn"
          :label="item.fColumnDes"
          :placeholder="item.fReadOnly==0?'点击扫描/输入':''"
          clearable
          @change="judge(item.fColumn,allForm[item.fColumn])"
          :disabled="item.fReadOnly==1?true:false"
        />
        <bottom-nav :title="'确认上架'" @onSubmit="allUpData"></bottom-nav>
      </van-tab>
      <van-tab title="拆分上架">
        <van-field
          v-for="(item,index) in formData1"
          :key="index"
          v-model="splitForm[item.fColumn]"
          :name="item.fColumn"
          :label="item.fColumnDes"
          :placeholder="item.fReadOnly==0?'点击扫描/输入':''"
          clearable
          @change="judge(item.fColumn,splitForm[item.fColumn])"
          :disabled="item.fReadOnly==1?true:false"
        >
          <template v-if="item.fColumn=='fPutonNum'" #button>
            <van-button @click="addNum(item.fColumn)" size="mini" type="primary" color="#1989fa">
              <van-icon class-prefix="iconfont" name="zengjia" color="#ffffff" />
            </van-button>
            <van-button @click="reduceNum(item.fColumn)" size="mini" type="primary" color="#1989fa">
              <van-icon class-prefix="iconfont" name="jianshao" color="#ffffff" />
            </van-button>
          </template>
        </van-field>
        <bottom-nav :title="'确认上架'" @onSubmit="splitUpData"></bottom-nav>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script>
import navBar from "@/components/navBar.vue";
import bottomNav from "@/components/bottomNav";
import { decryptDesCbc } from "@/utils/cryptoJs.js"; //解密
import { Toast } from "vant";
import { compare } from "@/utils/common";
import { timeCycle } from "@/utils/updateTime";
import {
  getTableBodyData,
  collectionData,
  getTableHeadData,
  upGoods
} from "@/api/index";
export default {
  components: {
    navBar,
    bottomNav
  },
  data() {
    return {
      title: "上架",
      formData: [
        { fColumn: "fInboundOrderNo", fColumnDes: "入库单", fReadOnly: 0 },
        { fColumn: "fContainerCode", fColumnDes: "容器号", fReadOnly: 0 },
        //库位条码，根据库位条码获取到库位的id，然后保存
        // { fColumn: "fStorageID", fColumnDes: "库位", fReadOnly: 0 },
        { fColumn: "fStorageBarCode", fColumnDes: "库位", fReadOnly: 0 }
      ],
      formData1: [
        { fColumn: "fInboundOrderNo", fColumnDes: "入库单", fReadOnly: 0 },
        { fColumn: "fProductBarCode", fColumnDes: "货品条码", fReadOnly: 0 },
        // { fColumn: "fStorageID", fColumnDes: "库位", fReadOnly: 0 },
        { fColumn: "fStorageBarCode", fColumnDes: "库位", fReadOnly: 0 },
        { fColumn: "fProductName", fColumnDes: "货品名称", fReadOnly: 1 },
        { fColumn: "fBatchNo", fColumnDes: "批次号", fReadOnly: 1 },
        {
          fColumn: "fProductionDate",
          fColumnDes: "生产日期",
          fReadOnly: 1
        },
        {
          fColumn: "fExpirationDate",
          fColumnDes: "失效日期",
          fReadOnly: 1
        },
        { fColumn: "fShelfLifeDays", fColumnDes: "有效期", fReadOnly: 1 },
        { fColumn: "fRealReceiptNum", fColumnDes: "实收数量", fReadOnly: 1 },
        { fColumn: "fPutonNum", fColumnDes: "上架数量", fReadOnly: 0 },
        { fColumn: "WaitUpNum", fColumnDes: "待上架", fReadOnly: 1 },
        { fColumn: "fHasPutonNum", fColumnDes: "已上架", fReadOnly: 1 }
      ],
      allForm: {
        fInboundOrderNo: "",
        fContainerCode: "",
        fStorageBarCode: ""
      },
      splitForm: {
        fInboundOrderNo: "",
        fStorageBarCode: "",
        fProductBarCode: "",
        fProductName: "",
        fBatchNo: "",
        fProductionDate: "",
        fExpirationDate: "",
        fShelfLifeDays: "",
        fPutonNum: "",
        WaitUpNum: "",
        fHasPutonNum: ""
      },
      fID: 0,
      // 库位ID
      fStorageID:0,
      Item_tableHead: [],
      userDes: JSON.parse(sessionStorage.getItem("user")).userDes,
      user: JSON.parse(sessionStorage.getItem("user")),
      // 上架数量最大值
      // 默认下为货品的入库数量
      mostNum: "",
      // 拆分上架货品信息
      splitGoodData: {}
    };
  },
  methods: {
    judge(str, value) {
      // console.log(str, value);
      // return;
      if (str == "fInboundOrderNo") {
        return this.getStock(value);
      } else if (str == "fProductBarCode") {
        // 货品条码
        return this.getGoods(value);
      } else if (str == "fPutonNum") {
        // 计算待上架数量
        return this.countWaitNum(value);
      } else if (str == "fStorageBarCode") {
        // 根据库位条码获取对应的库位ID
        return this.getStorageID(value);
      } else {
        return false;
      }
    },
    //输入入库单后，获取当前入库单信息
    async getStock(val) {
      let searchWhere = {
        Computer: "=",
        DataFile: "fInboundOrderNo",
        Value: val
      };
      let res = await getTableBodyData("v_InboundOrder_Mst", [searchWhere]);
      res = JSON.parse(
        decryptDesCbc(res.qureyDataResult, String(this.userDes))
      );
      let data;
      if (res.State) {
        if (res.Data == "[]") {
          Toast("该单号不存在，请确认单号是否正确");
          return;
        }
        data = JSON.parse(res.Data)[0];
      } else {
        Toast(res.Message);
        return;
      }
      this.fID = data.fID;
      console.log(data);
    },
    // 根据库位条码获取对应的库位ID
    async getStorageID(v) {
      let searchWhere = {
        Computer: "=",
        DataFile: "fStorageBarCode",
        Value: v
      };
      let res = await getTableBodyData("v_Storage_Item", [searchWhere]);
      res = JSON.parse(
        decryptDesCbc(res.qureyDataResult, String(this.userDes))
      );
      let data
      if (res.State) {
        if (res.Data == "[]") {
          Toast("该库位条码不存在，请确认是否正确");
          return;
        }
        data = JSON.parse(res.Data)[0];
      } else {
        Toast(res.Message);
        return;
      }
      console.log(data)
      this.fStorageID=data.fID
    },
    // 整箱上架
    async allUpData() {
      // console.log("整箱上架");
      // 先根据容器号获取到入库单相应的商品
      // fContainerCode
      // console.log(this.allForm)
      // console.log(this.allForm);
      if (this.allForm.fInboundOrderNo == "") {
        Toast("请输入入库单号");
        return;
      }
      if (this.allForm.fContainerCode == "") {
        Toast("请输入容器号");
        return;
      }
      if (this.allForm.fStorageBarCode == "") {
        Toast("请输入库位");
        return;
      }
      // 根据容器号获取相应的商品信息
      let goodsRes = await getTableBodyData("v_InboundOrder_Item", [
        {
          Computer: "=",
          DataFile: "fMstID",
          Value: this.fID
        },
        {
          Computer: "=",
          DataFile: "fContainerCode",
          Value: this.allForm.fContainerCode
        }
      ]);
      goodsRes = JSON.parse(
        decryptDesCbc(goodsRes.qureyDataResult, String(this.userDes))
      );
      console.log(goodsRes);
      let goodsData;
      if (goodsRes.State) {
        if (goodsRes.Data == "[]") {
          Toast("该容器号不存在，请确认容器号是否正确");
          return;
        }
        goodsData = JSON.parse(goodsRes.Data)[0];
      } else {
        Toast(goodsRes.Message);
        return;
      }
      // let goodsData = goodsRes[0];
      for (const key in goodsData) {
        if (JSON.stringify(goodsData[key]).indexOf("/Date") != -1) {
          goodsData[key] = timeCycle(goodsData[key]);
        }
      }
      //获取到商品信息后更改商品的库位，状态已上架
      goodsData.fStorageID = this.fStorageID;
      goodsData.fItemState = 4;
      goodsData.fPutonNum = goodsData.fRealReceiptNum;
      goodsData.fHasPutonNum = goodsData.fRealReceiptNum;
      let upData = await upGoods([
        {
          TableName: "t_InboundOrder_Item",
          updateData: [goodsData],
          headData: this.Item_tableHead
        }
      ]);
      // console.log(upData)
      upData = JSON.parse(
        decryptDesCbc(upData.saveStockDataResult, String(this.userDes))
      );
      // console.log(upData);
      if (upData.state) {
        Toast.success("上架完成");
        for (const key in this.allForm) {
          this.allForm[key] = "";
        }
        // window.location.reload()
      } else {
        Toast(upData.errstr);
      }
    },
    // 获取子表表格表头
    async getItemTableHead() {
      let res = await getTableHeadData("t_InboundOrder_Item");
      res = JSON.parse(
        decryptDesCbc(res.getInterfaceEntityResult, String(this.userDes))
      );
      console.log(res);
      if (res.State) {
        console.log(res.lstRet);
        this.Item_tableHead = res.lstRet.sort(compare);
        // console.log(this.Item_tableHead);
        // this.tableHead=this.Item_tableHead
      } else {
        this.$message.error(res.Message);
      }
    },
    //拆分上架
    //输入货品条码后，获取货品信息
    async getGoods(v) {
      // console.log(0);
      // console.log(v);
      if (this.splitForm.fInboundOrderNo == "") {
        Toast("请先输入入库单号");
        return;
      }
      let goodsRes = await getTableBodyData("v_InboundOrder_Item", [
        {
          Computer: "=",
          DataFile: "fMstID",
          Value: this.fID
        },
        {
          Computer: "=",
          DataFile: "fProductBarCode",
          Value: v
        }
      ]);
      goodsRes = JSON.parse(
        decryptDesCbc(goodsRes.qureyDataResult, String(this.user.userDes))
      );
      console.log(goodsRes);
      let data = [];
      if (goodsRes.State) {
        data = JSON.parse(goodsRes.Data)[0];
      }

      for (const key in data) {
        if (JSON.stringify(data[key]).indexOf("/Date") != -1) {
          data[key] = timeCycle(data[key]);
        }
      }
      console.log(data);
      this.formData1.forEach(item => {
        for (const key in data) {
          if (item.fColumn == key) {
            this.splitForm[key] = data[key];
          }
        }
      });
      this.splitGoodData = data;
      // 上架数量 = 实收数量 - 已上架数量
      this.splitForm.fPutonNum = data.fRealReceiptNum - data.fHasPutonNum;
      // 点击加号时限制最大数量
      this.mostNum = data.fRealReceiptNum - data.fHasPutonNum;
      // 已上架数量
      this.splitForm.fHasPutonNum = data.fHasPutonNum;
      // 待上架数量 = 实收数量 - 已上架数量
      this.splitForm.WaitUpNum =
        parseInt(this.splitForm.fRealReceiptNum) -
        parseInt(this.splitForm.fHasPutonNum);
      // console.log(this.splitForm);
    },
    // 拆分上架
    async splitUpData() {
      console.log("拆分上架");
      console.log(this.splitGoodData, this.splitForm);
      this.splitGoodData.fPutonNum = this.splitForm.fPutonNum;
      this.splitGoodData.fStorageID = this.fStorageID;
      this.splitGoodData.fItemState = 4;
      // 已上架数量
      // this.splitGoodData.fHasPutonNum =
      //   this.splitForm.fHasPutonNum + this.splitForm.fPutonNum;
      let res = await upGoods([
        {
          TableName: "t_InboundOrder_Item",
          updateData: [this.splitGoodData],
          headData: this.Item_tableHead
        }
      ]);
      res = JSON.parse(
        decryptDesCbc(res.saveStockDataResult, String(this.user.userDes))
      );
      if (res.state) {
        Toast.success("上架完成");
        for (const key in this.splitForm) {
          this.splitForm[key] = "";
        }
      } else {
        Toast(res.errstr);
      }
    },
    // 上架数量增加
    addNum(v) {
      // console.log(v, "add");
      // console.log(this.splitForm[v]);
      if (this.splitForm[v]) {
        if (this.splitForm[v] < this.mostNum) {
          this.splitForm[v]++;
          // this.splitForm.WaitUpNum =
          //   parseInt(this.splitForm.fRealReceiptNum) -
          //   parseInt(this.splitForm.fPutonNum) -
          //   parseInt(this.splitForm.fHasPutonNum);
        } else {
          Toast("数量超出实收数量啦！");
        }
      }
    },
    // 上架数量减少
    reduceNum(v) {
      // console.log(v, "reduce");
      if (this.splitForm[v]) {
        if (this.splitForm[v] > 0) {
          this.splitForm[v]--;
          // this.splitForm.WaitUpNum =
          //   parseInt(this.splitForm.fRealReceiptNum) -
          //   parseInt(this.splitForm.fPutonNum) -
          //   parseInt(this.splitForm.fHasPutonNum);
        } else {
          Toast("数量不能少于0");
        }
      }
    },
    // 验证上架数量，不能超出待上架数量，不能少于1
    countWaitNum(v) {
      if (v > this.mostNum) {
        Toast("数量不能超出待上架数量！");
        this.splitForm.fPutonNum = this.mostNum;
      } else if (v <= 0) {
        Toast("数量不能少于1");
        this.splitForm.fPutonNum = 1;
      }
    }
  },
  created() {
    this.getItemTableHead();
    // this.creatStockInfo();
  }
};
</script>

<style scoped>
</style>