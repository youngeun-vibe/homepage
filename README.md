# 사단법인 제주바이오기업협회 홈페이지

빌드 없이 동작하는 정적 웹사이트입니다. **Vercel** 로 배포하고, 내용은 **Supabase** 에 저장해 `/admin/` 관리자 페이지에서 수정합니다.

- **설치·배포·도메인 연결·사용법: [ADMIN_GUIDE.md](ADMIN_GUIDE.md)**

## 구조

```
index.html, about.html, ...   페이지 틀 (HTML)
assets/js/config.js           Supabase 주소·공개 키, 소식 분류, 회원사 분야
assets/js/main.js             메뉴·푸터, Supabase 에서 내용을 읽어 화면에 표시
assets/css/style.css          디자인 (맨 위 :root 에 로고 색상 팔레트)
assets/vendor/marked.umd.js   본문(마크다운) 변환
admin/                        관리자 페이지 (index.html, admin.js, admin.css, vendor/)
supabase/setup.sql            Supabase 표·보안 규칙·저장소·예시 내용 (SQL Editor 에서 1회 실행)
vercel.json                   Vercel 설정 (/admin 검색 노출 차단)
```

## Supabase 구성

| 표 | 내용 | 홈페이지 |
| --- | --- | --- |
| `pages` | `key` 별 JSON: `site`, `home`, `about`, `greeting`, `business`, `join` | 각 페이지 문구, 하단 기관 정보 |
| `news` | 소식 글 (`category`: notice/event/support/press, 본문은 마크다운) | 소식, 메인 최신 소식 |
| `members` | 회원사 (`sort_order` 순) | 회원사 소개 |
| `admins` | 수정 권한이 있는 이메일 | — |
| Storage `uploads` | 사진·첨부파일 (공개 읽기) | — |

- 누구나 읽기, **`admins` 에 등록된 이메일로 로그인한 사용자만** 쓰기 (RLS).
- `config.js` 의 키는 공개용(publishable) 키입니다. secret / service_role 키는 저장소에 넣지 않습니다.

## 로컬에서 보기

```bash
python3 -m http.server 8000
# http://localhost:8000 , 관리자: http://localhost:8000/admin/
```

로컬에서도 실제 Supabase 의 내용을 읽고 씁니다.

## 수정할 때 주의

- 소식 분류·회원사 분야는 `assets/js/config.js` 한 곳에서 바꿉니다.
- 관리자 페이지 입력 항목은 `admin/admin.js` 맨 위 `PAGES`, `NEWS_FIELDS`, `MEMBER_FIELDS` 에 정의되어 있습니다.
  `pages` 에 새 항목을 추가하면 `main.js` 의 해당 페이지 렌더링도 함께 고칩니다.
- 관리자 페이지는 `/admin/...` 절대경로를 쓰므로 도메인 최상위에 배포해야 합니다.
- 로고 `assets/img/logo.jpg` 는 고해상도 원본(SVG 또는 배경 투명 PNG)으로 바꾸면 더 선명합니다.
- 문의하기 양식은 방문자의 메일 앱을 여는 방식입니다.
