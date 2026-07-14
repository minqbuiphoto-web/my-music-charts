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
    const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' ' + artist + ' official audio')}`;
    const ytRes = await axios.get(ytSearchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 5000 });
    const match = ytRes.data.match(/"videoId":"([^"]+)"/);
    if (match && match[1]) { ytId = match[1]; }
  } catch (e) {}
  
  return { songId, lyric, ytId };
}

async function start() {
  const freshData = { KR_HOT: [], KR_BALLAD: [], JP_HOT: [], CN_HOT: [], KR_OST: [], JP_OST: [], CN_OST: [] };

  // 1. Cào Top 10 Melon Hàn Quốc
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
  } catch (err) {}

  // 2. Cào Top 10 BẢNG XẾP HẠNG KOREAN BALLAD từ Melon
  try {
    console.log('Đang cào dữ liệu Melon Genre Chart - Ballad...');
    const balladRes = await axios.get('https://www.melon.com/genre/song_list.htm?gnrCode=GN0100', { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
    const $b = cheerio.load(balladRes.data);
    let bi = 0;
    // Tìm các hàng bài hát dựa trên cấu trúc bảng của trang thể loại Melon
    $b('table tbody tr').each(async (index, el) => {
      if (bi < 10) {
        const title = $b(el).find('.ellipsis.rank01 a').text().trim();
        const artist = $b(el).find('.ellipsis.rank02 a').first().text().trim();
        if(title && artist) {
          const details = await getMusicDetails(title, artist);
          freshData.KR_BALLAD.push({ rank: bi+1, title, artist, ...details });
          bi++;
        }
      }
    });
  } catch (err) { console.log('Lỗi cào nhạc Ballad Hàn...'); }

  // 3. Cào Top 10 Billboard Japan
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
  } catch (err) {}

  // 4. Cào BXH OST Hàn Quốc từ chuyên mục Melon
  try {
    console.log('Đang cào dữ liệu chuyên mục OST Melon...');
    const krOstRes = await axios.get('https://www.melon.com/genre/ost_list.htm', { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
    const $ko = cheerio.load(krOstRes.data);
    let o = 0;
    for (const el of $ko('.lst50').toArray()) {
      if (o < 10) {
        const title = $ko(el).find('.ellipsis.rank01 a').text().trim();
        const artist = $ko(el).find('.ellipsis.rank02 a').first().text().trim();
        const details = await getMusicDetails(title, artist);
        freshData.KR_OST.push({ rank: o+1, title, artist, movie: 'K-Drama OST', ...details });
        o++;
      }
    }
  } catch (err) {}

  // 5. Cào BXH OST Nhật Bản từ Billboard Japan Hot Animation
  try {
    console.log('Đang cào dữ liệu Billboard Japan Hot Animation...');
    const jpOstRes = await axios.get('https://www.billboard-japan.com/charts/detail?a=anime', { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
    const $jo = cheerio.load(jpOstRes.data);
    let a = 0;
    for (const el of $jo('table.table tbody tr').toArray()) {
      if (a < 10) {
        const title = $jo(el).find('.name_detail p.music_name').text().trim();
        const artist = $jo(el).find('.name_detail p.artist_name').text().trim();
        const details = await getMusicDetails(title, artist);
        freshData.JP_OST.push({ rank: a+1, title, artist, movie: 'Anime/Movie OST', ...details });
        a++;
      }
    }
  } catch (err) {}

  // 6. Nạp danh sách Nhạc Trung Quốc và OST Trung Quốc
  try {
    const baseCn = [{title:"离别开出花", artist:"张妙阳"}, {title:"演员", artist:"薛之谦"}, {title:"飞鸟和蝉", artist:"任然"}, {title:"可能", artist:"程响"}, {title:"精卫", artist:"30年前 của下午"}, {title:"我会等", artist:"承桓"}];
    let c = 1; for(let s of baseCn) { const d = await getMusicDetails(s.title, s.artist); freshData.CN_HOT.push({ rank: c++, ...s, ...d }); }
    
    const baseCnOst = [{title:"凉凉", artist:"张碧晨", movie:"Tam Sinh Tam Thế"}, {title:"左手指月", artist:"萨顶顶", movie:"Hương Mật"}, {title:"不染", artist:"毛不易", movie:"Hương Mật"}, {title:"无羁", artist:"肖战", movie:"Trần Tình Lệnh"}];
    let co = 1; for(let s of baseCnOst) { const d = await getMusicDetails(s.title, s.artist); freshData.CN_OST.push({ rank: co++, ...s, ...d }); }
  } catch (err) {}

  fs.writeFileSync('live-data.json', JSON.stringify(freshData, null, 2));
  console.log('Hoàn tất cào thêm dữ liệu Ballad!');
}

start();
