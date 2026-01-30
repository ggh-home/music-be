import axios from 'axios';
import CryptoJs from 'crypto-js';
import * as crypto from 'crypto';
import qs from 'qs';
import bigInt from 'big-integer';
import dayjs from 'dayjs';
import { PlatformApi } from './platform.api.interface';
import { ThirdPlatformType } from 'src/playlist/enums/platform-type.enum';
import { EnvCode } from 'src/enums/env-code.enum';
import { ImportSongs } from 'src/playlist/dto/import-songs.dto';

// Utility functions
function create_key() {
  let d,
    e,
    b = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    c = '';
  for (d = 0; 16 > d; d += 1)
    (e = Math.random() * b.length), (e = Math.floor(e)), (c += b.charAt(e));
  return c;
}

function AES(a, b) {
  const c = CryptoJs.enc.Utf8.parse(b),
    d = CryptoJs.enc.Utf8.parse('0102030405060708'),
    e = CryptoJs.enc.Utf8.parse(a),
    f = CryptoJs.AES.encrypt(e, c, {
      iv: d,
      mode: CryptoJs.mode.CBC,
    });
  return f.toString();
}

function Rsa(text) {
  text = text.split('').reverse().join('');
  const d = '010001';
  const e =
    '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7';
  const hexText = text
    .split('')
    .map(_ => _.charCodeAt(0).toString(16))
    .join('');
  const res = bigInt(hexText, 16)
    .modPow(bigInt(d, 16), bigInt(e, 16))
    .toString(16);
  return Array(256 - res.length)
    .fill('0')
    .join('')
    .concat(res);
}

function getParamsAndEnc(text) {
  const first = AES(text, '0CoJUm6Qyw8W8jud');
  const rand = create_key();
  const params = AES(first, rand);
  const encSecKey = Rsa(rand);
  return {
    params,
    encSecKey,
  };
}

function formatMusicItem(_) {
  let _a, _b, _c, _d;
  const album = _.al || _.album;
  return {
    id: _.id,
    artwork: album === null || album === void 0 ? void 0 : album.picUrl,
    title: _.name,
    artist: (_.ar || _.artists)[0].name,
    album: album === null || album === void 0 ? void 0 : album.name,
    url: `https://share.duanx.cn/url/wy/${_.id}/128k`,
    qualities: {
      low: {
        size: (_a = _.l || {}) === null || _a === void 0 ? void 0 : _a.size,
      },
      standard: {
        size: (_b = _.m || {}) === null || _b === void 0 ? void 0 : _b.size,
      },
      high: {
        size: (_c = _.h || {}) === null || _c === void 0 ? void 0 : _c.size,
      },
      super: {
        size: (_d = _.sq || {}) === null || _d === void 0 ? void 0 : _d.size,
      },
    },
    copyrightId: _ === null || _ === void 0 ? void 0 : _.copyrightId,
    valid: typeof _.privilege?.st === 'number' ? _.privilege.st >= 0 : true,
  };
}

function formatAlbumItem(_) {
  return {
    id: _.id,
    artist: _.artist.name,
    title: _.name,
    artwork: _.picUrl,
    description: '',
    date: dayjs.unix(_.publishTime / 1000).format('YYYY-MM-DD'),
  };
}

const pageSize = 15;

// Search functionality
export async function searchBase(query, page, type) {
  const data = {
    s: query,
    limit: pageSize,
    type: type,
    offset: (page - 1) * pageSize,
    csrf_token: '',
  };
  const pae = getParamsAndEnc(JSON.stringify(data));
  const paeData = qs.stringify(pae);
  const headers = {
    authority: 'music.163.com',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36',
    'content-type': 'application/x-www-form-urlencoded',
    accept: '*/*',
    origin: 'https://music.163.com',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    referer: 'https://music.163.com/search/',
    'accept-language': 'zh-CN,zh;q=0.9',
  };
  const res = (
    await axios({
      method: 'post',
      url: 'https://music.163.com/weapi/search/get',
      headers,
      data: paeData,
    })
  ).data;
  return res;
}

export async function searchMusic(query, page) {
  const res = await searchBase(query, page, 1);
  const songs =
    'songs' in res.result ? res.result.songs.map(formatMusicItem) : [];
  return {
    isEnd: res.result.songCount <= page * pageSize,
    data: songs,
  };
}

export async function searchAlbum(query, page) {
  const res = await searchBase(query, page, 10);
  const albums = res.result.albums.map(formatAlbumItem);
  return {
    isEnd: res.result.albumCount <= page * pageSize,
    data: albums,
  };
}

export async function searchArtist(query, page) {
  const res = await searchBase(query, page, 100);
  console.log(`网易云searchArtist的原始搜索结果${JSON.stringify(res.result)}`);
  const artists = res.result.artists.map(_ => ({
    name: _.name,
    id: _.id,
    avatar: _.img1v1Url,
    albumNum: _.albumSize,
  }));
  return {
    isEnd: res.result.artistCount <= page * pageSize,
    data: artists,
  };
}

export async function searchMusicSheet(query, page) {
  const res = await searchBase(query, page, 1000);
  const playlists = res.result.playlists.map(_ => {
    let _a;
    return {
      title: _.name,
      id: _.id,
      coverImg: _.coverImgUrl,
      artist: (_a = _.creator) === null || _a === void 0 ? void 0 : _a.nickname,
      playCount: _.playCount,
      worksNum: _.trackCount,
    };
  });
  return {
    isEnd: res.result.playlistCount <= page * pageSize,
    data: playlists,
  };
}

export async function searchLyric(query, page) {
  let _a, _b;
  const res = await searchBase(query, page, 1006);
  const lyrics =
    (_b =
      (_a = res.result.songs) === null || _a === void 0
        ? void 0
        : _a.map(it => {
          let _a, _b, _c, _d;
          return {
            title: it.name,
            artist:
              (_a = it.ar) === null || _a === void 0
                ? void 0
                : _a.map(_ => _.name).join(', '),
            id: it.id,
            artwork:
              (_b = it.al) === null || _b === void 0 ? void 0 : _b.picUrl,
            album: (_c = it.al) === null || _c === void 0 ? void 0 : _c.name,
            rawLrcTxt:
              (_d = it.lyrics) === null || _d === void 0
                ? void 0
                : _d.join('\n'),
          };
        })) !== null && _b !== void 0
      ? _b
      : [];
  return {
    isEnd: res.result.songCount <= page * pageSize,
    data: lyrics,
  };
}

export async function getArtistSongs(artistId, page) {
  const pageSizeForArtist = 60;
  const data = {
    id: artistId,
    private_cloud: 'true',
    work_type: 1,
    order: 'hot', //hot,time
    offset: (page - 1) * pageSizeForArtist,
    limit: pageSizeForArtist,
    csrf_token: '',
  };
  const pae = getParamsAndEnc(JSON.stringify(data));
  const paeData = qs.stringify(pae);
  const headers = {
    authority: 'music.163.com',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36',
    'content-type': 'application/x-www-form-urlencoded',
    accept: '*/*',
    origin: 'https://music.163.com',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    referer: 'https://music.163.com/search/',
    'accept-language': 'zh-CN,zh;q=0.9',
  };

  const res = (
    await axios({
      method: 'post',
      url: `https://music.163.com/weapi/v1/artist/songs?csrf_token=`,
      headers,
      data: paeData,
    })
  ).data;

  return {
    isEnd: !res.more,
    data: res.songs.map(formatMusicItem),
  };
}

export async function getArtistAlbums(artistId, page) {
  const data = {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    total: true,
  };
  const pae = getParamsAndEnc(JSON.stringify(data));
  const paeData = qs.stringify(pae);
  const headers = {
    authority: 'music.163.com',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36',
    'content-type': 'application/x-www-form-urlencoded',
    accept: '*/*',
    origin: 'https://music.163.com',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    referer: 'https://music.163.com/search/',
    'accept-language': 'zh-CN,zh;q=0.9',
  };

  const res = (
    await axios({
      method: 'post',
      url: `https://music.163.com/weapi/artist/albums/${artistId}?csrf_token=`,
      headers,
      data: paeData,
    })
  ).data;
  return {
    isEnd: !res.more,
    data: res.hotAlbums.map(formatAlbumItem),
  };
}

async function getMusicInfo(id: string) {
  const headers = {
    Referer: 'https://y.music.163.com/',
    Origin: 'https://y.music.163.com/',
    authority: 'music.163.com',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  const data = { id: id, ids: `[${id}]` };
  const result = (
    await axios.get('http://music.163.com/api/song/detail', {
      headers,
      params: data,
    })
  ).data;

  return {
    artwork: result.songs[0].album.picUrl,
  };
}

async function getAlbumInfo(albumItem) {
  const headers = {
    Referer: 'https://y.music.163.com/',
    Origin: 'https://y.music.163.com/',
    authority: 'music.163.com',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  const data = {
    resourceType: 3,
    resourceId: albumItem.id,
    limit: 15,
    csrf_token: '',
  };
  const pae = getParamsAndEnc(JSON.stringify(data));
  const paeData = qs.stringify(pae);
  const res = (
    await axios({
      method: 'post',
      url: `https://interface.music.163.com/weapi/v1/album/${albumItem.id}?csrf_token=`,
      headers,
      data: paeData,
    })
  ).data;
  return {
    albumItem: { description: res.album.description },
    musicList: (res.songs || []).map(formatMusicItem),
  };
}

async function getValidMusicItems(trackIds) {
  const headers = {
    Referer: 'https://y.music.163.com/',
    Origin: 'https://y.music.163.com/',
    authority: 'music.163.com',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  try {
    // 获取歌曲详情数据
    const res = (
      await axios.get(
        `https://music.163.com/api/song/detail/?ids=[${trackIds.join(',')}]`,
        { headers },
      )
    ).data;
    const validMusicItems = res.songs.map(formatMusicItem);
    return validMusicItems;
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function getSheetMusicById(id): Promise<ImportSongsResult> {
  const headers = {
    Referer: 'https://y.music.163.com/',
    Origin: 'https://y.music.163.com/',
    authority: 'music.163.com',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36',
  };
  const sheetDetail = (
    await axios.get(
      `https://music.163.com/api/v3/playlist/detail?id=${id}&n=5000`,
      {
        headers,
      },
    )
  ).data;

  const playlistImg = sheetDetail.playlist.coverImgUrl;
  const playlistName = sheetDetail.playlist.name;
  return { playlistImg, playlistId: id, playlistName };

}

async function importMusicSheet(urlLike): Promise<ImportSongsResult> {
  const matchResult = urlLike.match(
    /(?:https:\/\/y\.music\.163\.com\/m\/playlist\?id=([0-9]+))|(?:https?:\/\/music\.163\.com\/playlist\/([0-9]+)\/.*)|(?:https?:\/\/music.163.com(?:\/#|\/m)?\/playlist\?id=(\d+))|(?:^\s*(\d+)\s*$)/,
  );

  if (!matchResult) {
    console.error('No match found');
    return; // or return some default value
  }

  const id =
    matchResult[1] || matchResult[2] || matchResult[3] || matchResult[4];
  return getSheetMusicById(id);
}

type WyyLevel = 'exhigh';

async function getMediaSource(musicItem, cookie, level: WyyLevel = 'exhigh') {
  const res = (
    await axios.get(
      `http://${process.env.NODE_ENV === EnvCode.DEV
        ? 'localhost'
        : process.env.NODE_ENV === EnvCode.PROD
          ? 'localhost'
          : 'localhost'
      }:5122/WYY/song?songId=${musicItem.id}&cookie=${cookie}&level=${level}`,
      {
        headers: {
          'X-Request-Key': 'share-v2',
        },
        proxy: false,
      },
    )
  ).data;
  return {
    url: res.songUrl,
    lyric: res.lyric,
    finalLevel: res.finalLevel,
  };
}

const headers = {
  authority: 'music.163.com',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36',
  'content-type': 'application/x-www-form-urlencoded',
  accept: '*/*',
  origin: 'https://music.163.com',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty',
  referer: 'https://music.163.com/',
  'accept-language': 'zh-CN,zh;q=0.9',
};
async function getRecommendSheetTags() {
  const data = {
    csrf_token: '',
  };
  const pae = getParamsAndEnc(JSON.stringify(data));
  const paeData = qs.stringify(pae);
  const res = (
    await axios({
      method: 'post',
      url: 'https://music.163.com/weapi/playlist/catalogue',
      headers,
      data: paeData,
    })
  ).data;
  const cats = res.categories;
  const map = {};
  const catData = Object.entries(cats).map(_ => {
    const tagData = {
      title: _[1],
      data: [],
    };
    map[_[0]] = tagData;
    return tagData;
  });
  const pinned = [];
  res.sub.forEach(tag => {
    const _tag = {
      id: tag.name,
      title: tag.name,
    };
    if (tag.hot) {
      pinned.push(_tag);
    }
    map[tag.category].data.push(_tag);
  });
  return {
    pinned,
    data: catData,
  };
}
async function getRecommendSheetsByTag(tag, page) {
  const pageSize = 20;
  const data = {
    cat: tag.id || '全部',
    order: 'hot',
    limit: pageSize,
    offset: (page - 1) * pageSize,
    total: true,
    csrf_token: '',
  };
  const pae = getParamsAndEnc(JSON.stringify(data));
  const paeData = qs.stringify(pae);
  const res = (
    await axios({
      method: 'post',
      url: 'https://music.163.com/weapi/playlist/list',
      headers,
      data: paeData,
    })
  ).data;
  const playLists = res.playlists.map(_ => ({
    id: _.id,
    artist: _.creator.nickname,
    title: _.name,
    artwork: _.coverImgUrl,
    playCount: _.playCount,
    createUserId: _.userId,
    createTime: _.createTime,
    description: _.description,
  }));
  return {
    isEnd: !(res.more === true),
    data: playLists,
  };
}

async function getMusicSheetInfo(sheet, pageNum, pageSize) {
  let trackIds = sheet._trackIds;
  if (!trackIds) {
    const id = sheet.id;
    const headers = {
      Referer: 'https://y.music.163.com/',
      Origin: 'https://y.music.163.com/',
      authority: 'music.163.com',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36',
    };
    const sheetDetail = (
      await axios.get(
        `https://music.163.com/api/v3/playlist/detail?id=${id}&n=100000`,
        {
          headers,
          proxy: false,
        },
      )
    ).data;
    trackIds = sheetDetail.playlist.trackIds.map(_ => _.id);
  }
  // const pageSize = 15;
  const currentPageIds = trackIds.slice(
    (pageNum - 1) * pageSize,
    pageNum * pageSize,
  );
  // console.log(`currentPageIds:${currentPageIds}`);
  const res = await getValidMusicItems(currentPageIds);
  let extra = {};
  if (pageNum <= 1) {
    extra = {
      _trackIds: trackIds,
    };
  }
  return Object.assign(
    { isEnd: trackIds.length <= pageNum * pageSize, musicList: res },
    extra,
  );
}


export class WyyApiClient implements PlatformApi {
  name: string = ThirdPlatformType.WYY;

  async searchSoundAlbum(
    keyWord: string,
    pageNum: number,
  ): Promise<Array<SoundAlbum>> {
    return [];
  }

  async importSongs(importSongs: ImportSongs) {
    return await importMusicSheet(importSongs.url);
  }

  async getMusicDetail(songId: string, cookie: string, level: WyyLevel) {
    const musicInfo = await getMusicInfo(songId);
    const source = await getMediaSource({ id: songId }, cookie, level);
    return {
      songImg: musicInfo.artwork,
      songUrl: source.url,
      songLyric: source.lyric,
      finalLevel: source.finalLevel,
    };
  }

  async searchPlaylistSongs(
    playListId: string,
    pageNum: number,
    pageSize: number,
  ): Promise<Array<Song>> {
    const result = await getMusicSheetInfo(
      { id: playListId },
      pageNum,
      pageSize,
    );
    console.log('网易云searchPlaylistSongs结果：' + JSON.stringify(result));
    return result.musicList.map(item => this.convertSong(item));
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
        playListImg: item.coverImg,
        playCount: item.playCount,
        countOfSong: item.worksNum,
      };
    });
  }
  async searchAlbumDetail(albumId: string): Promise<Array<Song>> {
    const result = await getAlbumInfo({ id: albumId });
    console.log(
      `${this.name} searchAlbumDetail结果：${JSON.stringify(result)}`,
    );
    return result.musicList.map(item => this.convertSong(item));
  }
  async searchSingerAlbums(singerId: string, pageNum: number): Promise<any> {
    const result = await getArtistAlbums(singerId, pageNum);

    return result.data.map(item => {
      return {
        platform: this.name,
        albumId: item.id,
        albumTitle: item.title,
        albumImg: item.artwork,
        releaseDate: item.date,
        singerId: '',
        singerName: item.artist,
        desc: item.description,
      };
    });
  }

  async searchSingerSongs(
    singerId: string,
    pageNum: number,
  ): Promise<Array<Song>> {
    const result = await getArtistSongs(singerId, pageNum);

    return result.data.map(item => this.convertSong(item));
  }
  async searchSinger(keyWord: string, pageNum: number): Promise<Array<Singer>> {
    const result = await searchArtist(keyWord, pageNum);
    return result.data.map(item => {
      return {
        platform: this.name,
        singerId: item.id,
        singerName: item.name,
        countOfSong: item.worksNum,
        countOfAlbum: item.albumNum,
        singerImg: item.avatar,
      };
    });
  }

  async searchMusic(keyWord: string, pageNum: number): Promise<Array<Song>> {
    const result = await searchMusic(keyWord, pageNum);

    return result.data.map(item => this.convertSong(item));
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
      songId: item.id,
      songTitle: item.title,
      songUrl: 'http://music.yangjian.tech',
      songImg: '',
      singerName: item.artist,
      albumId: '',
      albumTitle: item.album,
      isBookmarked: false,
      valid: item.valid,
    };
  }
}
