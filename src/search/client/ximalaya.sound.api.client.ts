import { ThirdPlatformType } from 'src/playlist/enums/platform-type.enum';
import { PlatformApi } from './platform.api.interface';
import axios from 'axios';
import { EnvCode } from 'src/enums/env-code.enum';
import { isEmpty } from 'lodash';
import { UtilsApiService } from 'src/utils-api/utils.api.service';


export class XmlyApiClient implements PlatformApi {
  constructor(private readonly utilsService: UtilsApiService) { }

  name: string = ThirdPlatformType.XMLY;

  async searchSoundAlbum(
    keyWord: string,
    pageNum: number,
  ): Promise<Array<SoundAlbum>> {
    const res = (
      await axios.get(
        `http://${process.env.NODE_ENV === EnvCode.DEV
          ? '192.168.0.150'
          : process.env.NODE_ENV === EnvCode.PROD
            ? '172.16.22.26'
            : '192.168.0.4'
        }:5123/XMLY/search?keyWord=${keyWord}&pageNum=${pageNum}&pageSize=15`,
        {
          proxy: false,
        },
      )
    ).data;
    console.log(
      `调用喜马拉雅python apisearchSoundAlbum返回原始数据：${JSON.stringify(res)}`,
    );
    return res.map(item => this.convertSearchResult(item));
  }

  async searchSoundList(
    albumId: string,
    pageNum: number,
    pageSize: number,
    sort: SortType,
    cookie: string,
    bid: string,
    ctn: string,
  ): Promise<Array<Sound>> {
    const sortValue = sort === 'ASC' ? 0 : 1;
    let soundListResult = (
      await axios.get(
        `http://${process.env.NODE_ENV === EnvCode.DEV
          ? '192.168.0.150'
          : process.env.NODE_ENV === EnvCode.PROD
            ? '172.16.22.26'
            : '192.168.0.4'
        }:5123/XMLY/album-detail?albumId=${albumId}&pageNum=${pageNum}&pageSize=${pageSize}&cookie=${encodeURIComponent(cookie)}&bid=${encodeURIComponent(bid)}&ctn=${encodeURIComponent(ctn)}&sort=${sortValue}`,
        {
          proxy: false,
        },
      )
    ).data;

    if (process.env.NODE_ENV === EnvCode.PROD) {
      // 生产环境，如果服务器的IP出问题了，那么尝试请求本地环境的
      if (isEmpty(soundListResult)) {
        console.log(
          `searchSoundList，生产环境第一次请求云服务器Docker，结果为空：${soundListResult.length} 准备尝试请求本地Docker~`,
        );
        soundListResult = (
          await axios.get(
            `http://yangjian2020.tpddns.cn:5123/XMLY/album-detail?albumId=${albumId}&pageNum=${pageNum}&pageSize=${pageSize}&cookie=${encodeURIComponent(cookie)}&bid=${encodeURIComponent(bid)}&ctn=${encodeURIComponent(ctn)}&sort=${sortValue}`,
            {
              proxy: false,
            },
          )
        ).data;
        console.log(`尝试从本地docker获取到结果：${soundListResult.length}`);
      }
    }
    return soundListResult.map(item => this.convertSound(item));
  }

  async searchPlaylist(keyWord: string, pageNum: number): Promise<Array<any>> {
    return [];
  }

  async getSoundDetail(
    soundId: string,
    cookie: string,
    bid: string,
    ctn: string,
  ): Promise<any> {
    let songUrl = await this._getSoundDetail(
      soundId,
      cookie,
      bid,
      ctn,
      '172.16.22.26',
    );
    console.log(`getSoundDetail首次从云服务器Docker返回songUrl：${songUrl}`);
    if (isEmpty(songUrl) && process.env.NODE_ENV === EnvCode.PROD) {
      console.log(
        `生产环境，getSoundDetail首次从云服务器Docker返回空songUrl，准备尝试本地Docker请求~`,
      );
      songUrl = await this._getSoundDetail(
        soundId,
        cookie,
        bid,
        ctn,
        'yangjian2020.tpddns.cn',
      );
      console.log(`本地Docker请求后返回地址：${songUrl}`);
    }
    return { songUrl };
  }

  async _getSoundDetail(
    soundId: string,
    cookie: string,
    bid: string,
    ctn: string,
    hostOfProd: string,
  ): Promise<any> {
    const res = (
      await axios.get(
        `http://${process.env.NODE_ENV === EnvCode.DEV
          ? '192.168.0.150'
          : process.env.NODE_ENV === EnvCode.PROD
            ? hostOfProd
            : '192.168.0.4'
        }:5123/XMLY/sound/url?trackId=${soundId}&cookie=${encodeURIComponent(cookie)}&bid=${encodeURIComponent(bid)}&ctn=${encodeURIComponent(ctn)}`,
        {
          proxy: false,
        },
      )
    ).data;
    console.log(
      `调用喜马拉雅python api getSoundDetail返回原始数据：${JSON.stringify(res)}`,
    );
    let songUrl;
    if (res && res['MP3_64']) {
      songUrl = res['MP3_64'];
    } else if (res && res['M4A_128']) {
      songUrl = res['M4A_128'];
    } else if (res && res['M4A_64']) {
      songUrl = res['M4A_64'];
    } else if (res && res['M4A_32']) {
      songUrl = res['M4A_32'];
    } else if (res && res['MP3_32']) {
      songUrl = res['MP3_32'];
    }

    return songUrl;
  }

  convertSound(item: any): Sound {
    return {
      platform: this.name,
      sort: item.index,
      songId: item.trackId,
      songTitle: item.title,
      songImg: 'https://imagev2.xmcdn.com/' + item.albumCoverPath,
      songUrl: 'http://yangjian.tech',
      singerName: item.anchorName,
      albumId: item.albumId,
      albumTitle: item.albumTitle,
      isBookmarked: false,
      songType: 'sound',
      valid: true,
    };
  }

  convertSearchResult(rawItem): SoundAlbum {
    let vipType: VipType;
    if (rawItem.is_paid === false) {
      vipType = 'Free';
    } else if (rawItem.vipFreeType === 1) {
      vipType = 'Vip';
    } else if (rawItem.price && rawItem.price > 0) {
      vipType = 'Purchse';
    } else {
      vipType = 'Svip';
    }
    return {
      platform: this.name,
      albumId: rawItem.id,
      albumTitle: rawItem.title,
      albumImg: 'https://' + rawItem.cover_path,
      countOfSounds: rawItem.tracks,
      releaseDate: '',
      desc: rawItem.intro,
      vipType: vipType,
      isFinished: rawItem.is_finished === 2,
      soundAlbumUpdateAt: rawItem.updated_at,
    };
  }

  async searchSinger(keyWord: string, pageNum: number): Promise<Array<Singer>> {
    return [];
  }

  async searchMusic(keyWord: string, pageNum: number): Promise<Array<Song>> {
    return [];
  }
}
