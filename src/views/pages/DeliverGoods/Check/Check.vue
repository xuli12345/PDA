<template>
  <div class="wrap">
    <nav-bar :title="title"></nav-bar>
    <van-tabs v-model="active">
      <van-tab title="复核操作">
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
            ></van-field>
          </van-cell-group>
        </template>
      </van-tab>
      <van-tab title="复核详情">
        <template v-for="(item,i) in stockData">
          <van-cell-group :key="i">
            <van-field
              v-model="stockForm[item.fColumn]"
              :name="item.fColumn"
              :label="item.fColumnDes"
              disabled
            >
              <template v-if="item.fColumn=='fSumOutboundNumL'" #input>
                <span
                  style="color:#d3c9cc"
                >{{Mst_HeadData.fSumReviewNum}}/{{Mst_HeadData.fSumOutboundNum}}</span>
              </template>
            </van-field>
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
  getTableHeadData,
  saveOutStockData
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
      title: "复核",
      //   底部按钮左边文字
      titleLeft: "开始复核",
      titleRight: "返回",
      value: "",
      //  form表单显示数据
      standardData: [
        { fColumn: "fOutboundOrderNo", fColumnDes: "出库单号", fReadOnly: 0 },
        { fColumn: "fCustomerName", fColumnDes: "客户", fReadOnly: 1 },
        { fColumn: "fContactName", fColumnDes: "收货人", fReadOnly: 1 },
        { fColumn: "fProductBarCode", fColumnDes: "货品条码", fReadOnly: 0 },
        { fColumn: "fBatchNo", fColumnDes: "批次", fReadOnly: 0 },
        // { fColumn: "fContainerCode", fColumnDes: "容器号", fReadOnly: 0 },
        { fColumn: "fProductName", fColumnDes: "货品名称", fReadOnly: 1 },
        { fColumn: "fOutboundNum", fColumnDes: "货品数量", fReadOnly: 1 },
        { fColumn: "fOutboundBoxNum", fColumnDes: "箱数量", fReadOnly: 1 },
        { fColumn: "fRealOutboundNum", fColumnDes: "拣货数量", fReadOnly: 1 },
        { fColumn: "fReviewNum", fColumnDes: "复核数量", fReadOnly: 0 }
      ],
      //   form表单数据
      standardForm: {
        fOutboundOrderNo: "",
        fCustomerName: "",
        fContactName: "",
        fProductBarCode: "",
        // fContainerCode: "",
        fBatchNo: "",
        fProductName: "",
        fOutboundNum: "",
        fOutboundBoxNum: "",
        fRealOutboundNum: "",
        fReviewNum: ""
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
        { fColumn: "fOutboundOrderNo", fColumnDes: "出库单号", fReadOnly: 1 },
        { fColumn: "fContactName", fColumnDes: "收货人", fReadOnly: 1 },
        { fColumn: "fReviewUser", fColumnDes: "复核人", fReadOnly: 1 },
        { fColumn: "fSumOutboundNumL", fColumnDes: "复核数量", fReadOnly: 1 }
      ],
      stockForm: {
        fOutboundOrderNo: "",
        fContactName: "",
        fReviewUser: ""
      },
      //   盘点明细表格数据
      tableData: [],
      // 盘点明细表头
      tableHead: [
        { fColumn: "fBatchNo", fColumnDes: "批次", fReadOnly: 0 },
        { fColumn: "fContainerCode", fColumnDes: "容器号", fReadOnly: 0 },
        { fColumn: "fProductName", fColumnDes: "货品名称", fReadOnly: 1 },
        { fColumn: "fRealOutboundNum", fColumnDes: "拣货数量", fReadOnly: 1 },
        { fColumn: "fReviewNum", fColumnDes: "复核数量", fReadOnly: 0 }
      ],
      columnWidth: 120,
      fID: null,
      user: JSON.parse(sessionStorage.getItem("user")),
      // 开始复核时间
      fReviewStartDate: "",
      // 完成复核时间
      fReviewFinishDate: ""
    };
  },
  methods: {
    judge(str, value) {
      // console.log(str, value);
      // 出库单号
      if (str == "fOutboundOrderNo") {
        return this.getStock(value);
      }
      if (str == "fProductBarCode") {
        // 货品条码
        return this.getGoods(str, value);
      } else if (str == "fBatchNo") {
        // 批次号
        return this.getGoods(str, value);
      }
      // else if (str == "fContainerCode") {
      //   // 批次号
      //   return this.getGoods(str, value);
      // }
      else {
        return false;
      }
    },
    // 根据出库单号获取出库单信息
    async getStock(val) {
      let searchWhere = {
        Computer: "=",
        DataFile: "fOutboundOrderNo",
        Value: val
      };
      let res = await getTableBodyData("v_OutboundOrder_Mst", [searchWhere]);
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
      // console.log(data);
      this.stockForm.fOutboundOrderNo = data.fOutboundOrderNo;
      this.stockForm.fReviewUser = this.user.userId;

      for (const key1 in data) {
        for (const key2 in this.standardForm) {
          if (key1 == key2) {
            this.standardForm[key2] = data[key1];
          }
        }
      }
      for (const key1 in data) {
        for (const key2 in this.stockForm) {
          if (key1 == key2) {
            this.stockForm[key2] = data[key1];
          }
        }
      }
      this.standardForm.fReviewUser = this.user.userId;
      this.stockForm.fReviewUser = this.user.userId;
      //主表数据
      this.Mst_HeadData = data;
    },
    // 根据货品条码/容器号/批次号，获取盘点单下的货品信息
    async getGoods(str, v) {
      console.log(str, v);
      let goodsRes = await getTableBodyData("v_OutboundOrder_Item", [
        {
          Computer: "=",
          DataFile: "fMstID",
          Value: this.fID
        },
        // {
        //   Computer: "=",
        //   DataFile: "fBatchNo",
        //   Value: this.standardForm.fBatchNo
        // },
        {
          Computer: "=",
          DataFile: str,
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
        Toast(goodsRes.Message);
        return;
      }
      for (const key in goodsData) {
        if (JSON.stringify(goodsData[key]).indexOf("/Date") != -1) {
          goodsData[key] = timeCycle(goodsData[key]);
        }
      }
      for (const key1 in goodsData) {
        for (const key2 in this.standardForm) {
          if (key2 != "fReviewUser" && key1 == key2) {
            this.standardForm[key2] = goodsData[key1];
          }
        }
      }
      console.log(goodsData);
      this.Item_Data = goodsData;
    },
    // 开始复核 完成复核
    onSubmit() {
      if (this.standardForm.fOutboundOrderNo == "") {
        Toast("请先输入出库单号");
        return;
      }
      if (this.titleLeft == "开始复核") {
        // console.log("开始盘点");
        this.standardData[0].fReadOnly = 1;
        this.titleLeft = "完成复核";
        this.titleRight = "添加";
        this.fReviewStartDate = new Date();
        // console.log(this.Mst_HeadData);
      } else if (this.titleLeft == "完成复核") {
        Dialog.confirm({
          title: "提示",
          message: "确认提交吗"
        })
          .then(() => {
            this.fReviewFinishDate = new Date();
            this.sendData();
            this.standardData[0].fReadOnly = 0;
            this.titleLeft = "开始复核";
            this.titleRight = "返回";
          })
          .catch(() => {
            // on cancel
          });
      }
    },
    // 完成复核，提交数据
    async sendData() {
      this.Mst_HeadData.fReviewStartDate = this.fReviewStartDate;
      this.Mst_HeadData.fReviewFinishDate = this.fReviewFinishDate;
      // delete this.Mst_tableHead.fRemark
      this.Mst_tableHead.forEach((item,i)=>{
        if(item.fColumn=='fRemark'){
          console.log('shan')
          this.Mst_tableHead.splice(i,1)
        }
      })
      console.log(this.Mst_tableHead)
      console.log(this.Item_tableHead)
      let res = await saveOutStockData([
        {
          TableName: "t_OutboundOrder_Mst",
          updateData: [this.Mst_HeadData],
          headData: this.Mst_tableHead
        },
        {
          TableName: "t_OutboundOrder_Item",
          // IdentityColumn:'fID',
          updateData: this.tableData,
          // insertData:this.tableData,
          headData: this.Item_tableHead
        }
      ]);
      // console.log(res)
      res = JSON.parse(
        decryptDesCbc(res.saveOutStockDataResult, String(this.user.userDes))
      );
      console.log(res);
      if (res.state) {
        Toast.success("复核完成");
        // 清空数据
        this.tableData = [];
        for (const key in this.standardForm) {
          this.standardForm[key] = "";
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
      } else if (this.titleRight == "添加") {
        // 是否输入了信息
        if (this.standardForm.fProductBarCode == "") {
          Toast("请输入货品条码");
          return;
        }
        if (this.standardForm.fReviewNum == "") {
          Toast("请输入复核数量");
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
        this.Item_Data.fReviewUser = this.user.userId;
        this.Item_Data.fItemState = 4;
        this.tableData.push(this.Item_Data);
        for (const key in this.standardForm) {
          if (
            key != "fOutboundOrderNo" &&
            key != "fCustomerName" &&
            key != "fReviewUser"
          ) {
            this.standardForm[key] = "";
          }
        }
        Toast("当前货品复核完成，请复核下一个货品");
      }
    },
    //获取主表表格的表头，保存的时候需要用到
    async getTableHead() {
      let res = await getTableHeadData("t_OutboundOrder_Mst");
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
      let res = await getTableHeadData("t_OutboundOrder_Item");
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
    this.getItemTableHead();
    this.getTableHead();
  }
};
</script>

<style scoped>
.wrap {
  padding-bottom: 77px;
}
.moveNum {
  height: 24px;
  line-height: 24px;
  text-align: center;
}
.van-cell::after {
  border-bottom: none;
}
</style>