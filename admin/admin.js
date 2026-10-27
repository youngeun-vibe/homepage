/* =========================================================
   홈페이지 관리자 페이지 (Supabase)
   - 로그인: Supabase Auth (이메일·비밀번호)
   - 수정 권한: Supabase 의 admins 표에 등록된 이메일만 (supabase/setup.sql)
   ========================================================= */
(function () {
  "use strict";

  var CONFIG = window.SITE_CONFIG;
  var sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
  var BUCKET = CONFIG.STORAGE_BUCKET;
  var NEWS_CATEGORIES = CONFIG.NEWS_CATEGORIES;

  /* ---------- 입력 항목 정의 ---------- */
  var ICON_HINT = "이모지 한 개 (예: 🤝 🚀 🏛️). Windows: 윈도우키 + 마침표(.)";
  var PAGES = {
    site: {
      label: "기본 정보", desc: "모든 페이지 하단과 협회소개·오시는 길에 표시됩니다.",
      fields: [
        { name: "name", label: "법인명", type: "string", required: true },
        { name: "nameEn", label: "영문명", type: "string" },
        { name: "president", label: "회장 성명", type: "string" },
        { name: "founded", label: "설립연도", type: "string" },
        { name: "address", label: "주소", type: "string" },
        { name: "tel", label: "전화", type: "string" },
        { name: "fax", label: "팩스", type: "string" },
        { name: "email", label: "이메일", type: "string", hint: "홈페이지 '문의하기' 양식이 이 주소로 메일을 보냅니다." },
        { name: "bizNo", label: "고유번호", type: "string" },
        { name: "mapEmbedUrl", label: "지도 주소", type: "string",
          hint: "구글 지도에서 장소 검색 › 공유 › 지도 퍼가기 › HTML 복사 후, src=\"…\" 따옴표 안의 주소만 붙여 넣으세요." }
      ]
    },
    home: {
      label: "메인 화면", desc: "홈페이지 첫 화면의 문구와 숫자, 협력 기관입니다.",
      fields: [
        { name: "heroTitle", label: "대표 문구", type: "text", hint: "줄을 바꾸면 화면에서도 줄이 바뀝니다." },
        { name: "heroText", label: "소개 문장", type: "text" },
        { name: "stats", label: "숫자로 보는 협회", type: "list", addLabel: "숫자 추가",
          hint: "회원사 수는 회원사 목록에서 자동으로 계산되어 맨 앞에 표시됩니다.",
          fields: [
            { name: "value", label: "숫자", type: "string" },
            { name: "label", label: "항목", type: "string" }
          ] },
        { name: "partners", label: "협력 기관", type: "list", addLabel: "기관 추가",
          fields: [
            { name: "name", label: "기관명", type: "string" },
            { name: "url", label: "홈페이지 주소", type: "string", hint: "https:// 로 시작 (없으면 비워 두세요)" }
          ] }
      ]
    },
    about: {
      label: "협회소개", desc: "협회개요, 비전·목표, 연혁, 조직도입니다.",
      fields: [
        { name: "intro", label: "협회개요", type: "text" },
        { name: "vision", label: "비전", type: "string" },
        { name: "goals", label: "목표", type: "list", addLabel: "목표 추가",
          fields: [
            { name: "icon", label: "아이콘", type: "string", hint: ICON_HINT },
            { name: "title", label: "제목", type: "string" },
            { name: "desc", label: "설명", type: "string" }
          ] },
        { name: "history", label: "연혁", type: "list", addLabel: "연도 추가", addToTop: true,
          hint: "최근 연도가 위에 오도록 순서를 맞춰 주세요.",
          fields: [
            { name: "year", label: "연도", type: "string" },
            { name: "items", label: "내용", type: "list", addLabel: "내용 추가", item: { type: "string" } }
          ] },
        { name: "orgUnits", label: "조직도 (사무국 아래 부서)", type: "list", addLabel: "부서 추가",
          fields: [
            { name: "name", label: "부서/분과명", type: "string" },
            { name: "note", label: "설명", type: "string" }
          ] }
      ]
    },
    greeting: {
      label: "회장인사", desc: "회장 사진과 인사말입니다. 회장 성명은 '기본 정보'에서 바꿉니다.",
      fields: [
        { name: "photo", label: "회장 사진", type: "image", hint: "세로 사진(3:4 비율)을 권장합니다." },
        { name: "lead", label: "강조 문구", type: "text" },
        { name: "body", label: "인사말", type: "markdown" }
      ]
    },
    business: {
      label: "주요사업", desc: "주요사업 페이지의 사업 목록입니다.",
      fields: [
        { name: "items", label: "사업 목록", type: "list", addLabel: "사업 추가",
          fields: [
            { name: "icon", label: "아이콘", type: "string", hint: ICON_HINT },
            { name: "title", label: "사업명", type: "string" },
            { name: "desc", label: "설명", type: "text" }
          ] }
      ]
    },
    join: {
      label: "회원가입 안내", desc: "가입 대상, 혜택, 절차, 회비, 신청서 파일입니다.",
      fields: [
        { name: "targets", label: "가입 대상", type: "list", addLabel: "항목 추가", item: { type: "string" } },
        { name: "benefits", label: "회원 혜택", type: "list", addLabel: "항목 추가", item: { type: "string" } },
        { name: "steps", label: "가입 절차", type: "list", addLabel: "단계 추가",
          fields: [
            { name: "title", label: "단계명", type: "string" },
            { name: "desc", label: "설명", type: "string" }
          ] },
        { name: "entranceFee", label: "입회비", type: "string" },
        { name: "annualFee", label: "연회비", type: "string" },
        { name: "documents", label: "구비서류", type: "string" },
        { name: "applicationFile", label: "가입신청서 파일", type: "file" }
      ]
    }
  };

  var NEWS_FIELDS = [
    { name: "title", label: "제목", type: "string", required: true },
    { name: "category", label: "분류", type: "select", required: true,
      options: Object.keys(NEWS_CATEGORIES).map(function (k) { return { value: k, label: NEWS_CATEGORIES[k] }; }) },
    { name: "date", label: "게시일", type: "date", required: true },
    { name: "thumbnail", label: "대표 이미지", type: "image", hint: "목록과 본문 위에 보입니다. 없으면 분류별 기본 그림이 나옵니다." },
    { name: "body", label: "본문", type: "markdown" },
    { name: "attachment", label: "첨부파일", type: "file", hint: "공고문·신청서 등 (PDF, HWP, 엑셀 등 20MB 이하)" }
  ];

  var MEMBER_FIELDS = [
    { name: "name", label: "회사명", type: "string", required: true },
    { name: "category", label: "분야", type: "select", required: true,
      options: CONFIG.MEMBER_CATEGORIES.map(function (c) { return { value: c, label: c }; }) },
    { name: "description", label: "한 줄 소개", type: "string" },
    { name: "logo", label: "로고 이미지", type: "image", hint: "배경이 투명한 PNG 권장. 없으면 회사명이 대신 표시됩니다." },
    { name: "url", label: "홈페이지 주소", type: "string", hint: "https:// 로 시작하는 전체 주소" }
  ];

  /* ---------- 유틸 ---------- */
  function $(id) { return document.getElementById(id); }
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") el.textContent = attrs[k];
      else if (k === "class") el.className = attrs[k];
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) el.setAttribute(k, attrs[k]);
    });
    [].concat(children || []).forEach(function (c) {
      if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  var toastTimer;
  function toast(msg, isError) {
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast show" + (isError ? " error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast"; }, isError ? 6000 : 2500);
  }

  function errMsg(err) {
    var m = (err && (err.message || err.error_description)) || String(err);
    if (/Invalid login credentials/i.test(m)) return "이메일 또는 비밀번호가 올바르지 않습니다.";
    if (/Email not confirmed/i.test(m)) return "이메일 인증이 완료되지 않은 계정입니다. 담당자에게 문의하세요.";
    if (/row-level security|permission denied|Unauthorized|403/i.test(m)) return "수정 권한이 없습니다. 관리자로 등록된 계정인지 확인하세요.";
    if (/exceeded the maximum allowed size|Payload too large|413/i.test(m)) return "파일이 너무 큽니다. (20MB 이하)";
    if (/Failed to fetch|NetworkError/i.test(m)) return "인터넷 연결을 확인해 주세요.";
    if (/rate limit/i.test(m)) return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
    return "오류가 발생했습니다: " + m;
  }

  /* ---------- 저장하지 않은 변경사항 경고 ---------- */
  var dirty = false;
  function setDirty(v) { dirty = v; }
  window.addEventListener("beforeunload", function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ---------- 파일 업로드 ---------- */
  // 큰 사진은 가로 1600px 로 줄여서 올림 (홈페이지 속도)
  function shrinkImage(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return Promise.resolve(file);
    return new Promise(function (resolve) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var max = 1600;
        if (img.width <= max && file.size < 1.5 * 1024 * 1024) return resolve(file);
        var scale = Math.min(1, max / img.width);
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        var type = file.type === "image/png" ? "image/png" : "image/jpeg";
        c.toBlob(function (blob) {
          resolve(blob && blob.size < file.size ? new File([blob], file.name, { type: type }) : file);
        }, type, 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  // 저장 경로는 영문·숫자만 사용 (한글 파일명 오류 방지). 첨부파일은 원래 이름을 ?download= 로 보존
  function upload(file, folder, keepName) {
    return shrinkImage(file).then(function (f) {
      var ext = ((f.name || "").match(/\.([a-zA-Z0-9]{1,8})$/) || [, f.type.split("/")[1] || "bin"])[1].toLowerCase();
      var d = new Date();
      var path = folder + "/" + d.getFullYear() + "/" + d.getTime() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
      return sb.storage.from(BUCKET).upload(path, f, { contentType: f.type || undefined, cacheControl: "31536000", upsert: false })
        .then(function (res) {
          if (res.error) throw res.error;
          var url = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
          return keepName ? url + "?download=" + encodeURIComponent(file.name) : url;
        });
    });
  }

  function fileNameOf(url) {
    var m = /[?&]download=([^&]+)/.exec(url || "");
    return m ? decodeURIComponent(m[1]) : (url || "").split("?")[0].split("/").pop();
  }

  /* ---------- 입력 항목 만들기 ---------- */
  // 각 항목은 { el, get(), mount() } 를 돌려줌. mount 는 화면에 붙은 뒤 호출 (편집기 초기화)
  function buildField(def, value, mounts) {
    var type = def.type;
    var wrap = h("div", { class: "field" });
    var labelEl = h("span", { class: "label" }, [def.label || "", def.required ? h("span", { class: "req", text: "*" }) : null]);
    if (def.label) wrap.appendChild(labelEl);
    var api;

    if (type === "string" || type === "date") {
      var input = h("input", { type: type === "date" ? "date" : "text", required: def.required });
      input.value = value == null ? "" : value;
      wrap.appendChild(input);
      api = { get: function () { return input.value.trim(); } };
    } else if (type === "text") {
      var ta = h("textarea", { required: def.required });
      ta.value = value == null ? "" : value;
      wrap.appendChild(ta);
      api = { get: function () { return ta.value.replace(/\s+$/, ""); } };
    } else if (type === "select") {
      var sel = h("select", { required: def.required }, def.options.map(function (o) {
        return h("option", { value: o.value, text: o.label });
      }));
      if (value && !def.options.some(function (o) { return o.value === value; })) {
        sel.appendChild(h("option", { value: value, text: value }));
      }
      sel.value = value || def.options[0].value;
      wrap.appendChild(sel);
      api = { get: function () { return sel.value; } };
    } else if (type === "image" || type === "file") {
      api = mediaField(def, value || "", wrap);
    } else if (type === "markdown") {
      var box = h("div");
      wrap.appendChild(box);
      var editor;
      mounts.push(function () {
        editor = new window.toastui.Editor({
          el: box,
          height: "460px",
          initialEditType: "wysiwyg",
          previewStyle: "tab",
          hideModeSwitch: true,
          language: "ko-KR",
          usageStatistics: false,
          initialValue: value || "",
          placeholder: "내용을 입력하세요. 사진은 위쪽 그림 버튼으로 넣을 수 있습니다.",
          hooks: {
            addImageBlobHook: function (blob, callback) {
              toast("사진을 올리는 중…");
              upload(blob, "images").then(function (url) { callback(url, ""); toast("사진을 넣었습니다."); })
                .catch(function (e) { toast(errMsg(e), true); });
            }
          },
          events: { change: function () { setDirty(true); } }
        });
      });
      api = { get: function () { return editor ? editor.getMarkdown().replace(/\s+$/, "") : value || ""; } };
    } else if (type === "list") {
      api = listField(def, Array.isArray(value) ? value : [], wrap, mounts);
    }

    if (def.hint) wrap.appendChild(h("div", { class: "hint", text: def.hint }));
    api.el = wrap;
    api.def = def;
    return api;
  }

  function mediaField(def, value, wrap) {
    var current = value;
    var isImage = def.type === "image";
    var box = h("div", { class: "media" });
    var preview = h("div", { class: "preview" });
    var name = h("div", { class: "file-name" });
    var fileInput = h("input", { type: "file", hidden: true, accept: isImage ? "image/*" : null });
    var removeBtn = h("button", { type: "button", class: "btn btn-sm btn-danger", text: "삭제" });
    var pickBtn = h("button", { type: "button", class: "btn btn-sm", text: isImage ? "사진 선택" : "파일 선택" });

    function render() {
      if (isImage) {
        preview.style.backgroundImage = current ? "url(\"" + current.replace(/"/g, "%22") + "\")" : "";
        preview.textContent = current ? "" : "사진 없음";
      }
      name.textContent = current ? (isImage ? "" : fileNameOf(current)) : (isImage ? "" : "파일 없음");
      if (!isImage && current) {
        name.textContent = "";
        name.appendChild(h("a", { href: current, target: "_blank", rel: "noopener", text: fileNameOf(current) }));
      }
      removeBtn.hidden = !current;
      pickBtn.textContent = current ? (isImage ? "사진 바꾸기" : "파일 바꾸기") : (isImage ? "사진 선택" : "파일 선택");
    }

    pickBtn.addEventListener("click", function () { fileInput.click(); });
    removeBtn.addEventListener("click", function () { current = ""; setDirty(true); render(); });
    fileInput.addEventListener("change", function () {
      var f = fileInput.files[0];
      if (!f) return;
      box.classList.add("busy");
      toast("올리는 중…");
      upload(f, isImage ? "images" : "files", !isImage).then(function (url) {
        current = url; setDirty(true); render(); toast("올렸습니다. 저장을 눌러야 반영됩니다.");
      }).catch(function (e) { toast(errMsg(e), true); })
        .then(function () { box.classList.remove("busy"); fileInput.value = ""; });
    });

    if (isImage) box.appendChild(preview);
    box.appendChild(h("div", { style: "display:grid;gap:8px" }, [name, h("div", { class: "media-actions" }, [pickBtn, removeBtn])]));
    box.appendChild(fileInput);
    wrap.appendChild(box);
    render();
    return { get: function () { return current; } };
  }

  function listField(def, items, wrap, mounts) {
    var list = h("div", { class: "list" });
    var entries = [];
    var addBtn = h("button", { type: "button", class: "btn btn-sm add", text: "+ " + (def.addLabel || "추가") });

    function blank() {
      if (def.item) return "";
      var o = {};
      def.fields.forEach(function (f) { o[f.name] = f.type === "list" ? [] : ""; });
      return o;
    }

    function makeEntry(val) {
      var entry = {};
      var tools = h("div", { class: "item-tools" }, [
        h("button", { type: "button", title: "위로", text: "↑", onclick: function () { move(entry, -1); } }),
        h("button", { type: "button", title: "아래로", text: "↓", onclick: function () { move(entry, 1); } }),
        h("button", { type: "button", class: "del", text: "삭제", onclick: function () {
          if (!confirm("이 항목을 삭제할까요?")) return;
          entries.splice(entries.indexOf(entry), 1); entry.el.remove(); setDirty(true);
        } })
      ]);
      var localMounts = [];
      if (def.item) {
        var f = buildField({ type: def.item.type }, val, localMounts);
        entry.el = h("div", { class: "list-item simple" }, [f.el, tools]);
        entry.get = f.get;
      } else {
        var fields = def.fields.map(function (fd) { return buildField(fd, (val || {})[fd.name], localMounts); });
        entry.el = h("div", { class: "list-item" }, [h("div", { class: "list-item-head" }, [h("strong", { text: def.label }), tools])]
          .concat(fields.map(function (f) { return f.el; })));
        entry.get = function () {
          var o = {};
          fields.forEach(function (f) { o[f.def.name] = f.get(); });
          return o;
        };
      }
      entry.mount = function () { localMounts.forEach(function (m) { m(); }); };
      return entry;
    }

    function move(entry, dir) {
      var i = entries.indexOf(entry), j = i + dir;
      if (j < 0 || j >= entries.length) return;
      entries.splice(i, 1); entries.splice(j, 0, entry);
      if (dir < 0) list.insertBefore(entry.el, entries[j + 1].el);
      else list.insertBefore(entry.el, entries[j - 1].el.nextSibling);
      setDirty(true);
    }

    items.forEach(function (v) { var e = makeEntry(v); entries.push(e); list.appendChild(e.el); });
    mounts.push(function () { entries.forEach(function (e) { e.mount(); }); });

    addBtn.addEventListener("click", function () {
      var e = makeEntry(blank());
      if (def.addToTop) { entries.unshift(e); list.insertBefore(e.el, list.firstChild); }
      else { entries.push(e); list.insertBefore(e.el, addBtn); }
      e.mount(); setDirty(true);
      var first = e.el.querySelector("input, textarea");
      if (first) first.focus();
    });
    list.appendChild(addBtn);
    wrap.appendChild(list);
    return { get: function () { return entries.map(function (e) { return e.get(); }); } };
  }

  // 여러 항목으로 된 입력 폼
  function buildForm(defs, data, onSave, extraButtons) {
    var mounts = [];
    var fields = defs.map(function (d) { return buildField(d, data[d.name], mounts); });
    var saveBtn = h("button", { type: "submit", class: "btn btn-primary", text: "저장" });
    var form = h("form", { class: "form panel", novalidate: true }, fields.map(function (f) { return f.el; }));
    var foot = h("div", { class: "form-foot" }, (extraButtons || []).concat([saveBtn]));
    var wrap = h("div", {}, [form, foot]);
    form.addEventListener("input", function () { setDirty(true); });
    foot.addEventListener("click", function (e) { if (e.target === saveBtn) { e.preventDefault(); form.requestSubmit(); } });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var values = {};
      fields.forEach(function (f) { values[f.def.name] = f.get(); });
      var missing = defs.filter(function (d) { return d.required && !values[d.name]; });
      if (missing.length) return toast(missing[0].label + "을(를) 입력해 주세요.", true);
      saveBtn.disabled = true; saveBtn.textContent = "저장 중…";
      Promise.resolve(onSave(values)).then(function (ok) {
        if (ok !== false) { setDirty(false); toast("저장했습니다. 홈페이지에 바로 반영됩니다."); }
      }).catch(function (err) { toast(errMsg(err), true); })
        .then(function () { saveBtn.disabled = false; saveBtn.textContent = "저장"; });
    });
    return { el: wrap, mount: function () { mounts.forEach(function (m) { m(); }); } };
  }

  /* ---------- 화면 ---------- */
  var main = $("main");
  function setMain(children) {
    main.innerHTML = "";
    [].concat(children).forEach(function (c) { if (c) main.appendChild(c); });
    window.scrollTo(0, 0);
  }
  function head(title, desc, actions) {
    return h("div", { class: "page-head" }, [
      h("div", {}, [h("h1", { text: title }), desc ? h("p", { text: desc }) : null]),
      actions ? h("div", { class: "actions" }, actions) : null
    ]);
  }
  function loading() { setMain(h("div", { class: "panel loading", text: "불러오는 중…" })); }
  function failed(err) { setMain(h("div", { class: "panel empty", text: errMsg(err) })); }
  function go(hash) { location.hash = hash; }

  function renderNav() {
    var items = [
      { group: "게시판" },
      { hash: "#news", label: "📢 소식" },
      { hash: "#members", label: "🤝 회원사" },
      { group: "페이지 내용" }
    ].concat(Object.keys(PAGES).map(function (k) { return { hash: "#page/" + k, label: PAGES[k].label }; }));
    var nav = $("side-nav");
    nav.innerHTML = "";
    items.forEach(function (it) {
      nav.appendChild(it.group ? h("div", { class: "group", text: it.group }) : h("a", { href: it.hash, "data-hash": it.hash, text: it.label }));
    });
  }
  function markNav() {
    var cur = location.hash.split("/").slice(0, location.hash.indexOf("#page/") === 0 ? 2 : 1).join("/");
    document.querySelectorAll("#side-nav a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-hash") === cur); });
  }

  /* 소식 목록 */
  function newsList() {
    loading();
    sb.from("news").select("id,title,category,date,thumbnail").order("date", { ascending: false }).order("created_at", { ascending: false })
      .then(function (res) {
        if (res.error) return failed(res.error);
        var rows = res.data;
        var q = h("input", { type: "search", placeholder: "제목 검색" });
        var cat = h("select", {}, [h("option", { value: "", text: "전체 분류" })].concat(Object.keys(NEWS_CATEGORIES).map(function (k) {
          return h("option", { value: k, text: NEWS_CATEGORIES[k] });
        })));
        var ul = h("ul", { class: "rows" });
        function draw() {
          ul.innerHTML = "";
          var items = rows.filter(function (n) {
            return (!cat.value || n.category === cat.value) && (!q.value || n.title.indexOf(q.value.trim()) > -1);
          });
          if (!items.length) ul.appendChild(h("li", { class: "empty", text: "글이 없습니다." }));
          items.forEach(function (n) {
            ul.appendChild(h("li", {}, [
              h("div", { class: "thumb", style: n.thumbnail ? "background-image:url(\"" + n.thumbnail.replace(/"/g, "%22") + "\");background-size:cover" : "" }),
              h("div", { class: "main-col" }, [
                h("a", { class: "title", href: "#news/" + n.id, text: n.title }),
                h("div", { class: "meta" }, [h("span", { class: "tag", text: NEWS_CATEGORIES[n.category] || n.category }), n.date])
              ]),
              h("a", { class: "btn btn-sm", href: "#news/" + n.id, text: "수정" }),
              h("button", { class: "btn btn-sm btn-danger", type: "button", text: "삭제", onclick: function () { deleteNews(n); } })
            ]));
          });
        }
        q.addEventListener("input", draw);
        cat.addEventListener("change", draw);
        draw();
        setMain([
          head("소식", "공지사항, 행사·교육, 지원사업, 언론보도 글을 관리합니다. (" + rows.length + "개)",
            [h("a", { class: "btn btn-primary", href: "#news/new", text: "+ 새 글 쓰기" })]),
          h("div", { class: "panel" }, [h("div", { class: "filters" }, [q, cat]), ul])
        ]);
      });
  }

  function deleteNews(n) {
    if (!confirm("'" + n.title + "' 글을 삭제할까요?\n삭제하면 되돌릴 수 없습니다.")) return;
    sb.from("news").delete().eq("id", n.id).select().then(function (res) {
      if (res.error) return toast(errMsg(res.error), true);
      if (!res.data.length) return toast(errMsg("permission denied"), true);
      toast("삭제했습니다.");
      newsList();
    });
  }

  /* 소식 편집 */
  function newsEdit(id) {
    loading();
    var isNew = id === "new";
    var p = isNew ? Promise.resolve({ data: { category: "notice", date: today() } })
      : sb.from("news").select("*").eq("id", id).maybeSingle();
    p.then(function (res) {
      if (res.error) return failed(res.error);
      if (!res.data) return failed("글을 찾을 수 없습니다.");
      var form = buildForm(NEWS_FIELDS, res.data, function (v) {
        var q = isNew ? sb.from("news").insert(v).select().single() : sb.from("news").update(v).eq("id", id).select().single();
        return q.then(function (r) {
          if (r.error) throw r.error;
          if (isNew) { setDirty(false); go("#news/" + r.data.id); }
        });
      }, [h("a", { class: "btn", href: "#news", text: "목록으로" }),
          isNew ? null : h("a", { class: "btn", href: "/news-view.html?id=" + id, target: "_blank", rel: "noopener", text: "홈페이지에서 보기 ↗" })]);
      setMain([head(isNew ? "새 소식 쓰기" : "소식 수정", null), form.el]);
      form.mount();
    });
  }

  /* 회원사 목록 */
  function memberList() {
    loading();
    sb.from("members").select("*").order("sort_order").order("created_at").then(function (res) {
      if (res.error) return failed(res.error);
      var rows = res.data;
      var q = h("input", { type: "search", placeholder: "회사명 검색" });
      var ul = h("ul", { class: "rows" });
      function draw() {
        ul.innerHTML = "";
        var filtering = !!q.value.trim();
        rows.forEach(function (m, i) {
          if (filtering && m.name.indexOf(q.value.trim()) < 0) return;
          ul.appendChild(h("li", {}, [
            h("div", { class: "thumb", style: m.logo ? "background-image:url(\"" + m.logo.replace(/"/g, "%22") + "\")" : "" }),
            h("div", { class: "main-col" }, [
              h("a", { class: "title", href: "#members/" + m.id, text: m.name }),
              h("div", { class: "meta" }, [h("span", { class: "tag", text: m.category }), m.description])
            ]),
            filtering ? null : h("div", { class: "item-tools" }, [
              h("button", { type: "button", title: "위로", text: "↑", disabled: i === 0, onclick: function () { swap(i, i - 1); } }),
              h("button", { type: "button", title: "아래로", text: "↓", disabled: i === rows.length - 1, onclick: function () { swap(i, i + 1); } })
            ]),
            h("a", { class: "btn btn-sm", href: "#members/" + m.id, text: "수정" }),
            h("button", { class: "btn btn-sm btn-danger", type: "button", text: "삭제", onclick: function () { deleteMember(m); } })
          ]));
        });
        if (!ul.children.length) ul.appendChild(h("li", { class: "empty", text: "회원사가 없습니다." }));
      }
      // 순서 바꾸기: 전체 순서를 1,2,3… 으로 다시 저장
      function swap(i, j) {
        var tmp = rows[i]; rows[i] = rows[j]; rows[j] = tmp;
        draw();
        Promise.all(rows.map(function (m, k) {
          if (m.sort_order === k + 1) return null;
          m.sort_order = k + 1;
          return sb.from("members").update({ sort_order: k + 1 }).eq("id", m.id).then(function (r) { if (r.error) throw r.error; });
        })).then(function () { toast("순서를 저장했습니다."); }).catch(function (e) { toast(errMsg(e), true); memberList(); });
      }
      q.addEventListener("input", draw);
      draw();
      setMain([
        head("회원사", "회원사 소개 페이지에 보이는 목록입니다. ↑↓ 로 순서를 바꿉니다. (" + rows.length + "곳)",
          [h("a", { class: "btn btn-primary", href: "#members/new", text: "+ 회원사 추가" })]),
        h("div", { class: "panel" }, [h("div", { class: "filters" }, [q]), ul])
      ]);
    });
  }

  function deleteMember(m) {
    if (!confirm("'" + m.name + "' 회원사를 삭제할까요?\n삭제하면 되돌릴 수 없습니다.")) return;
    sb.from("members").delete().eq("id", m.id).select().then(function (res) {
      if (res.error) return toast(errMsg(res.error), true);
      if (!res.data.length) return toast(errMsg("permission denied"), true);
      toast("삭제했습니다.");
      memberList();
    });
  }

  /* 회원사 편집 */
  function memberEdit(id) {
    loading();
    var isNew = id === "new";
    var p = isNew ? Promise.resolve({ data: {} }) : sb.from("members").select("*").eq("id", id).maybeSingle();
    p.then(function (res) {
      if (res.error) return failed(res.error);
      if (!res.data) return failed("회원사를 찾을 수 없습니다.");
      var form = buildForm(MEMBER_FIELDS, res.data, function (v) {
        if (!isNew) {
          return sb.from("members").update(v).eq("id", id).select().single().then(function (r) { if (r.error) throw r.error; });
        }
        // 새 회원사는 목록 맨 뒤에
        return sb.from("members").select("sort_order").order("sort_order", { ascending: false }).limit(1).then(function (r) {
          if (r.error) throw r.error;
          v.sort_order = (r.data[0] ? r.data[0].sort_order : 0) + 1;
          return sb.from("members").insert(v).select().single();
        }).then(function (r) {
          if (r.error) throw r.error;
          setDirty(false);
          go("#members");
        });
      }, [h("a", { class: "btn", href: "#members", text: "목록으로" })]);
      setMain([head(isNew ? "회원사 추가" : "회원사 수정", null), form.el]);
      form.mount();
    });
  }

  /* 페이지 내용 */
  function pageEdit(key) {
    var def = PAGES[key];
    if (!def) return go("#news");
    loading();
    sb.from("pages").select("data").eq("key", key).maybeSingle().then(function (res) {
      if (res.error) return failed(res.error);
      var data = (res.data && res.data.data) || {};
      var form = buildForm(def.fields, data, function (v) {
        // 화면에 없는 기존 값은 그대로 두고 덮어쓰기
        var merged = Object.assign({}, data, v);
        return sb.from("pages").upsert({ key: key, data: merged }).select().single().then(function (r) {
          if (r.error) throw r.error;
          data = merged;
        });
      });
      setMain([head(def.label, def.desc), form.el]);
      form.mount();
    });
  }

  /* ---------- 라우팅 ---------- */
  var lastHash = "";
  function route() {
    var hash = location.hash || "#news";
    if (dirty && hash !== lastHash) {
      if (!confirm("저장하지 않은 내용이 있습니다. 이동할까요?")) {
        history.replaceState(null, "", lastHash);
        return;
      }
      setDirty(false);
    }
    lastHash = hash;
    markNav();
    var parts = hash.slice(1).split("/");
    if (parts[0] === "news") return parts[1] ? newsEdit(parts[1]) : newsList();
    if (parts[0] === "members") return parts[1] ? memberEdit(parts[1]) : memberList();
    if (parts[0] === "page") return pageEdit(parts[1]);
    go("#news");
  }

  /* ---------- 로그인 ---------- */
  function show(view) {
    ["view-login", "view-recovery", "view-app"].forEach(function (v) { $(v).hidden = v !== view; });
  }

  var started = false;
  function startApp(session) {
    sb.rpc("is_admin").then(function (res) {
      if (res.error || !res.data) {
        show("view-login");
        $("login-msg").textContent = res.error ? errMsg(res.error)
          : "관리자로 등록되지 않은 계정입니다. (" + session.user.email + ") 담당자에게 등록을 요청하세요.";
        sb.auth.signOut();
        return;
      }
      $("user-email").textContent = session.user.email;
      show("view-app");
      if (!started) {
        started = true;
        renderNav();
        window.addEventListener("hashchange", route);
        route();
      }
    });
  }

  $("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, btn = f.querySelector(".btn-primary");
    $("login-msg").textContent = "";
    btn.disabled = true;
    sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value }).then(function (res) {
      btn.disabled = false;
      if (res.error) { $("login-msg").textContent = errMsg(res.error); return; }
      f.password.value = "";
      startApp(res.data.session);
    });
  });

  $("forgot-btn").addEventListener("click", function () {
    var email = $("login-form").email.value.trim() || prompt("가입된 이메일 주소를 입력하세요.");
    if (!email) return;
    sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/admin/" }).then(function (res) {
      var msg = $("login-msg");
      msg.className = "auth-msg" + (res.error ? "" : " ok");
      msg.textContent = res.error ? errMsg(res.error) : "비밀번호 재설정 메일을 보냈습니다. 메일의 링크를 눌러 새 비밀번호를 정하세요.";
    });
  });

  $("recovery-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, msg = $("recovery-msg");
    if (f.password.value !== f.password2.value) { msg.textContent = "두 비밀번호가 다릅니다."; return; }
    sb.auth.updateUser({ password: f.password.value }).then(function (res) {
      if (res.error) { msg.textContent = errMsg(res.error); return; }
      toast("비밀번호를 바꿨습니다.");
      history.replaceState(null, "", "/admin/");
      sb.auth.getSession().then(function (r) { startApp(r.data.session); });
    });
  });

  $("logout-btn").addEventListener("click", function () {
    if (dirty && !confirm("저장하지 않은 내용이 있습니다. 로그아웃할까요?")) return;
    setDirty(false);
    sb.auth.signOut().then(function () { location.replace("/admin/"); });
  });

  // 비밀번호 재설정 메일의 링크로 들어온 경우 (#...type=recovery)
  var recovering = /type=recovery/.test(location.hash);
  if (recovering) show("view-recovery");
  sb.auth.onAuthStateChange(function (event) {
    if (event === "PASSWORD_RECOVERY") { recovering = true; show("view-recovery"); }
  });

  sb.auth.getSession().then(function (res) {
    if (recovering) return;
    if (res.data.session) startApp(res.data.session);
    else show("view-login");
  });
})();
