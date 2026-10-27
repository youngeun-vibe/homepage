/* =========================================================
   Supabase 연결 정보 및 공통 분류
   - SUPABASE_KEY 는 공개용(publishable) 키입니다. 브라우저에 공개되어도 안전하며,
     수정 권한은 Supabase 보안 규칙(관리자 이메일)으로 막혀 있습니다.
   - secret / service_role 키는 절대 여기에 넣지 마세요.
   ========================================================= */
window.SITE_CONFIG = {
  SUPABASE_URL: "https://tzeqgnokgtjtvhandlbu.supabase.co",
  SUPABASE_KEY: "sb_publishable_ckEt5vBqSI_jzGcwFeS8TA_tTgMtSSG",
  STORAGE_BUCKET: "uploads",

  // 소식 분류 (값: 화면 표시 이름)
  NEWS_CATEGORIES: {
    notice: "공지사항",
    event: "행사·교육",
    support: "지원사업",
    press: "언론보도"
  },

  // 회원사 분야
  MEMBER_CATEGORIES: ["화장품", "식품·건강기능식품", "의약·바이오소재", "농축수산·기타"]
};
