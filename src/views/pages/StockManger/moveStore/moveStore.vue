<template>
  <div style="padding-bottom:77px">
    <nav-bar :title="title"></nav-bar>
    <van-tabs v-model="active">
      <van-tab title="标准移库">
        <template v-for="(item, i) in standardData">
          <van-cell-group :key="i">
            <van-field
              v-model="standardForm[item.fColumn]"
              :name="item.fColumn"
              :label="item.fColumnDes"
              :placeholder="item.fReadOnly == 0 ? '点击扫描/输入' : ''"
              @change="judge(item.fColumn, standardForm[item.fColumn])"
              clearable
              :readonly="item.fReadOnly == 1 ? true : false"
            >
              <template v-if="item.fColumn == 'fTransferNum'" #button>
                <van-button size="mini" style="border:none;vertical-align: top">
                  <van-checkbox v-model="checkbox" shape="square" @change="changefUsableNum">可移量</van-checkbox>
                </van-button>
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
              <!-- <template v-if="item.fColumn == 'fTransferNum'" #input>
                <van-checkbox v-model="checkbox" shape="square" />
              </template>-->
            </van-field>
            <template v-if="item.fColumn == 'fTransferNum'">
              <van-row class="fTransferNum">
                <van-col span="8">可移量:{{ standardForm.fUsableNum }}</van-col>
                <van-col span="8">占用量: 0</van-col>
                <van-col span="8">库存量: {{ standardForm.fStockNum }}</van-col>
              </van-row>
            </template>
          </van-cell-group>
        </template>
        <bottom-nav :title="'确认移库'" @onSubmit="standardSubmit" @resetData="resetStandar"></bottom-nav>
      </van-tab>
      <van-tab title="库位移库">
        <template v-for="(item,i) in stockData">
          <van-field
            :key="i"
            v-model="stockForm[item.fColumn]"
            :name="item.fColumn"
            :label="item.fColumnDes"
            :placeholder="item.fReadOnly == 0 ? '点击扫描/输入' : ''"
            @change="judge(item.fColumn, stockForm[item.fColumn])"
            clearable
            :readonly="item.fReadOnly == 1 ? true : false"
          ></van-field>
        </template>
        <bottom-nav :title="'确认移库'" @onSubmit="stockSubmit" @resetData="resetStock"></bottom-nav>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script>
import navBar from "@/components/navBar.vue";
import bottomNav from "./bottomNav";
import {
  getTableHeadData,
  getTableBodyData,
  collectionData,
  saveStockTransferData
} from "@/api/index";
import { decryptDesCbc } from "@/utils/cryptoJs.js";
import { Notify, Toast, Dialog } from "vant";
import { compare } from "@/utils/common";
import { timeCycle } from "@/utils/updateTime";

export default {
  components: {
    navBar,
    bottomNav
  },
  data() {
    return {
      title: "移库",
      value: "",
      checkbox: false,
      //   标准移库数据
      standardData: [
        { fColumn: "fOriginBarCode", fColumnDes: "原库位", fReadOnly: 0 },
        { fColumn: "fBatchNo", fColumnDes: "商品PN", fReadOnly: 1 },
        // { fColumn: "fProductBarCode", fColumnDes: "货品条码", fReadOnly: 0 },
        { fColumn: "fTransferNum", fColumnDes: "移库数量", fReadOnly: 0 },
        { fColumn: "fTargetBarCode", fColumnDes: "目标库位", fReadOnly: 0 },
        { fColumn: "fRemark", fColumnDes: "备注", fReadOnly: 0 }
      ],
      // 标准移库表头
      standardHead: [],
      // 标准移库表单数据
      standardForm: {
        fOriginBarCode: "", //原库位条码
        fBatchNo: "",
        fTransferNum: "",
        fTargetBarCode: "",
        fUsableNum: "", //可移量
        fStockNum: "", //库存量
        fRemark: ""
      },
      //   库位移库数据
      stockData: [
        { fColumn: "fOriginBarCode", fColumnDes: "原库位", fReadOnly: 0 },
        { fColumn: "fTargetBarCode", fColumnDes: "目标库位", fReadOnly: 0 },
        { fColumn: "fTransferNum", fColumnDes: "移库数量", fReadOnly: 1 }
      ],
      //库位移库表单数据
      stockForm: {
        fOriginBarCode: "",
        fTargetBarCode: "",
        fTransferNum: 0
      },
      userDes: this.$store.state.user.userInfo.userDes,
      userId: this.$store.state.user.userInfo.userId,
      user: JSON.parse(sessionStorage.getItem("user")),
      sqlConn: sessionStorage.getItem("sqlConn"),
      //原库位ID
      fOriginStorageID: -1,
      //目标库位ID
      fTargetStorageID: -1,
      // active 当前标签页
      active: 0
    };
  },
  methods: {
    changefUsableNum(v) {
      console.log(v);
    },
    judge(str, value) {
      // console.log(str, value);
      // 原库位
      if (str == "fOriginBarCode") {
        return this.getGoods(str, value);
      }
      //目标库位
      if (str == "fTargetBarCode") {
        return this.getTargetGoods(str, value);
      }
      //移库数量
      if (str == "fTransferNum") {
        return this.countNum(value);
      } else {
        return false;
      }
    },
    // 原库位
    async getGoods(str, v) {
      // 根据原库位条码，查询库存表接口，获取库存信息，查询fStorageBarCode 字段
      let goodsRes = await getTableBodyData("v_Stock", [
        {
          Computer: "=",
          DataFile: "fStorageBarCode",
          Value: v
        }
      ]);
      goodsRes = JSON.parse(
        decryptDesCbc(goodsRes.qureyDataResult, String(this.userDes))
      );
      console.log(JSON.parse(goodsRes.Data));
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
      for (const key in goodsData) {
        if (JSON.stringify(goodsData[key]).indexOf("/Date") != -1) {
          goodsData[key] = timeCycle(goodsData[key]);
        }
      }
      // 赋值原库位ID 
      this.fOriginStorageID = goodsData.fStorageID;
      // this.fTargetStorageID = goodsData.fStorageID;

      // console.log(goodsData);
      // 标准移库
      if (this.active == 0) {
        if (str == "fOriginBarCode") {
          for (const key in goodsData) {
            for (const key1 in this.standardForm) {
              if (key == key1) {
                this.standardForm[key1] = goodsData[key];
              }
            }
          }
          // 移库数量默认为0
          this.standardForm.fTransferNum = 0;
        }
      } else if (this.active == 1) {
        //库位移库
        // 移库数量默认为库存数量
        if (str == "fOriginBarCode") {
          this.stockForm.fTransferNum = goodsData.fStockNum;
        }
      }
    },
    // 目标库位
    async getTargetGoods(str, v) {
      // 根据原库位条码，查询库存表接口，获取库存信息，查询fStorageBarCode 字段
      let goodsRes = await getTableBodyData("t_Storage_Item", [
        {
          Computer: "=",
          DataFile: "fStorageBarCode",
          Value: v
        }
      ]);
      goodsRes = JSON.parse(
        decryptDesCbc(goodsRes.qureyDataResult, String(this.userDes))
      );
      // console.log(JSON.parse(goodsRes.Data));
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
      for (const key in goodsData) {
        if (JSON.stringify(goodsData[key]).indexOf("/Date") != -1) {
          goodsData[key] = timeCycle(goodsData[key]);
        }
      }
      // 获取目标库位id
      this.fTargetStorageID = goodsData.fID;
      console.log(goodsData, this.fTargetStorageID);
      // 标准移库
      // if (this.active == 0) {
      //   // if (str == "fOriginBarCode") {
      //   //   for (const key in goodsData) {
      //   //     for (const key1 in this.standardForm) {
      //   //       if (key == key1) {
      //   //         this.standardForm[key1] = goodsData[key];
      //   //       }
      //   //     }
      //   //   }
      //   //   // 移库数量默认为0
      //   //   this.standardForm.fTransferNum = 0;
      //   // }
      // } else if (this.active == 1) {
      //   //库位移库
      //   // 移库数量默认为库存数量
      //   if (str == "fOriginBarCode") {
      //     this.stockForm.fTransferNum = goodsData.fStockNum;
      //   }
      // }
    },
    // 先生成一条数据，并赋给默认值，保存的时候用到
    creatDefaultData() {
      let insertData = {};
      this.standardHead.forEach(item => {
        if (item.fDataType == "datetime") {
          insertData[item.fColumn] = new Date();
        } else if (item.fDataType == "bit") {
          insertData[item.fColumn] = true;
        } else if (item.fDataType == "int") {
          insertData[item.fColumn] = 0;
        } else {
          insertData[item.fColumn] = "";
        }
        // 建立人id 和建立人代号
        if (item.fColumn == "fCreater") {
          insertData[item.fColumn] = this.user.userId;
        } else if (item.fColumn == "fCreaterCode") {
          insertData[item.fColumn] = this.user.usercode;
        }
      });
      return insertData;
    },
    //   标准移库
    async standardSubmit() {
      console.log("标准移库");
      //表头数据
      //生成一条数据，先给默认值
      let insertData = this.creatDefaultData();
      // 根据用户输入的值赋给需要保存的数据
      for (const key in insertData) {
        for (const key1 in this.standardForm) {
          if (key == key1) {
            insertData[key1] = this.standardForm[key];
          }
        }
      }
      // 赋值原库位ID，目标库位ID
      insertData.fOriginStorageID = this.fOriginStorageID;
      insertData.fTargetStorageID = this.fTargetStorageID;
      console.log(insertData);
      this.saveData(insertData);
    },
    // 库位移库
    stockSubmit() {
      console.log("库位移库");
      console.log(this.stockForm);
      let insertData = this.creatDefaultData();
      for (const key in insertData) {
        for (const key1 in this.stockForm) {
          if (key == key1) {
            insertData[key1] = this.stockForm[key];
          }
        }
      }
      // 赋值原库位ID，目标库位ID
      insertData.fOriginStorageID = this.fOriginStorageID;
      insertData.fTargetStorageID = this.fTargetStorageID;
      this.saveData(insertData);
    },
    // 保存数据
    async saveData(insertData) {
      if (this.checkbox) {
        insertData.fIsMovable = 1;
      } else {
        insertData.fIsMovable = 0;
      }
      let res = await saveStockTransferData([
        {
          TableName: "t_Stock_Transfer",
          IdentityColumn: "fID",
          insertData: [insertData],
          headData: this.standardHead
        }
      ]);
      res = JSON.parse(
        decryptDesCbc(
          res.saveStockTransferDataResult,
          String(this.user.userDes)
        )
      );
      console.log(res);
      if (res.state) {
        Toast.success("移库完成");
        // 清空数据
        this.resetStandar();
        this.resetStock();
      } else {
        Toast(res.errstr);
      }
    },
    // 清空标准移库数据
    resetStandar() {
      for (const key in this.standardForm) {
        this.standardForm[key] = "";
      }
    },
    // 清空库位移库数据
    resetStock() {
      for (const key in this.stockForm) {
        this.stockForm[key] = "";
      }
    },
    // 上架数量增加
    addNum(v) {
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
      if (this.standardForm[v]) {
        if (this.standardForm[v] > 0) {
          this.standardForm[v]--;
        } else {
          Toast("数量不能少于0");
        }
      }
    },
    // 验证移库数量，不能超出可移量，不能少于1
    countNum(v) {
      if (v > this.standardForm.fStockNum) {
        Toast("数量不能超出可移量！");
        this.standardForm.fTransferNum = this.standardForm.fStockNum;
      } else if (v <= 1) {
        Toast("数量不能少于0");
        this.standardForm.fTransferNum = 1;
      }
    },
    async getTableHeadData() {
      let res = await getTableHeadData("t_Stock_Transfer");

      res = JSON.parse(
        decryptDesCbc(res.getInterfaceEntityResult, String(this.userDes))
      );

      if (res.State) {
        this.standardHead = res.lstRet.sort(compare);
        console.log(this.standardHead);
      }
    }
  },
  created() {
    this.getTableHeadData();
  }
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
