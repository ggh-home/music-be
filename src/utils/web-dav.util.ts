import webdav from 'webdav';
import fs from 'fs'; // 使用 import 语法导入 fs
import axios from 'axios';
import { EnvCode } from 'src/enums/env-code.enum';

class WebDAVClient {
  // 内置的 WebDAV 服务器信息
  // static username = '如果要使用网盘,这里改为你的网盘WebDav协议用户名'; // 用户名
  // static password = '如果要使用网盘,这里改为你的网盘WebDav协议密码'; // 密码
  static username = '13601017534'; // 用户名
  static password = 'irxttqlt'; // 密码
  static url = 'https://webdav.123pan.cn/webdav'; // WebDAV服务器的URL
  static rootPath =
    process.env.NODE_ENV === EnvCode.DEV ? '/music/dev/' : '/music/prod/';

  // 创建 WebDAV 客户端（静态方法）
  static client = webdav.createClient(WebDAVClient.url, {
    username: WebDAVClient.username,
    password: WebDAVClient.password,
  });

  // 获取文件列表
  static async listFiles(path) {
    try {
      const files = await WebDAVClient.client.getDirectoryContents(
        this.rootPath + path,
      );
      console.log('文件列表:', files);
      return files;
    } catch (error) {
      console.error('获取文件列表时出错:', error);
    }
  }

  static async exist(path) {
    return await WebDAVClient.client.exists(path);
  }

  static async existWithRootPath(path) {
    return await WebDAVClient.client.exists(this.rootPath + path);
  }

  static async tryCreateRootPathIfNotExist() {
    let isExistMusic = await this.exist('/music');
    console.log(`music文件夹检测结果:${isExistMusic}`);
    if (!isExistMusic) {
      console.error(`严重异常,网盘返回不存在music文件夹,尝试创建`);
      await this.createDirectory('/music');
      isExistMusic = await this.exist('/music');
      console.log(
        `创建music完毕,再次检测music文件夹是否存在,结果：${isExistMusic}`,
      );
    }

    const subPath = process.env.NODE_ENV === EnvCode.DEV ? 'dev' : 'prod';
    let isExistSubPath = await this.exist(`/music/${subPath}`);
    console.log(`/music/${subPath}文件夹检测结果:${isExistSubPath}`);
    if (!isExistSubPath) {
      console.error(`严重异常,网盘返回不存在/music/${subPath}文件夹,尝试创建`);
      await this.createDirectory(`/music/${subPath}`);
      isExistSubPath = await this.exist(`/music/${subPath}`);
      console.log(
        `创建/music/${subPath}完毕,再次检测/music/${subPath}文件夹是否存在,结果:${isExistSubPath}`,
      );
    }
  }

  static async tryCreateDirectoryIfNotExist(path) {
    const isExist = await this.existWithRootPath(path);
    console.log(`云盘文件夹:${path}是否存在的检测结果:${isExist}`);
    if (!isExist) {
      await this.createDirectory(path);
    }
  }

  // 上传文件
  static async uploadFile(localFilePath, remoteFilePath) {
    await WebDAVClient.client.putFileContents(
      this.rootPath + remoteFilePath,
      fs.createReadStream(localFilePath),
    );
    console.log(`文件已上传到云盘: ${remoteFilePath}`);
  }

  // 创建目录
  static async createDirectory(remoteDirPath) {
    try {
      await WebDAVClient.client.createDirectory(this.rootPath + remoteDirPath);
      console.log(`目录已创建: ${remoteDirPath}`);
    } catch (error) {
      console.error('创建目录时出错:', error);
    }
  }

  // 删除文件
  static async deleteFile(remoteFilePath) {
    try {
      await WebDAVClient.client.deleteFile(this.rootPath + remoteFilePath);
      console.log(`文件已删除: ${remoteFilePath}`);
    } catch (error) {
      console.error('删除文件时出错:', error);
    }
  }

  // 移动文件
  static async moveFile(sourcePath, destinationPath) {
    try {
      await WebDAVClient.client.moveFile(
        this.rootPath + sourcePath,
        this.rootPath + destinationPath,
      );
      console.log(`文件已移动到: ${destinationPath}`);
    } catch (error) {
      console.error('移动文件时出错:', error);
    }
  }

  // 获取文件的 WebDAV URL
  static async getFileUrl(remoteFilePath) {
    const url = WebDAVClient.client.getFileDownloadLink(
      this.rootPath + remoteFilePath,
    );
    return await this.getRedirectUrl(url);
  }

  static async getRedirectUrl(url) {
    try {
      const response = await axios.get(url, {
        maxRedirects: 0, // 禁止自动重定向
        validateStatus: function (status) {
          return status >= 300 && status < 400; // 只处理3xx系列的重定向响应
        },
      });
      // 如果请求返回了重定向地址
      return response.headers.location;
    } catch (error) {
      if (error.response) {
        // 获取重定向地址
        const redirectUrl = error.response.headers.location;
        console.log('重定向地址:', redirectUrl);
        return redirectUrl;
      } else {
        console.error('请求失败:', error.message);
        throw error; // 如果发生其他错误，可以选择抛出异常
      }
    }
  }
}

// 导出类
export default WebDAVClient;
