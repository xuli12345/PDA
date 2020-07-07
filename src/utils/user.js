function getUserData() {
  return JSON.parse(window.sessionStorage.getItem("user")) || null;
}

export {
    getUserData
}