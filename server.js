const express = require("express");
const server = express();

server.all("/", (req, res) => {
  res.send("봇 상태: \n 온라인 입니다.");
});

function keepAlive() {
  server.listen(3000, () => {
    console.log("서버 준비됨");
  });
}

module.exports = keepAlive;
