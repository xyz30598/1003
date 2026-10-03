/* 首頁落地頁：填入股票資料，並加上捲動淡入動畫 */
(function () {
  var D = window.STOCK, SW = window.SW;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  $("lStamp").textContent = "資料日期 " + D.dataDate + "・非即時股價・僅供學習";
  $("mPrice").innerHTML = D.price.toFixed(1) + "<small>元</small>";
  $("mPE").textContent = D.peTTM + " 倍";
  $("mHist").textContent = SW.histMid + " 倍";
  $("mGM").textContent = D.q2[1].value;

  // 巨大數字區
  $("statList").innerHTML = D.stats.map(function (s) {
    return '<div class="stat rv"><div class="num c-' + esc(s.tone) + '">' + esc(s.num) + "<sup>" + esc(s.unit) + "</sup></div><h2>" +
      esc(s.title) + "</h2><p>" + esc(s.note) + "</p></div>";
  }).join("");

  // 進度條寬度（PE 以尺標滿格值為準；毛利率以 50% 為滿格）
  var fills = {
    fPE: D.peTTM / SW.peMax * 100,
    fHist: SW.histMid / SW.peMax * 100,
    fGM: Math.min(SW.gmNow / 50, 1) * 100
  };
  Object.keys(fills).forEach(function (k) {
    $(k).style.setProperty("--w", fills[k].toFixed(1) + "%");
  });

  // 捲動淡入
  var items = document.querySelectorAll(".rv, .mock");
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.18 });
  items.forEach(function (el) { io.observe(el); });
})();
