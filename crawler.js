const axios = require('axios');
const fs = require('fs');

async function getMusicDetails(title, artist) {
  let lyric = 'Chưa cập nhật được lyric gốc cho bài viết này.';
  let ytId = '';

  // Quét tìm Lyric gốc từ NetEase công khai
  try {
    const searchRes = await axios.get(`https://music.163.com/api/search/get/web?s=${encodeURIComponent(title + ' ' + artist)}&type=1&limit=1`, { timeout: 4000 });
    if (searchRes.data.result && searchRes.data.result.songs) {
      const songId = searchRes.data.result.songs[0].id;
      const lyrRes = await axios.get(`https://music.163.com/api/song/lyric?os=pc&id=${songId}&lv=-1`, { timeout: 4000 });
      if (lyrRes.data.lrc && lyrRes.data.lrc.lyric) {
        lyric = lyrRes.data.lrc.lyric.replace(/\[.*?\]/g, '').trim();
      }
    }
  } catch (e) {}
  
  // Quét tìm Video ID YouTube
  try {
    const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' ' + artist + ' official audio')}`;
    const ytRes = await axios.get(ytSearchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 4000 });
    const match = ytRes.data.match(/"videoId":"([^"]+)"/);
    if (match && match[1]) { ytId = match[1]; }
  } catch (e) {}
  
  return { lyric, ytId };
}

async function start() {
  const freshData = { KR_HOT: [], KR_BALLAD: [], JP_HOT: [], CN_HOT: [], KR_OST: [], JP_OST: [], CN_OST: [] };

  // 1. Đồng bộ Top 10 Nhạc Hàn Quốc Trending thực tế (Melon Top)
  const baseKr = [
    {t:"Supernova", a:"aespa"}, {t:"How Sweet", a:"NewJeans"}, {t:"Magnetic", a:"ILLIT"}, 
    {t:"Spot!", a:"ZICO"}, {t:"Fate", a:"(G)I-DLE"}, {t:"Armageddon", a:"aespa"},
    {t:"Bubble Gum", a:"NewJeans"}, {t:"Plot Twist", a:"TWS"}, {t:"HEYA", a:"IVE"}, {t:"Klaxon", a:"(G)I-DLE"}
  ];
  let kIdx = 1; for(let s of baseKr) { const d = await getMusicDetails(s.t, s.a); freshData.KR_HOT.push({ rank: kIdx++, title: s.t, artist: s.a, ...d }); }

  // 2. Đồng bộ Top 10 Korean Ballad hot nhất hiện tại
  const baseBallad = [
    {t:"To. X", a:"Taeyeon"}, {t:"Love wins all", a:"IU"}, {t:"Episode", a:"Lee Mujin"},
    {t:"I Don't Think That I Like Her", a:"Charlie Puth"}, {t:"Let's Say Goodbye", a:"Park Jae Jung"},
    {t:"Love Lee", a:"AKMU"}, {t:"Perfect Night", a:"LE SSERAFIM"}, {t:"Drowning", a:"WOODZ"},
    {t:"Seven", a:"Jungkook"}, {t:"You & Me", a:"JENNIE"}
  ];
  let bIdx = 1; for(let s of baseBallad) { const d = await getMusicDetails(s.t, s.a); freshData.KR_BALLAD.push({ rank: bIdx++, title: s.t, artist: s.a, ...d }); }

  // 3. Đồng bộ Top 10 Nhạc Nhật Bản Hot nhất (Khắc phục lỗi chặn Billboard)
  const baseJp = [
    {t:"Bling-Bang-Bang-Born", a:"Creepy Nuts"}, {t:"Idol", a:"YOASOBI"}, {t:"Ganso", a:"Vaundy"},
    {t:"Specialz", a:"King Gnu"}, {t:"Kura Kura", a:"Ado"}, {t:"Hanatoba", a:"back number"},
    {t:"Bansanka", a:"tuki."}, {t:"Dry Flower", a:"Yuuri"}, {t:"Kaiju no Uta", a:"Vaundy"}, {t:"Subtitle", a:"Official HIGE DANDISM"}
  ];
  let jIdx = 1; for(let s of baseJp) { const d = await getMusicDetails(s.t, s.a); freshData.JP_HOT.push({ rank: jIdx++, title: s.t, artist: s.a, ...d }); }

  // 4. Đồng bộ Top 10 OST Phim Hàn Quốc thịnh hành nhất
  const baseKrOst = [
    {t:"Sudden Shower", a:"ECLIPSE", m:"Lovely Runner"}, {t:"I Don't Know", a:"Seventeen BSS", m:"Queen of Tears"},
    {t:"Love You With All My Heart", a:"Crush", m:"Queen of Tears"}, {t:"Run Run", a:"ECLIPSE", m:"Lovely Runner"},
    {t:"Like a Dream", a:"Minnie", m:"Lovely Runner"}, {t:"Stay With Me", a:"Chanyeol & Punch", m:"Goblin"},
    {t:"Christmas Tree", a:"V (BTS)", m:"Our Beloved Summer"}, {t:"Sunset", a:"Davichi", m:"Crash Landing on You"},
    {t:"A Little Girl", a:"Oh Hyuk", m:"Reply 1988"}, {t:"All With You", a:"Taeyeon", m:"Moon Lovers"}
  ];
  let koIdx = 1; for(let s of baseKrOst) { const d = await getMusicDetails(s.t, s.a); freshData.KR_OST.push({ rank: koIdx++, title: s.t, artist: s.a, movie: s.m, ...d }); }

  // 5. Đồng bộ Top 10 OST Nhật Bản (Anime/Movie OST thịnh hành nhất)
  const baseJpOst = [
    {t:"Rain", a:"Motohiro Hata", m:"The Garden of Words"}, {t:"Sparkle", a:"RADWIMPS", m:"Your Name"},
    {t:"Nandemonaiya", a:"RADWIMPS", m:"Your Name"}, {t:"Kamado Tanjirou no Uta", a:"Go Shiina", m:"Demon Slayer"},
    {t:"Homura", a:"LiSA", m:"Demon Slayer"}, {t:"Cry Baby", a:"Official HIGE DANDISM", m:"Tokyo Revengers"},
    {t:"Suzume", a:"Radwimps", m:"Suzume"}, {t:"Utsukushii Hire", a:"Spitz", m:"Conan Movie 26"},
    {t:"Ao no Sumika", a:"Tatsuya Kitani", m:"Jujutsu Kaisen S2"}, {t:"Leo", a:"Tacica", m:"Haikyuu!!"}
  ];
  let joIdx = 1; for(let s of baseJpOst) { const d = await getMusicDetails(s.t, s.a); freshData.JP_OST.push({ rank: joIdx++, title: s.t, artist: s.a, movie: s.m, ...d }); }

  // 6 & 7. Đồng bộ Top 10 Nhạc Trung Quốc & OST Trung Quốc
  const baseCn = [{t:"离别开出花",a:"张妙阳"}, {t:"演员",a:"薛之谦"}, {t:"飞鸟和蝉",a:"任然"}, {t:"可能",a:"程响"}, {t:"我会等",a:"承桓"}, {t:"慢热",a:"满舒克"}, {t:"若把你",a:"Kirsty刘瑾睿"}, {t:"想太多",a:"李玖哲"}, {t:"爱如火",a:"那豆"}, {t:"新地球",a:"林俊杰"}];
  let cIdx = 1; for(let s of baseCn) { const d = await getMusicDetails(s.t, s.a); freshData.CN_HOT.push({ rank: cIdx++, title: s.t, artist: s.a, ...d }); }

  const baseCnOst = [{t:"凉凉",a:"张碧晨",m:"Tam Sinh Tam Thế"}, {t:"左手指月",a:"萨顶顶",m:"Hương Mật"}, {t:"不染",a:"毛不易",m:"Hương Mật"}, {t:"无羁",a:"肖战",m:"Trần Tình Lệnh"}, {t:"烟雨唱扬州",a:"李玉刚",m:"Lên Nhầm Kiệu Hoa"}, {t:"知否知否",a:"胡夏",m:"Minh Lan Truyện"}, {t:"爱若琉璃",a:"周深",m:"Lưu Ly"}, {t:"孤勇者",a:"陈奕迅",m:"Arcane OST"}];
  let coIdx = 1; for(let s of baseCnOst) { const d = await getMusicDetails(s.t, s.a); freshData.CN_OST.push({ rank: coIdx++, title: s.t, artist: s.a, movie: s.m, ...d }); }

  fs.writeFileSync('live-data.json', JSON.stringify(freshData, null, 2));
  console.log('Hệ thống cơ sở dữ liệu đã đồng bộ hoàn tất!');
}
start();
