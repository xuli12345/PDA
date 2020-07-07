<template>
  <div style="padding-bottom:77px">
    <nav-bar :title="title"></nav-bar>
    <van-tabs>
      <van-tab title="标准移库">
        <template v-for="(item,i) in standardData">
          <van-cell-group :key="i">
            <van-field
              v-model="standardForm[item.fColumn]"
              :name="item.fColumn"
              :label="item.fColumnDes"
              :placeholder="item.fReadOnly==0?'点击扫描/输入':''"
              @change="judge(item.fColumn,standardForm[item.fColumn])"
              clearable
              :disabled="item.fReadOnly==1?true:false"
            >
              <template v-if="item.fColumn=='moveNum'" #button>
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
              </template>
            </van-field>
            <template v-if="item.fColumn=='moveNum'">
              <van-row class="moveNum">
                <van-col span="8">可移量: 0</van-col>
                <van-col span="8">占用量: 0</van-col>
                <van-col span="8">库存量: 0</van-col>
              </van-row>
            </template>
          </van-cell-group>
        </template>
        <bottom-nav :title="'确认移库'" @onSubmit="standardSubmit" @resetData="resetStandar"></bottom-nav>
      </van-tab>
      <van-tab title="库位移库">
        <bottom-nav :title="'确认移库'" @onSubmit="stockSubmit" @resetData="resetStock"></bottom-nav>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script>
import navBar from "@/components/navBar.vue";
import bottomNav from "./bottomNav";
export default {
  components: {
    navBar,
    bottomNav
  },
  data() {
    return {
      title: "移库",
      value: "",
      //   标准移库数据
      standardData: [
        { fColumn: "Ostock", fColumnDes: "原库位", fReadOnly: 0 },
        { fColumn: "fProductBarCode", fColumnDes: "货品条码", fReadOnly: 0 },
        { fColumn: "moveNum", fColumnDes: "移库数量", fReadOnly: 0 },
        { fColumn: "targetStock", fColumnDes: "目标库位", fReadOnly: 0 },
        { fColumn: "fProductName", fColumnDes: "货品名称", fReadOnly: 1 },
        { fColumn: "fStockType", fColumnDes: "库存类型", fReadOnly: 1 },
        { fColumn: "fBatchNo", fColumnDes: "批次", fReadOnly: 1 },
        { fColumn: "fProductionDate", fColumnDes: "生产日期", fReadOnly: 1 },
        { fColumn: "fExpirationDate", fColumnDes: "失效日期", fReadOnly: 1 }
      ],
      standardForm: {},
      //   库位移库数据
      stockData: [],
      stockForm: {}
    };
  },
  methods: {
    judge(str, value) {
      // console.log(str, value);
      // 入库单号
      // if (str == "fInboundOrderNo") {
      //   return this.getStock(value);
      // } 
      if (str == "fProductBarCode") {
        // 货品条码
        return this.getGoods(value);
      } 
      // else if (str == "fRealReceiptNum") {
      //   // 计算待收数量
      //   return this.countWaitNum(value);
      // } 
      else {
        return false;
      }
    },
    async getGoods(v){
      let goodsRes =  await getTableBodyData('v_OutboundOrder_Item',[
        // {
        //   Computer: "=",
        //   DataFile: "fMstID",
        //   Value: this.fID
        // },
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
    }
  }
};
</script>

<style scoped>
  .moveNum{
    height: 24px;
    line-height: 24px;
    text-align: center;
  }
  .van-cell::after {
    border-bottom: none;
  }
</style>