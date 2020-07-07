<template>
  <div style="padding-bottom:77px">
    <nav-bar :title="title"></nav-bar>
    <van-tabs>
      <van-tab title="标准移库">
        <template v-for="(item, i) in standardData">
          <van-cell-group :key="i" v-if="item.fVisible == 1">
            <van-field
              v-model="standardForm[item.fColumn]"
              :name="item.fColumn"
              :label="item.fColumnDes"
              :placeholder="item.fReadOnly == 0 ? '点击扫描/输入' : ''"
              @change="judge(item.fColumn, standardForm[item.fColumn])"
              clearable
              :disabled="item.fReadOnly == 1 ? true : false"
            >
              <template v-if="item.fColumn == 'fTransferNum'" #button>
                <van-button
                  @click="addNum(item.fColumn)"
                  size="mini"
                  type="primary"
                  color="#1989fa"
                >
                  <van-icon
                    class-prefix="iconfont"
                    name="zengjia"
                    color="#ffffff"
                  />
                </van-button>
                <van-button
                  @click="reduceNum(item.fColumn)"
                  size="mini"
                  type="primary"
                  color="#1989fa"
                >
                  <van-icon
                    class-prefix="iconfont"
                    name="jianshao"
                    color="#ffffff"
                  />
                </van-button>
              </template>
            </van-field>
            <template v-if="item.fColumn == 'fTransferNum'">
              <van-row class="fTransferNum">
                <van-col span="8"
                  >可移量:{{ standardForm.fUsableNum }}
                </van-col>
                <van-col span="8">占用量: 0</van-col>
                <van-col span="8">库存量: {{ standardForm.fStockNum }}</van-col>
              </van-row>
            </template>
          </van-cell-group>
        </template>
        <bottom-nav
          :title="'确认移库'"
          @onSubmit="standardSubmit"
          @resetData="resetStandar"
        ></bottom-nav>
      </van-tab>
      <van-tab title="库位移库">
        <bottom-nav
          :title="'确认移库'"
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
import { getTableHeadData, getTableBodyData } from "@/api/index";
import { decryptDesCbc } from "@/utils/cryptoJs.js";
import { Notify, Toast, Dialog } from "vant";
import { compare } from "@/utils/common";
export default {
  components: {
    navBar,
    bottomNav,
  },
  data() {
    return {
      title: "移库",
      value: "",
      //   标准移库数据
      standardData: [
        { fColumn: "Ostock", fColumnDes: "原库位", fReadOnly: 0 },
        { fColumn: "fProductBarCode", fColumnDes: "货品条码", fReadOnly: 0 },
        { fColumn: "fTransferNum", fColumnDes: "移库数量", fReadOnly: 0 },
        { fColumn: "targetStock", fColumnDes: "目标库位", fReadOnly: 0 },
        { fColumn: "fProductName", fColumnDes: "货品名称", fReadOnly: 1 },
        { fColumn: "fStockType", fColumnDes: "库存类型", fReadOnly: 1 },
        { fColumn: "fBatchNo", fColumnDes: "批次", fReadOnly: 1 },
        { fColumn: "fProductionDate", fColumnDes: "生产日期", fReadOnly: 1 },
        { fColumn: "fExpirationDate", fColumnDes: "失效日期", fReadOnly: 1 },
      ],
      standardForm: {},
      //   库位移库数据
      stockData: [],
      //库位移库表单数据
      stockForm: {},
      userDes: this.$store.state.user.userInfo.userDes,
      userId: this.$store.state.user.userInfo.userId,
      sqlConn: sessionStorage.getItem("sqlConn"),
    };
  },
  methods: {
    judge(str, value) {
      console.log(str, value);
      // 入库单号
      if (str == "fOriginBarCode") {
        return this.getGoods(str, value);
      }
      if (str == "fTargetBarCode") {
        return this.getGoods(str, value);
      } else {
        return false;
      }
    },
    async getGoods(str, v) {
      let goodsRes = await getTableBodyData("v_Stock", [
        {
          Computer: "=",
          DataFile: "fStorageBarCode",
          Value: v,
        },
      ]);

      goodsRes = JSON.parse(
        decryptDesCbc(goodsRes.qureyDataResult, String(this.userDes))
      );

      let goodsData;
      if (goodsRes.State) {
        if (goodsRes.Data == "[]") {
          Toast("该库位条码不存在，请确认库位条码是否正确");
          return;
        }
        goodsData = JSON.parse(goodsRes.Data)[0];
      } else {
        Toast(goodsRes.Message);
        return;
      }

      if (goodsData) {
        //动态添加字段
        if (str == "fOriginBarCode") {
          goodsData.fOriginBarCode = goodsData.fStorageBarCode;
          goodsData.fTransferNum = 0;
          this.standardForm = goodsData;
        } else {
          this.standardForm.fTargetBarCode = goodsData.fStorageBarCode;
        }
      }
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
    },
    // 上架数量增加
    addNum(v) {
      // console.log(v, "add");
      // console.log(this.standardForm[v]);
      if (this.standardForm[v]) {
        if (this.standardForm[v] >= this.standardForm.fUsableNum) {
          Toast("移库数量不能大于可移量");
          return;
        } else {
          this.standardForm[v]++;
        }
      }
    },
    // 上架数量减少
    reduceNum(v) {
      // console.log(v, "reduce");
      if (this.standardForm[v]) {
        if (this.standardForm[v] > 0) {
          this.standardForm[v]--;
          console.log("-");
        } else {
          Toast("数量不能少于0");
        }
      }
    },
    async getTableHeadData() {
      let res = await getTableHeadData("t_Stock_Transfer");

      res = JSON.parse(
        decryptDesCbc(res.getInterfaceEntityResult, String(this.userDes))
      );

      if (res.State) {
        this.standardData = res.lstRet.sort(compare);
        console.log(this.standardData);
      }
    },
  },
  created() {
    this.getTableHeadData();
  },
};
</script>

<style scoped>
.fTransferNum {
  height: 24px;
  line-height: 24px;
  text-align: center;
}
.van-cell::after {
  border-bottom: none;
}
</style>
