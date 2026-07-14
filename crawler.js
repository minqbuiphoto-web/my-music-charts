const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function start() {
  try {
    console.log('Đang cào dữ liệu Melon...');
    const melonRes = await axios.get('https://www.melon.com/chart/index.htm', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $k = cheerio.load(melonRes.data);
    const krHot = [];
    $k('.lst50').each((i, el) => {
      if(i < 10) {
        const title = $k(el).find('.ellipsis.rank01 a').text().trim();
        const artist = $k(el).find('.ellipsis.rank02 a').first().text().trim();
        krHot.push({ rank: i+1, title, artist, ytId: '', songId: '' });
      }
    });

    console.log('Đang cào dữ liệu Billboard Japan...');
    const jpnRes = await axios.get('http://www.billboard-japan.com/charts/detail?a=hot100', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $j = cheerio.load(pnRes.data || jpnRes.data);
    const jpHot = [];
    $j('table.table tbody tr').each((i, el) => {
      if(i < 10) {
        const title = $j(el).find('.name_detail p.music_name').text().trim();
        const artist = $j(el).find('.name_detail p.artist_name').text().trim();
        jpHot.push({ rank: i+1, title, artist, ytId: '', songId: '' });
      }
    });

    // Tạo sẵn danh sách cứng cho các mục OST và Nhạc Trung để chống lỗi
    const freshData = {
      KR_HOT: krHot,
      JP_HOT: jpHot,
      CN_HOT: [
        { rank: 1, title: "离别开出花", artist: "张妙阳" },
        { rank: 2, title: "演员", artist: "薛之谦" },
        { rank: 3, title: "飞鸟和蝉", artist: "任然" },
        { rank: 4, title: "可能", artist: "程响" },
        { rank: 5, title: "精卫", artist: "30年前的下午" },
        { rank: 6, title: "爱如火", artist: "那豆" },
        { rank: 7, title: "乌梅子酱", artist: "李荣浩" },
        { rank: 8, title: "想太多", artist: "李玖哲" },
        { rank: 9, title: "我会等", artist: "承桓" },
        { rank: 10, title: "慢热", artist: "满舒克" }
      ],
      KR_OST: [
        { rank: 1, title: "Sudden Shower", artist: "ECLIPSE", movie: "Lovely Runner" },
        { rank: 2, title: "I Don't Know", artist: "Seventeen BSS", movie: "Queen of Tears" },
        { rank: 3, title: "Love You With All My Heart", artist: "Crush", movie: "Queen of Tears" },
        { rank: 4, title: "Run Run", artist: "ECLIPSE", movie: "Lovely Runner" },
        { rank: 5, title: "Like a Dream", artist: "Minnie", movie: "Lovely Runner" },
        { rank: 6, title: "Stay With Me", artist: "Chanyeol & Punch", movie: "Goblin" },
        { rank: 7, title: "Christmas Tree", artist: "V (BTS)", movie: "Our Beloved Summer" },
        { rank: 8, title: "Sunset", artist: "Davichi", movie: "Crash Landing on You" },
        { rank: 9, title: "A Little Girl", artist: "Oh Hyuk", movie: "Reply 1988" },
        { rank: 10, title: "All With You", artist: "Taeyeon", movie: "Moon Lovers" }
      ],
      JP_OST: [
        { rank: 1, title: "Rain", artist: "Motohiro Hata", movie: "The Garden of Words" },
        { rank: 2, title: "Sparkle", artist: "RADWIMPS", movie: "Your Name" },
        { rank: 3, title: "Nandemonaiya", artist: "RADWIMPS", movie: "Your Name" },
        { rank: 4, title: "Kamado Tanjirou no Uta", artist: "Go Shiina", movie: "Demon Slayer" },
        { rank: 5, title: "Homura", artist: "LiSA", movie: "Demon Slayer" },
        { rank: 6, title: "Cry Baby", artist: "Official HIGE DANDISM", movie: "Tokyo Revengers" },
        { rank: 7, title: "Suzume", artist: "Radwimps", movie: "Suzume" },
        { rank: 8, title: "Utsukushii Hire", artist: "Spitz", movie: "Conan Movie 26" },
        { rank: 9, title: "Ao no Sumika", artist: "Tatsuya Kitani", movie: "Jujutsu Kaisen S2" },
        { rank: 10, title: "Leo", artist: "Tacica", movie: "Haikyuu!!" }
      ],
      CN_OST: [
        { rank: 1, title: "凉凉", artist: "张碧晨 & 杨宗纬", movie: "Tam Sinh Tam Thế" },
        { rank: 2, title: "左手指月", artist: "萨顶顶", movie: "Hương Mật Tựa Khói Sương" },
        { rank: 3, title: "不染", artist: "毛不易", movie: "Hương Mật Tựa Khói Sương" },
        { rank: 4, title: "无羁", artist: "肖战 & 王一博", movie: "Trần Tình Lệnh" },
        { rank: 5, title: "烟雨唱扬州", artist: "李玉刚", movie: "Lên Nhầm Kiệu Hoa" },
        { rank: 6, title: "烟花易冷", artist: "周杰伦", movie: "Lạc Dương" },
        { rank: 7, title: "爱若琉璃", artist: "周深", movie: "Lưu Ly" },
        { rank: 8, title: "独孤", artist: "曾可妮", movie: "Chiếc Bật Lửa" },
        { rank: 9, title: "寻光", artist: "刘宇宁", movie: "Trường Phong Độ" },
        { rank: 10, title: "青丝", artist: "等什么君", movie: "Thả Thí Thiên Hạ" }
      ]
    };

    fs.writeFileSync('live-data.json', JSON.stringify(freshData, null, 2));
    console.log('Ghi file live-data.json thành công!');
  } catch (err) {
    console.error('Lỗi hệ thống cào dữ liệu:', err);
    process.exit(1);
  }
}

start();
