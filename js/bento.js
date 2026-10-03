/* Bento 版面：填入股票資料並加上進場動畫 */
(function () {
  var D = window.STOCK, SW = window.SW;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  $("bLead").textContent = D.oneLine;
  $("bTag").textContent = D.verdict.replace("／", " · ");
  $("bPrice").innerHTML = D.price.toFixed(1) + "<small>元</small>";
  $("bDate").textContent = "資料日期 " + D.dataDate + "・非即時股價・僅供學習";
  $("bPE").innerHTML = D.peTTM + "<small>倍</small>";
  $("bPENow").textContent = D.peTTM + " 倍";
  $("bPEMid").textContent = SW.histMid + " 倍";
  $("bGM").innerHTML = D.q2[1].value.replace("%", "<small>%</small>");
  $("bGMn").textContent = D.q2[1].sub;
  $("bStop").innerHTML = D.stopLine + "<small>元</small>";
  $("bIdeal").textContent = "理想建倉區：" + D.idealZone;
  $("bRateNote").textContent = D.ratingNote;

  var s = "";
  for (var i = 1; i <= 5; i++) s += i <= D.rating ? "★" : '<span class="off">★</span>';
  $("bStars").innerHTML = s;

  // 本益比：現在 vs 歷史中位數
  $("fNow").style.setProperty("--w", (D.peTTM / SW.peMax * 100).toFixed(1) + "%");
  $("fMid").style.setProperty("--w", (SW.histMid / SW.peMax * 100).toFixed(1) + "%");

  // 長條圖（取最後一張圖表，通常是 EPS）
  var c = SW.epsChart, max = Math.max.apply(null, c.values);
  $("bEpsTitle").textContent = c.title + (c.note ? "・" + c.note : "");
  $("bBars").innerHTML = c.values.map(function (v, i) {
    return '<div style="--h:' + (v / max * 100).toFixed(0) + '%"><b>' + v.toFixed(c.digits) + "</b><span>" + esc(c.labels[i]) + "</span></div>";
  }).join("");

  var items = document.querySelectorAll(".rv");
  if (!("IntersectionObserver" in window)) { items.forEach(function (n) { n.classList.add("in"); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) {
        var d = Array.prototype.indexOf.call(items, e.target) % 4;
        e.target.style.transitionDelay = (d * 70) + "ms";
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(function (n) { io.observe(n); });
})();
