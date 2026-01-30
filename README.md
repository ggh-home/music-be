这是一个多站合一音乐搜索解决方案，支持搜索QQ音乐、网易云音乐和喜马拉雅。总共4个小项目，其中2个Python项目，分别用于抓取喜马拉雅和音乐（QQ和网易云）音源，1个基于Nest.js的后端API项目，1个基于React Native
的安卓客户端项目。
此项目是后端核心项目，提供了app端全部的API服务，数据库是MySQL，建议使用Docker部署，部署前需自行准备MySQL，执行脚本，并更改代码中数据库连接配置（app.module.ts文件中）。
如果想完成音源拉取还需要更新cookie表中的音乐或有声书的cookie。
数据库脚本：https://vip.123pan.cn/1834467410/%E4%BB%98%E8%B4%B9%E7%BE%A4%E5%88%86%E4%BA%AB/%E5%85%A8%E6%A0%88%E9%9F%B3%E4%B9%90App/3-%E5%90%8E%E7%AB%AFApi-Nestjs/music.sql
