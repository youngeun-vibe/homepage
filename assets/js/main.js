/* =========================================================
   공통 레이아웃(헤더·푸터) 및 페이지별 렌더링
   ========================================================= */
(function () {
  "use strict";

  var S = window.SITE;
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
      sub: Object.keys(window.NEWS_CATEGORIES).map(function (k) {
        return { label: window.NEWS_CATEGORIES[k], href: "news.html?category=" + k };
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

  var page = (location.pathname.split("/").pop() || "index.html").split("?")[0];
  if (page === "news-view.html") page = "news.html";
  if (page === "join.html") page = "members.html";

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function logoHTML() {
    return '<a class="logo" href="index.html"><span class="logo-mark">' + esc(S.shortName) +
      '</span><span>' + esc(S.name.replace("사단법인 ", "")) + '<small>' + esc(S.nameEn) + '</small></span></a>';
  }

  /* ---------- Header ---------- */
  function renderHeader() {
    var el = document.getElementById("site-header");
    if (!el) return;
    var items = MENU.map(function (m) {
      var sub = m.sub ? '<ul class="sub">' + m.sub.map(function (s) {
        return '<li><a href="' + s.href + '">' + esc(s.label) + '</a></li>';
      }).join("") + "</ul>" : "";
      var active = m.href === page ? ' class="active" aria-current="page"' : "";
      return '<li><a href="' + m.href + '"' + active + ">" + esc(m.label) + "</a>" + sub + "</li>";
    }).join("");

    el.className = "site-header";
    el.innerHTML =
      '<div class="container">' + logoHTML() +
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
    var el = document.getElementById("site-footer");
    if (!el) return;
    el.className = "site-footer";
    el.innerHTML =
      '<div class="container">' +
      '<div class="top">' + logoHTML() +
      '<div class="footer-links"><a href="about.html">협회소개</a><a href="news.html">소식</a>' +
      '<a href="members.html">회원사</a><a href="join.html">회원가입 안내</a><a href="join.html#contact">문의하기</a>' +
      '<a href="privacy.html"><strong>개인정보처리방침</strong></a></div></div>' +
      "<address>" + esc(S.name) + " | 대표자 " + esc(S.president) + " | 고유번호 " + esc(S.bizNo) + "<br>" +
      "주소 " + esc(S.address) + "<br>" +
      "TEL " + esc(S.tel) + " | FAX " + esc(S.fax) + " | E-mail " + esc(S.email) + "</address>" +
      '<p class="copy">© ' + new Date().getFullYear() + " " + esc(S.nameEn) + ". All rights reserved.</p>" +
      "</div>";
  }

  /* ---------- 공통 치환: data-site="키" 요소에 SITE 값 채우기 ---------- */
  function fillSiteFields() {
    document.querySelectorAll("[data-site]").forEach(function (el) {
      var v = S[el.getAttribute("data-site")];
      if (v !== undefined) el.textContent = v;
    });
  }

  /* ---------- 소식 ---------- */
  var ICONS = { notice: "📢", event: "🎤", support: "🤝", press: "📰" };
  var COLORS = {
    notice: "linear-gradient(135deg,#0b6e8a,#2a8fae)",
    event: "linear-gradient(135deg,#f28c28,#f6b26b)",
    support: "linear-gradient(135deg,#6a4bb3,#9a7fd6)",
    press: "linear-gradient(135deg,#2f9e6e,#5cc193)"
  };

  function newsCard(n) {
    return '<a class="card news-card" href="news-view.html?id=' + n.id + '">' +
      '<div class="thumb" style="background:' + COLORS[n.category] + '">' + ICONS[n.category] + "</div>" +
      '<span class="badge ' + n.category + '">' + esc(window.NEWS_CATEGORIES[n.category]) + "</span>" +
      "<h3>" + esc(n.title) + "</h3>" +
      '<span class="date">' + esc(n.date) + "</span></a>";
  }

  function sortedNews() {
    return window.NEWS.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
  }

  function renderLatestNews() {
    var el = document.getElementById("latest-news");
    if (!el) return;
    el.innerHTML = sortedNews().slice(0, 3).map(newsCard).join("");
  }

  function renderNewsList() {
    var listEl = document.getElementById("news-list");
    var tabsEl = document.getElementById("news-tabs");
    if (!listEl || !tabsEl) return;

    var params = new URLSearchParams(location.search);
    var current = params.get("category") || "all";
    var cats = Object.assign({ all: "전체" }, window.NEWS_CATEGORIES);

    function draw() {
      tabsEl.innerHTML = Object.keys(cats).map(function (k) {
        return '<button class="chip' + (k === current ? " active" : "") + '" data-cat="' + k + '">' + esc(cats[k]) + "</button>";
      }).join("");
      var items = sortedNews().filter(function (n) { return current === "all" || n.category === current; });
      listEl.innerHTML = items.length ? items.map(function (n) {
        return '<li><span class="badge ' + n.category + '">' + esc(window.NEWS_CATEGORIES[n.category]) + "</span>" +
          '<a href="news-view.html?id=' + n.id + '">' + esc(n.title) + "</a>" +
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

  function renderNewsView() {
    var el = document.getElementById("news-view");
    if (!el) return;
    var id = Number(new URLSearchParams(location.search).get("id"));
    var n = window.NEWS.filter(function (x) { return x.id === id; })[0];
    if (!n) {
      el.innerHTML = '<p class="empty">게시물을 찾을 수 없습니다.</p><div class="article-foot"><a class="btn btn-outline" href="news.html">목록으로</a></div>';
      return;
    }
    document.title = n.title + " | " + S.name;
    el.innerHTML =
      '<div class="article-head"><span class="badge ' + n.category + '">' + esc(window.NEWS_CATEGORIES[n.category]) + "</span>" +
      "<h2>" + esc(n.title) + '</h2><p class="meta">' + esc(n.date) + " · " + esc(S.name) + "</p></div>" +
      '<div class="article-body">' + n.content.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
      '<div class="article-foot"><a class="btn btn-outline" href="news.html">목록으로</a></div>';
  }

  /* ---------- 회원사 ---------- */
  function renderMembers() {
    var listEl = document.getElementById("member-list");
    var tabsEl = document.getElementById("member-tabs");
    var searchEl = document.getElementById("member-search");
    var countEl = document.getElementById("member-count");
    if (!listEl) return;

    var cats = ["전체"];
    window.MEMBERS.forEach(function (m) { if (cats.indexOf(m.category) < 0) cats.push(m.category); });
    var current = "전체";

    function draw() {
      tabsEl.innerHTML = cats.map(function (c) {
        return '<button class="chip' + (c === current ? " active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
      }).join("");
      var q = (searchEl.value || "").trim().toLowerCase();
      var items = window.MEMBERS.filter(function (m) {
        return (current === "전체" || m.category === current) &&
          (!q || (m.name + " " + m.desc).toLowerCase().indexOf(q) > -1);
      });
      countEl.textContent = items.length;
      listEl.innerHTML = items.length ? items.map(function (m) {
        var initial = m.name.replace(/주식회사|\(주\)|㈜|[\[\]\s]/g, "").slice(0, 5);
        var more = m.url ? '<a class="more" href="' + esc(m.url) + '" target="_blank" rel="noopener">홈페이지 바로가기 →</a>' : "";
        return '<div class="card member-card"><div class="member-logo">' +
          (m.logo ? '<img src="' + esc(m.logo) + '" alt="' + esc(m.name) + ' 로고" style="max-height:60px">' : esc(initial)) +
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

  function renderMemberCount() {
    document.querySelectorAll("[data-member-count]").forEach(function (el) {
      el.textContent = window.MEMBERS.length;
    });
  }

  /* ---------- 지도 ---------- */
  function renderMap() {
    var el = document.getElementById("map");
    if (!el) return;
    if (S.mapEmbedUrl) {
      el.innerHTML = '<iframe src="' + esc(S.mapEmbedUrl) + '" title="협회 위치 지도" loading="lazy"></iframe>';
    } else {
      el.textContent = "지도 영역 — data.js의 mapEmbedUrl에 지도 퍼가기 주소를 입력하세요.";
    }
  }

  /* ---------- 문의 폼 (백엔드 연동 전: 메일 앱 연결) ---------- */
  function bindContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var body = "구분: " + d.get("type") + "\n기업/기관명: " + d.get("company") + "\n담당자: " + d.get("name") +
        "\n연락처: " + d.get("phone") + "\n이메일: " + d.get("email") + "\n\n" + d.get("message");
      var to = S.email.replace(/[\[\]]/g, "");
      location.href = "mailto:" + to + "?subject=" + encodeURIComponent("[홈페이지 문의] " + d.get("type") + " - " + d.get("company")) +
        "&body=" + encodeURIComponent(body);
      var msg = document.getElementById("form-msg");
      msg.style.display = "block";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderHeader();
    renderFooter();
    fillSiteFields();
    renderLatestNews();
    renderNewsList();
    renderNewsView();
    renderMembers();
    renderMemberCount();
    renderMap();
    bindContactForm();
  });
})();
