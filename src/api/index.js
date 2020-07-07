//引入axios网络请求库
import http from "@/http/http";
import { encryptDesCbc } from "@/utils/cryptoJs.js";
import { batchDelete } from "@/utils/common";
let sqlConn;
let userDes, userId
/***
 *
 *   封装获取左侧导航菜单栏
 *
 */

function menus(obj) {
  // console.log(obj)
  sqlConn = sessionStorage.getItem('sqlConn')
  let object = {
    UserID: obj.userId,
    SqlConn: sqlConn,
    ParameterDes: encryptDesCbc(JSON.stringify(obj), String(obj.userDes))
  };

  return http({
    url: "/UrlMenu",
    method: "POST",
    loading: "true",
    data: JSON.stringify(object)
  });
}
/***
 *
 *   封装表格头部数据
 *
 */
function tableHeadData({ userDes, userId, fDataTableView, sqlConn }) {
  // console.log(sqlConn)
  let obj = {
    UserID: userId,
    SqlConn: sqlConn,
    ParameterDes: encryptDesCbc(fDataTableView, String(userDes))
  };
  return http({
    url: "/GetInterfaceEntity",
    method: "POST",
    loading: "true",
    data: JSON.stringify(obj)
  });
}

/**
 *
 * 获取表格内容
 * str 获取相应内容的接口fTableViewData
 * condition 查询条件，可以为空
 */

async function getTableBodyData(str, condition = []) {
  userDes = JSON.parse(sessionStorage.getItem("user")).userDes;
  userId = JSON.parse(sessionStorage.getItem("user")).userId;
  let obj1 = {
    Columns: "",
    OrderBy: "",
    SqlConn: sqlConn,
    TableView: str,
    Where: condition
  };
  // console.log(obj1);
  let obj = {
    UserID: userId,
    SqlConn: sqlConn,
    ParameterDes: encryptDesCbc(JSON.stringify(obj1), String(userDes))
  };
  // console.log(111)
  return http({
    url: "/QureyData",
    method: "POST",
    data: JSON.stringify(obj)
  })
}


/**
 * 新增/删除/修改保存数据
 * @param {*} data 
 * 
 * data 是数组，
 * 如data: [
              {
                type: "insert",type 字符串 有三个值 insert（新建） update（修改） delete（删除）
                TableName: "t_UserLimit_Company",//表接口
                bodyData: this.selSceondData,//表格的内容
                headData: this.itemSceondTableHead,//表格的头部
                IdentityColumn: "fLimitID"//自增长字段
              }
});
 * 
 */
function collectionData(data) {
  // console.log(data)
  userDes = JSON.parse(sessionStorage.getItem("user")).userDes;
  userId = JSON.parse(sessionStorage.getItem("user")).userId;
  // let type = data.type
  // let saveData = data.data
  let saveObj = [];
  let globalColumns;
  // console.log(data)
  data.forEach(element => {
    // console.log(element.updateData)
    let obj = {};
    let update = null,
      deleted = null,
      insert = null;
    if (element.insertData && element.insertData.length > 0) {
      insert = batchDelete(element.headData, element.insertData);
      globalColumns = insert.columns;
    }
    if (element.updateData && element.updateData.length > 0) {
      update = batchDelete(element.headData, element.updateData);
      globalColumns = update.columns;
    }
    if (element.deleteData && element.deleteData.length > 0) {
      deleted = batchDelete(element.headData, element.deleteData);
      globalColumns = deleted.columns;
    }
    // console.log(insert,update,deleted)
    obj = {
      TableName: element.TableName,
      IdentityColumn: element.IdentityColumn ? element.IdentityColumn : null,
      InsertRow: insert ? insert.arr : null,
      UpdateRow: update ? update.arr : null,
      DeleteRow: deleted ? deleted.arr : null,
      Columns: globalColumns
    };
    saveObj.push(obj);
  });
  let savaData = {
    lstSaveData: saveObj
  };
  console.log(savaData);
  console.log(JSON.stringify(savaData));
  let obj = {
    UserID: userId,
    SqlConn: sqlConn,
    ParameterDes: encryptDesCbc(JSON.stringify(savaData), String(userDes))
  };
  return http({
    url: "/SaveData",
    method: "POST",
    data: JSON.stringify(obj)
  });
}
/**
 * 获取表格表头
 * @param {} str 获取相应内容的接口名称
 */
function getTableHeadData(str) {
  userDes = JSON.parse(sessionStorage.getItem("user")).userDes;
  userId = JSON.parse(sessionStorage.getItem("user")).userId;
  let fTableView = '["' + str + '"]';
  console.log(fTableView);
  let obj = {
    UserID: userId,
    SqlConn: sqlConn,
    ParameterDes: encryptDesCbc(fTableView, String(userDes))
  };
  //  console.log(obj)
  return http({
    url: "/GetInterfaceEntity",
    method: "POST",
    loading: "true",
    data: JSON.stringify(obj)
  });
}


/**
 * 修改页面中获取从表数据
 * 
 * 
*/
function getInterfaceItemData(data) {
  console.log(JSON.stringify(data[0]))
  let obj = {
    UserID: data[1].userId,
    SqlConn: sqlConn,
    ParameterDes: encryptDesCbc(JSON.stringify(data[0]), String(data[1].userDes))
  };
  // console.log(JSON.stringify(obj))
  return http({
    url: "/qureyInterfaceItemData",
    method: "POST",
    data: JSON.stringify(obj)
  })
}
/**
 *
 * 登录页面下拉选择框仓库
 */
function companyList() {
  return http({
    // url: "/GetCompanyData",
    url: "http://8.129.208.95:8001/Service.svc/GetCompanyData",
    method: "POST"
  });
}
//上架
function upGoods(data) {
  // console.log(data)
  userDes = JSON.parse(sessionStorage.getItem("user")).userDes;
  userId = JSON.parse(sessionStorage.getItem("user")).userId;
  // let type = data.type
  // let saveData = data.data
  let saveObj = [];
  let globalColumns;
  // console.log(data)
  data.forEach(element => {
    // console.log(element.updateData)
    let obj = {};
    let update = null,
      deleted = null,
      insert = null;
    if (element.insertData && element.insertData.length > 0) {
      insert = batchDelete(element.headData, element.insertData);
      globalColumns = insert.columns;
    }
    if (element.updateData && element.updateData.length > 0) {
      update = batchDelete(element.headData, element.updateData);
      globalColumns = update.columns;
    }
    if (element.deleteData && element.deleteData.length > 0) {
      deleted = batchDelete(element.headData, element.deleteData);
      globalColumns = deleted.columns;
    }
    // console.log(insert,update,deleted)
    obj = {
      TableName: element.TableName,
      IdentityColumn: element.IdentityColumn ? element.IdentityColumn : null,
      InsertRow: insert ? insert.arr : null,
      UpdateRow: update ? update.arr : null,
      DeleteRow: deleted ? deleted.arr : null,
      Columns: globalColumns
    };
    saveObj.push(obj);
  });
  let savaData = {
    lstSaveData: saveObj
  };
  console.log(savaData);
  console.log(JSON.stringify(savaData));
  let obj = {
    UserID: userId,
    SqlConn: sqlConn,
    ParameterDes: encryptDesCbc(JSON.stringify(savaData), String(userDes))
  };
  // console.log(JSON.stringify({
  //   UserID: userId,
  //   SqlConn: sqlConn,
  //   ParameterDes: savaData
  // }))

  return http({
    url: "/saveStockData",
    method: "POST",
    data: JSON.stringify(obj)
  });
}

export {
  menus,
  tableHeadData,
  getTableBodyData,
  getTableHeadData,
  collectionData,
  companyList,
  getInterfaceItemData,
  upGoods
};
