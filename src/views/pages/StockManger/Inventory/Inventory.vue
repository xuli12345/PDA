<template>
  <div style="padding-bottom:77px">
    <nav-bar :title="title"></nav-bar>
    <van-tabs v-model="active">
      <van-tab title="盘点操作">
        <template v-for="(item,i) in standardData">
          <van-cell-group :key="i">
            <van-field
              v-model="standardForm[item.fColumn]"
              :name="item.fColumn"
              :label="item.fColumnDes"
              :placeholder="item.fReadOnly==0?'点击输入/扫描':''"
              @change="judge(item.fColumn,standardForm[item.fColumn])"
              clearable
              :disabled="item.fReadOnly==1?true:false"
            >
              <!-- <template v-if="item.fColumn=='moveNum'" #button>
                <van-button
                  @click="addNum(item.fColumn)"
                  size="mini"
                  type="primary"
                  color="#1989fa"
                >
                  <van-icon class-prefix="iconfont" name="zengjia" color="#ffffff" />
                </van-button>
                <van-button
                  @click="reduceNum(item.fColumn)"
                  size="mini"
                  type="primary"
                  color="#1989fa"
                >
                  <van-icon class-prefix="iconfont" name="jianshao" color="#ffffff" />
                </van-button>
              </template>-->
            </van-field>
          </van-cell-group>
        </template>
      </van-tab>
      <van-tab title="盘点明细">
        <template v-for="(item,i) in stockData">
          <van-cell-group :key="i">
            <van-field
              v-model="stockForm[item.fColumn]"
              :name="item.fColumn"
              :label="item.fColumnDes"
              disabled
            ></van-field>
          </van-cell-group>
        </template>
        <hr />
        <el-table :data="tableData" style="width: 100%">
          <el-table-column
            v-for="(item,i) in tableHead"
            :key="i"
            :prop="item.fColumn"
            :label="item.fColumnDes"
            :width="columnWidth"
          ></el-table-column>
        </el-table>
      </van-tab>
    </van-tabs>
    <bottom-nav
      :title="titleLeft"
      :titleRight="titleRight"
      @onSubmit="onSubmit"
      @resetData="resetData"
    ></bottom-nav>
  </div>
</template>

<script>
import navBar from "@/components/navBar.vue";
import bottomNav from "./bottomNav";

import {
  getTableBodyData,
  collectionData,
  getTableHeadData
} from "@/api/index";
import { decryptDesCbc } from "@/utils/cryptoJs.js"; //解密
import { compare } from "@/utils/common.js";
import { timeCycle } from "@/utils/updateTime.js"; //格式化时间
import { Notify, Toast, Dialog } from "vant";
export default {
  components: {
    navBar,
    bottomNav
  },
  data() {
    return {
      active: 0,
      title: "盘点",
      //   底部按钮左边文字
      titleLeft: "开始盘点",
      titleRight: "返回",
      value: "",
      //  form表单显示数据
      standardData: [
        { fColumn: "fCheckOrderNO", fColumnDes: "盘点单号", fReadOnly: 0 },
        // { fColumn: "fCheckID", fColumnDes: "盘点人", fReadOnly: 1 },
        { fColumn: "fCheckName", fColumnDes: "盘点人", fReadOnly: 1 },
        { fColumn: "fProductBarCode", fColumnDes: "货品条码", fReadOnly: 0 },
        { fColumn: "fProductName", fColumnDes: "货品名称", fReadOnly: 1 },
        { fColumn: "fStockNum", fColumnDes: "库存数量", fReadOnly: 1 },
        { fColumn: "fCheckNum", fColumnDes: "盘点数量", fReadOnly: 0 },
        { fColumn: "fDifferenceNum", fColumnDes: "差异数量", fReadOnly: 1 }
      ],
      //   form表单数据
      standardForm: {
        fCheckOrderNO: "",
        fCheckID: "",
        fCheckName: "",
        fProductBarCode: "",
        fProductName: "",
        fStockNum: "",
        fCheckNum: "",
        fDifferenceNum: ""
      },
      //扫描盘点单获取到的主表数据
      Mst_HeadData: {},
      // 主表表头
      Mst_tableHead: [],
      // 扫描每个货品获取到的数据
      Item_Data: {},
      // 字表表头数据
      Item_tableHead: [],
      //   盘点明细数据
      stockData: [
        { fColumn: "fCheckOrderNO", fColumnDes: "盘点单号", fReadOnly: 0 },
        { fColumn: "fCheckID", fColumnDes: "盘点人ID", fReadOnly: 1 }
      ],
      stockForm: {
        fCheckOrderNO: "",
        fCheckID: ""
      },
      //   盘点明细表格数据
      tableData: [],
      tableHead: [
        { fColumn: "fCheckID", fColumnDes: "盘点人ID", fReadOnly: 1 },
        { fColumn: "fProductBarCode", fColumnDes: "货品条码", fReadOnly: 0 },
        { fColumn: "fProductName", fColumnDes: "货品名称", fReadOnly: 1 },
        { fColumn: "fStockNum", fColumnDes: "库存数量", fReadOnly: 1 },
        { fColumn: "fCheckNum", fColumnDes: "盘点数量", fReadOnly: 0 },
        { fColumn: "fDifferenceNum", fColumnDes: "差异数量", fReadOnly: 1 }
      ],
      columnWidth: 120,
      fID: null,
      user: JSON.parse(sessionStorage.getItem("user"))
    };
  },
  methods: {
    judge(str, value) {
      // console.log(str, value);
      // 盘点单号
      if (str == "fCheckOrderNO") {
        return this.getStock(value);
      }
      if (str == "fProductBarCode") {
        // 货品条码
        return this.getGoods(value);
      } else if (str == "fCheckNum") {
        // 盘点数量输入后，计算差异数量
        return this.calculation(value);
      } else {
        return false;
      }
    },
    // 根据盘点单号获取盘点单信息
    async getStock(val) {
      let searchWhere = {
        Computer: "=",
        DataFile: "fCheckOrderNO",
        Value: val
      };
      let res = await getTableBodyData("v_CheckOrder_Mst", [searchWhere]);
      res = JSON.parse(
        decryptDesCbc(res.qureyDataResult, String(this.user.userDes))
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
      for (const key in data) {
        if (JSON.stringify(data[key]).indexOf("/Date") != -1) {
          data[key] = timeCycle(data[key]);
        }
      }
      //   console.log(data);
      this.stockForm.fCheckOrderNO = data.fCheckOrderNO;
      // this.stockData.fCheckOrderNO = data.fCheckOrderNO;
      this.stockForm.fCheckID = this.user.userId;
      //     this.stockForm.fCheckName=data.fCheckName
      // this.ruleForm = data;
      //主表数据
      this.Mst_HeadData = data;
    },
    // 根据货品条码，获取盘点单下的货品信息
    async getGoods(v) {
      let goodsRes = await getTableBodyData("v_CheckOrder_Item", [
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
      let goodsData;
      if (goodsRes.State) {
        if (goodsRes.Data == "[]") {
          Toast("该货品条码不存在，请确认货品条码是否正确");
          return;
        }
        goodsData = JSON.parse(goodsRes.Data)[0];
      } else {
        Toast(res.Message);
        return;
      }
      for (const key in goodsData) {
        if (JSON.stringify(goodsData[key]).indexOf("/Date") != -1) {
          goodsData[key] = timeCycle(goodsData[key]);
        }
      }
      for (const key1 in goodsData) {
        for (const key2 in this.standardForm) {
          if (key1 == key2) {
            this.standardForm[key2] = goodsData[key1];
          }
        }
      }
      console.log(goodsData);
      this.Item_Data = goodsData;
    },
    // 上架数量增加
    addNum(v) {
      // console.log(v, "add");
      console.log(this.splitForm[v]);
      if (this.splitForm[v]) {
        this.splitForm[v]++;
        console.log("+");
      }
    },
    // 上架数量减少
    reduceNum(v) {
      // console.log(v, "reduce");
      if (this.splitForm[v]) {
        if (this.splitForm[v] > 0) {
          this.splitForm[v]--;
          console.log("-");
        } else {
          Toast("数量不能少于0");
        }
      }
    },
    // 开始盘点 完成盘点
    onSubmit() {
      if (this.titleLeft == "开始盘点") {
        console.log("开始盘点");
        this.titleLeft = "完成盘点";
        this.titleRight = "下一个货品";
        console.log(this.Mst_HeadData);
      } else if (this.titleLeft == "完成盘点") {
        console.log("完成盘点");
        Dialog.confirm({
          title: "提示",
          message: "确认提交吗"
        })
          .then(() => {
            // comfirm = true;
            this.sendData();
          })
          .catch(() => {
            // on cancel
          });
      }
    },
    // 完成盘点，提交数据
    async sendData() {
      console.log("提交数据");

      console.log(this.tableData);
      // return
      let res = await collectionData([
        {
          TableName: "t_CheckOrder_Mst",
          updateData: [this.Mst_HeadData],
          headData: this.Mst_tableHead
        },
        {
          TableName: "t_CheckOrder_Item",
          updateData: this.tableData,
          headData: this.Item_tableHead
        }
      ]);
      res = JSON.parse(
        decryptDesCbc(res.saveDataResult, String(this.user.userDes))
      );
      console.log(res);
      if (res.state) {
        Toast.success("盘点完成");
        // 清空数据
        this.tableData = [];
        for (const key in this.standardForm) {
          if (key != "fCheckName" && key != "fCheckID") {
            this.standardForm[key] = "";
          }
        }
        for (const key1 in this.stockForm) {
            this.stockForm[key1] = "";
        }

      } else {
        Toast(res.errstr);
      }
    },
    // 返回 盘点下一个商品
    resetData() {
      if (this.titleRight == "返回") {
        this.$router.back();
        // console.log('路由跳转')
        try {
          setTimeout(() => {
            let path = window.location.hash.slice(1);
            this.$router.replace(path);
          }, 10);
          return false;
        } catch (e) {}
      } else if (this.titleRight == "下一个货品") {
        // console.log("下一个货品");
        // 盘点是否输入了信息
        if (this.standardForm.fCheckOrderNO == "") {
          Toast("请输入盘点单号");
          return;
        }
        if (this.standardForm.fProductBarCode == "") {
          Toast("请输入货品条码");
          return;
        }
        if (this.standardForm.fCheckNum == "") {
          Toast("请输入盘点数量");
          return;
        }
        // 将当前表单输入的数据更改Item_Data里面的相应的数据
        for (const key in this.standardForm) {
          for (const child in this.Item_Data) {
            if (key == child) {
              this.Item_Data[child] = this.standardForm[key];
            }
          }
        }
        this.Item_Data.fCheckID = this.user.userId;
        console.log(this.Item_Data);
        this.tableData.push(this.Item_Data);
        for (const key in this.standardForm) {
          if (
            key != "fCheckOrderNO" &&
            key != "fCheckName" &&
            key != "fCheckID"
          ) {
            this.standardForm[key] = "";
          }
        }
        Toast("当前货品盘点完成，请继续盘点下一个货品");
      }
    },
    // 输入盘点数量后，计算差异数量
    calculation() {
      console.log("计算差异数量");
      let diff = this.standardForm.fStockNum - this.standardForm.fCheckNum;
      this.standardForm.fDifferenceNum = diff;
    },
    //获取主表表格的表头，保存的时候需要用到
    async getTableHead() {
      let res = await getTableHeadData("t_CheckOrder_Mst");
      res = JSON.parse(
        decryptDesCbc(res.getInterfaceEntityResult, String(this.user.userDes))
      );
      if (res.State) {
        this.Mst_tableHead = res.lstRet.sort(compare);
      } else {
        this.$message.error(res.Message);
      }
    },
    // 获取子表表格表头
    async getItemTableHead() {
      let res = await getTableHeadData("t_CheckOrder_Item");
      res = JSON.parse(
        decryptDesCbc(res.getInterfaceEntityResult, String(this.user.userDes))
      );
      console.log(res);
      if (res.State) {
        this.Item_tableHead = res.lstRet.sort(compare);
      } else {
        this.$message.error(res.Message);
      }
    }
  },
  created() {
    this.standardForm.fCheckID = this.user.userId;
    this.standardForm.fCheckName = this.user.username;
    this.getItemTableHead();
    this.getTableHead();
  }
};
</script>

<style scoped>
.moveNum {
  height: 24px;
  line-height: 24px;
  text-align: center;
}
.van-cell::after {
  border-bottom: none;
}
</style>