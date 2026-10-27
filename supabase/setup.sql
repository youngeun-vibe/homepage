-- =========================================================
-- 제주바이오기업협회 홈페이지 - Supabase 초기 설정
-- 사용법: Supabase 대시보드 › SQL Editor › New query 에 이 파일 전체를 붙여넣고 Run.
--        (처음 한 번만 실행합니다. 맨 아래 '관리자 이메일'을 먼저 바꿔 주세요.)
-- =========================================================

-- ---------------------------------------------------------
-- 1. 관리자 목록: 여기에 등록된 이메일로 로그인한 사람만 내용을 수정할 수 있습니다.
-- ---------------------------------------------------------
create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.admins enable row level security;
drop policy if exists "본인 관리자 여부 확인" on public.admins;
create policy "본인 관리자 여부 확인" on public.admins
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- 수정 시각 자동 기록
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------
-- 2. 페이지 내용 (기본 정보, 메인 화면, 협회소개, 회장인사, 주요사업, 회원가입 안내)
-- ---------------------------------------------------------
create table if not exists public.pages (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 3. 소식
-- ---------------------------------------------------------
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'notice',
  date date not null default current_date,
  thumbnail text not null default '',
  attachment text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists news_date_idx on public.news (date desc, created_at desc);

-- ---------------------------------------------------------
-- 4. 회원사
-- ---------------------------------------------------------
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '',
  description text not null default '',
  logo text not null default '',
  url text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 5. 권한: 누구나 읽기, 관리자만 쓰기
-- ---------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['pages', 'news', 'members'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists "누구나 읽기" on public.%I', t);
    execute format('create policy "누구나 읽기" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "관리자 추가" on public.%I', t);
    execute format('create policy "관리자 추가" on public.%I for insert to authenticated with check (public.is_admin())', t);
    execute format('drop policy if exists "관리자 수정" on public.%I', t);
    execute format('create policy "관리자 수정" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('drop policy if exists "관리자 삭제" on public.%I', t);
    execute format('create policy "관리자 삭제" on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

grant select on public.admins to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------
-- 6. 사진·첨부파일 저장소 (공개 읽기, 관리자만 업로드/삭제, 파일당 20MB)
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('uploads', 'uploads', true, 20971520)
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit;

drop policy if exists "관리자 파일 조회" on storage.objects;
create policy "관리자 파일 조회" on storage.objects
  for select to authenticated
  using (bucket_id = 'uploads' and public.is_admin());

drop policy if exists "관리자 업로드" on storage.objects;
create policy "관리자 업로드" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'uploads' and public.is_admin());

drop policy if exists "관리자 파일 수정" on storage.objects;
create policy "관리자 파일 수정" on storage.objects
  for update to authenticated
  using (bucket_id = 'uploads' and public.is_admin());

drop policy if exists "관리자 파일 삭제" on storage.objects;
create policy "관리자 파일 삭제" on storage.objects
  for delete to authenticated
  using (bucket_id = 'uploads' and public.is_admin());

-- =========================================================
-- 7. 처음 내용 (예시 데이터) — 이미 내용이 있으면 건너뜁니다.
-- =========================================================

insert into public.pages (key, data) values
  ('site', '{"name": "사단법인 제주바이오기업협회", "nameEn": "Jeju Bio Business Association", "president": "[회장 성명]", "founded": "[설립연도]", "address": "[제주특별자치도 제주시 ○○로 ○○, ○층]", "tel": "[064-000-0000]", "fax": "[064-000-0000]", "email": "[info@jejubio.or.kr]", "bizNo": "[000-00-00000]", "mapEmbedUrl": ""}'::jsonb),
  ('home', '{"heroTitle": "제주의 청정 자원으로\n바이오산업의 내일을 엽니다", "heroText": "사단법인 제주바이오기업협회는 도내 바이오기업이 함께 성장할 수 있도록 정보 교류, 판로 개척, 정책 제안, 인재 양성을 지원하는 기업 협의체입니다.", "stats": [{"value": "[00]", "label": "협력 기관"}, {"value": "[00]", "label": "연간 지원사업"}, {"value": "[설립연도]", "label": "설립"}], "partners": [{"name": "[제주특별자치도]", "url": ""}, {"name": "[제주테크노파크]", "url": ""}, {"name": "[제주대학교]", "url": ""}, {"name": "[유관 연구기관]", "url": ""}, {"name": "[지원 기관]", "url": ""}]}'::jsonb),
  ('about', '{"intro": "사단법인 제주바이오기업협회는 제주의 청정 생물자원을 기반으로 화장품, 식품·건강기능식품, 의약·바이오소재 등 다양한 분야에서 활동하는 도내 바이오기업들이 모여 설립한 비영리 사단법인입니다. 회원사 간 협력과 정보 공유, 정책 건의, 공동 마케팅을 통해 제주 바이오산업의 경쟁력을 높이고 지역 경제 발전에 기여하고자 합니다.", "vision": "청정 제주 자원 기반, 글로벌 바이오산업 거점으로", "goals": [{"icon": "🤝", "title": "상생 협력", "desc": "회원사 간 협력 네트워크 강화와 공동 사업 발굴"}, {"icon": "🚀", "title": "기업 성장", "desc": "판로 개척, 투자 유치, 기술 사업화 지원"}, {"icon": "🧑‍🔬", "title": "인재 양성", "desc": "현장 맞춤형 교육과 지역 인재 채용 연계"}, {"icon": "🏛️", "title": "정책 제안", "desc": "업계 의견 수렴과 제도 개선 건의"}], "history": [{"year": "[2026]", "items": ["[협회 홈페이지 개설]", "[해외 판로개척 지원사업 수행]"]}, {"year": "[2025]", "items": ["[유관기관 업무협약(MOU) 체결]"]}, {"year": "[0000]", "items": ["[사단법인 설립 허가]"]}, {"year": "[0000]", "items": ["[창립총회 개최 및 초대 회장 선출]"]}], "orgUnits": [{"name": "기획·운영", "note": "[분과/팀]"}, {"name": "회원·사업지원", "note": "[분과/팀]"}, {"name": "대외협력", "note": "[분과/팀]"}]}'::jsonb),
  ('greeting', '{"photo": "", "lead": "청정 제주의 가치를 바이오 혁신으로 잇고,\n회원사와 함께 성장하는 협회가 되겠습니다.", "body": "안녕하십니까. 사단법인 제주바이오기업협회 회장입니다.\n\n제주는 화산섬이 빚어낸 독특한 자연환경과 풍부한 생물자원을 품고 있는 바이오산업의 보고입니다. 감귤, 녹차, 동백, 용암해수와 해양 생물자원에 이르기까지, 제주의 자원은 화장품과 식품, 의약 소재 분야에서 새로운 가치를 만들어 내고 있습니다.\n\n우리 협회는 이러한 가능성을 현실로 만들어 가는 도내 바이오기업들이 뜻을 모아 출범하였습니다. 개별 기업의 힘만으로는 넘기 어려운 판로, 인증, 인력, 투자의 벽을 회원사가 함께 넘을 수 있도록 협력의 장을 만들고, 정부와 지자체, 학계, 연구기관과의 가교 역할을 충실히 하겠습니다.\n\n앞으로도 회원사의 목소리에 귀 기울이며, 현장에서 실질적인 도움이 되는 사업을 펼쳐 나가겠습니다. 제주 바이오산업이 대한민국을 넘어 세계로 나아가는 그 길에 많은 관심과 성원 부탁드립니다.\n\n감사합니다."}'::jsonb),
  ('business', '{"items": [{"icon": "🌐", "title": "회원 네트워킹", "desc": "정기총회, 회원 간담회, 네트워킹 데이를 통해 회원사 간 교류와 협업 기회를 만듭니다."}, {"icon": "✈️", "title": "국내외 판로 개척", "desc": "국내외 전시회 공동관 참가, 바이어 상담회, 온라인 수출 플랫폼 입점을 지원합니다."}, {"icon": "🏷️", "title": "공동 브랜드·마케팅", "desc": "제주 바이오 공동 브랜드 육성과 홍보 콘텐츠 제작으로 인지도를 높입니다."}, {"icon": "🎓", "title": "교육·세미나", "desc": "GMP·HACCP 등 인증, 규제 대응, 수출 실무, 기술 트렌드 교육을 운영합니다."}, {"icon": "🔬", "title": "산·학·연 협력", "desc": "대학·연구기관과 연계한 공동 R&D, 기술이전, 원료 표준화를 추진합니다."}, {"icon": "📋", "title": "정책 건의·정보 제공", "desc": "업계 애로사항을 수렴해 정책을 제안하고, 정부·지자체 지원사업 정보를 공유합니다."}]}'::jsonb),
  ('join', '{"targets": ["제주특별자치도에 본사·공장·연구소를 둔 바이오 관련 기업", "제주 바이오산업 발전에 뜻을 같이하는 기관 및 단체 (특별회원)", "[세부 자격 요건은 정관에 따름]"], "benefits": ["협회 주관 지원사업·전시회 참가 우선 기회", "교육·세미나 무료 또는 할인 참여", "회원사 홈페이지 소개 및 공동 홍보", "정부·지자체 지원사업 정보 신속 제공", "회원사 간 네트워킹 및 협업 기회"], "steps": [{"title": "가입 문의", "desc": "전화·이메일 또는 아래 문의 양식으로 접수"}, {"title": "신청서 제출", "desc": "가입신청서 및 사업자등록증 등 구비서류 제출"}, {"title": "이사회 승인", "desc": "자격 검토 후 이사회 승인"}, {"title": "회비 납부·가입 완료", "desc": "입회비·연회비 납부 후 회원 등록"}], "entranceFee": "[금액 입력]", "annualFee": "[금액 입력]", "documents": "회원가입신청서, 사업자등록증 사본, 회사소개서", "applicationFile": ""}'::jsonb)
on conflict (key) do nothing;

insert into public.news (title, category, date, body)
select * from (values
  ('2026년 정기총회 개최 안내', 'notice', date '2026-10-20', '회원사 여러분의 많은 참석을 부탁드립니다.

- 일시: [일시 입력]
- 장소: [장소 입력]
- 안건: 2026년 사업 결산 및 2027년 사업계획 승인 등'),
  ('제주 바이오기업 해외 판로개척 지원사업 참여기업 모집', 'support', date '2026-10-08', '도내 바이오기업의 해외시장 진출을 지원하기 위한 참여기업을 모집합니다.

**지원내용**: 해외 전시회 참가, 바이어 매칭, 수출 상담 지원 등

신청방법 및 세부 내용은 첨부된 공고문을 참고해 주시기 바랍니다.'),
  ('제주 바이오 네트워킹 데이 개최', 'event', date '2026-09-25', '회원사 간 교류와 협력 기회를 마련하기 위한 네트워킹 행사를 개최합니다.

기업 IR 발표, 산·학·연 협력 세션, 네트워킹 리셉션이 진행될 예정입니다.'),
  ('제주바이오기업협회, 지역 바이오산업 활성화 위한 업무협약 체결', 'press', date '2026-09-10', '협회는 지역 유관기관과 바이오산업 활성화를 위한 업무협약을 체결했습니다.

양 기관은 기업 성장 지원, 인력 양성, 공동 연구 등 분야에서 협력할 계획입니다.'),
  ('바이오 인증(GMP·HACCP) 실무 교육 안내', 'event', date '2026-08-28', '회원사 실무자를 대상으로 인증 취득 및 사후관리 실무 교육을 진행합니다.

교육 대상: 회원사 품질·생산 담당자'),
  ('협회 홈페이지를 새롭게 오픈했습니다', 'notice', date '2026-08-01', '사단법인 제주바이오기업협회 홈페이지가 새롭게 문을 열었습니다.

앞으로 협회 소식과 회원사 정보, 지원사업 안내를 빠르게 전해드리겠습니다.')
) as v(title, category, date, body)
where not exists (select 1 from public.news);

insert into public.members (name, category, description, sort_order)
select * from (values
  ('[회원사 A]', '화장품', '제주 천연 원료를 활용한 기능성 화장품 개발·제조', 1),
  ('[회원사 B]', '식품·건강기능식품', '감귤 부산물 기반 건강기능식품 소재 생산', 2),
  ('[회원사 C]', '의약·바이오소재', '제주 해양 미생물 유래 바이오 소재 연구', 3),
  ('[회원사 D]', '화장품', '화산송이·용암해수 활용 스킨케어 브랜드', 4),
  ('[회원사 E]', '농축수산·기타', '제주 약용작물 재배 및 원료 가공', 5),
  ('[회원사 F]', '식품·건강기능식품', '발효 기술 기반 제주 전통 발효식품 개발', 6),
  ('[회원사 G]', '의약·바이오소재', '천연물 유래 원료의약품 및 소재 개발', 7),
  ('[회원사 H]', '화장품', '제주 녹차·동백 원료 OEM/ODM', 8)
) as v(name, category, description, sort_order)
where not exists (select 1 from public.members);

-- =========================================================
-- 8. 관리자 이메일 등록 — 아래 이메일을 실제 직원 이메일로 바꾸세요.
--    (Authentication › Users 에서 같은 이메일로 사용자를 먼저 만들어 두세요)
--    여러 명이면 ('a@example.com'), ('b@example.com') 처럼 이어서 씁니다.
-- =========================================================
insert into public.admins (email) values
  ('admin@example.com')
on conflict (email) do nothing;
