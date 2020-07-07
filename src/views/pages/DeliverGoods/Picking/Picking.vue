<template>
  <div style="padding-bottom:77px">
    <nav-bar :title="title"></nav-bar>
    <van-tabs>
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
        <bottom-nav
          :title="'确认'"
          :titleRight="'返回'"
          @onSubmit="standardSubmit"
          @resetData="resetStandar"
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
        <el-table :data="tableData" style="width: 100%">
          <el-table-column
            v-for="(item,i) in tableHead"
            :key="i"
            :prop="item.fColumn"
            :label="item.fColumnDes"
            :width="columnWidth"
          ></el-table-column>
        </el-table>
        <bottom-nav
          :title="'拣货完成'"
          :titleRight="'取消拣货'"
          @onSubmit="stockSubmit"
          @resetData="resetStock"
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
      title: "拣货",
      value: "",
      //   拣货操作数据
      standardData: [
        { fColumn: "fOutboundOrderNo", fColumnDes: "出库单号", fReadOnly: 0 },
        { fColumn: "fCustomerName", fColumnDes: "客户", fReadOnly: 1 },
        { fColumn: "fMstStateName", fColumnDes: "打印状态", fReadOnly: 1 },
         { fColumn: "fProductBarCode", fColumnDes: "货品条码", fReadOnly: 0 },
         { fColumn: "fProductName", fColumnDes: "货品名称", fReadOnly: 1 },
        { fColumn: "fOutboundNum", fColumnDes: "出库数量", fReadOnly: 1 },
        { fColumn: "fRealOutboundNum", fColumnDes: "实出数量", fReadOnly: 0 },
        {
          fColumn: "fAreadyOutboundNum",
          fColumnDes: "已出库数量",
          fReadOnly: 1
        }
        //   { fColumn:'fProductName', fColumnDes:'货品名称', fReadOnly:1 },
        //   { fColumn:'fStockType', fColumnDes:'库存类型', fReadOnly:1 },
        //   { fColumn:'fBatchNo', fColumnDes:'批次', fReadOnly:1},
        //   { fColumn:'fProductionDate', fColumnDes:'生产日期', fReadOnly:1},
        //   { fColumn:'fExpirationDate', fColumnDes:'失效日期', fReadOnly:1},
      ],
      standardForm: {
        fCustomerName: "",
        fOutboundOrderNo: "",
        fOutboundNum:'',
        fRealOutboundNum:''
      },
      // 拣货详情数据
      stockData: [
        { fColumn: "fOutboundOrderNo", fColumnDes: "出库单号", fReadOnly: 1 },
        { fColumn: "fJianUser", fColumnDes: "拣货员", fReadOnly: 1 }
      ],
      stockForm: {},
      //拣货详情表格数据
      tableData: [],
      columnWidth: 120,
      tableHead: [
        { fColumn: "fProductName", fColumnDes: "货品名称", fReadOnly: 1 },
        { fColumn: "fProductBarCode", fColumnDes: "货品条码", fReadOnly: 1 },
        { fColumn: "fBatchNo", fColumnDes: "批次号", fReadOnly: 1 },
        { fColumn: "fInboundNum", fColumnDes: "入库数量", fReadOnly: 1 },
        { fColumn: "fRealReceiptNum", fColumnDes: "实收数量", fReadOnly: 1 },
        { fColumn: "fCollectNum", fColumnDes: "待收数量", fReadOnly: 1 }
      ],
      user: JSON.parse(sessionStorage.getItem("user"))
    };
  },
  methods: {
    judge(str, value) {
      // console.log(str, value);
      // 入库单号
      if (str == "fOutboundOrderNo") {
        return this.getStock(value);
      }
      else if (str == "fProductBarCode") {
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
      // console.log(res)
      // return
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
      // this.Mst_HeadData = data;
      console.log(this.standardForm);
    },
    async getGoods(v){
      let goodsRes =  await getTableBodyData('v_OutboundOrder_Item',[
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
      ])
      goodsRes = JSON.parse(
        decryptDesCbc(goodsRes.qureyDataResult,String(this.user.userDes))
      )
      let goodsData
      if(goodsRes.State){
        if(goodsRes.Data=='[]'){
          Toast("该货品条码不存在，请确认货品条码是否正确");
          return
        }
        goodsData = JSON.parse(goodsRes.Data)[0]
      }else{
        Toast(res.Message);
        return
      }
      for(const key in goodsData){
        if(JSON.stringify(goodsData[key]).indexOf("/Date")!=-1){
          goodsData[key] = timeCycle(goodsData[key]);
        }
      }
      console.log(goodsData)
    },
    //   标准移库
    standardSubmit() {
      console.log("标准移库");
      let a = this.standardForm.Ostock;
      let pattern = /^\d{6}$/;
      console.log(a);
      console.log(pattern.test(a));
    },
    // 库位移库
    stockSubmit() {
      console.log("库位移库");
    },
    // 清空标准移库
    resetStandar() {
      console.log("清空标准移库数据");
      this.standardForm = {};
    },
    // 清空库位移库
    resetStock() {
      console.log("清空库位移库");
    }
  }
};
</script>

<style>
</style>