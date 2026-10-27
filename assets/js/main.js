/* =========================================================
   공통 레이아웃(헤더·푸터) 및 페이지별 렌더링
   - 콘텐츠는 content/*.json 에서 불러옵니다. (관리자 페이지 /admin 에서 수정)
   ========================================================= */
(function () {
  "use strict";

  // 분류를 바꾸면 admin/config.yml 의 소식 분류(select options)도 같이 바꿔 주세요.
  var NEWS_CATEGORIES = {
    notice: "공지사항",
    event: "행사·교육",
    support: "지원사업",
    press: "언론보도"
  };

  var MENU = [
    {
      label: "협회소개", href: "about.html",
      sub: [
        { label: "협회개요", href: "about.html#overview" },
        { label: "비전·목표", href: "about.html#vision" },
        { label: "연혁", href: "about.html#history" },
        { label: "조직도", href: "about.html#organization" },
        { label: "오시는 길", href: "about.html#location" }
      ]
    },
    { label: "회장인사", href: "greeting.html" },
    { label: "주요사업", href: "business.html" },
    {
      label: "소식", href: "news.html",
      sub: Object.keys(NEWS_CATEGORIES).map(function (k) {
        return { label: NEWS_CATEGORIES[k], href: "news.html?category=" + k };
      })
    },
    {
      label: "회원사", href: "members.html",
      sub: [
        { label: "회원사 소개", href: "members.html" },
        { label: "회원가입 안내", href: "join.html" },
        { label: "문의하기", href: "join.html#contact" }
      ]
    }
  ];

  var file = location.pathname.split("/").pop() || "index.html";
  var menuPage = { "news-view.html": "news.html", "join.html": "members.html" }[file] || file;

  var S = {};

  /* ---------- 유틸 ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // 줄바꿈을 <br>로 (제목 등 짧은 문구용)
  function escBr(str) { return esc(str).replace(/\n/g, "<br>"); }
  // 마크다운 → HTML (관리자 페이지에서 작성한 본문)
  function md(str) {
    var html = window.marked ? window.marked.parse(str || "") : "<p>" + escBr(str) + "</p>";
    return html.replace(/(src|href)="\/assets\//g, '$1="assets/');
  }
  // javascript: 같은 위험한 주소 차단. 관리자 페이지가 저장하는 "/assets/..." 는
  // 상대경로로 바꿔 도메인 연결 전(github.io/저장소명/)에도 보이게 함
  function safeUrl(u) {
    if (!u || /^\s*(javascript|data|vbscript):/i.test(u)) return "";
    return u.replace(/^\/(?!\/)/, "");
  }

  function load(name) {
    return fetch("content/" + name + ".json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(name + ".json 을 불러오지 못했습니다.");
      return r.json();
    });
  }

  /* ---------- Header ---------- */
  function renderHeader() {
    var el = $("site-header");
    if (!el) return;
    var items = MENU.map(function (m) {
      var sub = m.sub ? '<ul class="sub">' + m.sub.map(function (s) {
        return '<li><a href="' + s.href + '">' + esc(s.label) + "</a></li>";
      }).join("") + "</ul>" : "";
      var active = m.href === menuPage ? ' class="active" aria-current="page"' : "";
      return '<li><a href="' + m.href + '"' + active + ">" + esc(m.label) + "</a>" + sub + "</li>";
    }).join("");

    el.className = "site-header";
    el.innerHTML =
      '<div class="container"><a class="logo" href="index.html"><img src="assets/img/logo.jpg" alt="사단법인 제주바이오기업협회"></a>' +
      '<nav class="gnb" id="gnb" aria-label="주 메뉴"><ul>' + items + "</ul></nav>" +
      '<button class="menu-toggle" aria-label="메뉴 열기" aria-expanded="false" aria-controls="gnb"><span></span><span></span><span></span></button>' +
      "</div>";

    var btn = el.querySelector(".menu-toggle");
    var nav = el.querySelector(".gnb");
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && nav.classList.contains("open")) btn.click();
    });
  }

  /* ---------- Footer ---------- */
  function renderFooter() {
    var el = $("site-footer");
    if (!el) return;
    el.className = "site-footer";
    el.innerHTML =
      '<div class="container">' +
      '<div class="top"><a class="logo" href="index.html"><span>' + esc(S.name) + "<small>" + esc(S.nameEn) + "</small></span></a>" +
      '<div class="footer-links"><a href="about.html">협회소개</a><a href="news.html">소식</a>' +
      '<a href="members.html">회원사</a><a href="join.html">회원가입 안내</a><a href="join.html#contact">문의하기</a>' +
      '<a href="privacy.html"><strong>개인정보처리방침</strong></a></div></div>' +
      "<address>" + esc(S.name) + " | 대표자 " + esc(S.president) + " | 고유번호 " + esc(S.bizNo) + "<br>" +
      "주소 " + esc(S.address) + "<br>" +
      "TEL " + esc(S.tel) + " | FAX " + esc(S.fax) + " | E-mail " + esc(S.email) + "</address>" +
      '<p class="copy">© ' + new Date().getFullYear() + " " + esc(S.nameEn) + ". All rights reserved.</p>" +
      "</div>";
  }

  /* data-site="키" 요소에 기관 정보 채우기 */
  function fillSiteFields() {
    document.querySelectorAll("[data-site]").forEach(function (el) {
      var v = S[el.getAttribute("data-site")];
      if (v !== undefined) el.textContent = v;
    });
  }

  function iconCards(items) {
    return items.map(function (g) {
      return '<div class="card"><div class="icon">' + esc(g.icon) + "</div><h3>" + esc(g.title) + "</h3><p>" + esc(g.desc) + "</p></div>";
    }).join("");
  }

  function listItems(arr) {
    return (arr || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
  }

  /* ---------- 소식 ---------- */
  var ICONS = { notice: "📢", event: "🎤", support: "🤝", press: "📰" };
  var COLORS = {
    notice: "linear-gradient(135deg,#0068a8,#2f8fd0)",
    event: "linear-gradient(135deg,#74a82a,#a6d45e)",
    support: "linear-gradient(135deg,#0a8fc4,#4cc6f0)",
    press: "linear-gradient(135deg,#101868,#3a46a0)"
  };

  function sortNews(news) {
    return news.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }
  function badge(cat) {
    return '<span class="badge ' + esc(cat) + '">' + esc(NEWS_CATEGORIES[cat] || cat) + "</span>";
  }
  function newsLink(n) { return "news-view.html?id=" + encodeURIComponent(n.id); }
  function newsCard(n) {
    var thumb = n.thumbnail
      ? '<div class="thumb"><img src="' + esc(safeUrl(n.thumbnail)) + '" alt=""></div>'
      : '<div class="thumb" style="background:' + (COLORS[n.category] || COLORS.notice) + '">' + (ICONS[n.category] || "📢") + "</div>";
    return '<a class="card news-card" href="' + newsLink(n) + '">' + thumb +
      badge(n.category) + "<h3>" + esc(n.title) + '</h3><span class="date">' + esc(n.date) + "</span></a>";
  }

  function renderNewsList(news) {
    var listEl = $("news-list");
    var tabsEl = $("news-tabs");
    var current = new URLSearchParams(location.search).get("category") || "all";
    var cats = Object.assign({ all: "전체" }, NEWS_CATEGORIES);

    function draw() {
      tabsEl.innerHTML = Object.keys(cats).map(function (k) {
        return '<button class="chip' + (k === current ? " active" : "") + '" data-cat="' + k + '">' + esc(cats[k]) + "</button>";
      }).join("");
      var items = sortNews(news).filter(function (n) { return current === "all" || n.category === current; });
      listEl.innerHTML = items.length ? items.map(function (n) {
        return "<li>" + badge(n.category) + '<a href="' + newsLink(n) + '">' + esc(n.title) + "</a>" +
          '<span class="date">' + esc(n.date) + "</span></li>";
      }).join("") : '<li class="empty">등록된 게시물이 없습니다.</li>';
    }

    tabsEl.addEventListener("click", function (e) {
      var cat = e.target.getAttribute("data-cat");
      if (!cat) return;
      current = cat;
      history.replaceState(null, "", cat === "all" ? "news.html" : "news.html?category=" + cat);
      draw();
    });
    draw();
  }

  function renderNewsView(news) {
    var el = $("news-view");
    var id = new URLSearchParams(location.search).get("id");
    var n = news.filter(function (x) { return String(x.id) === id; })[0];
    if (!n) {
      el.innerHTML = '<p class="empty">게시물을 찾을 수 없습니다.</p><div class="article-foot"><a class="btn btn-outline" href="news.html">목록으로</a></div>';
      return;
    }
    document.title = n.title + " | " + S.name;
    var attach = n.attachment
      ? '<p class="attach">📎 <a href="' + esc(safeUrl(n.attachment)) + '" download>첨부파일 내려받기 (' + esc(n.attachment.split("/").pop()) + ")</a></p>"
      : "";
    el.innerHTML =
      '<div class="article-head">' + badge(n.category) + "<h2>" + esc(n.title) + '</h2><p class="meta">' + esc(n.date) + " · " + esc(S.name) + "</p></div>" +
      (n.thumbnail ? '<img class="article-img" src="' + esc(safeUrl(n.thumbnail)) + '" alt="">' : "") +
      '<div class="article-body">' + md(n.body) + "</div>" + attach +
      '<div class="article-foot"><a class="btn btn-outline" href="news.html">목록으로</a></div>';
  }

  /* ---------- 회원사 ---------- */
  function renderMembers(members) {
    var listEl = $("member-list");
    var tabsEl = $("member-tabs");
    var searchEl = $("member-search");
    var cats = ["전체"];
    members.forEach(function (m) { if (m.category && cats.indexOf(m.category) < 0) cats.push(m.category); });
    var current = "전체";

    function draw() {
      tabsEl.innerHTML = cats.map(function (c) {
        return '<button class="chip' + (c === current ? " active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
      }).join("");
      var q = (searchEl.value || "").trim().toLowerCase();
      var items = members.filter(function (m) {
        return (current === "전체" || m.category === current) &&
          (!q || (m.name + " " + m.desc).toLowerCase().indexOf(q) > -1);
      });
      $("member-count").textContent = items.length;
      listEl.innerHTML = items.length ? items.map(function (m) {
        var initial = String(m.name).replace(/주식회사|\(주\)|㈜|[\[\]\s]/g, "").slice(0, 5);
        var url = safeUrl(m.url);
        var more = url ? '<a class="more" href="' + esc(url) + '" target="_blank" rel="noopener">홈페이지 바로가기 →</a>' : "";
        return '<div class="card member-card"><div class="member-logo">' +
          (m.logo ? '<img src="' + esc(safeUrl(m.logo)) + '" alt="' + esc(m.name) + ' 로고">' : esc(initial)) +
          '</div><span class="tag">' + esc(m.category) + "</span><h3>" + esc(m.name) + "</h3><p>" + esc(m.desc) + "</p>" + more + "</div>";
      }).join("") : '<p class="empty">검색 결과가 없습니다.</p>';
    }

    tabsEl.addEventListener("click", function (e) {
      var cat = e.target.getAttribute("data-cat");
      if (!cat) return;
      current = cat;
      draw();
    });
    searchEl.addEventListener("input", draw);
    draw();
  }

  /* ---------- 문의 폼 (메일 앱 연결) ---------- */
  function bindContactForm() {
    var form = $("contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var body = "구분: " + d.get("type") + "\n기업/기관명: " + d.get("company") + "\n담당자: " + d.get("name") +
        "\n연락처: " + d.get("phone") + "\n이메일: " + d.get("email") + "\n\n" + d.get("message");
      var to = String(S.email).replace(/[\[\]]/g, "");
      location.href = "mailto:" + to + "?subject=" + encodeURIComponent("[홈페이지 문의] " + d.get("type") + " - " + d.get("company")) +
        "&body=" + encodeURIComponent(body);
      $("form-msg").style.display = "block";
    });
  }

  /* ---------- 페이지별 렌더링 ---------- */
  var PAGES = {
    "index.html": function () {
      return Promise.all([load("home"), load("news"), load("members")]).then(function (r) {
        var home = r[0];
        $("hero-title").innerHTML = escBr(home.heroTitle);
        $("hero-text").textContent = home.heroText;
        $("stats").innerHTML = '<div class="stat"><strong>' + r[2].length + "</strong><span>회원사</span></div>" +
          (home.stats || []).map(function (s) {
            return '<div class="stat"><strong>' + esc(s.value) + "</strong><span>" + esc(s.label) + "</span></div>";
          }).join("");
        $("partners").innerHTML = (home.partners || []).map(function (p) {
          var url = safeUrl(p.url);
          return url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(p.name) + "</a>" : "<span>" + esc(p.name) + "</span>";
        }).join("");
        $("latest-news").innerHTML = sortNews(r[1]).slice(0, 3).map(newsCard).join("");
      });
    },
    "about.html": function () {
      return Promise.all([load("about"), load("members")]).then(function (r) {
        var a = r[0];
        $("about-intro").textContent = a.intro;
        $("member-total").textContent = r[1].length;
        $("vision-text").textContent = a.vision;
        $("goals").innerHTML = iconCards(a.goals || []);
        $("history-list").innerHTML = (a.history || []).map(function (h) {
          return '<li><div class="year">' + esc(h.year) + '</div><div class="desc">' + (h.items || []).map(esc).join("<br>") + "</div></li>";
        }).join("");
        $("org-units").innerHTML = (a.orgUnits || []).map(function (u) {
          return '<div class="org-node">' + esc(u.name) + (u.note ? "<small>" + esc(u.note) + "</small>" : "") + "</div>";
        }).join("");
        var mapUrl = safeUrl(S.mapEmbedUrl);
        $("map").innerHTML = mapUrl
          ? '<iframe src="' + esc(mapUrl) + '" title="협회 위치 지도" loading="lazy"></iframe>'
          : "지도 영역 — 관리자 페이지 › 기본 정보 › 지도 주소를 입력하세요.";
      });
    },
    "greeting.html": function () {
      return load("greeting").then(function (g) {
        $("greeting-lead").innerHTML = "“" + escBr(g.lead) + "”";
        $("greeting-body").innerHTML = md(g.body);
        if (g.photo) $("portrait").innerHTML = '<img src="' + esc(safeUrl(g.photo)) + '" alt="회장 사진">';
      });
    },
    "business.html": function () {
      return load("business").then(function (b) { $("business-items").innerHTML = iconCards(b.items || []); });
    },
    "news.html": function () { return load("news").then(renderNewsList); },
    "news-view.html": function () { return load("news").then(renderNewsView); },
    "members.html": function () { return load("members").then(renderMembers); },
    "join.html": function () {
      bindContactForm();
      return load("join").then(function (j) {
        $("join-targets").innerHTML = listItems(j.targets);
        $("join-benefits").innerHTML = listItems(j.benefits);
        $("join-steps").innerHTML = (j.steps || []).map(function (s) {
          return '<div class="step"><h3>' + esc(s.title) + "</h3><p>" + esc(s.desc) + "</p></div>";
        }).join("");
        $("join-entrance").textContent = j.entranceFee;
        $("join-annual").textContent = j.annualFee;
        $("join-docs").innerHTML = esc(j.documents) + (j.applicationFile
          ? ' <a class="file-link" href="' + esc(safeUrl(j.applicationFile)) + '" download>[가입신청서 내려받기]</a>' : "");
      });
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    renderHeader();
    load("site").then(function (site) {
      S = site;
      renderFooter();
      return PAGES[file] && PAGES[file]();
    }).then(function () {
      fillSiteFields();
      // 콘텐츠가 그려진 뒤 #앵커 위치로 다시 이동
      var target = location.hash && document.querySelector(location.hash);
      if (target) target.scrollIntoView();
    }).catch(function (err) {
      console.error(err);
      var main = $("main");
      if (main) main.insertAdjacentHTML("afterbegin", '<p class="load-error">콘텐츠를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>');
    });
  });
})();
