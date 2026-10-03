/* 戰情室共用程式：依 window.STOCK（由 loader.js 從資料庫取得）畫出各頁內容 */
(function () {
  var D = window.STOCK;
  // 多頁網站：找不到的元素回傳暫時的空容器，讓各頁共用同一支程式而不出錯
  var $ = function (id) { return document.getElementById(id) || document.createElement("div"); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var fmt = function (n, d) { return Number(n).toLocaleString("zh-TW", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var TONE = { green: "綠燈", yellow: "黃燈", red: "紅燈" };
  var pill = function (tone, text) { return '<span class="pill ' + tone + '">' + esc(text) + "</span>"; };
  var stars = function (n) {
    var s = "";
    for (var i = 1; i <= 5; i++) s += i <= n ? "★" : '<span class="off">★</span>';
    return '<span class="stars" aria-label="' + n + ' 顆星">' + s + "</span>";
  };
  var table = function (head, rows) {
    return "<thead><tr>" + head.map(function (h) {
      return "<th" + (h.num ? ' class="num"' : "") + ">" + esc(h.t) + "</th>";
    }).join("") + "</tr></thead><tbody>" + rows.join("") + "</tbody>";
  };

  // 提供給其他頁面程式共用的推算值
  var lastBand = D.peBands[D.peBands.length - 1].pe;
  window.SW = {
    peMax: Math.ceil(Math.max(D.peTTM, lastBand) * 1.1 / 5) * 5,   // PE 尺標的滿格值
    histMid: D.peBands[1].pe,                                      // 歷史中位數 PE
    gmNow: parseFloat(D.q2[1].value),                              // 最新單季毛利率（%）
    epsChart: D.charts[D.charts.length - 1]                        // 最後一張圖表（EPS）
  };

  /* ---------- 共用導覽列、頁尾、標題 ---------- */
  var brand = D.name + " " + D.code + " 戰情室";
  var PAGES = [
    { id: "home", href: "index.html", label: "總覽" },
    { id: "financials", href: "financials.html", label: "財報" },
    { id: "valuation", href: "valuation.html", label: "估值" },
    { id: "calculator", href: "calculator.html", label: "試算" },
    { id: "risk", href: "risk.html", label: "風險" },
    { id: "news", href: "news.html", label: "新聞" }
  ];
  var cur = document.body.getAttribute("data-page");
  var list = window.STOCK_LIST || [];
  $("siteNav").innerHTML = '<div class="wrap"><a class="brand" href="index.html"><img src="images/logo.svg" alt=""><span>' + esc(brand) + "</span></a><ul>" +
    PAGES.map(function (p) {
      return '<li><a href="' + p.href + '"' + (p.id === cur ? ' class="active" aria-current="page"' : "") + ">" + p.label + "</a></li>";
    }).join("") + '</ul><select id="stockSwitch" class="switch" aria-label="切換股票">' +
    list.map(function (s) {
      return '<option value="' + esc(s.code) + '"' + (s.code === D.code ? " selected" : "") + ">" + esc(s.name + " " + s.code) + "</option>";
    }).join("") + "</select></div>";
  $("stockSwitch").addEventListener("change", function (e) {
    try { localStorage.setItem("stockCode", e.target.value); } catch (err) { /* 忽略 */ }
    location.href = location.pathname;   // 移除網址上的 ?s=，重新載入選到的股票
  });

  var t0 = document.title;
  document.title = t0.indexOf("｜") > -1 ? t0.split("｜")[0] + "｜" + brand : D.name + " " + D.code + " 股票戰情室";
  $("eyebrow").textContent = D.name + " · " + D.code;
  $("siteFooter").innerHTML = '<div class="wrap"><p>資料來源：《' + esc(D.name) + " " + esc(D.code) + " 投資價值分析報告》（分析日期 " + esc(D.dataDate) +
    "）、公開新聞整理。股價與財務數字皆為報告當日資料，不會自動更新。</p>" +
    "<p>免責聲明：本站內容僅供學習與決策框架驗證，不構成任何投資要約或買賣建議。市場存在風險，投資人應獨立判斷並自負盈虧。</p>" +
    '<p style="opacity:.7">內容讀取自：' + (window.DATA_SOURCE === "db" ? "Supabase 資料庫" : "本機備援檔（資料庫暫時無法連線）") + "</p></div>";

  $("stamp").textContent = "資料日期 " + D.dataDate + "（非即時股價）";

  /* ---------- 風險頁頂部：一句話結論與四維評分 ---------- */
  $("oneLine").textContent = D.oneLine;
  $("rateGrid").innerHTML = D.rates.map(function (r) {
    return '<div><div style="font-weight:600">' + esc(r.t) + "</div>" + stars(r.s) + '<div class="chart-note">' + esc(r.d) + "</div></div>";
  }).join("");

  /* ---------- 財報 ---------- */
  $("q2cards").innerHTML = D.q2.map(function (k) {
    return '<div class="card kpi"><div class="label">' + esc(k.label) + '</div><div class="value">' + esc(k.value) + '</div><div class="hint">' + esc(k.sub) + "</div></div>";
  }).join("");

  // 長條圖：預估值（est）用較淡的顏色
  function barChart(c) {
    var W = 300, H = 210, pl = 8, pb = 26, pt = 24, values = c.values;
    var max = Math.max.apply(null, values) * 1.12;
    var n = values.length, gap = 12, bw = (W - pl * 2 - gap * (n - 1)) / n, s = "";
    values.forEach(function (v, i) {
      var h = (v / max) * (H - pb - pt), x = pl + i * (bw + gap), y = H - pb - h;
      var est = (c.est || []).indexOf(i) > -1;
      s += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="6" fill="' + c.color + '"' + (est ? ' opacity=".45"' : "") + "/>";
      s += '<text class="val" x="' + (x + bw / 2) + '" y="' + (y - 6) + '" text-anchor="middle">' + fmt(v, c.digits) + "</text>";
      s += '<text x="' + (x + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(c.labels[i]) + "</text>";
    });
    return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img">' + s + "</svg>";
  }

  // 折線圖（例如毛利率）
  function lineChart(c) {
    var W = 300, H = 210, pl = 22, pr = 22, pb = 26, pt = 28, values = c.values;
    var min = Math.min.apply(null, values) - 2, max = Math.max.apply(null, values) + 2;
    var n = values.length, s = "", pts = [];
    values.forEach(function (v, i) {
      pts.push([pl + i * ((W - pl - pr) / (n - 1)), pt + (1 - (v - min) / (max - min)) * (H - pb - pt)]);
    });
    s += '<polyline fill="none" stroke="' + c.color + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="' + pts.map(function (p) { return p.join(","); }).join(" ") + '"/>';
    pts.forEach(function (p, i) {
      var est = (c.est || []).indexOf(i) > -1;
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="' + c.color + '"' + (est ? ' opacity=".5"' : "") + "/>";
      s += '<text class="val" x="' + p[0] + '" y="' + (p[1] - 12) + '" text-anchor="middle">' + values[i].toFixed(c.digits) + "%</text>";
      s += '<text x="' + p[0] + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(c.labels[i]) + "</text>";
    });
    return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img">' + s + "</svg>";
  }

  $("chartGrid").innerHTML = D.charts.map(function (c) {
    return '<div class="card"><h3>' + esc(c.title) + "</h3><div>" + (c.type === "line" ? lineChart(c) : barChart(c)) + '</div><p class="chart-note">' + esc(c.note || "") + "</p></div>";
  }).join("");

  $("healthTable").innerHTML = table(
    [{ t: "指標" }, { t: "數據" }, { t: "結論" }],
    D.health.map(function (r) {
      return "<tr><td>" + esc(r.item) + "</td><td>" + esc(r.data) + "</td><td>" + pill(r.status, r.result) + "</td></tr>";
    })
  );

  $("scenTable").innerHTML = table(
    [{ t: "情境" }, { t: "2026E", num: 1 }, { t: "2027E", num: 1 }, { t: "2028E", num: 1 }, { t: "達標條件" }],
    D.scenarios.map(function (r) {
      return "<tr" + (r.name === "中性" ? ' class="hl"' : "") + "><td><b>" + esc(r.name) + "</b><br><span class='chart-note'>" + esc(r.desc) + "</span></td>" +
        '<td class="num">' + r.e26.toFixed(2) + '</td><td class="num">' + r.e27.toFixed(2) + '</td><td class="num">' + r.e28.toFixed(2) + "</td><td>" + esc(r.cond) + "</td></tr>";
    })
  );

  /* ---------- 估值 ---------- */
  $("peSub").textContent = "十年歷史區間 " + D.peBands[0].pe + "～" + lastBand + " 倍，現價約 " + D.peForward + "～" + D.peTTM + " 倍，已高於歷史極端上限。";
  (function () {
    var max = window.SW.peMax, pos = function (v) { return Math.min(v / max, 1) * 100; };
    $("peScale").innerHTML = D.peBands.map(function (b) {
      return '<div class="tick" style="left:' + pos(b.pe) + '%"><span>' + b.pe + "x</span></div>";
    }).join("") + '<div class="now" style="left:calc(' + pos(D.peTTM) + '% - 2px)"><span>現在 ' + D.peTTM + " 倍</span></div>";
    $("peLegend").innerHTML = D.peBands.map(function (b) {
      return "<span>" + b.pe + "x ＝ " + esc(b.label) + "</span>";
    }).join("");
  })();

  $("fvTable").innerHTML = table(
    [{ t: "情境" }, { t: "合理 PE", num: 1 }, { t: "2027E EPS", num: 1 }, { t: "合理股價", num: 1 }, { t: "報告年化報酬", num: 1 }],
    D.fairValue.map(function (r) {
      var tone = r.ret.charAt(0) === "+" ? "green" : "red";
      return "<tr><td><b>" + esc(r.name) + "</b></td><td class='num'>" + r.pe + "x</td><td class='num'>" + r.eps.toFixed(1) +
        "</td><td class='num'>" + r.price.toFixed(1) + "</td><td class='num'>" + pill(tone, r.ret) + "</td></tr>";
    })
  );
  if (D.fvNote) $("fvNote").innerHTML = "※ " + esc(D.fvNote) + "本站沿用報告原值；<a href=\"calculator.html\">試算工具</a>可自訂年數。";

  $("entryTable").innerHTML = table(
    [{ t: "價格區間" }, { t: "建議倉位" }, { t: "說明" }],
    D.entry.map(function (r) {
      return "<tr><td><span class='dot " + r.tone + "'></span><b>" + esc(r.range) + "</b></td><td>" + pill(r.tone, r.pos) + "</td><td>" + esc(r.note) + "</td></tr>";
    })
  );

  /* ---------- 試算工具 ---------- */
  var inPrice = $("inPrice"), inScen = $("inScen"), inPE = $("inPE"), inYears = $("inYears");
  var midFv = D.fairValue.filter(function (f) { return f.name === "中性"; })[0] || D.fairValue[1];
  inScen.innerHTML = D.scenarios.map(function (s, i) {
    return '<option value="' + i + '"' + (s.name === "中性" ? " selected" : "") + ">" + esc(s.name) + "（2027E EPS " + s.e27.toFixed(1) + "）</option>";
  }).join("");
  inPrice.value = D.price;
  inPE.value = midFv.pe;
  inYears.value = D.calcYears || 2;

  function calc() {
    if (!document.getElementById("inPrice")) return;
    var price = parseFloat(inPrice.value);
    var sc = D.scenarios[+inScen.value], pe = parseFloat(inPE.value), yrs = parseInt(inYears.value, 10);
    $("peVal").textContent = pe + " 倍";
    $("yrVal").textContent = yrs + " 年";
    if (!(price > 0)) {
      $("calcResult").innerHTML = "";
      $("calcVerdict").className = "verdict";
      $("calcVerdict").textContent = "請輸入大於 0 的買進價。";
      return;
    }
    var future = sc.e27 * pe;
    var total = future / price - 1;
    var annual = Math.pow(future / price, 1 / yrs) - 1;
    var peNow = price / sc.e26;
    $("calcSub").textContent = "以「" + sc.name + "」情境 2027E EPS " + sc.e27.toFixed(1) + " 元 × " + pe + " 倍 = " + future.toFixed(1) + " 元";
    var box = function (k, v) { return '<div class="box"><div class="k">' + k + '</div><div class="v">' + v + "</div></div>"; };
    var pct = function (x) { return (x >= 0 ? "+" : "") + (x * 100).toFixed(1) + "%"; };
    $("calcResult").innerHTML =
      box("買進價對應 2026E PE", peNow.toFixed(1) + " 倍") +
      box("推算未來股價", future.toFixed(1) + " 元") +
      box("總報酬", pct(total)) +
      box("年化報酬（" + yrs + " 年）", pct(annual));
    var v = $("calcVerdict"), tone, msg;
    if (annual >= 0.10) { tone = "green"; msg = "年化報酬 ≥ 10%：在此假設下具吸引力，但仍取決於獲利能否兌現。"; }
    else if (annual >= 0) { tone = "yellow"; msg = "年化報酬介於 0～10%：風險報酬比普通，可考慮等更低價位。"; }
    else { tone = "red"; msg = "年化報酬為負：在此假設下，買進價已高於合理價，風險大於報酬。"; }
    v.className = "verdict " + tone;
    v.textContent = msg + "（報告建議建倉區：" + D.idealZone + "）";
  }
  [inPrice, inScen, inPE, inYears].forEach(function (el) { el.addEventListener("input", calc); });
  calc();

  /* ---------- 風險 ---------- */
  $("revTable").innerHTML = table(
    [{ t: "情境" }, { t: "目標 PE", num: 1 }, { t: "全年淨利（億）", num: 1 }, { t: "全年 EPS", num: 1 }, { t: "Q3 至少淨利（億）", num: 1 }, { t: "Q3 營收驗證線（億）", num: 1 }, { t: "難度" }],
    D.reverse.map(function (r) {
      return "<tr><td><b>" + esc(r.name) + "</b></td><td class='num'>" + r.pe + "x</td><td class='num'>" + r.profit.toFixed(1) + "</td><td class='num'>" + r.eps.toFixed(2) +
        "</td><td class='num'>" + r.q3.toFixed(1) + "</td><td class='num'>" + r.q3rev.toFixed(1) + "</td><td>" + esc(r.note) + "</td></tr>";
    })
  );
  $("q3Line").textContent = D.q3Line;

  $("flagTable").innerHTML = table(
    [{ t: "項目" }, { t: "目前數據" }, { t: "判斷標準" }, { t: "結論" }],
    D.redflags.map(function (r) {
      return "<tr><td>" + esc(r.item) + "</td><td>" + esc(r.data) + "</td><td>" + esc(r.rule) + "</td><td>" + pill(r.status, r.result) + "</td></tr>";
    })
  );

  $("factors").innerHTML = D.factors.map(function (f) {
    return '<div class="card factor"><h3>' + esc(f.title) + (f.now ? pill(f.now, "目前：" + TONE[f.now]) : "") + '</h3><p class="sub">' + esc(f.why) + "</p><dl>" +
      '<dt><span class="dot green"></span>綠燈</dt><dd>' + esc(f.green) + "</dd>" +
      '<dt><span class="dot yellow"></span>黃燈</dt><dd>' + esc(f.yellow) + "</dd>" +
      '<dt><span class="dot red"></span>紅燈</dt><dd>' + esc(f.red) + "</dd>" +
      '<dt>資訊來源</dt><dd>' + esc(f.source) + "</dd></dl></div>";
  }).join("");
  $("exits").innerHTML = D.exits.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");

  /* ---------- 新聞 ---------- */
  $("newsNote").textContent = D.newsNote;
  var TONE_NEWS = { bull: ["green", "偏多"], bear: ["red", "偏空"], neutral: ["neutral", "中性"] };
  $("newsList").innerHTML = D.news.map(function (n) {
    var t = TONE_NEWS[n.tone] || TONE_NEWS.neutral;
    return '<a class="item" href="' + esc(n.url) + '" target="_blank" rel="noopener noreferrer"><div class="meta">' +
      pill(t[0], t[1]) + "<span>" + esc(n.source) + '</span></div><p class="t">' + esc(n.title) + '</p><p class="s">' + esc(n.summary) + "</p></a>";
  }).join("");
  $("links").innerHTML = "官方資料：" + D.links.map(function (l) {
    return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + esc(l.label) + "</a>";
  }).join(" · ");
})();
