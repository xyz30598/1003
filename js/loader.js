/* 資料載入器：從 Supabase 讀取股票資料，失敗時改讀 data/ 資料夾的備援檔，
 * 讀到之後設定 window.STOCK，再依序載入頁面需要的其他 script。
 * 這裡的 key 是「可公開」的 publishable key；資料表只開放讀取（RLS），無法被改寫。 */
(function () {
  var SUPABASE_URL = "https://ouprnizilddzhhejwybf.supabase.co";
  var SUPABASE_KEY = "sb_publishable_Zs5rFdCoW3FxKoQNQF8LkQ_HLohpBUg";
  var DEFAULT_CODE = "3264";
  var FALLBACK_LIST = [{ code: "2313", name: "華通電腦" }, { code: "3264", name: "欣銓科技" }];

  var self = document.currentScript;
  var next = (self.getAttribute("data-next") || "").split(/\s+/).filter(Boolean);

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 無痕模式等情況：忽略 */ } }
  };

  // 目前要看哪一檔：網址 ?s=2313 優先，其次是上次選的，最後是預設
  var q = new URLSearchParams(location.search).get("s");
  var code = [q, store.get("stockCode"), DEFAULT_CODE].filter(function (c) { return /^\d{4}$/.test(c || ""); })[0];

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error("timeout")); }, ms);
      promise.then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
    });
  }
  function api(path) {
    return withTimeout(fetch(SUPABASE_URL + "/rest/v1/" + path, { headers: { apikey: SUPABASE_KEY } }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }), 6000);
  }
  function local(file) {
    return fetch(file).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }

  function fromDb(c) {
    return Promise.all([
      api("stocks?select=code,name&order=code"),
      api("stocks?select=data&code=eq." + c)
    ]).then(function (res) {
      if (!res[1].length) throw new Error("not found");
      return { list: res[0], stock: res[1][0].data, source: "db" };
    });
  }
  function fromLocal(c) {
    return local("data/" + c + ".json").then(function (stock) {
      return { list: FALLBACK_LIST, stock: stock, source: "local" };
    });
  }

  function loadScripts(i) {
    if (i >= next.length) return;
    var s = document.createElement("script");
    s.src = next[i];
    s.onload = function () { loadScripts(i + 1); };
    document.body.appendChild(s);
  }

  fromDb(code).catch(function () { return fromLocal(code); }).catch(function () {
    return fromLocal(DEFAULT_CODE);
  }).then(function (r) {
    window.STOCK = r.stock;
    window.STOCK_LIST = r.list;
    window.DATA_SOURCE = r.source;
    store.set("stockCode", r.stock.code);
    loadScripts(0);
  }).catch(function () {
    var p = document.createElement("p");
    p.style.cssText = "text-align:center;padding:80px 24px;font:16px sans-serif";
    p.textContent = "資料載入失敗，請檢查網路連線後重新整理。";
    document.body.appendChild(p);
  });
})();
