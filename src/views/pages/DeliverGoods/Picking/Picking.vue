<template>
  <div style="padding-bottom:77px">
    <nav-bar :title="title"></nav-bar>
    <van-tabs v-model="active">
      <van-tab title="拣货操作">
        <template v-for="(item,i) in standardData">
          <van-field
            :key="i"
            v-model="standardForm[item.fColumn]"
            :name="item.fColumn"
            :label="item.fColumnDes"
            :placeholder="item.fReadOnly==0?'点击扫描/输入':''"
            clearable
            :disabled="item.fReadOnly==1?true:false"
            @change="judge(item.fColumn,standardForm[item.fColumn])"
          ></van-field>
        </template>
        <el-table :data="goodsData">
          <el-table-column type="index" width="50" label="序号"></el-table-column>
          <el-table-column
            v-for="(item,i) in goodsDataHead"
            :key="i"
            :prop="item.fColumn"
            :label="item.fColumnDes"
            width="120"
          ></el-table-column>
          <el-table-column fixed="right" label="操作" width="50">
            <template slot-scope="scope">
              <el-button
                @click="handleClick(scope.row,scope.$index)"
                :disabled="isBeginPick"
                type="text"
              >拣货</el-button>
            </template>
          </el-table-column>
        </el-table>
        <bottom-nav
          :title="titleLeft"
          :titleRight="titleRight"
          @onSubmit="stockSubmit"
          @resetData="resetStock"
        ></bottom-nav>
      </van-tab>
      <van-tab title="拣货详情">
        <van-cell-group>
          <template v-for="(item,i) in stockData">
            <van-field
              :key="i"
              v-model="stockForm[item.fColumn]"
              :name="item.fColumn"
              :label="item.fColumnDes"
              :placeholder="item.fReadOnly==0?'点击扫描/输入':''"
              clearable
              :disabled="item.fReadOnly==1?true:false"
            ></van-field>
          </template>
        </van-cell-group>
        <bottom-nav
          :title="'确认'"
          :titleRight="'取消拣货'"
          @onSubmit="onConfirm"
          @resetData="cancelPick"
        ></bottom-nav>
      </van-tab>
    </van-tabs>
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
      title: "拣货",
      titleLeft: "开始拣货",
      titleRight: "返回",
      //拣货按钮 是否开始拣货
      isBeginPick: true,
      //   拣货操作数据
      standardData: [
        { fColumn: "fOutboundOrderNo", fColumnDes: "出库单号", fReadOnly: 0 },
        { fColumn: "fCustomerName", fColumnDes: "客户", fReadOnly: 1 },
        { fColumn: "fMstStateName", fColumnDes: "打印状态", fReadOnly: 1 }
      ],
      standardForm: {
        fCustomerName: "",
        fProductName: "",
        fOutboundOrderNo: "",
        fOutboundNum: "",
        fRealOutboundNum: ""
      },
      // 出库单商品信息
      goodsData: [],
      // 出库单商品表格表头信息
      goodsDataHead: [
        { fColumn: "fProductName", fColumnDes: "货品名称", fReadOnly: 1 },
        { fColumn: "fStorageCode", fColumnDes: "库位编码", fReadOnly: 1 },
        { fColumn: "fProductBarCode", fColumnDes: "货品条码", fReadOnly: 1 },
        { fColumn: "fStorageBarCode", fColumnDes: "库位", fReadOnly: 1 },
        { fColumn: "fRealOutboundNum", fColumnDes: "拣货数量", fReadOnly: 0 }
      ],
      // 拣货详情数据
      stockData: [
        { fColumn: "fOutboundOrderNo", fColumnDes: "出库单号", fReadOnly: 1 },
        { fColumn: "fPickUser", fColumnDes: "拣货员", fReadOnly: 1 },
        { fColumn: "fStorageCode", fColumnDes: "库位", fReadOnly: 1 },
        { fColumn: "fStorageCodeC", fColumnDes: "库位", fReadOnly: 0 },
        { fColumn: "fBatchNo", fColumnDes: "批次", fReadOnly: 1 },
        { fColumn: "fBatchNoC", fColumnDes: "批次", fReadOnly: 0 },
        { fColumn: "fOutboundNum", fColumnDes: "货品数量", fReadOnly: 1 },
        { fColumn: "fOutboundBoxNum", fColumnDes: "装箱数量", fReadOnly: 1 },
        { fColumn: "fRealOutboundNum", fColumnDes: "拣货数量", fReadOnly: 0 }
      ],
      stockForm: {
        fOutboundOrderNo: "",
        fPickUser: "",
        fStorageCode: "",
        fStorageCodeC: "",
        fBatchNo: "",
        fBatchNoC: "",
        fOutboundNum: "",
        fOutboundBoxNum: "",
        fRealOutboundNum: ""
      },
      user: JSON.parse(sessionStorage.getItem("user")),
      //扫描出库单获取到的主表数据
      Mst_HeadData: {},
      // 主表表头
      Mst_tableHead: [],
      // 扫描每个货品条码获取到的数据
      Item_Data: {},
      // 字表表头数据
      Item_tableHead: [],
      // 开始拣货时间
      fPickStartDate: null,
      // 结束拣货时间
      fPickEndDate: null,
      // 当前拣货的货品对应商品信息的下标index
      pickIndex: -1
    };
  },
  methods: {
    judge(str, value) {
      // console.log(str, value);
      // 入库单号
      if (str == "fOutboundOrderNo") {
        return this.getStock(value);
      } else if (str == "fProductBarCode") {
        // 货品条码
        return this.getGoods(value);
      }
      //else if (str == "fRealReceiptNum") {
      //   // 计算待收数量
      //   return this.countWaitNum(value);
      // }
      else {
        return false;
      }
    },
    // 根据出库单号获取客户名称
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
      // this.ruleForm = data;
      this.standardForm.fCustomerName = data.fCustomerName;
      //主表数据
      this.Mst_HeadData = data;
      console.log(this.standardForm);
      this.getAllGoods();
    },
    //根据出库单号获取所有货品信息
    async getAllGoods() {
      let res = await getTableBodyData("v_OutboundOrder_Item", [
        {
          Computer: "=",
          DataFile: "fMstID",
          Value: this.fID
        }
      ]);
      res = JSON.parse(
        decryptDesCbc(res.qureyDataResult, String(this.user.userDes))
      );
      let allGoods = [];
      console.log(res);
      if (res.State) {
        allGoods = JSON.parse(res.Data);
      }
      allGoods.forEach(item => {
        for (const key in item) {
          if (JSON.stringify(item[key]).indexOf("/Date") != -1) {
            item[key] = timeCycle(item[key]);
          }
        }
      });
      this.goodsData = allGoods;
      console.log(allGoods);
      console.log(this.goodsData);
    },
    async getGoods(v) {
      let goodsRes = await getTableBodyData("v_OutboundOrder_Item", [
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
      console.log(goodsData);
      this.Item_Data = goodsData;
      for (const key in this.standardForm) {
        for (const child in goodsData) {
          if (key == child) {
            this.standardForm[key] = goodsData[child];
          }
        }
      }
      // 实出数量默认与出库数量一致
      this.standardForm.fRealOutboundNum = this.standardForm.fOutboundNum;
    },
    // 点击拣货跳转到拣货详情
    handleClick(v, i) {
      // console.log(v, i);
      this.pickIndex = i;
      this.active = 1;
      for (const index in this.stockForm) {
        for (const idx in v) {
          if (index == idx) {
            this.stockForm[index] = v[idx];
          }
        }
      }
      this.stockForm.fPickUser = this.user.userId;
    },
    // 点击按钮开始拣货或完成拣货
    stockSubmit() {
      if (this.standardForm.fOutboundOrderNo == "") {
        Toast("请先输入出库单号");
        return;
      }
      if (this.titleLeft == "开始拣货") {
        this.standardData[0].fReadOnly = 1;
        this.isBeginPick = false;
        this.titleLeft = "拣货完成";
        this.fPickStartDate = new Date();
      } else if ((this.titleLeft = "拣货完成")) {
        Dialog.confirm({
          title: "提示",
          message: "是否已经拣货完成"
        })
          .then(() => {
            // comfirm = true;
            this.fPickEndDate = new Date();
            this.sendData();
            this.titleLeft = "开始拣货";
            this.isBeginPick = true;
          })
          .catch(() => {
            // on cancel
          });
      }
    },
    async sendData() {
      console.log("完成拣货");
      this.Mst_HeadData.fPickStartDate = this.fPickStartDate;
      this.Mst_HeadData.fPickEndDate = this.fPickEndDate;
      let res = await collectionData([
        {
          TableName: "t_OutboundOrder_Mst",
          updateData: [this.Mst_HeadData],
          headData: this.Mst_tableHead
        },
        {
          TableName: "t_OutboundOrder_Item",
          updateData: this.goodsData,
          headData: this.Item_tableHead
        }
      ]);
      res = JSON.parse(
        decryptDesCbc(res.saveDataResult, String(this.user.userDes))
      );
      console.log(res);
      if (res.state) {
        Toast.success("拣货完成");
        // 清空数据
        this.goodsData = [];
        for (const key in this.standardForm) {
          this.standardForm[key] = "";
        }
        for (const key in this.stockForm) {
          this.stockForm[key] = "";
        }
      } else {
        Toast(res.errstr);
      }
    },
    // 返回按钮
    resetStock() {
      // console.log(this.isBeginPick === false);
      if (this.isBeginPick) {
        this.$router.back();
        try {
          setTimeout(() => {
            let path = window.location.hash.slice(1);
            this.$router.replace(path);
          }, 10);
          return false;
        } catch (e) {}
      } else {
        Dialog.confirm({
          message: "当前拣货尚未完成，是否确定退出"
        })
          .then(() => {
            this.$router.back();
            try {
              setTimeout(() => {
                let path = window.location.hash.slice(1);
                this.$router.replace(path);
              }, 10);
              return false;
            } catch (e) {}
          })
          .catch(() => {
            return false;
          });
      }
    },
    // 拣货详情确认按钮
    onConfirm() {
      console.log("拣货详情确认");
      this.active = 0;
      // this.pickIndex
      // console.log(this.goodsData)
      let changeData = this.goodsData[this.pickIndex];
      // console.log(changeData);
      this.goodsData[
        this.pickIndex
      ].fRealOutboundNum = this.stockForm.fRealOutboundNum;
      // console.log(this.goodsData[this.pickIndex]);
      let _pickIndex = this.pickIndex;

      this.goodsData[this.pickIndex];
      for (const key in this.goodsData[_pickIndex]) {
        for (const item in this.stockForm) {
          if (key == item) {
            this.goodsData[_pickIndex][key] = this.stockForm[item];
          }
        }
      }
      this.goodsData[_pickIndex].fBatchNo = this.stockForm.fBatchNoC;
      this.goodsData[_pickIndex].fStorageCode = this.stockForm.fStorageCodeC;
      this.goodsData[_pickIndex].fItemState = 3;
      // console.log(this.goodsData[_pickIndex]);
    },
    // 拣货详情取消拣货
    cancelPick() {
      console.log("拣货详情取消拣货");
      this.active = 0;
      for (const key in this.stockForm) {
        this.stockForm[key] = "";
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
      // console.log(res);
      if (res.State) {
        this.Item_tableHead = res.lstRet.sort(compare);
      } else {
        this.$message.error(res.Message);
      }
    }
  },
  created() {
    this.standardForm.fPickUser = this.user.userId;
    this.getItemTableHead();
    this.getTableHead();
  }
};
</script>

<style>
</style>