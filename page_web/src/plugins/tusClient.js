/**
 * github: https://github.com/tus/tus-js-client.git
 * tus客户端
 */
import { Upload } from "tus-js-client";
import { getToken, logout } from "@/utils/auth";

/**
 * 如果局域网带宽比较大可以将chunkSize设置大些，直接将路由器带宽拉满
 */
const defaultChunkSize = 20 * 1024 * 1024;

function createWithTokenHeaders() {
  const headers = {};
  // 是否需要设置 token
  const token = getToken();
  if (token) {
    headers["Authorization"] = token;
  }
  return headers;
}

function handleError(error) {
  if (`${error}`.indexOf('"code":401') > 0) {
    logout();
    throw "登录状态无效，请重新登录";
  }
  throw "上传失败";
}

export function createTusClient(file, onProgress, chunkSize) {
  let upload;
  let task = new Promise((resolve, reject) => {
    upload = new Upload(file, {
      endpoint: "/api/tus",
      headers: createWithTokenHeaders(),
      chunkSize: chunkSize || defaultChunkSize,
      metadata: {
        filename: file.name,
        filetype: file.type,
      },
      onError: (error) => {
        reject(error);
      },
      onProgress: (loaded, total) => {
        const event = { loaded, total, percent: (loaded / total) * 100 };
        onProgress(event);
      },
      onSuccess: () => {
        const fileid = upload.url.substring(upload.url.lastIndexOf("/") + 1);
        resolve(fileid);
      },
    });
    upload.findPreviousUploads().then(function (previousUploads) {
      if (previousUploads.length) {
        // 恢复之前还未完成的上传任务
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    });
  });
  return {
    upload: () => task.catch(handleError),
    abort: () => upload.abort(false),
  };
}
