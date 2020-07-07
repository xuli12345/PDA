import cryptoJs from "crypto-js";
let a = sessionStorage.getItem("user") || "{}";
let desCode = JSON.parse(a).userDes || "12345678";
let encryKey = decryptDesCbc(desCode, "d#s87@28");

//des加密，ECB模式
function encryptDesEcb(message) {
  var keyHex = cryptoJs.enc.Utf8.parse(encryKey);

  var option = { mode: cryptoJs.mode.ECB, padding: cryptoJs.pad.Pkcs7 };

  var encrypted = cryptoJs.DES.encrypt(message, keyHex, option);

  return encrypted.ciphertext.toString();
}

//des 解密，ECB模式
function decryptDesEcb(message, key = "12345678") {
  var keyHex = cryptoJs.enc.Utf8.parse(key);

  var option = { mode: cryptoJs.mode.ECB, padding: cryptoJs.pad.Pkcs7 };

  var decrypted = cryptoJs.DES.decrypt(
    { ciphertext: cryptoJs.enc.Hex.parse(message) },
    keyHex,
    option
  );

  return decrypted.toString(cryptoJs.enc.Utf8);
}

//des加密，cbc模式
function encryptDesCbc(message, encryKey) {
  var keyHex = cryptoJs.enc.Utf8.parse(encryKey);
  var ivHex = cryptoJs.enc.Utf8.parse(encryKey);
  var option = {
    iv: ivHex,
    mode: cryptoJs.mode.CBC,
    padding: cryptoJs.pad.Pkcs7
  };
  var encrypted = cryptoJs.DES.encrypt(message, keyHex, option);
  return encrypted.ciphertext.toString();
}

//des解密，cbc模式
function decryptDesCbc(message, encryKey) {
  var keyHex = cryptoJs.enc.Utf8.parse(encryKey);
  var ivHex = cryptoJs.enc.Utf8.parse(encryKey);
  var decrypted = cryptoJs.DES.decrypt(
    {
      ciphertext: cryptoJs.enc.Hex.parse(message)
    },
    keyHex,
    {
      iv: ivHex,
      mode: cryptoJs.mode.CBC,
      padding: cryptoJs.pad.Pkcs7
    }
  );
  return decrypted.toString(cryptoJs.enc.Utf8);
}

export {
  encryptDesEcb, //des加密，ECB模式
  decryptDesEcb, //des解密，ECB模式
  encryptDesCbc, //des加密，CBC模式
  decryptDesCbc //des解密，CBC模式
};
