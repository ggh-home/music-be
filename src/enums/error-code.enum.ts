export enum ErrorCode {
  //---Common---
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  NOT_AUTH = 'NOT_AUTH',
  FORBIDDEN = 'FORBIDDEN',
  TOO_MANY_REQUEST = 'TOO_MANY_REQUEST',

  //---User---
  REPEAT_PWD_NOT_MATCH = 'REPEAT_PWD_NOT_MATCH',
  USER_EXIST = 'USER_EXIST',
  USER_NOT_EXITS = 'USER_NOT_EXITS',
  PWD_NOT_MATCH = 'PWD_NOT_MATCH',
  MISS_TOKEN = 'MISS_TOKEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  USER_STATUS_BLOCKED = 'USER_STATUS_BLOCKED',
  USER_STATUS_DELETED = 'USER_STATUS_DELETED',
  USER_STATUS_EXPIRED = 'USER_STATUS_EXPIRED',
  USER_NOT_BIND_WX = 'USER_NOT_BIND_WX',
  USER_BEEN_UPDATED = 'USER_BEEN_UPDATED',
  USER_WX_NOT_MATCH = 'USER_WX_NOT_MATCH',

  //---Playlist---
  PLAYLIST_EXIST = 'PLAYLIST_EXIST',
  PLAYLIST_BOOKMARKED = 'PLAYLIST_BOOKMARKED',

  //---Playlist Song---
  PLAYLIST_SONG_EXIST = 'PLAYLIST_SONG_EXIST',
  PLAYLIST_SONG_IMPORT_ERROR = 'PLAYLIST_SONG_IMPORT_ERROR',
  PLAYLIST_SONG_IMPORT_URL_ERROR = 'PLAYLIST_SONG_IMPORT_URL_ERROR',
  PLAYLIST_SONG_IMPORT_PLATFORM_ERROR = 'PLAYLIST_SONG_IMPORT_PLATFORM_ERROR',

  //---SoundAlbum---
  SOUND_ALBUM_EXIST = 'SOUND_ALBUM_EXIST',
  SOUND_ALBUM_NOT_EXIST = 'SOUND_ALBUM_NOT_EXIST',
  SOUND_ALBUM_IMPORT_URL_ERROR = 'SOUND_ALBUM_IMPORT_URL_ERROR',
  SOUND_ALBUM_IMPORT_ALBUM_ID_NOT_FOUND = 'SOUND_ALBUM_IMPORT_ALBUM_ID_NOT_FOUND',
  SOUND_ALBUM_IMPORT_ALBUM_NOT_FOUND = 'SOUND_ALBUM_IMPORT_ALBUM_NOT_FOUND',
  SOUND_LIST_DISABLED = 'SOUND_LIST_DISABLED',
}

export const ErrorMessages = {
  [ErrorCode.REPEAT_PWD_NOT_MATCH]: '确认密码和密码不匹配，请检查~',
  [ErrorCode.USER_EXIST]: '该用户名已存在，请换一个~',
  [ErrorCode.USER_NOT_EXITS]: '该用户不存在~',
  [ErrorCode.PWD_NOT_MATCH]: '密码错误，请重试~',
  [ErrorCode.MISS_TOKEN]: '请到账号模块，登录后再使用~',
  [ErrorCode.INVALID_TOKEN]: '登录已过期，请重新登录~',
  [ErrorCode.PLAYLIST_EXIST]: '重复创建，该歌单已存在~',
  [ErrorCode.PLAYLIST_BOOKMARKED]: '重复收藏，该歌单已收藏~',
  [ErrorCode.DATA_NOT_FOUND]: '数据不存在~',
  [ErrorCode.NOT_AUTH]: '权限错误~',
  [ErrorCode.FORBIDDEN]: '禁止的操作~',
  [ErrorCode.PLAYLIST_SONG_EXIST]: '重复收藏，该歌曲已收藏~',
  [ErrorCode.TOO_MANY_REQUEST]: '请求频繁，休息一下吧~',
  [ErrorCode.USER_STATUS_BLOCKED]: '该账号已被临时封禁~',
  [ErrorCode.USER_STATUS_DELETED]: '该账号已被删除~',
  [ErrorCode.USER_STATUS_EXPIRED]: '该账号已过期~',
  [ErrorCode.PLAYLIST_SONG_IMPORT_ERROR]: '歌单导入失败~',
  [ErrorCode.PLAYLIST_SONG_IMPORT_URL_ERROR]: '请输入分享url链接~',
  [ErrorCode.PLAYLIST_SONG_IMPORT_PLATFORM_ERROR]:
    '无法识别来源，目前仅支持QQ和网易云~',
  [ErrorCode.SOUND_ALBUM_EXIST]: '该声音专辑已收藏~',
  [ErrorCode.SOUND_ALBUM_NOT_EXIST]: '该声音专辑尚未收藏~',
  [ErrorCode.SOUND_ALBUM_IMPORT_URL_ERROR]: '声音专辑url格式不正确~',
  [ErrorCode.SOUND_ALBUM_IMPORT_ALBUM_ID_NOT_FOUND]: '无法解析到专辑ID信息~',
  [ErrorCode.SOUND_ALBUM_IMPORT_ALBUM_NOT_FOUND]: '未能获取到声音专辑信息~',
  [ErrorCode.SOUND_LIST_DISABLED]: '抱歉，当前平台已被风控，暂停一切请求~',
  [ErrorCode.USER_NOT_BIND_WX]: '抱歉，当前用户还没有绑定微信~',
  [ErrorCode.USER_BEEN_UPDATED]: '抱歉，你已经领取过了，请勿重复操作~',
  [ErrorCode.USER_WX_NOT_MATCH]: '微信Id不匹配~',
};
