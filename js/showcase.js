/* 深色展示頁：填入股票資料、滑鼠移動棚燈高光、捲動淡入 */
(function () {
  var D = window.STOCK, SW = window.SW;
  var el = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  el("gPrice").innerHTML = D.price.toFixed(1) + "<small>元</small>";
  el("gFoot").textContent = "資料日期 " + D.dataDate + "・非即時股價・僅供學習";
  el("gTag").textContent = D.verdict.replace("／", " · ");
  el("sPE").textContent = D.peTTM + " 倍";
  el("sPEn").textContent = "歷史中位數 " + SW.histMid + " 倍";
  el("sGM").textContent = D.q2[1].value;
  el("sGMn").textContent = D.q2[1].sub;
  el("sEPS").textContent = D.q2[2].value;
  el("sEPSn").textContent = D.q2[2].sub;
  el("sEPSk").textContent = D.q2[2].label.replace("單季", "Q2 單季");
  el("sStop").textContent = D.stopLine + " 元";

  // 玻璃面板內的長條（取最後一張圖表，通常是 EPS；預估值會以較淡色表示）
  var c = SW.epsChart, max = Math.max.apply(null, c.values);
  el("gBars").innerHTML = c.values.map(function (v, i) {
    return '<div style="--h:' + (v / max * 100).toFixed(0) + '%"><span>' + esc(c.labels[i]) + "</span></div>";
  }).join("");

  // 棚燈：高光與微幅傾斜跟著滑鼠
  var stage = el("stage");
  if (!reduce) {
    stage.addEventListener("pointermove", function (e) {
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      stage.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      stage.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      stage.style.setProperty("--ry", ((x - .5) * 6).toFixed(2) + "deg");
      stage.style.setProperty("--rx", ((.5 - y) * 4).toFixed(2) + "deg");
    });
    stage.addEventListener("pointerleave", function () {
      stage.style.setProperty("--rx", "0deg");
      stage.style.setProperty("--ry", "0deg");
    });
  }

  var items = document.querySelectorAll(".rv, .stage");
  if (!("IntersectionObserver" in window)) { items.forEach(function (n) { n.classList.add("in"); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.2 });
  items.forEach(function (n) { io.observe(n); });
})();
