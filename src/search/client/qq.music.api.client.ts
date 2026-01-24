'use strict';
import axios from 'axios';
import { PlatformApi } from './platform.api.interface';
import { ThirdPlatformType } from 'src/playlist/enums/platform-type.enum';
import { EnvCode } from 'src/enums/env-code.enum';
import { ImportSongs } from 'src/playlist/dto/import-songs.dto';

const pageSize = 15;

function formatMusicItem(_: any) {
  const albumid = _.albumid || _.album?.id;
  const albummid = _.albummid || _.album?.mid;
  const albumname = _.albumname || _.album?.title;

  const alertId = _?.action?.alert ?? _?.alertid;
  const msgid = _?.action?.msgid ?? _?.msgid;

  return {
    id: _.id || _.songid,
    songmid: _.mid || _.songmid,
    title: _.title || _.songname,
    artist: _.singer.map((s: any) => s.name).join(', '),
    artwork: albummid
      ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${albummid}.jpg`
      : undefined,
    album: albumname,
    lrc: _.lyric || undefined,
    albumid: albumid,
    albummid: albummid,
    valid: !(msgid === 3 && alertId === 0),
  };
}

function formatAlbumItem(_: any) {
  return {
    id: _.albumID || _.albumid,
    albumMID: _.albumMID || _.album_mid,
    title: _.albumName || _.album_name,
    artwork:
      _.albumPic ||
      `https://y.gtimg.cn/music/photo_new/T002R800x800M000${_.albumMID || _.album_mid}.jpg`,
    date: _.publicTime || _.pub_time,
    singerID: _.singerID || _.singer_id,
    artist: _.singerName || _.singer_name,
    singerMID: _.singerMID || _.singer_mid,
    description: _.desc,
  };
}

function formatArtistItem(_: any) {
  return {
    name: _.singerName,
    id: _.singerID,
    singerMID: _.singerMID,
    avatar: _.singerPic,
    worksNum: _.songNum,
    albumNum: _.albumNum,
  };
}

const searchTypeMap: Record<number, string> = {
  0: 'song',
  2: 'album',
  1: 'singer',
  3: 'songlist',
  7: 'song',
  12: 'mv',
};

const headers = {
  referer: 'https://y.qq.com',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
  Cookie: 'uin=',
};

async function searchBase(query: string, page: number, type: number) {
  const res = await axios({
    url: 'https://u.y.qq.com/cgi-bin/musicu.fcg',
    method: 'POST',
    data: {
      req_1: {
        method: 'DoSearchForQQMusicDesktop',
        module: 'music.search.SearchCgiService',
        param: {
          num_per_page: pageSize,
          page_num: page,
          query: query,
          search_type: type,
        },
      },
    },
    headers,
    xsrfCookieName: 'XSRF-TOKEN',
    withCredentials: true,
  });
  //console.log(`qq音乐原始搜索结果:${JSON.stringify(res.data)}`);
  return {
    isEnd: res.data.req_1.data.meta.sum <= page * pageSize,
    data: res.data.req_1.data.body[searchTypeMap[type]].list,
  };
}

async function searchMusic(query: string, page: number) {
  const songs = await searchBase(query, page, 0);
  return {
    isEnd: songs.isEnd,
    data: songs.data.map(formatMusicItem),
  };
}

export async function searchAlbum(query: string, page: number) {
  const albums = await searchBase(query, page, 2);
  return {
    isEnd: albums.isEnd,
    data: albums.data.map(formatAlbumItem),
  };
}

export async function searchArtist(query: string, page: number) {
  const artists = await searchBase(query, page, 1);
  return {
    isEnd: artists.isEnd,
    data: artists.data.map(formatArtistItem),
  };
}

export async function searchMusicSheet(query: string, page: number) {
  const musicSheet = await searchBase(query, page, 3);
  return {
    isEnd: musicSheet.isEnd,
    data: musicSheet.data.map((item: any) => ({
      title: item.dissname,
      createAt: item.createtime,
      description: item.introduction,
      playCount: item.listennum,
      worksNums: item.song_count,
      artwork: item.imgurl,
      id: item.dissid,
      artist: item.creator.name,
    })),
  };
}

export async function getMusicSheetInfo(sheet) {
  const data = await importMusicSheet(sheet.id);
  return {
    isEnd: true,
    musicList: data,
  };
}

export async function importMusicSheet(urlLike) {
  let id;
  if (!id) {
    id = (urlLike.match(
      /https?:\/\/i\.y\.qq\.com\/n2\/m\/share\/details\/taoge\.html\?.*id=([0-9]+)/,
    ) || [])[1];
  }
  if (!id) {
    id = (urlLike.match(/https?:\/\/y\.qq\.com\/n\/ryqq\/playlist\/([0-9]+)/) ||
      [])[1];
  }
  if (!id) {
    id = (urlLike.match(/^(\d+)$/) || [])[1];
  }
  if (!id) {
    const match = urlLike.match(/[?&]id=(\d+)/);
    // 如果匹配成功，获取到 id，否则返回 null
    id = match ? match[1] : null;
  }
  if (!id) {
    return;
  }
  const result = (
    await axios({
      url: `http://i.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&utf8=1&disstid=${id}&loginUin=0`,
      headers: { Referer: 'https://y.qq.com/n/yqq/playlist', Cookie: 'uin=' },
      method: 'get',
      xsrfCookieName: 'XSRF-TOKEN',
      withCredentials: true,
    })
  ).data;
  const res = JSON.parse(
    result.replace(/callback\(|MusicJsonCallback\(|jsonCallback\(|\)$/g, ''),
  );
  const importSongs = res.cdlist[0].songlist.map(formatMusicItem);
  const playlistName = res.cdlist[0].dissname;
  const playlistId = id;
  const playlistImg = res.cdlist[0].logo;
  return { importSongs, playlistName, playlistId, playlistImg };
}

export async function searchLyric(query: string, page: number) {
  const songs = await searchBase(query, page, 7);
  return {
    isEnd: songs.isEnd,
    data: songs.data.map((it: any) => ({
      ...formatMusicItem(it),
      rawLrcTxt: it.content,
    })),
  };
}

export function getQueryFromUrl(key: string | null, search: string): any {
  try {
    const sArr = search.split('?');
    let s = '';
    if (sArr.length > 1) {
      s = sArr[1];
    } else {
      return key ? undefined : {};
    }
    const querys = s.split('&');
    const result: Record<string, string> = {};
    querys.forEach(item => {
      const temp = item.split('=');
      result[temp[0]] = decodeURIComponent(temp[1]);
    });
    return key ? result[key] : result;
  } catch (err) {
    return key ? '' : {};
  }
}

export function changeUrlQuery(
  obj: Record<string, any>,
  baseUrl: string,
): string {
  const query = getQueryFromUrl(null, baseUrl);
  const url = baseUrl.split('?')[0];
  const newQuery = { ...query, ...obj };
  const queryArr = Object.keys(newQuery).map(key =>
    newQuery[key] !== undefined && newQuery[key] !== ''
      ? `${key}=${encodeURIComponent(newQuery[key])}`
      : '',
  );
  return `${url}?${queryArr.join('&')}`.replace(/\?$/, '');
}

type QQLevel = '320' | 'flac';

export async function getMediaSource(
  musicItem: any,
  cookie: string,
  level: QQLevel,
) {
  let res;
  try {
    res = await axios.get(
      `http://${process.env.NODE_ENV === EnvCode.DEV
        ? 'localhost'
        : process.env.NODE_ENV === EnvCode.PROD
          ? 'localhost'
          : 'localhost'
      }:5122/QQ/song?songId=${musicItem.id}&cookie=${cookie}&level=${level}`,
      {
        headers: {
          'X-Request-Key': 'share-v2',
        },
        proxy: false,
      },
    );
  } catch (err) {
    console.log(`QQ音乐第一次尝试调用url接口发生异常，err:${err}`);
    if (process.env.NODE_ENV === EnvCode.PROD) {
      res = await axios.get(
        `http://yangjian2020.tpddns.cn:5122/QQ/song?songId=${musicItem.id}&cookie=${cookie}&level=${level}`,
        {
          headers: {
            'X-Request-Key': 'share-v2',
          },
          proxy: false,
        },
      );
      console.log(
        `当前是生产环境，所以准备尝试从本地Docker获取url链接，获取结果：${res?.data?.songUrl}`,
      );
    }
  }

  return {
    url: res.data.songUrl,
    lyric: res.data.lyric,
  };
}

export async function getArtistSongs(artistItem, page) {
  // console.log('-------getArtistSongs-------');
  // console.log(`artistItem=${JSON.stringify(artistItem)}`);
  // console.log('-------getArtistSongs-------');
  const pageSizeForArtist = 300;
  const url = changeUrlQuery(
    {
      data: JSON.stringify({
        comm: {
          ct: 24,
          cv: 0,
        },
        singer: {
          method: 'get_singer_detail_info',
          param: {
            sort: 5,
            singermid: artistItem.singerMID,
            sin: (page - 1) * pageSizeForArtist,
            num: pageSizeForArtist,
          },
          module: 'music.web_singer_info_svr',
        },
      }),
    },
    'http://u.y.qq.com/cgi-bin/musicu.fcg',
  );
  const res = (
    await axios({
      url,
      method: 'get',
      headers: headers,
      xsrfCookieName: 'XSRF-TOKEN',
      withCredentials: true,
    })
  ).data;
  return {
    isEnd: res.singer.data.total_song <= page * pageSize,
    data: res.singer.data.songlist.map(formatMusicItem),
  };
}
export async function getArtistAlbums(artistItem, page) {
  const url = changeUrlQuery(
    {
      data: JSON.stringify({
        comm: {
          ct: 24,
          cv: 0,
        },
        singerAlbum: {
          method: 'get_singer_album',
          param: {
            singermid: artistItem.singerMID,
            order: 'time',
            begin: (page - 1) * pageSize,
            num: pageSize / 1,
            exstatus: 1,
          },
          module: 'music.web_singer_info_svr',
        },
      }),
    },
    'http://u.y.qq.com/cgi-bin/musicu.fcg',
  );
  const res = (
    await axios({
      url,
      method: 'get',
      headers: headers,
      xsrfCookieName: 'XSRF-TOKEN',
      withCredentials: true,
    })
  ).data;
  return {
    isEnd: res.singerAlbum.data.total <= page * pageSize,
    data: res.singerAlbum.data.list.map(formatAlbumItem),
  };
}
export async function getArtistWorks(artistItem, page, type) {
  if (type === 'music') {
    return getArtistSongs(artistItem, page);
  }
  if (type === 'album') {
    return getArtistAlbums(artistItem, page);
  }
}

export async function getAlbumInfo(albumItem) {
  const url = changeUrlQuery(
    {
      data: JSON.stringify({
        comm: {
          ct: 24,
          cv: 10000,
        },
        albumSonglist: {
          method: 'GetAlbumSongList',
          param: {
            albumMid: albumItem.albumMID,
            albumID: 0,
            begin: 0,
            num: 999,
            order: 2,
          },
          module: 'music.musichallAlbum.AlbumSongList',
        },
      }),
    },
    'https://u.y.qq.com/cgi-bin/musicu.fcg?g_tk=5381&format=json&inCharset=utf8&outCharset=utf-8',
  );
  const res = (
    await axios({
      url: url,
      headers: headers,
      xsrfCookieName: 'XSRF-TOKEN',
      withCredentials: true,
    })
  ).data;
  console.log(`QQ音乐原始音乐结果，getAlbumInfo：${JSON.stringify(res)}`);
  return {
    musicList: res.albumSonglist.data.songList.map(item => {
      const _ = item.songInfo;
      return formatMusicItem(_);
    }),
  };
}

// export const platformInfo = {
//   platform: '小秋音乐',
//   author: 'Huibq',
//   version: '0.3.0',
//   srcUrl:
//     'https://raw.niuma666bet.buzz/Huibq/keep-alive/master/Music_Free/xiaoqiu.js',
//   cacheControl: 'no-cache',
// };

export class QQApiClint implements PlatformApi {
  async searchSoundAlbum(
    keyWord: string,
    pageNum: number,
  ): Promise<Array<SoundAlbum>> {
    return [];
  }

  async importSongs(importSongs: ImportSongs): Promise<ImportSongsResult> {
    const importSongsResult = await importMusicSheet(importSongs.url);
    importSongsResult.importSongs = importSongsResult.importSongs.map(item =>
      this.convertSong(item),
    );
    return importSongsResult;
  }

  async getMusicDetail(songId: string, cookie: string, level: QQLevel = '320') {
    const source = await getMediaSource({ id: songId }, cookie, level);
    return {
      songUrl: source.url,
      songLyric: source.lyric,
    };
  }

  async searchPlaylistSongs(
    playListId: string,
    pageNum: number,
  ): Promise<Array<Song>> {
    if (pageNum > 1) {
      return [];
    }
    const result = await getMusicSheetInfo({ id: playListId });
    // console.log(
    //   `QQ搜索歌单歌曲，playlistId:${playListId} 结果：${JSON.stringify(result)}`,
    // );
    return result.musicList.importSongs.map(item => this.convertSong(item));
  }
  async searchPlaylist(keyWord: string, pageNum: number): Promise<Array<any>> {
    const result = await searchMusicSheet(keyWord, pageNum);
    console.log(
      `${this.name} searchPlaylist搜索结果：${JSON.stringify(result)}`,
    );
    return result.data.map(item => {
      return {
        platform: this.name,
        playListName: item.title,
        playListId: item.id,
        playListImg: item.artwork,
        playCount: item.playCount,
        countOfSong: item.worksNums,
      };
    });
  }
  async searchAlbumDetail(albumId: string): Promise<Array<Song>> {
    const result = await getAlbumInfo({ albumMID: albumId });
    console.log(
      `${this.name} searchAlbumDetail结果：${JSON.stringify(result)}`,
    );
    return result.musicList.map(item => this.convertSong(item));
  }
  name = ThirdPlatformType.QQ;

  async searchSingerAlbums(singerId: string, pageNum: number): Promise<any> {
    const result = await getArtistWorks(
      { singerMID: singerId },
      pageNum,
      'album',
    );
    // console.log(
    //   `$${this.name} searchSingerAlbums结果${JSON.stringify(result.data)}`,
    // );
    return result.data.map(item => {
      return {
        platform: this.name,
        albumId: item.albumMID,
        albumTitle: item.title,
        albumImg: item.artwork,
        releaseDate: item.date,
        singerId: item.singerMID,
        singerName: item.artist,
        desc: item.description,
      };
    });
  }

  async searchSingerSongs(
    singerId: string,
    pageNum: number,
  ): Promise<Array<Song>> {
    const result = await getArtistWorks(
      { singerMID: singerId },
      pageNum,
      'music',
    );
    console.log(
      `$${this.name} searchSingerSongs结果：${JSON.stringify(result.data)}`,
    );
    return result.data.map(item => this.convertSong(item));
  }

  async searchSinger(keyWord: string, pageNum: number): Promise<Array<Singer>> {
    const result = await searchArtist(keyWord, pageNum);
    // console.log(`${this.name} searchSinger结果：${JSON.stringify(result)}`);
    return result.data.map(item => {
      return {
        platform: this.name,
        singerId: item.singerMID,
        singerName: item.name,
        countOfSong: item.worksNum,
        countOfAlbum: item.albumNum,
        singerImg: item.avatar,
      };
    });
  }

  async searchMusic(keyWord: string, pageNum: number): Promise<Array<Song>> {
    const result = await searchMusic(keyWord, pageNum);
    const convertResult = result.data.map(item => this.convertSong(item));
    return convertResult;
  }

  async searchSoundList(
    albumId: string,
    pageNum: number,
    pageSize: number,
  ): Promise<Array<Sound>> {
    return [];
  }

  convertSong(item): Song {
    return {
      platform: this.name,
      songId: item.songmid,
      songTitle: item.title,
      songImg: item.artwork,
      songUrl: 'http://music.yangjian.tech',
      singerName: item.artist,
      albumId: item.albumid,
      albumTitle: item.album,
      isBookmarked: false,
      valid: item.valid,
    };
  }
}
