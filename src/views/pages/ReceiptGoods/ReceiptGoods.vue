<template>
  <div style="padding-bottom:77px">
    <nav-bar :title="title"></nav-bar>
    <van-tabs v-model="active">
      <van-tab title="入库扫描">
        <van-form
          @submit="onSubmitGoods"
          :submit-on-enter="false"
          scroll-to-error
          validate-first
          ref="vanForm"
        >
          <template v-for="(item,index) in formData1">
            <!-- 选择生产日期 -->
            <template v-if="item.fColumn=='fProductionDate'">
              <van-field
                clickable
                :key="index"
                v-model="ruleForm[item.fColumn]"
                :name="item.fColumn"
                :label="item.fColumnDes"
                :placeholder="'点击选择'+item.fColumnDes"
                clearable
                @click="showPicker=true"
                :readonly="item.fReadOnly==1?true:false"
              />
              <van-popup v-model="showPicker" position="bottom" :key="item.fColumn">
                <van-datetime-picker
                  v-model="currentTime"
                  type="date"
                  @confirm="onConfirm(item.fColumn)"
                  @cancel="showPicker = false"
                />
              </van-popup>
            </template>
            <!-- 选择失效日期 -->
            <template v-else-if="item.fColumn=='fExpirationDate'">
              <van-field
                clickable
                :key="index"
                v-model="ruleForm[item.fColumn]"
                :name="item.fColumn"
                :label="item.fColumnDes"
                :placeholder="'点击选择'+item.fColumnDes"
                clearable
                @click="showPicker2=true"
                :readonly="item.fReadOnly==1?true:false"
              />
              <van-popup v-model="showPicker2" position="bottom" :key="item.fColumn">
                <van-datetime-picker
                  v-model="currentTime2"
                  type="date"
                  @confirm="onConfirm2(item.fColumn)"
                  @cancel="showPicker2 = false"
                />
              </van-popup>
            </template>
            <!-- 选择有效期 -->
            <template v-else-if="item.fColumn=='fShelfLifeDays'">
              <van-field
                clickable
                :key="index"
                v-model="ruleForm[item.fColumn]"
                :name="item.fColumn"
                :label="item.fColumnDes"
                :placeholder="'点击选择'+item.fColumnDes"
                clearable
                @click="showPicker3=true"
                :readonly="item.fReadOnly==1?true:false"
              />
              <van-popup v-model="showPicker3" position="bottom" :key="item.fColumn">
                <van-datetime-picker
                  v-model="currentTime3"
                  type="date"
                  @confirm="onConfirm3(item.fColumn)"
                  @cancel="showPicker3 = false"
                />
              </van-popup>
            </template>
            <van-field
              v-else
              :key="index"
              v-model="ruleForm[item.fColumn]"
              :name="item.fColumn"
              :label="item.fColumnDes"
              :placeholder="item.fReadOnly==0?'点击扫描/输入':''"
              clearable
              @change="judge(item.fColumn,ruleForm[item.fColumn])"
              :readonly="item.fReadOnly==1?true:false"
              :rules="checkInput(item.fColumn)"
            />
            <!-- '请输入'+ -->
            <!-- :rules="[{ pattern, message: '请输入数字' }]" -->
          </template>
          <bottom-nav :title="'货品提交'" @onSubmit="onClickSubmit"></bottom-nav>
        </van-form>
      </van-tab>
      <van-tab title="批量提交">
        <div class="goodsData">货品明细</div>
        <div class="goodsTable">
          <el-table :data="tableData" style="width: 100%">
            <el-table-column
              v-for="(item,i) in tableHead"
              :key="i"
              :prop="item.fColumn"
              :label="item.fColumnDes"
              :width="columnWidth"
            >
              <!-- <template slot-scope="scope">
                  <el-input
                    v-model="scope.row[item.fColumn]"
                    :disabled="item.fColumn=='fRealReceiptNum'?false:true"
                  ></el-input>
              </template>-->
            </el-table-column>
          </el-table>
        </div>
        <bottom-nav :title="'确认收货'" @onSubmit="onSubmit"></bottom-nav>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script>
import navBar from "@/components/navBar.vue";
import bottomNav from "@/components/bottomNav";

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
      columnWidth: 120,
      title: "收货",
      active: 0,
      order: "",
      custome: "",
      // 表单需要显示的内容
      formData1: [
        { fColumn: "fInboundOrderNo", fColumnDes: "入库单号", fReadOnly: 0 },
        { fColumn: "fCustomerName", fColumnDes: "客户名称", fReadOnly: 1 },
        {
          fColumn: "fContainerCode",
          fColumnDes: "容器号",
          fReadOnly: 0,
          errorMessage: "请输入货品条码"
        },
        { fColumn: "fProductBarCode", fColumnDes: "货品条码", fReadOnly: 0 },
        { fColumn: "fProductName", fColumnDes: "货品名称", fReadOnly: 1 }
      ],
      // 批量提交表格的表头
      tableHead: [
        { fColumn: "fProductName", fColumnDes: "货品名称", fReadOnly: 1 },
        { fColumn: "fProductBarCode", fColumnDes: "货品条码", fReadOnly: 1 },
        { fColumn: "fBatchNo", fColumnDes: "批次号", fReadOnly: 1 },
        { fColumn: "fInboundNum", fColumnDes: "入库数量", fReadOnly: 1 },
        { fColumn: "fRealReceiptNum", fColumnDes: "实收数量", fReadOnly: 1 },
        { fColumn: "fCollectNum", fColumnDes: "待收数量", fReadOnly: 1 }
      ],
      ruleForm: {
        fInboundOrderNo: "",
        fCustomerName: "",
        fContainerCode: "",
        fProductBarCode: "",
        fProductName: "",
        fBatchNo: "",
        fProductionDate: "",
        fExpirationDate: "",
        fShelfLifeDays: "",
        fInboundNum: "",
        fRealReceiptNum: "",
        fCollectNum: ""
      },
      userDes: JSON.parse(sessionStorage.getItem("user")).userDes,
      user: JSON.parse(sessionStorage.getItem("user")),
      tableData: [],
      //主表表头
      Mst_tableHead: [],
      //主表数据
      Mst_HeadData: {},
      // 字表表头
      Item_tableHead: [],
      // 扫描每个货品获取到的数据
      Item_Data: {},
      // formdata1 原来数据，保存一份
      FormOriginData: [],
      //当前单号fID
      fID: "",
      // 生产日期时间选择
      showPicker: false,
      // 失效日期时间选择
      showPicker2: false,
      // 有效期选择
      showPicker3: false,
      // 时间
      currentTime: new Date(),
      currentTime2: new Date(),
      currentTime3: new Date(),
      // 正则表达式，只能输入数字
      pattern: /\d{6}/
    };
  },
  methods: {
    //判断change变化时字段使用哪一个函数函数获取数据
    judge(str, value) {
      // console.log(str, value);
      // 入库单号
      if (str == "fInboundOrderNo") {
        return this.getStock(value);
      } else if (str == "fProductBarCode") {
        // 货品条码
        return this.getGoods(value);
      } else if (str == "fRealReceiptNum") {
        // 计算待收数量
        return this.countWaitNum(value);
      } else {
        return false;
      }
    },
    // 根据货品条码获取货品信息
    async getGoods(value) {
      // console.log(value, "货品");
      // this.FormOriginData = JSON.parse(JSON.stringify(this.formData1))
      this.formData1 = JSON.parse(JSON.stringify(this.FormOriginData));
      let goodsRes = await getTableBodyData("v_InboundOrder_Item", [
        {
          Computer: "=",
          DataFile: "fMstID",
          Value: this.fID
        },
        {
          Computer: "=",
          DataFile: "fProductBarCode",
          Value: value
        }
      ]);
      goodsRes = JSON.parse(
        decryptDesCbc(goodsRes.qureyDataResult, String(this.userDes))
      );
      console.log(goodsRes);
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
      console.log(goodsData);
      for (const key in goodsData) {
        if (JSON.stringify(goodsData[key]).indexOf("/Date") != -1) {
          goodsData[key] = timeCycle(goodsData[key]);
        }
      }
      // 保存原来的数据
      this.Item_Data = goodsData;
      // ruleform 需要显示在页面的数据
      for (const key in this.ruleForm) {
        for (const child in goodsData) {
          if (key != "fContainerCode" && key == child) {
            this.ruleForm[key] = goodsData[child];
          }
        }
      }
      // 是否批次管理
      let Batch = {};
      // 是否有效期管理
      let ShelfLife;
      // 添加到form表单的数据
      let AddArr = [];
      for (const key in goodsData) {
        if (key == "fIsBatchManage" && goodsData[key] == 1) {
          //是否批次管理
          Batch = { fColumn: "fBatchNo", fColumnDes: "批次号", fReadOnly: 0 };
          this.formData1.push(Batch);
        } else if (key == "fIsShelfLife" && goodsData[key] == 1) {
          // 是否效期管理
          ShelfLife = [
            {
              fColumn: "fProductionDate",
              fColumnDes: "生产日期",
              fReadOnly: 0
            },
            {
              fColumn: "fExpirationDate",
              fColumnDes: "失效日期",
              fReadOnly: 0
            },
            { fColumn: "fShelfLifeDays", fColumnDes: "有效期", fReadOnly: 0 }
          ];
          this.formData1.push(...ShelfLife);
        }
      }
      let arr = [
        { fColumn: "fInboundNum", fColumnDes: "入库数量", fReadOnly: 1 },
        { fColumn: "fRealReceiptNum", fColumnDes: "实收数量", fReadOnly: 0 },
        { fColumn: "fCollectNum", fColumnDes: "待收数量", fReadOnly: 1 }
      ];
      this.formData1.push(...arr);
      // console.log(this.formData1);
    },
    //实收数量值变化时，计算待收数量
    countWaitNum(val) {
      let diffNum = this.ruleForm.fInboundNum - this.ruleForm.fRealReceiptNum;
      this.ruleForm.fCollectNum = diffNum;
    },
    // 表单验证
    validator(val, rule) {
      // console.log(val);
      // console.log(rule);
      return /\d{6}/.test(val);
    },
    checkInput(v) {
      // 遍历获取到item表头，进行验证，因为原来的表头有数据类型的要求
      let a = [];
      this.Item_tableHead.forEach(child => {
        // console.log(child)
        if (child.fColumn == v) {
          if (child.fDataType == "int") {
            //验证为数字
            a = [{ pattern: /^[0-9]*$/, message: "请输入数字" }];
            // let l =child.fLength
          }
        }
      });
      return a;
    },
    //点击按钮触发提交事件
    onClickSubmit() {
      console.log(this.$refs.vanForm);
      this.$refs.vanForm.submit();
    },
    // 提交商品
    onSubmitGoods(val) {
      if (this.ruleForm.fInboundOrderNo == "") {
        Toast("请输入入库单号");
        return;
      }
      if (this.ruleForm.fContainerCode == "") {
        Toast("请输入容器号");
        return;
      }
      if (this.ruleForm.fProductBarCode == "") {
        Toast("请输入货品条码");
        return;
      }
      for (const key in this.ruleForm) {
        for (const child in this.Item_Data) {
          if (key == child) {
            this.Item_Data[child] = this.ruleForm[key];
          }
        }
      }
      // console.log(this.Item_Data);
      // console.log(this.ruleForm);
      // return;
      this.tableData.push(this.Item_Data);
      // console.log(val);
      for (const key in this.ruleForm) {
        if (key != "fCustomerName" && key != "fInboundOrderNo") {
          this.ruleForm[key] = "";
        }
      }
      Toast("提交完成，货品明细请到批量提交查看");
    },
    // 是否确认收货提交
    async onSubmit(value) {
      console.log("提交");
      // console.log(this.tableData);
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
    },
    // 确认收货，请求接口发送数据到数据库
    async sendData() {
      this.Mst_HeadData.fMstState = 4;
      this.Mst_HeadData.fModifyDate = new Date();
      this.Mst_HeadData.fInboundDate = new Date();
      this.Mst_HeadData.fModifier = this.user.userId;
      this.Mst_HeadData.fModifierCode = this.user.usercode;
      this.tableData.forEach(ele => {
        ele.fItemState = 3;
      });
      console.log(this.tableData);
      // return;
      let res = await collectionData([
        {
          TableName: "t_InboundOrder_Mst",
          updateData: [this.Mst_HeadData],
          headData: this.Mst_tableHead
        },
        {
          TableName: "t_InboundOrder_Item",
          updateData: this.tableData,
          headData: this.Item_tableHead
        }
      ]);
      res = JSON.parse(decryptDesCbc(res.saveDataResult, String(this.userDes)));
      console.log(res);
      if (res.state) {
        Toast.success("收货完成");
        window.location.reload()
      } else {
        Toast(res.errstr);
      }
    },
    // 根据入库单号获取客户名称
    async getStock(val) {
      let searchWhere = {
        Computer: "=",
        DataFile: "fInboundOrderNo",
        Value: val
      };
      // let searchWhere2 = {
      //   Computer: "=",
      //   DataFile: "fMstState",
      //   Value: 3
      // };
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
      for (const key in data) {
        if (JSON.stringify(data[key]).indexOf("/Date") != -1) {
          data[key] = timeCycle(data[key]);
        }
      }
      this.ruleForm.fCustomerName = data.fCustomerName;
      //主表数据
      this.Mst_HeadData = data;
      console.log(this.ruleForm);
    },
    //获取主表表格的表头，保存的时候需要用到
    async getTableHead() {
      let res = await getTableHeadData("t_InboundOrder_Mst");
      res = JSON.parse(
        decryptDesCbc(res.getInterfaceEntityResult, String(this.userDes))
      );
      // console.log(res);
      if (res.State) {
        this.Mst_tableHead = res.lstRet.sort(compare);
      } else {
        this.$message.error(res.Message);
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
        this.Item_tableHead = res.lstRet.sort(compare);
        console.log(this.Item_tableHead);
        // this.tableHead=this.Item_tableHead
        // GetInterfaceEntity
      } else {
        this.$message.error(res.Message);
      }
    },
    // 选择生产日期
    onConfirm(v) {
      // console.log(v);
      // // return
      // console.log(this.currentTime);
      this.ruleForm[v] = timeCycle(this.currentTime);
      this.showPicker = false;
    },
    // 选择失效日期
    onConfirm2(v) {
      // console.log(v);
      // // return
      // console.log(this.currentTime2);

      this.ruleForm[v] = timeCycle(this.currentTime2);
      this.showPicker2 = false;
    },
    // 选择有效日期
    onConfirm3(v) {
      // console.log(v);
      // // return
      // console.log(this.currentTime3);

      this.ruleForm[v] = timeCycle(this.currentTime3);
      this.showPicker3 = false;
    }
  },
  created() {
    this.getTableHead();
    // console.log(this.Mst_tableHead)
    this.getItemTableHead();
    this.FormOriginData = JSON.parse(JSON.stringify(this.formData1));
  },
  watch: {
    // currentTime: function() {
    //   // 计算保质期
    //   let sheng = this.currentTime.getTime();
    //   let shi = this.currentTime2.getTime();
    //   let bao = shi - sheng;
    //   let baoDate = Math.floor(bao / (24 * 60 * 60 * 1000));
    //   this.ruleForm.fShelfLifeDays = baoDate;
    // },
    // currentTime2: function() {
    //   let sheng = this.currentTime.getTime();
    //   let shi = this.currentTime2.getTime();
    //   let bao = shi - sheng;
    //   let baoDate = Math.floor(bao / (24 * 60 * 60 * 1000));
    //   this.ruleForm.fShelfLifeDays = baoDate;
    // }
  },
  mounted() {
    let diffNum = this.ruleForm.fInboundNum - this.ruleForm.fRealReceiptNum;
    this.ruleForm.fCollectNum = diffNum;
    // console.log(this.ruleForm.fProductionDate)
    // let sheng = this.ruleForm.fProductionDate.getTime();
    // let shi = this.ruleForm.fExpirationDate.getTime();
    // let bao = shi - sheng;
    // let baoDate = Math.floor(bao / (24 * 60 * 60 * 1000));
    // this.ruleForm.fShelfLifeDays = baoDate;
  }
};
</script>

<style scoped >
.goodsData {
  width: 100%;
  height: 30px;
  line-height: 30px;
  text-align: center;
}
/* // .table-wrapper .el-input {
//   margin-left: 0;
// }
// .table-wrapper /deep/ .el-input__inner {
//   border: none !important;
// }
// .el-input.is-disabled /deep/ .el-input__inner {
//   background-color: #fff;
//   border-color: #fff;
// }
// .el-input /deep/ .el-input__inner {
//   background-color: #fff;
//   border-color: #fff;
// } */
</style>