const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function getLyric(title, artist) {
  try {
    const searchRes = await axios.get(`https://music.163.com/api/search/get/web?s=${encodeURIComponent(title + ' ' + artist)}&type=1&limit=1`);
    if (searchRes.data.result && searchRes.data.result.songs) {
      const songId = searchRes.data.result.songs[0].id;
      const lyrRes = await axios.get(`https://music.163.com/api/song/lyric?os=pc&id=${songId}&lv=-1`);
      if (lyrRes.data.lrc && lyrRes.data.lrc.lyric) {
        return lyrRes.data.lrc.lyric.replace(/\[.*?\]/g, '').trim();
      }
    }
  } catch (e) { /* Bỏ qua nếu lỗi */ }
  return "Chưa cập nhật được lyric gốc cho bài viết này.";
}

async function start() {
  try {
    console.log('Đang cào dữ liệu Melon...');
    const melonRes = await axios.get('https://www.melon.com/chart/index.htm', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $k = cheerio.load(melonRes.data);
    const krHot = [];
    let i = 0;
    for (const el of $k('.lst50').toArray()) {
      if (i < 10) {
        const title = $k(el).find('.ellipsis.rank01 a').text().trim();
        const artist = $k(el).find('.ellipsis.rank02 a').first().text().trim();
        const lyric = await getLyric(title, artist);
        krHot.push({ rank: i+1, title, artist, lyric });
        i++;
      }
    }

    console.log('Đang cào dữ liệu Billboard Japan...');
    const jpnRes = await axios.get('http://www.billboard-japan.com/charts/detail?a=hot100', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $j = cheerio.load(jpnRes.data);
    const jpHot = [];
    let j = 0;
    for (const el of $j('table.table tbody tr').toArray()) {
      if (j < 10) {
        const title = $j(el).find('.name_detail p.music_name').text().trim();
        const artist = $j(el).find('.name_detail p.artist_name').text().trim();
        const lyric = await getLyric(title, artist);
        jpHot.push({ rank: j+1, title, artist, lyric });
        j++;
      }
    }

    // Các mục OST mẫu cố định (Robot cũng tự động tìm lyric sẵn)
    const krOst = [{ rank: 1, title: "Sudden Shower", artist: "ECLIPSE", movie: "Lovely Runner" }, { rank: 2, title: "I Don't Know", artist: "Seventeen BSS", movie: "Queen of Tears" }];
    for(let s of krOst) { s.lyric = await getLyric(s.title, s.artist); }

    const cnHot = [{ rank: 1, title: "演员", artist: "薛之谦" }, { rank: 2, title: "飞鸟和蝉", artist: "任然" }];
    for(let s of cnHot) { s.lyric = await getLyric(s.title, s.artist); }

    const freshData = {
      KR_HOT: krHot,
      JP_HOT: jpHot,
      CN_HOT: cnHot,
      KR_OST: krOst,
      JP_OST: [{ rank: 1, title: "Rain", artist: "Motohiro Hata", movie: "The Garden of Words", lyric: "Lời gốc Nhật Bản..." }],
      CN_OST: [{ rank: 1, title: "凉凉", artist: "张碧晨", movie: "Tam Sinh Tam Thế", lyric: "Lời gốc Trung Quốc..." }]
    };

    fs.writeFileSync('live-data.json', JSON.stringify(freshData, null, 2));
    console.log('Thành công!');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
start();
