# 사단법인 제주바이오기업협회 홈페이지

별도 빌드 없이 동작하는 정적 웹사이트입니다. GitHub Pages로 무료 호스팅하고, `/admin` 관리자 페이지(Sveltia CMS)에서 내용을 수정합니다.

- **사무국 직원용 사용법·배포·도메인 연결: [ADMIN_GUIDE.md](ADMIN_GUIDE.md)**

## 구조

```
index.html, about.html, ...   페이지 틀 (HTML)
content/*.json                페이지 내용 — 관리자 페이지가 수정하는 파일
admin/                        관리자 페이지 (index.html, config.yml)
assets/css/style.css          디자인 (맨 위 :root 에 로고 색상 팔레트)
assets/js/main.js             메뉴·푸터 및 content/*.json → 화면 렌더링
assets/img/                   로고 등 고정 이미지
assets/uploads/               관리자 페이지에서 올린 사진·파일
assets/vendor/marked.umd.js   본문(마크다운) 변환 라이브러리
```

| 메뉴 | 파일 | 내용 파일 |
| --- | --- | --- |
| 메인 | `index.html` | `home.json`, `news.json`, `members.json` |
| 협회소개 | `about.html` | `about.json` (+ `site.json`) |
| 회장인사 | `greeting.html` | `greeting.json` |
| 주요사업 | `business.html` | `business.json` |
| 소식 | `news.html`, `news-view.html` | `news.json` |
| 회원사 소개 | `members.html` | `members.json` |
| 회원가입 안내·문의 | `join.html` | `join.json` |
| 개인정보처리방침 | `privacy.html` | (HTML 직접 수정) |

모든 페이지 하단의 기관 정보는 `content/site.json` 에서 옵니다.

## 로컬에서 보기

콘텐츠를 `fetch` 로 불러오므로 파일을 직접 열지 말고 간단한 웹 서버로 엽니다.

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## 수정할 때 주의

- 소식 분류를 바꾸려면 `assets/js/main.js` 의 `NEWS_CATEGORIES` 와 `admin/config.yml` 의 소식 `category` 옵션을 함께 바꿉니다.
- 회원사 분야는 `admin/config.yml` 의 회원사 `category` 옵션에서 관리합니다.
- 소식의 `id` 는 관리자 페이지가 자동으로 만드는 값(12자리)이며, 글 주소(`news-view.html?id=...`)에 쓰이므로 바꾸지 않습니다.
- 관리자 페이지 라이브러리 버전은 `admin/index.html` 의 `@sveltia/cms@버전` 에서 고정합니다.
- 로고 `assets/img/logo.jpg` 는 고해상도 원본(SVG 또는 배경 투명 PNG)으로 교체하면 더 선명합니다.
- 문의하기 양식은 방문자의 메일 앱을 여는 방식입니다. 서버 접수가 필요하면 외부 폼 서비스 연동이 필요합니다.
