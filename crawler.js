const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function getMusicDetails(title, artist) {
  let songId = '';
  let lyric = 'Chưa cập nhật được lyric gốc cho bài viết này.';
  let ytId = '';

  try {
    const searchRes = await axios.get(`https://music.163.com/api/search/get/web?s=${encodeURIComponent(title + ' ' + artist)}&type=1&limit=1`, { timeout: 5000 });
    if (searchRes.data.result && searchRes.data.result.songs) {
      songId = searchRes.data.result.songs[0].id;
      const lyrRes = await axios.get(`https://music.163.com/api/song/lyric?os=pc&id=${songId}&lv=-1`, { timeout: 5000 });
      if (lyrRes.data.lrc && lyrRes.data.lrc.lyric) {
        lyric = lyrRes.data.lrc.lyric.replace(/\[.*?\]/g, '').trim();
      }
    }
  } catch (e) {}
  
  try {
    const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' ' + artist + ' official mv')}`;
    const ytRes = await axios.get(ytSearchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 5000 });
    const match = ytRes.data.match(/"videoId":"([^"]+)"/);
    if (match && match[1]) { ytId = match[1]; }
  } catch (e) {}
  
  return { songId, lyric, ytId };
}

async function start() {
  // Tạo sẵn khung dữ liệu trống đề phòng lỗi cào web
  const freshData = { KR_HOT: [], JP_HOT: [], CN_HOT: [], KR_OST: [], JP_OST: [], CN_OST: [] };

  // 1. Cào dữ liệu Melon Hàn Quốc
  try {
    console.log('Đang cào dữ liệu Melon Hàn Quốc...');
    const melonRes = await axios.get('https://www.melon.com/chart/index.htm', { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
    const $k = cheerio.load(melonRes.data);
    let i = 0;
    for (const el of $k('.lst50').toArray()) {
      if (i < 10) {
        const title = $k(el).find('.ellipsis.rank01 a').text().trim();
        const artist = $k(el).find('.ellipsis.rank02 a').first().text().trim();
        const details = await getMusicDetails(title, artist);
        freshData.KR_HOT.push({ rank: i+1, title, artist, ...details });
        i++;
      }
    }
  } catch (err) { console.log('Lỗi cào nhạc Hàn, bỏ qua...'); }

  // 2. Cào dữ liệu Billboard Japan
  try {
    console.log('Đang cào dữ liệu Billboard Japan...');
    const jpnRes = await axios.get('https://www.billboard-japan.com/charts/detail?a=hot100', { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
    const $j = cheerio.load(jpnRes.data);
    let j = 0;
    for (const el of $j('table.table tbody tr').toArray()) {
      if (j < 10) {
        const title = $j(el).find('.name_detail p.music_name').text().trim();
        const artist = $j(el).find('.name_detail p.artist_name').text().trim();
        const details = await getMusicDetails(title, artist);
        freshData.JP_HOT.push({ rank: j+1, title, artist, ...details });
        j++;
      }
    }
  } catch (err) { console.log('Lỗi cào nhạc Nhật, bỏ qua...'); }

  // 3. Nạp danh sách Nhạc Trung Quốc và OST
  try {
    const baseCn = [{rank:1, title:"演员", artist:"薛之谦"}, {rank:2, title:"飞鸟和蝉", artist:"任然"}, {rank:3, title:"可能", artist:"程响"}, {rank:4, title:"精卫", artist:"30年前的下午"}, {rank:5, title:"我会等", artist:"承桓"}];
    for(let s of baseCn) { const d = await getMusicDetails(s.title, s.artist); freshData.CN_HOT.push({...s, ...d}); }

    const baseKrOst = [{rank:1, title:"Sudden Shower", artist:"ECLIPSE", movie:"Lovely Runner"}, {rank:2, title:"I Don't Know", artist:"Seventeen BSS", movie:"Queen of Tears"}, {rank:3, title:"Love You With All My Heart", artist:"Crush", movie:"Queen of Tears"}];
    for(let s of baseKrOst) { const d = await getMusicDetails(s.title, s.artist); freshData.KR_OST.push({...s, ...d}); }

    freshData.JP_OST = [{ rank: 1, title: "Rain", artist: "Motohiro Hata", movie: "The Garden of Words", ytId: "776VvO-hPsw", lyric: "言の葉の庭 OST..." }];
    freshData.CN_OST = [{ rank: 1, title: "凉凉", artist: "张碧晨", movie: "Tam Sinh Tam Thế", ytId: "r7821-X3Sww", lyric: "三生三世十里桃花 OST..." }];
  } catch (err) {}

  // Ghi file kết quả
  fs.writeFileSync('live-data.json', JSON.stringify(freshData, null, 2));
  console.log('Hoàn tất cào dữ liệu thành công!');
}

start();
