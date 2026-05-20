const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  Events,
} = require('discord.js');

// ─── 설정 ───────────────────────────────────────────────────
const TOKEN   = 'MTUwMjgyNTE5NjI2NzI0MTU0Mg.GbAPDV.BIkK1p-8BGYSANDKocXAP4aw_mAOTFIXzVwu5o';
const GUILD_ID = '1503004897128484927';
const OWNER_ID = '1340155529238024282'; // DM 받을 본인 디스코드 ID
const LOG_CHANNEL_NAME = '봇-로그';
const SPAM_LIMIT     = 5;      // 몇 개 연속 메시지
const SPAM_WINDOW_MS = 3000;   // 몇 ms 안에

const SWEAR_WORDS = [
  // 기본 욕설
  '씨발','시발','ㅅㅂ','쌍년','쌍놈','개새끼','개씨발',
  '병신','ㅂㅅ','지랄','미친놈','미친년','존나','ㅈㄴ',
  '좆','보지','자지','꺼져','죽어','새끼','ㅅㄲ',
  // 변형/우회 욕설
  '시1발','씨1발','ㅅ1ㅂ','ㅂ1ㅅ','ㅈ1ㄴ',
  'sibal','ssibal','sibaal','ssibaal',
  '개년','개놈','미친','빡대가리','찐따','장애','저능아',
  '느금마','니애미','니엄마','ㄴㄱㅁ','애미','애비',
  '뒤져','뒤지','ㄷㅈ','염병','엿','좆같','ㅈ같',
  'fuck','shit','bitch','asshole','bastard',
  // ㅗ 욕설
  'ㅗ','ㅗㅗ',
];

// ─── 상태 ───────────────────────────────────────────────────
const spamTracker = new Map(); // userId → timestamp[]

// 경고 파일 저장/불러오기
const fs = require('fs');
const WARNINGS_FILE = './warnings.json';

function loadWarnings() {
  try {
    if (fs.existsSync(WARNINGS_FILE)) {
      return new Map(Object.entries(JSON.parse(fs.readFileSync(WARNINGS_FILE, 'utf8'))));
    }
  } catch (e) {}
  return new Map();
}

function saveWarnings(map) {
  fs.writeFileSync(WARNINGS_FILE, JSON.stringify(Object.fromEntries(map)), 'utf8');
}

const warnings = loadWarnings();

// 훈련 일정 저장
const EXAM_FILE = './exam.json';
function loadExam() {
  try { if (fs.existsSync(EXAM_FILE)) return JSON.parse(fs.readFileSync(EXAM_FILE, 'utf8')); } catch(e) {}
  return [];
}
function saveExam(arr) { fs.writeFileSync(EXAM_FILE, JSON.stringify(arr), 'utf8'); }
let examList = loadExam();

// 출석 저장
const ATTENDANCE_FILE = './attendance.json';
function loadAttendance() {
  try { if (fs.existsSync(ATTENDANCE_FILE)) return JSON.parse(fs.readFileSync(ATTENDANCE_FILE, 'utf8')); } catch(e) {}
  return {};
}
function saveAttendance(obj) { fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(obj), 'utf8'); }
let attendance = loadAttendance();

// 개발자 출석 저장
const DEV_ATTEND_FILE = './dev_attendance.json';
function loadDevAttend() {
  try { if (fs.existsSync(DEV_ATTEND_FILE)) return JSON.parse(fs.readFileSync(DEV_ATTEND_FILE, 'utf8')); } catch(e) {}
  return {};
}
function saveDevAttend(obj) { fs.writeFileSync(DEV_ATTEND_FILE, JSON.stringify(obj), 'utf8'); }
let devAttendance = loadDevAttend();

// 징계 저장
const DISCIPLINE_FILE = './discipline.json';
function loadDiscipline() {
  try { if (fs.existsSync(DISCIPLINE_FILE)) return JSON.parse(fs.readFileSync(DISCIPLINE_FILE, 'utf8')); } catch(e) {}
  return [];
}
function saveDiscipline(arr) { fs.writeFileSync(DISCIPLINE_FILE, JSON.stringify(arr), 'utf8'); }
let disciplineList = loadDiscipline();

// 부재 저장
const ABSENCE_FILE = './absence.json';
function loadAbsence() {
  try { if (fs.existsSync(ABSENCE_FILE)) return JSON.parse(fs.readFileSync(ABSENCE_FILE, 'utf8')); } catch(e) {}
  return [];
}
function saveAbsence(arr) { fs.writeFileSync(ABSENCE_FILE, JSON.stringify(arr), 'utf8'); }
let absenceList = loadAbsence();

// 활동 통계 저장
const STATS_FILE = './stats.json';
function loadStats() {
  try { if (fs.existsSync(STATS_FILE)) return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')); } catch(e) {}
  return {};
}
function saveStats(obj) { fs.writeFileSync(STATS_FILE, JSON.stringify(obj), 'utf8'); }
let activityStats = loadStats();

// 건의함 저장
const SUGGEST_FILE = './suggestions.json';
function loadSuggestions() {
  try { if (fs.existsSync(SUGGEST_FILE)) return JSON.parse(fs.readFileSync(SUGGEST_FILE, 'utf8')); } catch(e) {}
  return [];
}
function saveSuggestions(arr) { fs.writeFileSync(SUGGEST_FILE, JSON.stringify(arr), 'utf8'); }
let suggestions = loadSuggestions();

// 봇 설정 저장
const BOT_CONFIG_FILE = './bot_config.json';
function loadBotConfig() {
  try { if (fs.existsSync(BOT_CONFIG_FILE)) return JSON.parse(fs.readFileSync(BOT_CONFIG_FILE, 'utf8')); } catch(e) {}
  return { logChannel: '봇-로그', welcomeChannel: '일반', autoRole: '이등병 | Private', customSwears: [] };
}
function saveBotConfig(obj) { fs.writeFileSync(BOT_CONFIG_FILE, JSON.stringify(obj), 'utf8'); }
let botConfig = loadBotConfig();

// 진급 기록 저장
const RANK_LOG_FILE = './rank_log.json';
function loadRankLog() {
  try { if (fs.existsSync(RANK_LOG_FILE)) return JSON.parse(fs.readFileSync(RANK_LOG_FILE, 'utf8')); } catch(e) {}
  return [];
}
function saveRankLog(arr) { fs.writeFileSync(RANK_LOG_FILE, JSON.stringify(arr), 'utf8'); }
let rankLog = loadRankLog();

// 명단 저장
const ROSTER_FILE = './roster.json';
function loadRoster() {
  try { if (fs.existsSync(ROSTER_FILE)) return JSON.parse(fs.readFileSync(ROSTER_FILE, 'utf8')); } catch(e) {}
  return [];
}
function saveRoster(arr) { fs.writeFileSync(ROSTER_FILE, JSON.stringify(arr), 'utf8'); }
let roster = loadRoster();

// ─── 클라이언트 ─────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// ─── 슬래시 커맨드 정의 ─────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName('역할삭제')
    .setDescription('봇이 만든 역할 전체 삭제 (관리자 전용)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('경고')
    .setDescription('유저에게 경고 부여')
    .addUserOption(o => o.setName('유저').setDescription('경고 대상').setRequired(true))
    .addStringOption(o => o.setName('이유').setDescription('경고 이유').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('경고확인')
    .setDescription('유저 경고 횟수 확인')
    .addUserOption(o => o.setName('유저').setDescription('확인 대상').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('경고초기화')
    .setDescription('유저 경고 초기화')
    .addUserOption(o => o.setName('유저').setDescription('초기화 대상').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('타임아웃')
    .setDescription('유저 타임아웃')
    .addUserOption(o => o.setName('유저').setDescription('대상').setRequired(true))
    .addIntegerOption(o => o.setName('분').setDescription('타임아웃 시간(분)').setRequired(true))
    .addStringOption(o => o.setName('이유').setDescription('이유').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('킥')
    .setDescription('유저 킥')
    .addUserOption(o => o.setName('유저').setDescription('대상').setRequired(true))
    .addStringOption(o => o.setName('이유').setDescription('이유').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName('밴')
    .setDescription('유저 밴')
    .addUserOption(o => o.setName('유저').setDescription('대상').setRequired(true))
    .addStringOption(o => o.setName('이유').setDescription('이유').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName('역할부여')
    .setDescription('유저에게 역할 부여 (역할 이름 직접 입력)')
    .addUserOption(o => o.setName('유저').setDescription('대상').setRequired(true))
    .addStringOption(o => o.setName('역할').setDescription('부여할 역할 이름 (예: 병장 | SGT)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName('역할제거')
    .setDescription('유저에게서 역할 제거 (역할 이름 직접 입력)')
    .addUserOption(o => o.setName('유저').setDescription('대상').setRequired(true))
    .addStringOption(o => o.setName('역할').setDescription('제거할 역할 이름 (예: 병장 | SGT)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName('공지')
    .setDescription('공지 전송 (관리자 전용)')
    .addStringOption(o => o.setName('내용').setDescription('공지 내용').setRequired(true))
    .addChannelOption(o => o.setName('채널').setDescription('전송할 채널 (기본: 현재 채널)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('투표')
    .setDescription('투표 생성')
    .addStringOption(o => o.setName('질문').setDescription('투표 질문').setRequired(true))
    .addStringOption(o => o.setName('선택지').setDescription('선택지 (쉼표로 구분, 예: 찬성,반대,기권)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('청소')
    .setDescription('채널 메시지 삭제')
    .addIntegerOption(o => o.setName('개수').setDescription('삭제할 메시지 수 (최대 100)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('서버정보')
    .setDescription('서버 정보 확인'),

  new SlashCommandBuilder()
    .setName('유저정보')
    .setDescription('유저 정보 확인')
    .addUserOption(o => o.setName('유저').setDescription('확인할 유저 (기본: 본인)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('슬로우모드')
    .setDescription('채널 슬로우모드 설정')
    .addIntegerOption(o => o.setName('초').setDescription('슬로우모드 시간(초, 0=해제)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('닉네임')
    .setDescription('유저 닉네임 변경')
    .addUserOption(o => o.setName('유저').setDescription('대상').setRequired(true))
    .addStringOption(o => o.setName('닉네임').setDescription('새 닉네임 (비워두면 초기화)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

  new SlashCommandBuilder()
    .setName('역할목록')
    .setDescription('서버 역할 목록 확인'),

  // ══ 훈련 일정 ══
  new SlashCommandBuilder()
    .setName('시험등록')
    .setDescription('시험 일정 등록')
    .addStringOption(o => o.setName('제목').setDescription('시험명').setRequired(true))
    .addStringOption(o => o.setName('날짜').setDescription('날짜 (예: 2025-01-15 20:00)').setRequired(true))
    .addStringOption(o => o.setName('내용').setDescription('훈련 내용').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),

  new SlashCommandBuilder()
    .setName('시험목록')
    .setDescription('예정된 시험 일정 확인'),

  new SlashCommandBuilder()
    .setName('시험삭제')
    .setDescription('시험 일정 삭제')
    .addIntegerOption(o => o.setName('번호').setDescription('삭제할 시험 번호').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),

  // ══ 개발자 출석 ══
  new SlashCommandBuilder()
    .setName('개발출석')
    .setDescription('오늘 개발 작업 출석 체크')
    .addStringOption(o => o.setName('작업내용').setDescription('오늘 개발한 내용').setRequired(true)),

  new SlashCommandBuilder()
    .setName('개발출석목록')
    .setDescription('개발자 출석 현황 확인')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName('개발출석초기화')
    .setDescription('개발자 출석 초기화')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // ══ 출석 ══
  new SlashCommandBuilder()
    .setName('출석')
    .setDescription('출석 체크'),

  new SlashCommandBuilder()
    .setName('출석목록')
    .setDescription('오늘 출석 명단 확인')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('출석초기화')
    .setDescription('출석 데이터 초기화')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // ══ 명단 ══
  new SlashCommandBuilder()
    .setName('명단')
    .setDescription('부대원 명단 확인'),

  new SlashCommandBuilder()
    .setName('명단추가')
    .setDescription('부대원 명단에 추가')
    .addUserOption(o => o.setName('유저').setDescription('추가할 유저').setRequired(true))
    .addStringOption(o => o.setName('메모').setDescription('메모 (선택)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName('명단제거')
    .setDescription('부대원 명단에서 제거')
    .addUserOption(o => o.setName('유저').setDescription('제거할 유저').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  // ══ 채널 ══
  new SlashCommandBuilder()
    .setName('채널생성')
    .setDescription('채널 자동 생성')
    .addStringOption(o => o.setName('이름').setDescription('채널 이름').setRequired(true))
    .addStringOption(o => o.setName('종류').setDescription('채널 종류').setRequired(false)
      .addChoices({ name: '텍스트', value: 'GUILD_TEXT' }, { name: '음성', value: 'GUILD_VOICE' }))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('잠금')
    .setDescription('채널 잠금 (관리자만 메시지 전송 가능)')
    .addChannelOption(o => o.setName('채널').setDescription('잠금할 채널 (기본: 현재 채널)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('잠금해제')
    .setDescription('채널 잠금 해제')
    .addChannelOption(o => o.setName('채널').setDescription('잠금 해제할 채널 (기본: 현재 채널)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('채널삭제')
    .setDescription('현재 채널 삭제')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  // ══ 미니게임 ══
  new SlashCommandBuilder()
    .setName('가위바위보')
    .setDescription('봇과 가위바위보')
    .addStringOption(o => o.setName('선택').setDescription('선택').setRequired(true)
      .addChoices({ name: '✌️ 가위', value: '가위' }, { name: '✊ 바위', value: '바위' }, { name: '🖐️ 보', value: '보' })),

  new SlashCommandBuilder()
    .setName('주사위')
    .setDescription('주사위 굴리기')
    .addIntegerOption(o => o.setName('면').setDescription('주사위 면 수 (기본: 6)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('동전')
    .setDescription('동전 던지기'),

  new SlashCommandBuilder()
    .setName('타이머')
    .setDescription('카운트다운 타이머')
    .addIntegerOption(o => o.setName('분').setDescription('타이머 시간(분)').setRequired(true))
    .addStringOption(o => o.setName('메모').setDescription('타이머 메모').setRequired(false)),

  new SlashCommandBuilder()
    .setName('건의')
    .setDescription('건의사항 제출')
    .addStringOption(o => o.setName('내용').setDescription('건의 내용').setRequired(true))
    .addBooleanOption(o => o.setName('익명').setDescription('익명 여부 (기본: 공개)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('건의목록')
    .setDescription('건의사항 목록 확인')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('건의답변')
    .setDescription('건의사항 답변')
    .addIntegerOption(o => o.setName('번호').setDescription('건의 번호').setRequired(true))
    .addStringOption(o => o.setName('답변').setDescription('답변 내용').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('공지dm')
    .setDescription('전체 멤버에게 DM 발송')
    .addStringOption(o => o.setName('내용').setDescription('DM 내용').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // ══ 부대 운영 ══
  new SlashCommandBuilder()
    .setName('계급표')
    .setDescription('전체 계급 체계 표시'),

  new SlashCommandBuilder()
    .setName('모집공고')
    .setDescription('신병 모집 공고 작성')
    .addStringOption(o => o.setName('내용').setDescription('모집 내용').setRequired(true))
    .addIntegerOption(o => o.setName('인원').setDescription('모집 인원').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  // ══ 통계 ══
  new SlashCommandBuilder()
    .setName('월간통계')
    .setDescription('이번 달 서버 활동 통계'),

  new SlashCommandBuilder()
    .setName('진급기록')
    .setDescription('유저 진급/강등 히스토리')
    .addUserOption(o => o.setName('유저').setDescription('확인할 유저 (기본: 본인)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('출석률')
    .setDescription('이번 달 출석률 확인'),

  new SlashCommandBuilder()
    .setName('경고기록')
    .setDescription('전체 경고 현황')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('출석순위')
    .setDescription('이번 달 출석 순위 TOP 10'),

  // ══ 서버 관리 ══
  new SlashCommandBuilder()
    .setName('전체잠금')
    .setDescription('전체 채널 잠금/해제')
    .addStringOption(o => o.setName('모드').setDescription('잠금 또는 해제').setRequired(true)
      .addChoices({ name: '잠금', value: 'lock' }, { name: '해제', value: 'unlock' }))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('고정')
    .setDescription('메시지 ID로 고정')
    .addStringOption(o => o.setName('메시지id').setDescription('고정할 메시지 ID').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('초대링크')
    .setDescription('서버 초대링크 생성')
    .addIntegerOption(o => o.setName('시간').setDescription('유효시간(시간, 0=영구)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.CreateInstantInvite),

  // ══ 봇 설정 ══
  new SlashCommandBuilder()
    .setName('봇설정')
    .setDescription('봇 설정 확인')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('욕설추가')
    .setDescription('욕설 목록에 단어 추가')
    .addStringOption(o => o.setName('단어').setDescription('추가할 단어').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('욕설제거')
    .setDescription('욕설 목록에서 단어 제거')
    .addStringOption(o => o.setName('단어').setDescription('제거할 단어').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('욕설목록')
    .setDescription('현재 욕설 목록 확인')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('로그채널설정')
    .setDescription('로그 채널 변경')
    .addChannelOption(o => o.setName('채널').setDescription('새 로그 채널').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('환영채널설정')
    .setDescription('환영 메시지 채널 변경')
    .addChannelOption(o => o.setName('채널').setDescription('새 환영 채널').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('자동역할설정')
    .setDescription('입장 시 자동 부여 역할 변경')
    .addStringOption(o => o.setName('역할').setDescription('역할 이름').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('도움말')
    .setDescription('전체 커맨드 목록'),

  new SlashCommandBuilder()
    .setName('봇정보')
    .setDescription('봇 정보 확인'),

  new SlashCommandBuilder()
    .setName('백업')
    .setDescription('서버 데이터 백업')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('규칙')
    .setDescription('서버 규칙 표시')
    .addChannelOption(o => o.setName('채널').setDescription('전송할 채널 (기본: 현재 채널)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('핑')
    .setDescription('봇 핑 확인'),

  new SlashCommandBuilder()
    .setName('진급')
    .setDescription('유저 계급 한 단계 진급')
    .addUserOption(o => o.setName('유저').setDescription('진급할 유저').setRequired(true))
    .addStringOption(o => o.setName('이유').setDescription('진급 이유').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName('시험보고서')
    .setDescription('시험 보고서 작성')
    .addStringOption(o => o.setName('시험명').setDescription('시험 이름').setRequired(true))
    .addStringOption(o => o.setName('합격자').setDescription('합격자 (예: @김철수 훈련병→이등병, @이영희 이등병→일등병)').setRequired(true))
    .addStringOption(o => o.setName('불합격자').setDescription('불합격자 (@멘션, 쉼표로 구분)').setRequired(false))
    .addAttachmentOption(o => o.setName('사진').setDescription('시험 관련 사진').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),

  new SlashCommandBuilder()
    .setName('시험시작')
    .setDescription('시험 시작 알림 전송')
    .addStringOption(o => o.setName('제목').setDescription('시험명').setRequired(true))
    .addIntegerOption(o => o.setName('시간').setDescription('시험 시간(분)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),

  new SlashCommandBuilder()
    .setName('징계')
    .setDescription('유저 징계 기록')
    .addUserOption(o => o.setName('유저').setDescription('징계 대상').setRequired(true))
    .addStringOption(o => o.setName('내용').setDescription('징계 내용').setRequired(true))
    .addStringOption(o => o.setName('기간').setDescription('징계 기간 (예: 7일)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('징계목록')
    .setDescription('유저 징계 기록 확인')
    .addUserOption(o => o.setName('유저').setDescription('확인할 유저').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('활동통계')
    .setDescription('유저 활동 통계 확인')
    .addUserOption(o => o.setName('유저').setDescription('확인할 유저 (기본: 본인)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('부재신청')
    .setDescription('부재 기간 등록')
    .addStringOption(o => o.setName('시작').setDescription('시작일 (예: 2025-01-15)').setRequired(true))
    .addStringOption(o => o.setName('종료').setDescription('종료일 (예: 2025-01-20)').setRequired(true))
    .addStringOption(o => o.setName('사유').setDescription('부재 사유').setRequired(true)),

  new SlashCommandBuilder()
    .setName('부재목록')
    .setDescription('현재 부재 중인 멤버 확인'),

  new SlashCommandBuilder()
    .setName('부재취소')
    .setDescription('본인 부재 신청 취소'),

  new SlashCommandBuilder()
    .setName('강등')
    .setDescription('유저 계급 강등')
    .addUserOption(o => o.setName('유저').setDescription('강등할 유저').setRequired(true))
    .addStringOption(o => o.setName('이유').setDescription('강등 이유').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName('역할생성')
    .setDescription('모든 부대 역할 자동 생성 (관리자 전용)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
].map(c => c.toJSON());

// ─── 유틸 함수 ──────────────────────────────────────────────
async function getOrCreateLogChannel(guild) {
  let ch = guild.channels.cache.find(c => c.name === LOG_CHANNEL_NAME);
  if (!ch) {
    const ownerMember = await guild.members.fetch(OWNER_ID).catch(() => null);

    const overwrites = [
      {
        id: guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: guild.members.me.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
      },
    ];

    if (ownerMember) {
      overwrites.push({
        id: ownerMember.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        deny: [PermissionFlagsBits.SendMessages],
      });
    }

    ch = await guild.channels.create({
      name: LOG_CHANNEL_NAME,
      topic: '봇 자동 로그 채널',
      permissionOverwrites: overwrites,
      reason: '봇 로그 채널 자동 생성',
    });
    console.log(`✅ 로그 채널 생성: #${LOG_CHANNEL_NAME}`);
  }
  return ch;
}

async function sendLog(guild, embed) {
  try {
    const ch = await getOrCreateLogChannel(guild);
    await ch.send({ embeds: [embed] });
  } catch (e) {
    console.error('로그 전송 실패:', e.message);
  }
}

async function dmOwner(content) {
  try {
    const owner = await client.users.fetch(OWNER_ID);
    await owner.send(content);
  } catch (e) {
    console.error('DM 전송 실패:', e.message);
  }
}

function containsSwear(text) {
  const lower = text.toLowerCase();
  return SWEAR_WORDS.some(w => lower.includes(w));
}

// ─── 봇 준비 ────────────────────────────────────────────────
client.once(Events.ClientReady, async () => {
  console.log(`✅ 봇 로그인: ${client.user.tag}`);

  const rest = new REST().setToken(TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(client.user.id, GUILD_ID),
    { body: commands }
  );
  console.log('✅ 슬래시 커맨드 등록 완료');

  const guild = await client.guilds.fetch(GUILD_ID);
  await getOrCreateLogChannel(guild);
  console.log('✅ 로그 채널 준비 완료');
  console.log('🤖 봇 실행 중...');
});

// ─── 메시지 이벤트 (욕설 + 도배) ───────────────────────────
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  // 활동 통계 기록
  const today = new Date().toISOString().split('T')[0];
  if (!activityStats[message.author.id]) activityStats[message.author.id] = { messages: 0, days: {} };
  activityStats[message.author.id].messages = (activityStats[message.author.id].messages || 0) + 1;
  activityStats[message.author.id].days[today] = (activityStats[message.author.id].days[today] || 0) + 1;
  if (Object.keys(activityStats).length % 50 === 0) saveStats(activityStats); // 50개마다 저장

  const userId = message.author.id;
  const now    = Date.now();

  // 욕설 감지 제외 역할 (이 역할 있으면 욕설 감지 안 함)
  const SWEAR_EXEMPT = [
    '그룹홀더 | GH', '부그룹홀더 | VGH', '스튜디오 개발자',
    '개발자 | DEV', '관리자 | ADMIN', '쇠뇌부',
    '국군통수권자 | CIC', '국무총리 | PM', '국방부 장관 | MoND',
    '국방부 차관 | VMND', '참모총장 | CSA', '참모차장 | VCSA',
    '대장 | GEN', '중장 | LTGEN', '소장 | MGEN', '준장 | BGEN',
  ];
  const isExempt = message.member.roles.cache.some(r => SWEAR_EXEMPT.includes(r.name));

  // 욕설 감지
  if (!isExempt && containsSwear(message.content)) {
    await message.delete().catch(() => {});

    const count = (warnings.get(userId) || 0) + 1;
    warnings.set(userId, count);
    saveWarnings(warnings);

    await message.channel.send(`⚠️ <@${userId}> 욕설 감지! 경고 **${count}/3**`);

    const embed = new EmbedBuilder()
      .setColor(0xff6b35)
      .setTitle('⚠️ 욕설 감지')
      .addFields(
        { name: '유저',  value: `<@${userId}> (${message.author.tag})`, inline: true },
        { name: '경고',  value: `${count}/3`, inline: true },
        { name: '내용',  value: `||${message.content}||` },
        { name: '채널',  value: `<#${message.channel.id}>` },
      )
      .setTimestamp();

    await sendLog(message.guild, embed);
    await dmOwner(`⚠️ 욕설 감지\n유저: ${message.author.tag}\n경고: ${count}/3\n내용: ${message.content}\n채널: #${message.channel.name}`);

    if (count >= 3) {
      warnings.set(userId, 0);
      saveWarnings(warnings);
      try {
        const botMember = message.guild.members.me;
        if (message.member.roles.highest.position >= botMember.roles.highest.position) {
          await message.channel.send(`⚠️ <@${userId}> 경고 3회! 봇 역할이 낮아서 타임아웃 불가!`);
        } else {
          await message.member.timeout(60 * 60 * 1000, '욕설 3회 누적');
          await message.channel.send(`🔇 <@${userId}> 경고 3회 누적 → **1시간 타임아웃**`);
          const toEmbed = new EmbedBuilder()
            .setColor(0xe74c3c).setTitle('🔇 타임아웃 적용')
            .addFields(
              { name: '유저', value: `<@${userId}> (${message.author.tag})`, inline: true },
              { name: '시간', value: '1시간', inline: true },
              { name: '이유', value: '욕설 3회 누적' },
            ).setTimestamp();
          await sendLog(message.guild, toEmbed);
          await dmOwner(`🔇 타임아웃\n유저: ${message.author.tag}\n이유: 욕설 3회 누적 → 1시간`);
        }
      } catch (e) {
        console.error('타임아웃 실패:', e.message);
        await message.channel.send(`❌ 타임아웃 실패: ${e.message}`);
      }
    }
    return;
  }

  // 도배 감지
  const times  = (spamTracker.get(userId) || []).filter(t => now - t < SPAM_WINDOW_MS);
  times.push(now);
  spamTracker.set(userId, times);

  if (times.length >= SPAM_LIMIT) {
    spamTracker.set(userId, []);
    try {
      await message.member.timeout(10 * 60 * 1000, '도배');
      await message.channel.send(`🚫 <@${userId}> 도배 감지! **10분 타임아웃**`);

      const spamEmbed = new EmbedBuilder()
        .setColor(0xe67e22)
        .setTitle('🚫 도배 감지')
        .addFields(
          { name: '유저',      value: `<@${userId}> (${message.author.tag})`, inline: true },
          { name: '채널',      value: `<#${message.channel.id}>`, inline: true },
          { name: '타임아웃',  value: '10분' },
        )
        .setTimestamp();

      await sendLog(message.guild, spamEmbed);
      await dmOwner(`🚫 도배 감지\n유저: ${message.author.tag}\n채널: #${message.channel.name}\n→ 10분 타임아웃`);
    } catch (e) {
      console.error('도배 타임아웃 실패:', e.message);
    }
  }
});

// ─── 입장 환영 메시지 + 자동 역할 ────────────────────────────
const WELCOME_CHANNEL = '일반';       // 환영 메시지 보낼 채널 이름
const AUTO_ROLE_NAME  = '이등병 | Private'; // 입장 시 자동 부여 역할

// ─── 음성채널 입퇴장 로그 ──────────────────────────────────────
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  const guild = newState.guild || oldState.guild;
  const member = newState.member || oldState.member;
  if (!member || member.user.bot) return;

  if (!oldState.channel && newState.channel) {
    // 입장
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71).setTitle('🔊 음성채널 입장')
      .addFields(
        { name: '유저', value: `<@${member.id}>`, inline: true },
        { name: '채널', value: newState.channel.name, inline: true },
      ).setTimestamp();
    await sendLog(guild, embed);
  } else if (oldState.channel && !newState.channel) {
    // 퇴장
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c).setTitle('🔇 음성채널 퇴장')
      .addFields(
        { name: '유저', value: `<@${member.id}>`, inline: true },
        { name: '채널', value: oldState.channel.name, inline: true },
      ).setTimestamp();
    await sendLog(guild, embed);
  } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    // 이동
    const embed = new EmbedBuilder()
      .setColor(0x3498db).setTitle('🔀 음성채널 이동')
      .addFields(
        { name: '유저', value: `<@${member.id}>`, inline: true },
        { name: '이전', value: oldState.channel.name, inline: true },
        { name: '이동', value: newState.channel.name, inline: true },
      ).setTimestamp();
    await sendLog(guild, embed);
  }
});

// ─── 멤버 입퇴장 로그 ───────────────────────────────────────
client.on(Events.GuildMemberAdd, async (member) => {
  // 환영 메시지
  const welcomeCh = member.guild.channels.cache.find(c => c.name === WELCOME_CHANNEL);
  if (welcomeCh) {
    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('👋 새로운 멤버 입장!')
      .setDescription(`<@${member.id}>님, **${member.guild.name}**에 오신 것을 환영합니다!`)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: '멤버 수', value: `${member.guild.memberCount}번째 멤버`, inline: true },
        { name: '계정 생성', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      )
      .setTimestamp();
    await welcomeCh.send({ embeds: [welcomeEmbed] }).catch(() => {});
  }

  // 자동 역할 부여
  const autoRole = member.guild.roles.cache.find(r => r.name === AUTO_ROLE_NAME);
  if (autoRole) {
    await member.roles.add(autoRole).catch(() => {});
    console.log(`✅ 자동 역할 부여: ${member.user.tag} → ${AUTO_ROLE_NAME}`);
  }

  // 로그
  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('📥 멤버 입장')
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: '유저',       value: `<@${member.id}> (${member.user.tag})`, inline: true },
      { name: '계정 생성',  value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
    )
    .setTimestamp();
  await sendLog(member.guild, embed);
});

client.on(Events.GuildMemberRemove, async (member) => {
  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle('📤 멤버 퇴장')
    .setThumbnail(member.user.displayAvatarURL())
    .addFields({ name: '유저', value: `${member.user.tag}` })
    .setTimestamp();
  await sendLog(member.guild, embed);
  await dmOwner(`📤 멤버 퇴장: ${member.user.tag}`);
});

// ─── 슬래시 커맨드 처리 ─────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, guild, user } = interaction;

  // /공지
  if (commandName === '공지') {
    const 내용 = interaction.options.getString('내용');
    const 채널 = interaction.options.getChannel('채널') || interaction.channel;
    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('📢 공지사항')
      .setDescription(내용)
      .setFooter({ text: `공지자: ${user.tag}` })
      .setTimestamp();
    await 채널.send({ content: '@everyone', embeds: [embed] });
    await interaction.reply({ content: `✅ <#${채널.id}>에 공지 전송 완료!`, ephemeral: true });
    await sendLog(guild, new EmbedBuilder().setColor(0xf1c40f).setTitle('📢 공지 전송')
      .addFields({ name: '채널', value: `<#${채널.id}>`, inline: true }, { name: '실행자', value: `<@${user.id}>`, inline: true }, { name: '내용', value: 내용 }).setTimestamp());
    return;
  }

  // /투표
  if (commandName === '투표') {
    const 질문 = interaction.options.getString('질문');
    const 선택지raw = interaction.options.getString('선택지') || '찬성,반대';
    const 선택지 = 선택지raw.split(',').map(s => s.trim());
    const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
    const desc = 선택지.map((s, i) => `${emojis[i]} ${s}`).join('\n');
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🗳️ 투표')
      .setDescription(`**${질문}**

${desc}`)
      .setFooter({ text: `투표 생성: ${user.tag}` })
      .setTimestamp();
    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    for (let i = 0; i < 선택지.length; i++) await msg.react(emojis[i]).catch(() => {});
    return;
  }

  // /청소
  if (commandName === '청소') {
    const 개수 = Math.min(interaction.options.getInteger('개수'), 100);
    await interaction.deferReply({ ephemeral: true });
    const deleted = await interaction.channel.bulkDelete(개수, true).catch(() => null);
    const count = deleted ? deleted.size : 0;
    await interaction.editReply(`✅ 메시지 **${count}개** 삭제 완료!`);
    await sendLog(guild, new EmbedBuilder().setColor(0xe74c3c).setTitle('🧹 채널 청소')
      .addFields({ name: '채널', value: `<#${interaction.channel.id}>`, inline: true }, { name: '삭제', value: `${count}개`, inline: true }, { name: '실행자', value: `<@${user.id}>`, inline: true }).setTimestamp());
    return;
  }

  // /서버정보
  if (commandName === '서버정보') {
    const g = guild;
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`🏠 ${g.name}`)
      .setThumbnail(g.iconURL())
      .addFields(
        { name: '👑 서버 소유자', value: `<@${g.ownerId}>`, inline: true },
        { name: '👥 멤버 수', value: `${g.memberCount}명`, inline: true },
        { name: '📅 서버 생성일', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '💬 채널 수', value: `${g.channels.cache.size}개`, inline: true },
        { name: '🎭 역할 수', value: `${g.roles.cache.size}개`, inline: true },
        { name: '😀 이모지 수', value: `${g.emojis.cache.size}개`, inline: true },
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /유저정보
  if (commandName === '유저정보') {
    const target = interaction.options.getMember('유저') || interaction.member;
    const u = target.user;
    const roles = target.roles.cache.filter(r => r.id !== guild.roles.everyone.id).map(r => `<@&${r.id}>`).join(', ') || '없음';
    const embed = new EmbedBuilder()
      .setColor(target.displayHexColor || 0x3498db)
      .setTitle(`👤 ${u.tag}`)
      .setThumbnail(u.displayAvatarURL())
      .addFields(
        { name: '🆔 ID', value: u.id, inline: true },
        { name: '📅 계정 생성일', value: `<t:${Math.floor(u.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '📥 서버 입장일', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:D>`, inline: true },
        { name: '⚠️ 경고', value: `${warnings.get(u.id) || 0}/3`, inline: true },
        { name: '🎭 역할', value: roles.length > 1024 ? '역할이 너무 많습니다' : roles },
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /진급
  if (commandName === '진급') {
    const target = interaction.options.getMember('유저');
    const reason = interaction.options.getString('이유') || '이유 없음';
    const RANK_ORDER = [
      '그룹홀더 | GH','부그룹홀더 | VGH','스튜디오 개발자','개발자 | DEV','관리자 | ADMIN',
      '쇠뇌부',
      '국군통수권자 | CIC','국무총리 | PM','국방부 장관 | MoND','국방부 차관 | VMND','참모총장 | CSA','참모차장 | VCSA',
      '대장 | GEN','중장 | LTGEN','소장 | MGEN','준장 | BGEN',
      '대령 | COL','중령 | LTC','소령 | MAJ',
      '대위 | CPT','중위 | 1LT','소위 | 2LT','준위 | MO',
      '주임원사 | ASM','원사 | SGTMAJ','상사 | MSGT','중사 | FSGT','하사 | SSGT',
      '병장 | SGT','상등병 | CPL','일등병 | PFC','이등병 | Private',
    ];
    const currentRank = RANK_ORDER.find(r => target.roles.cache.some(role => role.name === r));
    if (!currentRank) {
      await interaction.reply({ content: '❌ 유저에게 계급 역할이 없습니다.', ephemeral: true });
      return;
    }
    const currentIdx = RANK_ORDER.indexOf(currentRank);
    if (currentIdx <= 0) {
      await interaction.reply({ content: '❌ 이미 최고 계급입니다.', ephemeral: true });
      return;
    }
    const nextRank = RANK_ORDER[currentIdx - 1];
    const currentRole = guild.roles.cache.find(r => r.name === currentRank);
    const nextRole = guild.roles.cache.find(r => r.name === nextRank);
    if (!nextRole) {
      await interaction.reply({ content: `❌ 역할 **${nextRank}**이 서버에 없습니다.`, ephemeral: true });
      return;
    }
    await target.roles.remove(currentRole);
    await target.roles.add(nextRole);
    await interaction.reply(`📈 <@${target.id}> **${currentRank}** → **${nextRank}** 진급! | 이유: ${reason}`);
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71).setTitle('📈 진급')
      .addFields(
        { name: '대상', value: `<@${target.id}>`, inline: true },
        { name: '이전 계급', value: currentRank, inline: true },
        { name: '새 계급', value: nextRank, inline: true },
        { name: '이유', value: reason },
        { name: '실행자', value: `<@${user.id}>` },
      ).setTimestamp();
    await sendLog(guild, embed);
    await dmOwner(`📈 진급\n대상: ${target.user.tag}\n${currentRank} → ${nextRank}\n이유: ${reason}`);
    return;
  }

  // /시험보고서
  if (commandName === '시험보고서') {
    const 시험명 = interaction.options.getString('시험명');
    const 합격자 = interaction.options.getString('합격자');
    const 불합격자 = interaction.options.getString('불합격자') || '없음';
    const 사진 = interaction.options.getAttachment('사진');
    const today = new Date().toISOString().split('T')[0];

    const embed = new EmbedBuilder()
      .setColor(0x2c3e50)
      .setTitle(`📋 시험 보고서 — ${시험명}`)
      .addFields(
        { name: '📅 날짜', value: today, inline: true },
        { name: '✍️ 진행자', value: `<@${user.id}>`, inline: true },
        { name: '✅ 합격자 (이전계급 → 새계급)', value: 합격자 },
        { name: '❌ 불합격자', value: 불합격자 },
      )
      .setFooter({ text: `작성자: ${user.tag}` })
      .setTimestamp();

    if (사진) embed.setImage(사진.url);

    await interaction.reply({ embeds: [embed] });
    await sendLog(guild, embed);
    await dmOwner(`📋 시험 보고서\n시험명: ${시험명}\n합격자: ${합격자}\n불합격자: ${불합격자}`);
    return;
  }

  // /시험시작
  if (commandName === '시험시작') {
    const 제목 = interaction.options.getString('제목');
    const 시간 = interaction.options.getInteger('시간');
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c).setTitle('⚠️ 시험 시작!')
      .setDescription(`**${제목}** 시험이 시작되었습니다!`)
      .addFields(
        { name: '시험명', value: 제목, inline: true },
        { name: '시간', value: 시간 ? `${시간}분` : '미정', inline: true },
        { name: '진행자', value: `<@${user.id}>`, inline: true },
      ).setTimestamp();
    await interaction.reply({ content: '@everyone', embeds: [embed] });
    if (시간) {
      setTimeout(async () => {
        const endEmbed = new EmbedBuilder()
          .setColor(0x2ecc71).setTitle('✅ 시험 종료!')
          .setDescription(`**${제목}** 시험이 종료되었습니다!`)
          .setTimestamp();
        await interaction.channel.send({ content: '@everyone', embeds: [endEmbed] }).catch(() => {});
      }, 시간 * 60 * 1000);
    }
    await sendLog(guild, embed);
    return;
  }

  // /징계
  if (commandName === '징계') {
    const target = interaction.options.getUser('유저');
    const 내용 = interaction.options.getString('내용');
    const 기간 = interaction.options.getString('기간') || '무기한';
    disciplineList.push({
      id: target.id, tag: target.tag, 내용, 기간,
      실행자: user.id, 날짜: new Date().toISOString().split('T')[0],
    });
    saveDiscipline(disciplineList);
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c).setTitle('⚖️ 징계 기록')
      .addFields(
        { name: '대상', value: `<@${target.id}>`, inline: true },
        { name: '기간', value: 기간, inline: true },
        { name: '내용', value: 내용 },
        { name: '실행자', value: `<@${user.id}>` },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    await sendLog(guild, embed);
    await dmOwner(`⚖️ 징계\n대상: ${target.tag}\n기간: ${기간}\n내용: ${내용}`);
    return;
  }

  // /징계목록
  if (commandName === '징계목록') {
    const target = interaction.options.getUser('유저');
    const list = target
      ? disciplineList.filter(d => d.id === target.id)
      : disciplineList;
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c).setTitle(target ? `⚖️ ${target.tag} 징계 기록` : '⚖️ 전체 징계 기록')
      .setDescription(list.length > 0
        ? list.map((d, i) => `**${i+1}.** <@${d.id}> | ${d.날짜} | ${d.기간}\n└ ${d.내용}`).join('\n\n')
        : '징계 기록이 없습니다.')
      .setFooter({ text: `총 ${list.length}건` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /활동통계
  if (commandName === '활동통계') {
    saveStats(activityStats);
    const target = interaction.options.getMember('유저') || interaction.member;
    const stats = activityStats[target.id] || { messages: 0, days: {} };
    const today = new Date().toISOString().split('T')[0];
    const todayMsg = stats.days?.[today] || 0;
    const activeDays = Object.keys(stats.days || {}).length;
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6).setTitle(`📊 ${target.user.tag} 활동 통계`)
      .setThumbnail(target.user.displayAvatarURL())
      .addFields(
        { name: '📨 총 메시지', value: `${stats.messages || 0}개`, inline: true },
        { name: '📅 오늘 메시지', value: `${todayMsg}개`, inline: true },
        { name: '🗓️ 활동 일수', value: `${activeDays}일`, inline: true },
        { name: '⚠️ 경고', value: `${warnings.get(target.id) || 0}/3`, inline: true },
        { name: '⚖️ 징계', value: `${disciplineList.filter(d => d.id === target.id).length}건`, inline: true },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /부재신청
  if (commandName === '부재신청') {
    const 시작 = interaction.options.getString('시작');
    const 종료 = interaction.options.getString('종료');
    const 사유 = interaction.options.getString('사유');
    absenceList = absenceList.filter(a => a.id !== user.id);
    absenceList.push({ id: user.id, tag: user.tag, 시작, 종료, 사유 });
    saveAbsence(absenceList);
    const embed = new EmbedBuilder()
      .setColor(0xf39c12).setTitle('🏖️ 부재 신청')
      .addFields(
        { name: '신청자', value: `<@${user.id}>`, inline: true },
        { name: '기간', value: `${시작} ~ ${종료}`, inline: true },
        { name: '사유', value: 사유 },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    await sendLog(guild, embed);
    return;
  }

  // /부재목록
  if (commandName === '부재목록') {
    const today = new Date().toISOString().split('T')[0];
    const list = absenceList.filter(a => a.종료 >= today);
    const embed = new EmbedBuilder()
      .setColor(0xf39c12).setTitle('🏖️ 부재 중인 멤버')
      .setDescription(list.length > 0
        ? list.map((a, i) => `**${i+1}.** <@${a.id}>\n└ ${a.시작} ~ ${a.종료} | ${a.사유}`).join('\n\n')
        : '현재 부재 중인 멤버가 없습니다.')
      .setFooter({ text: `총 ${list.length}명` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /부재취소
  if (commandName === '부재취소') {
    const before = absenceList.length;
    absenceList = absenceList.filter(a => a.id !== user.id);
    if (absenceList.length === before) {
      await interaction.reply({ content: '❌ 등록된 부재 신청이 없습니다.', ephemeral: true });
      return;
    }
    saveAbsence(absenceList);
    await interaction.reply('✅ 부재 신청이 취소되었습니다!');
    return;
  }

  // /강등
  if (commandName === '강등') {
    const target = interaction.options.getMember('유저');
    const reason = interaction.options.getString('이유') || '이유 없음';

    // 계급 순서 (높은 순)
    const RANK_ORDER = [
      '그룹홀더 | GH','부그룹홀더 | VGH','스튜디오 개발자','개발자 | DEV','관리자 | ADMIN',
      '쇠뇌부',
      '국군통수권자 | CIC','국무총리 | PM','국방부 장관 | MoND','국방부 차관 | VMND','참모총장 | CSA','참모차장 | VCSA',
      '대장 | GEN','중장 | LTGEN','소장 | MGEN','준장 | BGEN',
      '대령 | COL','중령 | LTC','소령 | MAJ',
      '대위 | CPT','중위 | 1LT','소위 | 2LT','준위 | MO',
      '주임원사 | ASM','원사 | SGTMAJ','상사 | MSGT','중사 | FSGT','하사 | SSGT',
      '병장 | SGT','상등병 | CPL','일등병 | PFC','이등병 | Private',
    ];

    // 현재 계급 찾기
    const currentRank = RANK_ORDER.find(r => target.roles.cache.some(role => role.name === r));
    if (!currentRank) {
      await interaction.reply({ content: '❌ 유저에게 계급 역할이 없습니다.', ephemeral: true });
      return;
    }

    const currentIdx = RANK_ORDER.indexOf(currentRank);
    if (currentIdx >= RANK_ORDER.length - 1) {
      await interaction.reply({ content: '❌ 더 이상 강등할 수 없습니다. (최하위 계급)', ephemeral: true });
      return;
    }

    const nextRank = RANK_ORDER[currentIdx + 1];
    const currentRole = guild.roles.cache.find(r => r.name === currentRank);
    const nextRole = guild.roles.cache.find(r => r.name === nextRank);

    if (!nextRole) {
      await interaction.reply({ content: `❌ 강등할 역할 **${nextRank}**이 서버에 없습니다.`, ephemeral: true });
      return;
    }

    await target.roles.remove(currentRole);
    await target.roles.add(nextRole);
    await interaction.reply(`📉 <@${target.id}> **${currentRank}** → **${nextRank}** 강등 | 이유: ${reason}`);

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c).setTitle('📉 강등')
      .addFields(
        { name: '대상', value: `<@${target.id}>`, inline: true },
        { name: '이전 계급', value: currentRank, inline: true },
        { name: '변경 계급', value: nextRank, inline: true },
        { name: '이유', value: reason },
        { name: '실행자', value: `<@${user.id}>` },
      ).setTimestamp();
    await sendLog(guild, embed);
    await dmOwner(`📉 강등\n대상: ${target.user.tag}\n${currentRank} → ${nextRank}\n이유: ${reason}`);
    return;
  }

  // /시험등록
  if (commandName === '시험등록') {
    const 제목 = interaction.options.getString('제목');
    const 날짜 = interaction.options.getString('날짜');
    const 내용 = interaction.options.getString('내용') || '내용 없음';
    const id = Date.now();
    examList.push({ id, 제목, 날짜, 내용, 등록자: user.id });
    saveExam(examList);
    const embed = new EmbedBuilder()
      .setColor(0x3498db).setTitle('📅 시험 일정 등록')
      .addFields(
        { name: '시험명', value: 제목, inline: true },
        { name: '날짜', value: 날짜, inline: true },
        { name: '내용', value: 내용 },
        { name: '등록자', value: `<@${user.id}>` },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    await sendLog(guild, embed);
    return;
  }

  // /시험목록
  if (commandName === '시험목록') {
    if (examList.length === 0) {
      await interaction.reply({ content: '📅 등록된 시험 일정이 없습니다.', ephemeral: true });
      return;
    }
    const embed = new EmbedBuilder()
      .setColor(0x3498db).setTitle('📅 시험 일정 목록')
      .setDescription(examList.map((t, i) => `**${i+1}.** ${t.제목} | ${t.날짜}`).join('\n'))
      .setFooter({ text: `총 ${examList.length}개` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /시험삭제
  if (commandName === '시험삭제') {
    const 번호 = interaction.options.getInteger('번호') - 1;
    if (번호 < 0 || 번호 >= examList.length) {
      await interaction.reply({ content: '❌ 잘못된 번호입니다.', ephemeral: true });
      return;
    }
    const deleted = examList.splice(번호, 1)[0];
    saveExam(examList);
    await interaction.reply(`✅ 시험 **${deleted.제목}** 삭제 완료!`);
    return;
  }

  // /개발출석
  if (commandName === '개발출석') {
    const 작업내용 = interaction.options.getString('작업내용');
    const today = new Date().toISOString().split('T')[0];
    if (!devAttendance[today]) devAttendance[today] = [];

    const existing = devAttendance[today].find(d => d.id === user.id);
    if (existing) {
      existing.작업내용 = 작업내용;
      existing.시간 = new Date().toLocaleTimeString('ko-KR');
      saveDevAttend(devAttendance);
      await interaction.reply(`✅ <@${user.id}> 개발 출석 업데이트!
📝 **${작업내용}**`);
      return;
    }

    devAttendance[today].push({
      id: user.id,
      tag: user.tag,
      작업내용,
      시간: new Date().toLocaleTimeString('ko-KR'),
    });
    saveDevAttend(devAttendance);

    const embed = new EmbedBuilder()
      .setColor(0x00bcd4).setTitle('💻 개발 출석 완료!')
      .addFields(
        { name: '개발자', value: `<@${user.id}>`, inline: true },
        { name: '날짜', value: today, inline: true },
        { name: '작업 내용', value: 작업내용 },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    await sendLog(guild, embed);
    return;
  }

  // /개발출석목록
  if (commandName === '개발출석목록') {
    const today = new Date().toISOString().split('T')[0];
    const list = devAttendance[today] || [];
    const embed = new EmbedBuilder()
      .setColor(0x00bcd4).setTitle(`💻 개발자 출석 현황 (${today})`)
      .setDescription(list.length > 0
        ? list.map((d, i) => `**${i+1}.** <@${d.id}> [${d.시간}]\n└ ${d.작업내용}`).join('\n\n')
        : '오늘 출석한 개발자가 없습니다.')
      .setFooter({ text: `총 ${list.length}명 출석` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /개발출석초기화
  if (commandName === '개발출석초기화') {
    devAttendance = {};
    saveDevAttend(devAttendance);
    await interaction.reply('✅ 개발자 출석 데이터 초기화 완료!');
    return;
  }

  // /출석
  if (commandName === '출석') {
    const today = new Date().toISOString().split('T')[0];
    if (!attendance[today]) attendance[today] = [];
    if (attendance[today].includes(user.id)) {
      await interaction.reply({ content: '✅ 이미 오늘 출석했습니다!', ephemeral: true });
      return;
    }
    attendance[today].push(user.id);
    saveAttendance(attendance);
    await interaction.reply(`✅ <@${user.id}> 출석 완료! (오늘 ${attendance[today].length}명 출석)`);
    return;
  }

  // /출석목록
  if (commandName === '출석목록') {
    const today = new Date().toISOString().split('T')[0];
    const list = attendance[today] || [];
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71).setTitle(`📋 오늘 출석 명단 (${today})`)
      .setDescription(list.length > 0 ? list.map((id, i) => `${i+1}. <@${id}>`).join('\n') : '출석자 없음')
      .setFooter({ text: `총 ${list.length}명` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /출석초기화
  if (commandName === '출석초기화') {
    attendance = {};
    saveAttendance(attendance);
    await interaction.reply('✅ 출석 데이터 초기화 완료!');
    return;
  }

  // /명단
  if (commandName === '명단') {
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6).setTitle('👥 부대원 명단')
      .setDescription(roster.length > 0 ? roster.map((m, i) => `${i+1}. <@${m.id}> ${m.memo ? `— ${m.memo}` : ''}`).join('\n') : '명단이 비어있습니다.')
      .setFooter({ text: `총 ${roster.length}명` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /명단추가
  if (commandName === '명단추가') {
    const target = interaction.options.getUser('유저');
    const memo = interaction.options.getString('메모') || '';
    if (roster.find(m => m.id === target.id)) {
      await interaction.reply({ content: '❌ 이미 명단에 있습니다.', ephemeral: true });
      return;
    }
    roster.push({ id: target.id, tag: target.tag, memo, 추가일: new Date().toISOString().split('T')[0] });
    saveRoster(roster);
    await interaction.reply(`✅ **${target.tag}** 명단 추가 완료!`);
    return;
  }

  // /명단제거
  if (commandName === '명단제거') {
    const target = interaction.options.getUser('유저');
    const before = roster.length;
    roster = roster.filter(m => m.id !== target.id);
    if (roster.length === before) {
      await interaction.reply({ content: '❌ 명단에 없는 유저입니다.', ephemeral: true });
      return;
    }
    saveRoster(roster);
    await interaction.reply(`✅ **${target.tag}** 명단 제거 완료!`);
    return;
  }

  // /채널생성
  if (commandName === '채널생성') {
    const 이름 = interaction.options.getString('이름');
    const 종류 = interaction.options.getString('종류') || 'GUILD_TEXT';
    const { ChannelType } = require('discord.js');
    const type = 종류 === 'GUILD_VOICE' ? ChannelType.GuildVoice : ChannelType.GuildText;
    const ch = await guild.channels.create({ name: 이름, type, reason: `채널생성 커맨드: ${user.tag}` });
    await interaction.reply(`✅ <#${ch.id}> 채널 생성 완료!`);
    await sendLog(guild, new EmbedBuilder().setColor(0x2ecc71).setTitle('📢 채널 생성')
      .addFields({ name: '채널', value: `<#${ch.id}>`, inline: true }, { name: '종류', value: 종류 === 'GUILD_VOICE' ? '음성' : '텍스트', inline: true }, { name: '실행자', value: `<@${user.id}>` }).setTimestamp());
    return;
  }

  // /잠금
  if (commandName === '잠금') {
    const ch = interaction.options.getChannel('채널') || interaction.channel;
    await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
    await ch.send('🔒 **채널이 잠금되었습니다.** 관리자만 메시지를 보낼 수 있습니다.');
    await interaction.reply({ content: `✅ <#${ch.id}> 잠금 완료!`, ephemeral: true });
    await sendLog(guild, new EmbedBuilder().setColor(0xe74c3c).setTitle('🔒 채널 잠금')
      .addFields({ name: '채널', value: `<#${ch.id}>`, inline: true }, { name: '실행자', value: `<@${user.id}>`, inline: true }).setTimestamp());
    return;
  }

  // /잠금해제
  if (commandName === '잠금해제') {
    const ch = interaction.options.getChannel('채널') || interaction.channel;
    await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
    await ch.send('🔓 **채널 잠금이 해제되었습니다.**');
    await interaction.reply({ content: `✅ <#${ch.id}> 잠금 해제 완료!`, ephemeral: true });
    await sendLog(guild, new EmbedBuilder().setColor(0x2ecc71).setTitle('🔓 채널 잠금 해제')
      .addFields({ name: '채널', value: `<#${ch.id}>`, inline: true }, { name: '실행자', value: `<@${user.id}>`, inline: true }).setTimestamp());
    return;
  }

  // /채널삭제
  if (commandName === '채널삭제') {
    const ch = interaction.channel;
    await interaction.reply('✅ 3초 후 이 채널이 삭제됩니다...');
    setTimeout(() => ch.delete(`채널삭제 커맨드: ${user.tag}`).catch(() => {}), 3000);
    return;
  }

  // /가위바위보
  if (commandName === '가위바위보') {
    const choices = ['가위', '바위', '보'];
    const emojis = { '가위': '✌️', '바위': '✊', '보': '🖐️' };
    const user선택 = interaction.options.getString('선택');
    const bot선택 = choices[Math.floor(Math.random() * 3)];
    let result;
    if (user선택 === bot선택) result = '🤝 무승부!';
    else if ((user선택 === '가위' && bot선택 === '보') || (user선택 === '바위' && bot선택 === '가위') || (user선택 === '보' && bot선택 === '바위')) result = '🎉 승리!';
    else result = '😢 패배!';
    const embed = new EmbedBuilder()
      .setColor(result.includes('승') ? 0x2ecc71 : result.includes('패') ? 0xe74c3c : 0xf1c40f)
      .setTitle('✊ 가위바위보')
      .addFields(
        { name: '내 선택', value: `${emojis[user선택]} ${user선택}`, inline: true },
        { name: '봇 선택', value: `${emojis[bot선택]} ${bot선택}`, inline: true },
        { name: '결과', value: result },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /주사위
  if (commandName === '주사위') {
    const 면 = interaction.options.getInteger('면') || 6;
    const result = Math.floor(Math.random() * 면) + 1;
    await interaction.reply(`🎲 **${면}면 주사위** → **${result}**`);
    return;
  }

  // /타이머
  if (commandName === '타이머') {
    const 분 = interaction.options.getInteger('분');
    const 메모 = interaction.options.getString('메모') || '타이머';
    const embed = new EmbedBuilder()
      .setColor(0xe67e22).setTitle('⏱️ 타이머 시작!')
      .addFields(
        { name: '메모', value: 메모, inline: true },
        { name: '시간', value: `${분}분`, inline: true },
      )
      .setFooter({ text: `설정자: ${user.tag}` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });

    setTimeout(async () => {
      const doneEmbed = new EmbedBuilder()
        .setColor(0x2ecc71).setTitle('⏰ 타이머 종료!')
        .setDescription(`**${메모}** 타이머가 종료되었습니다! @everyone`)
        .setTimestamp();
      await interaction.channel.send({ content: '@everyone', embeds: [doneEmbed] }).catch(() => {});
    }, 분 * 60 * 1000);
    return;
  }

  // /건의
  if (commandName === '건의') {
    const 내용 = interaction.options.getString('내용');
    const 익명 = interaction.options.getBoolean('익명') ?? false;
    const id = suggestions.length + 1;
    suggestions.push({ id, 내용, 작성자: 익명 ? '익명' : user.tag, 작성자id: user.id, 익명, 답변: null, 날짜: new Date().toISOString().split('T')[0] });
    saveSuggestions(suggestions);

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6).setTitle(`💬 건의사항 #${id}`)
      .addFields(
        { name: '작성자', value: 익명 ? '익명' : `<@${user.id}>`, inline: true },
        { name: '날짜', value: new Date().toISOString().split('T')[0], inline: true },
        { name: '내용', value: 내용 },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    await sendLog(guild, embed);
    return;
  }

  // /건의목록
  if (commandName === '건의목록') {
    const list = suggestions.slice(-10).reverse();
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6).setTitle('💬 건의사항 목록')
      .setDescription(list.length > 0
        ? list.map(s => `**#${s.id}** ${s.작성자} | ${s.날짜}\n└ ${s.내용}${s.답변 ? `\n✅ 답변: ${s.답변}` : ''}`).join('\n\n')
        : '건의사항이 없습니다.')
      .setFooter({ text: `총 ${suggestions.length}개` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /건의답변
  if (commandName === '건의답변') {
    const 번호 = interaction.options.getInteger('번호');
    const 답변 = interaction.options.getString('답변');
    const suggest = suggestions.find(s => s.id === 번호);
    if (!suggest) {
      await interaction.reply({ content: `❌ #${번호} 건의사항을 찾을 수 없습니다.`, ephemeral: true });
      return;
    }
    suggest.답변 = 답변;
    saveSuggestions(suggestions);
    await interaction.reply(`✅ **#${번호}** 건의사항에 답변 완료!`);

    // 작성자에게 DM
    if (!suggest.익명) {
      const 작성자 = await client.users.fetch(suggest.작성자id).catch(() => null);
      if (작성자) await 작성자.send(`💬 건의사항 #${번호}에 답변이 달렸습니다!\n\n**내용:** ${suggest.내용}\n**답변:** ${답변}`).catch(() => {});
    }
    return;
  }

  // /공지dm
  if (commandName === '공지dm') {
    const 내용 = interaction.options.getString('내용');
    await interaction.deferReply({ ephemeral: true });
    await guild.members.fetch();
    const members = guild.members.cache.filter(m => !m.user.bot);
    let success = 0, fail = 0;
    for (const [, member] of members) {
      try {
        await member.send(`📢 **${guild.name}** 공지\n\n${내용}`);
        success++;
      } catch (e) { fail++; }
      await new Promise(r => setTimeout(r, 500));
    }
    await interaction.editReply(`✅ DM 발송 완료! 성공: **${success}명** | 실패: **${fail}명**`);
    await sendLog(guild, new EmbedBuilder().setColor(0xf1c40f).setTitle('📢 전체 DM 발송')
      .addFields({ name: '실행자', value: `<@${user.id}>`, inline: true }, { name: '성공', value: `${success}명`, inline: true }, { name: '실패', value: `${fail}명`, inline: true }, { name: '내용', value: 내용 }).setTimestamp());
    return;
  }

  // /계급표
  if (commandName === '계급표') {
    const embed = new EmbedBuilder()
      .setColor(0x2c3e50).setTitle('🎖️ 계급 체계표')
      .addFields(
        { name: '🟢 병 (하위직)', value: '이등병 → 일등병 → 상등병 → 병장' },
        { name: '🩵 부사관 (중위직)', value: '하사 → 중사 → 상사 → 원사 → 주임원사' },
        { name: '🔵 위관급 (중위직)', value: '준위 → 소위 → 중위 → 대위' },
        { name: '🟣 영관급 (고위직)', value: '소령 → 중령 → 대령' },
        { name: '🟠 장성급 (고위직)', value: '준장 → 소장 → 중장 → 대장' },
        { name: '🔴 지휘부 (초고위직)', value: '참모차장 → 참모총장 → 국방부 차관 → 국방부 장관 → 국무총리 → 국군통수권자' },
        { name: '🟡 관리', value: '관리자 → 개발자 → 스튜디오 개발자 → 부그룹홀더 → 그룹홀더' },
        { name: '💜 특수', value: '쇠뇌부' },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /모집공고
  if (commandName === '모집공고') {
    const 내용 = interaction.options.getString('내용');
    const 인원 = interaction.options.getInteger('인원') || 0;
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71).setTitle('📢 신병 모집 공고')
      .setDescription(내용)
      .addFields(
        { name: '모집 인원', value: 인원 ? `${인원}명` : '제한 없음', inline: true },
        { name: '담당자', value: `<@${user.id}>`, inline: true },
      )
      .setFooter({ text: '지원 문의는 DM으로!' }).setTimestamp();
    await interaction.reply({ content: '@everyone', embeds: [embed] });
    return;
  }

  // /월간통계
  if (commandName === '월간통계') {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthStats = Object.entries(activityStats).map(([id, s]) => ({
      id, total: Object.entries(s.days || {}).filter(([d]) => d.startsWith(thisMonth)).reduce((a, [, v]) => a + v, 0)
    })).filter(s => s.total > 0).sort((a, b) => b.total - a.total).slice(0, 10);

    const today = new Date().toISOString().split('T')[0];
    const todayAttend = attendance[today]?.length || 0;
    const monthAttendDays = Object.keys(attendance).filter(d => d.startsWith(thisMonth)).length;

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6).setTitle(`📊 ${thisMonth} 월간 통계`)
      .addFields(
        { name: '👥 총 멤버', value: `${guild.memberCount}명`, inline: true },
        { name: '✅ 오늘 출석', value: `${todayAttend}명`, inline: true },
        { name: '📅 이번달 출석일', value: `${monthAttendDays}일`, inline: true },
        { name: '⚠️ 이번달 경고', value: `${Object.values(Object.fromEntries(warnings)).reduce((a, b) => a + b, 0)}건`, inline: true },
        { name: '⚖️ 이번달 징계', value: `${disciplineList.filter(d => d.날짜?.startsWith(thisMonth)).length}건`, inline: true },
        { name: '📈 진급/강등', value: `${rankLog.filter(r => r.date?.startsWith(thisMonth)).length}건`, inline: true },
        { name: '💬 활동 TOP 5', value: monthStats.slice(0, 5).map((s, i) => `${i+1}. <@${s.id}> — ${s.total}개`).join('\n') || '데이터 없음' },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /진급기록
  if (commandName === '진급기록') {
    const target = interaction.options.getMember('유저') || interaction.member;
    const logs = rankLog.filter(r => r.userId === target.id);
    const embed = new EmbedBuilder()
      .setColor(0x3498db).setTitle(`📋 ${target.user.tag} 진급/강등 기록`)
      .setDescription(logs.length > 0
        ? logs.map((r, i) => `${i+1}. ${r.type === '진급' ? '📈' : '📉'} **${r.from}** → **${r.to}**\n└ ${r.date} | ${r.reason}`).join('\n\n')
        : '기록이 없습니다.')
      .setFooter({ text: `총 ${logs.length}건` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /출석률
  if (commandName === '출석률') {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthDays = Object.keys(attendance).filter(d => d.startsWith(thisMonth));
    const totalDays = monthDays.length || 1;
    const memberAttend = {};
    monthDays.forEach(d => attendance[d]?.forEach(id => { memberAttend[id] = (memberAttend[id] || 0) + 1; }));
    const sorted = Object.entries(memberAttend).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71).setTitle(`📅 ${thisMonth} 출석률`)
      .setDescription(sorted.length > 0
        ? sorted.map(([ id, days], i) => `${i+1}. <@${id}> — ${days}일 / ${totalDays}일 (${Math.round(days/totalDays*100)}%)`).join('\n')
        : '데이터 없음')
      .setFooter({ text: `이번달 출석일: ${totalDays}일` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /경고기록
  if (commandName === '경고기록') {
    const list = [...warnings.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const embed = new EmbedBuilder()
      .setColor(0xff6b35).setTitle('⚠️ 전체 경고 현황')
      .setDescription(list.length > 0
        ? list.map(([id, count]) => `<@${id}> — **${count}/3**`).join('\n')
        : '경고 기록 없음')
      .setFooter({ text: `총 ${list.length}명` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /출석순위
  if (commandName === '출석순위') {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthDays = Object.keys(attendance).filter(d => d.startsWith(thisMonth));
    const memberAttend = {};
    monthDays.forEach(d => attendance[d]?.forEach(id => { memberAttend[id] = (memberAttend[id] || 0) + 1; }));
    const sorted = Object.entries(memberAttend).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
    const embed = new EmbedBuilder()
      .setColor(0xf1c40f).setTitle(`🏆 ${thisMonth} 출석 순위 TOP 10`)
      .setDescription(sorted.length > 0
        ? sorted.map(([id, days], i) => `${medals[i]} <@${id}> — **${days}일**`).join('\n')
        : '데이터 없음')
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /전체잠금
  if (commandName === '전체잠금') {
    const 모드 = interaction.options.getString('모드');
    await interaction.deferReply({ ephemeral: true });
    const channels = guild.channels.cache.filter(c => c.type === 0);
    let count = 0;
    for (const [, ch] of channels) {
      await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: 모드 === 'lock' ? false : null }).catch(() => {});
      count++;
    }
    await interaction.editReply(`${모드 === 'lock' ? '🔒' : '🔓'} **${count}개** 채널 ${모드 === 'lock' ? '잠금' : '잠금 해제'} 완료!`);
    await sendLog(guild, new EmbedBuilder().setColor(모드 === 'lock' ? 0xe74c3c : 0x2ecc71)
      .setTitle(모드 === 'lock' ? '🔒 전체 채널 잠금' : '🔓 전체 채널 잠금 해제')
      .addFields({ name: '실행자', value: `<@${user.id}>` }).setTimestamp());
    return;
  }

  // /고정
  if (commandName === '고정') {
    const msgId = interaction.options.getString('메시지id');
    const msg = await interaction.channel.messages.fetch(msgId).catch(() => null);
    if (!msg) { await interaction.reply({ content: '❌ 메시지를 찾을 수 없습니다.', ephemeral: true }); return; }
    await msg.pin();
    await interaction.reply(`✅ 메시지가 고정되었습니다!`);
    return;
  }

  // /초대링크
  if (commandName === '초대링크') {
    const 시간 = interaction.options.getInteger('시간') || 24;
    const invite = await interaction.channel.createInvite({ maxAge: 시간 === 0 ? 0 : 시간 * 3600, maxUses: 0 });
    await interaction.reply({ content: `🔗 초대링크: ${invite.url} (유효시간: ${시간 === 0 ? '영구' : `${시간}시간`})`, ephemeral: true });
    return;
  }

  // /봇설정
  if (commandName === '봇설정') {
    const embed = new EmbedBuilder()
      .setColor(0x3498db).setTitle('⚙️ 봇 설정 현황')
      .addFields(
        { name: '📋 로그 채널', value: botConfig.logChannel, inline: true },
        { name: '👋 환영 채널', value: botConfig.welcomeChannel, inline: true },
        { name: '🎭 자동 역할', value: botConfig.autoRole, inline: true },
        { name: '🚫 추가 욕설', value: botConfig.customSwears.length > 0 ? botConfig.customSwears.join(', ') : '없음' },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  // /욕설추가
  if (commandName === '욕설추가') {
    const 단어 = interaction.options.getString('단어');
    if (!botConfig.customSwears.includes(단어)) {
      botConfig.customSwears.push(단어);
      saveBotConfig(botConfig);
    }
    await interaction.reply(`✅ **${단어}** 욕설 목록 추가 완료!`);
    return;
  }

  // /욕설제거
  if (commandName === '욕설제거') {
    const 단어 = interaction.options.getString('단어');
    botConfig.customSwears = botConfig.customSwears.filter(w => w !== 단어);
    saveBotConfig(botConfig);
    await interaction.reply(`✅ **${단어}** 욕설 목록 제거 완료!`);
    return;
  }

  // /욕설목록
  if (commandName === '욕설목록') {
    const 기본 = SWEAR_WORDS.join(', ');
    const 추가 = botConfig.customSwears.length > 0 ? botConfig.customSwears.join(', ') : '없음';
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c).setTitle('🚫 욕설 목록')
      .addFields(
        { name: '기본 욕설', value: 기본.length > 1024 ? 기본.slice(0, 1021) + '...' : 기본 },
        { name: '추가 욕설', value: 추가 },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  // /로그채널설정
  if (commandName === '로그채널설정') {
    const ch = interaction.options.getChannel('채널');
    botConfig.logChannel = ch.name;
    saveBotConfig(botConfig);
    await interaction.reply(`✅ 로그 채널이 <#${ch.id}>로 변경되었습니다!`);
    return;
  }

  // /환영채널설정
  if (commandName === '환영채널설정') {
    const ch = interaction.options.getChannel('채널');
    botConfig.welcomeChannel = ch.name;
    saveBotConfig(botConfig);
    await interaction.reply(`✅ 환영 채널이 <#${ch.id}>로 변경되었습니다!`);
    return;
  }

  // /자동역할설정
  if (commandName === '자동역할설정') {
    const 역할 = interaction.options.getString('역할');
    botConfig.autoRole = 역할;
    saveBotConfig(botConfig);
    await interaction.reply(`✅ 자동 역할이 **${역할}**로 변경되었습니다!`);
    return;
  }

  // /도움말
  if (commandName === '도움말') {
    const embed = new EmbedBuilder()
      .setColor(0x3498db).setTitle('📖 커맨드 도움말')
      .addFields(
        { name: '⚔️ 부대 운영', value: '/진급 /강등 /계급표 /모집공고 /시험보고서 /시험등록 /시험목록 /시험삭제 /시험시작' },
        { name: '🛡️ 관리', value: '/경고 /경고확인 /경고초기화 /경고기록 /징계 /징계목록 /타임아웃 /킥 /밴' },
        { name: '👥 멤버', value: '/역할부여 /역할제거 /유저정보 /닉네임 /명단 /명단추가 /명단제거' },
        { name: '📊 통계', value: '/활동통계 /월간통계 /진급기록 /출석률 /출석순위 /경고기록' },
        { name: '✅ 출석', value: '/출석 /출석목록 /출석초기화 /개발출석 /개발출석목록' },
        { name: '🏖️ 부재', value: '/부재신청 /부재목록 /부재취소' },
        { name: '📢 공지', value: '/공지 /공지dm /규칙' },
        { name: '🎮 미니게임', value: '/가위바위보 /주사위 /동전' },
        { name: '🔧 서버', value: '/청소 /잠금 /잠금해제 /전체잠금 /채널생성 /채널삭제 /슬로우모드 /고정 /초대링크' },
        { name: '⚙️ 봇 설정', value: '/봇설정 /욕설추가 /욕설제거 /욕설목록 /로그채널설정 /환영채널설정 /자동역할설정' },
        { name: '🗄️ 기타', value: '/서버정보 /봇정보 /핑 /백업 /투표 /타이머 /건의 /건의목록' },
      ).setFooter({ text: '[] = 필수 | () = 선택' }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /봇정보
  if (commandName === '봇정보') {
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6).setTitle('🤖 봇 정보')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: '봇 이름', value: client.user.tag, inline: true },
        { name: '버전', value: 'v2.0.0', inline: true },
        { name: '핑', value: `${client.ws.ping}ms`, inline: true },
        { name: '서버 수', value: `${client.guilds.cache.size}개`, inline: true },
        { name: '커맨드 수', value: `${commands.length}개`, inline: true },
        { name: '업타임', value: `${Math.floor(process.uptime() / 3600)}시간 ${Math.floor((process.uptime() % 3600) / 60)}분`, inline: true },
        { name: '개발', value: 'discord.js v14', inline: true },
        { name: '호스팅', value: 'Discloud', inline: true },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /백업
  if (commandName === '백업') {
    await interaction.deferReply({ ephemeral: true });
    await guild.roles.fetch();
    await guild.channels.fetch();

    const backup = {
      날짜: new Date().toISOString(),
      서버명: guild.name,
      멤버수: guild.memberCount,
      역할목록: guild.roles.cache.map(r => ({ name: r.name, color: r.color, position: r.position })),
      채널목록: guild.channels.cache.map(c => ({ name: c.name, type: c.type })),
      경고데이터: Object.fromEntries(warnings),
      징계데이터: disciplineList,
      명단데이터: roster,
    };

    const backupStr = JSON.stringify(backup, null, 2);
    const { AttachmentBuilder } = require('discord.js');
    const buffer = Buffer.from(backupStr, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `backup_${new Date().toISOString().split('T')[0]}.json` });

    await interaction.editReply({ content: '✅ 백업 완료!', files: [attachment] });
    await dmOwner(`🗄️ 서버 백업 완료\n실행자: ${user.tag}\n날짜: ${new Date().toISOString().split('T')[0]}`);
    return;
  }

  // /동전
  if (commandName === '동전') {
    const result = Math.random() < 0.5 ? '앞면 🟡' : '뒷면 ⚪';
    await interaction.reply(`🪙 동전 던지기 → **${result}**`);
    return;
  }

  // /규칙
  if (commandName === '규칙') {
    const ch = interaction.options.getChannel('채널') || interaction.channel;
    const embed = new EmbedBuilder()
      .setColor(0x2c3e50)
      .setTitle('📋 부대 서버 규칙')
      .setDescription('모든 부대원은 아래 규칙을 숙지하고 준수해 주세요.')
      .addFields(
        {
          name: '1️⃣ 상호 존중',
          value: [
            '• 비속어, 욕설, 비하 발언(지역/인종/성별 등) **금지**',
            '• 유저 간 분쟁은 DM으로 해결, 공용 채널 다툼은 **엄격히 제재**',
            '• 도배(의미없는 문자, 이모지 남발, 반복 메시지) **금지**',
          ].join('\n'),
        },
        {
          name: '2️⃣ 부대 운영',
          value: [
            '• 운영진/간부 **사칭 금지** → 즉시 추방',
            '• 계급 체계 준수: 하급자는 정당한 지시를 따르고, 상급자는 권력 남용 금지',
            '• 과도한 친목으로 신규 유저가 소외되지 않도록 주의',
          ].join('\n'),
        },
        {
          name: '3️⃣ 즉시 처벌 대상',
          value: [
            '• **홍보 행위**: 타 서버/유튜브/외부 링크 공유 금지',
            '• **불법 프로그램**: 핵, 스크립트 악용, 버그 공유 → **영구 밴**',
            '• **정치/종교** 관련 논란성 발언 금지',
          ].join('\n'),
        },
        {
          name: '4️⃣ 채널 이용 가이드',
          value: [
            '• 각 채널 목적에 맞는 대화만 (예: 건의사항 → #부대-건의)',
            '• 운영진 멘션은 꼭 필요한 경우에만, **무분별한 멘션 제재**',
          ].join('\n'),
        },
      )
      .setFooter({ text: '규칙 위반 시 경고 → 타임아웃 → 추방 → 영구 밴 순으로 처벌됩니다.' })
      .setTimestamp();

    await ch.send({ embeds: [embed] });
    await interaction.reply({ content: `✅ <#${ch.id}>에 규칙 전송 완료!`, ephemeral: true });
    return;
  }

  // /슬로우모드
  if (commandName === '슬로우모드') {
    const 초 = interaction.options.getInteger('초');
    await interaction.channel.setRateLimitPerUser(초);
    await interaction.reply(초 === 0 ? '✅ 슬로우모드 해제!' : `✅ 슬로우모드 **${초}초** 설정!`);
    return;
  }

  // /닉네임
  if (commandName === '닉네임') {
    const target = interaction.options.getMember('유저');
    const nick = interaction.options.getString('닉네임') || null;
    await target.setNickname(nick);
    await interaction.reply(nick ? `✅ <@${target.id}> 닉네임 → **${nick}**` : `✅ <@${target.id}> 닉네임 초기화!`);
    return;
  }

  // /역할목록
  if (commandName === '역할목록') {
    const roles = guild.roles.cache
      .filter(r => r.id !== guild.roles.everyone.id)
      .sort((a, b) => b.position - a.position)
      .map(r => `<@&${r.id}>`)
      .join(' ');
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle(`🎭 ${guild.name} 역할 목록`)
      .setDescription(roles.length > 4096 ? roles.substring(0, 4093) + '...' : roles)
      .setFooter({ text: `총 ${guild.roles.cache.size - 1}개` })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /핑
  if (commandName === '핑') {
    const ping = client.ws.ping;
    const embed = new EmbedBuilder()
      .setColor(ping < 100 ? 0x2ecc71 : ping < 200 ? 0xf1c40f : 0xe74c3c)
      .setTitle('🏓 퐁!')
      .addFields(
        { name: '봇 핑', value: `${ping}ms`, inline: true },
        { name: '상태', value: ping < 100 ? '🟢 좋음' : ping < 200 ? '🟡 보통' : '🔴 나쁨', inline: true },
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // /역할생성
  if (commandName === '역할생성') {
    try {
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply('⏳ 역할 생성 시작...');

      await guild.roles.fetch();
      const existingNames = guild.roles.cache.map(r => r.name);
      console.log(`📋 기존 역할 수: ${existingNames.length}`);

      let created = 0, skipped = 0, failed = 0;
      for (const role of ROLE_LIST) {
        if (existingNames.includes(role.name)) {
          console.log(`⏭️ 스킵: ${role.name}`);
          skipped++;
          continue;
        }
        try {
          await guild.roles.create({
            name: role.name, color: role.color,
            hoist: role.hoist, permissions: role.perms,
            mentionable: true, reason: '역할생성 커맨드',
          });
          console.log(`✅ 생성: ${role.name}`);
          created++;
          if (created % 5 === 0) {
            await interaction.editReply(`⏳ 진행 중... 생성: **${created}개** | 스킵: **${skipped}개**`).catch(() => {});
          }
        } catch (e) {
          console.error(`❌ 실패: ${role.name} — ${e.message}`);
          failed++;
        }
        await new Promise(r => setTimeout(r, 800));
      }

      await interaction.editReply(`✅ 완료!
생성: **${created}개** | ⏭️ 스킵: **${skipped}개** | ❌ 실패: **${failed}개**`);
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71).setTitle('✅ 역할 전체 생성')
        .addFields({ name: '실행자', value: `<@${user.id}>`, inline: true },
                   { name: '생성', value: `${created}개`, inline: true },
                   { name: '스킵', value: `${skipped}개`, inline: true })
        .setTimestamp();
      await sendLog(guild, embed);
    } catch (e) {
      console.error('역할생성 전체 오류:', e);
      await interaction.editReply(`❌ 오류 발생: ${e.message}`).catch(() => {});
    }
    return;
  }

  // /역할삭제
  if (commandName === '역할삭제') {
    await interaction.deferReply({ ephemeral: true });
    const botRole = guild.members.me.roles.highest;

    // 최신 역할 목록 fetch
    await guild.roles.fetch();
    const toDelete = guild.roles.cache.filter(r =>
      r.id !== guild.roles.everyone.id &&
      r.id !== botRole.id &&
      !r.managed
    );

    let deleted = 0, failed = 0;
    for (const [, role] of toDelete) {
      try {
        await role.delete('역할삭제 커맨드');
        deleted++;
      } catch (e) {
        console.error(`역할 삭제 실패: ${role.name} — ${e.message}`);
        failed++;
      }
      await new Promise(r => setTimeout(r, 300));
    }

    await interaction.editReply(`✅ **${deleted}개** 삭제 완료! / ❌ ${failed}개 실패 (봇 역할보다 위에 있는 역할은 삭제 불가)`);
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c).setTitle('🗑️ 역할 전체 삭제')
      .addFields({ name: '실행자', value: `<@${user.id}>`, inline: true },
                 { name: '삭제', value: `${deleted}개`, inline: true })
      .setTimestamp();
    await sendLog(guild, embed);
    await dmOwner(`🗑️ 역할 전체 삭제\n실행자: ${user.tag}\n삭제된 역할: ${deleted}개`);
    return;
  }

  // /경고
  if (commandName === '경고') {
    const target = interaction.options.getUser('유저');
    const reason = interaction.options.getString('이유') || '이유 없음';
    const count  = (warnings.get(target.id) || 0) + 1;
    warnings.set(target.id, count);
    saveWarnings(warnings);
    await interaction.reply(`⚠️ <@${target.id}> 경고 **${count}/3** | 이유: ${reason}`);
    const embed = new EmbedBuilder()
      .setColor(0xff6b35).setTitle('⚠️ 수동 경고')
      .addFields({ name: '대상', value: `<@${target.id}>`, inline: true },
                 { name: '경고', value: `${count}/3`, inline: true },
                 { name: '이유', value: reason },
                 { name: '실행자', value: `<@${user.id}>` })
      .setTimestamp();
    await sendLog(guild, embed);
    await dmOwner(`⚠️ 경고 부여\n대상: ${target.tag}\n경고: ${count}/3\n이유: ${reason}\n실행자: ${user.tag}`);
    return;
  }

  // /경고확인
  if (commandName === '경고확인') {
    const target = interaction.options.getUser('유저');
    const count  = warnings.get(target.id) || 0;
    await interaction.reply({ content: `<@${target.id}> 현재 경고: **${count}/3**`, ephemeral: true });
    return;
  }

  // /경고초기화
  if (commandName === '경고초기화') {
    const target = interaction.options.getUser('유저');
    warnings.set(target.id, 0);
    saveWarnings(warnings);
    await interaction.reply(`✅ <@${target.id}> 경고 초기화 완료`);
    return;
  }

  // /타임아웃
  if (commandName === '타임아웃') {
    const target = interaction.options.getMember('유저');
    const mins   = interaction.options.getInteger('분');
    const reason = interaction.options.getString('이유') || '이유 없음';
    await target.timeout(mins * 60 * 1000, reason);
    await interaction.reply(`🔇 <@${target.id}> **${mins}분** 타임아웃 | 이유: ${reason}`);
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c).setTitle('🔇 타임아웃')
      .addFields({ name: '대상', value: `<@${target.id}>`, inline: true },
                 { name: '시간', value: `${mins}분`, inline: true },
                 { name: '이유', value: reason },
                 { name: '실행자', value: `<@${user.id}>` })
      .setTimestamp();
    await sendLog(guild, embed);
    await dmOwner(`🔇 타임아웃\n대상: ${target.user.tag}\n시간: ${mins}분\n이유: ${reason}`);
    return;
  }

  // /킥
  if (commandName === '킥') {
    const target = interaction.options.getMember('유저');
    const reason = interaction.options.getString('이유') || '이유 없음';
    await target.kick(reason);
    await interaction.reply(`👢 <@${target.id}> 킥 완료 | 이유: ${reason}`);
    const embed = new EmbedBuilder()
      .setColor(0xe67e22).setTitle('👢 킥')
      .addFields({ name: '대상', value: `${target.user.tag}`, inline: true },
                 { name: '이유', value: reason },
                 { name: '실행자', value: `<@${user.id}>` })
      .setTimestamp();
    await sendLog(guild, embed);
    await dmOwner(`👢 킥\n대상: ${target.user.tag}\n이유: ${reason}`);
    return;
  }

  // /밴
  if (commandName === '밴') {
    const target = interaction.options.getMember('유저');
    const reason = interaction.options.getString('이유') || '이유 없음';
    await target.ban({ reason });
    await interaction.reply(`🔨 <@${target.id}> 밴 완료 | 이유: ${reason}`);
    const embed = new EmbedBuilder()
      .setColor(0x922b21).setTitle('🔨 밴')
      .addFields({ name: '대상', value: `${target.user.tag}`, inline: true },
                 { name: '이유', value: reason },
                 { name: '실행자', value: `<@${user.id}>` })
      .setTimestamp();
    await sendLog(guild, embed);
    await dmOwner(`🔨 밴\n대상: ${target.user.tag}\n이유: ${reason}`);
    return;
  }

  // /역할부여
  if (commandName === '역할부여') {
    const target = interaction.options.getMember('유저');
    const roleName = interaction.options.getString('역할');
    const role = guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    if (!role) {
      await interaction.reply({ content: `❌ **${roleName}** 역할을 찾을 수 없습니다.`, ephemeral: true });
      return;
    }
    await target.roles.add(role);
    await interaction.reply(`✅ <@${target.id}> 에게 **${role.name}** 역할 부여 완료`);
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71).setTitle('✅ 역할 부여')
      .addFields({ name: '대상', value: `<@${target.id}>`, inline: true },
                 { name: '역할', value: role.name, inline: true },
                 { name: '실행자', value: `<@${user.id}>` })
      .setTimestamp();
    await sendLog(guild, embed);
    return;
  }

  // /역할제거
  if (commandName === '역할제거') {
    const target = interaction.options.getMember('유저');
    const roleName = interaction.options.getString('역할');
    const role = guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    if (!role) {
      await interaction.reply({ content: `❌ **${roleName}** 역할을 찾을 수 없습니다.`, ephemeral: true });
      return;
    }
    await target.roles.remove(role);
    await interaction.reply(`✅ <@${target.id}> 에게서 **${role.name}** 역할 제거 완료`);
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c).setTitle('❌ 역할 제거')
      .addFields({ name: '대상', value: `<@${target.id}>`, inline: true },
                 { name: '역할', value: role.name, inline: true },
                 { name: '실행자', value: `<@${user.id}>` })
      .setTimestamp();
    await sendLog(guild, embed);
    return;
  }
});

// ─── 역할 데이터 ────────────────────────────────────────────
const P2 = PermissionFlagsBits;
const ROLE_PERMS = {
  // 병: 기본 채팅 + 음성
  ENLISTED:
    P2.ViewChannel | P2.SendMessages | P2.ReadMessageHistory |
    P2.UseApplicationCommands | P2.Connect | P2.Speak |
    P2.AddReactions | P2.AttachFiles | P2.EmbedLinks | P2.UseExternalEmojis |
    P2.ChangeNickname | P2.UseExternalSounds | P2.SendMessagesInThreads |
    P2.CreatePublicThreads | P2.RequestToSpeak,

  // 부사관: 병 + 멤버 제어
  NCO:
    P2.ViewChannel | P2.SendMessages | P2.ReadMessageHistory |
    P2.UseApplicationCommands | P2.Connect | P2.Speak |
    P2.AddReactions | P2.AttachFiles | P2.EmbedLinks | P2.UseExternalEmojis |
    P2.ChangeNickname | P2.UseExternalSounds | P2.SendMessagesInThreads |
    P2.CreatePublicThreads | P2.RequestToSpeak |
    P2.MuteMembers | P2.DeafenMembers | P2.MoveMembers |
    P2.ManageMessages | P2.ManageNicknames | P2.ManageThreads |
    P2.PrioritySpeaker,

  // 위관급: 부사관 + 킥 + 채널 관리
  COMPANY_OFFICER:
    P2.ViewChannel | P2.SendMessages | P2.ReadMessageHistory |
    P2.UseApplicationCommands | P2.Connect | P2.Speak |
    P2.AddReactions | P2.AttachFiles | P2.EmbedLinks | P2.UseExternalEmojis |
    P2.ChangeNickname | P2.UseExternalSounds | P2.SendMessagesInThreads |
    P2.CreatePublicThreads | P2.RequestToSpeak |
    P2.MuteMembers | P2.DeafenMembers | P2.MoveMembers |
    P2.ManageMessages | P2.ManageNicknames | P2.ManageThreads |
    P2.PrioritySpeaker | P2.KickMembers | P2.ManageChannels |
    P2.CreateInstantInvite | P2.ManageEvents,

  // 영관급: 위관급 + 밴 + 역할 관리
  FIELD_OFFICER:
    P2.ViewChannel | P2.SendMessages | P2.ReadMessageHistory |
    P2.UseApplicationCommands | P2.Connect | P2.Speak |
    P2.AddReactions | P2.AttachFiles | P2.EmbedLinks | P2.UseExternalEmojis |
    P2.ChangeNickname | P2.UseExternalSounds | P2.SendMessagesInThreads |
    P2.CreatePublicThreads | P2.RequestToSpeak |
    P2.MuteMembers | P2.DeafenMembers | P2.MoveMembers |
    P2.ManageMessages | P2.ManageNicknames | P2.ManageThreads |
    P2.PrioritySpeaker | P2.KickMembers | P2.ManageChannels |
    P2.CreateInstantInvite | P2.ManageEvents |
    P2.BanMembers | P2.ManageRoles | P2.ViewAuditLog,

  // 장성급: 영관급 + 서버 관리
  GENERAL:
    P2.ViewChannel | P2.SendMessages | P2.ReadMessageHistory |
    P2.UseApplicationCommands | P2.Connect | P2.Speak |
    P2.AddReactions | P2.AttachFiles | P2.EmbedLinks | P2.UseExternalEmojis |
    P2.ChangeNickname | P2.UseExternalSounds | P2.SendMessagesInThreads |
    P2.CreatePublicThreads | P2.RequestToSpeak |
    P2.MuteMembers | P2.DeafenMembers | P2.MoveMembers |
    P2.ManageMessages | P2.ManageNicknames | P2.ManageThreads |
    P2.PrioritySpeaker | P2.KickMembers | P2.ManageChannels |
    P2.CreateInstantInvite | P2.ManageEvents |
    P2.BanMembers | P2.ManageRoles | P2.ViewAuditLog |
    P2.ManageGuild | P2.ManageWebhooks | P2.ManageEmojisAndStickers,

  // 지휘부: 관리자
  HIGH_COMMAND: P2.Administrator,

  // 병과: 기본 (식별용)
  UNIT:
    P2.ViewChannel | P2.SendMessages | P2.ReadMessageHistory |
    P2.UseApplicationCommands | P2.Connect | P2.Speak |
    P2.AddReactions | P2.AttachFiles | P2.EmbedLinks |
    P2.ChangeNickname | P2.UseExternalSounds,

  // 관리: 관리자
  ADMIN: P2.Administrator,
};

// 거꾸로 생성: 맨 위에 올 역할을 먼저 → 이등병이 마지막 (아래쪽)
const ROLE_LIST = [
  // ══ 관리 (먼저 생성 → 맨 위) ══
  { name: '그룹홀더 | GH',          color: 0xff5722, hoist: true,  perms: ROLE_PERMS.ADMIN },
  { name: '부그룹홀더 | VGH',       color: 0xff9800, hoist: true,  perms: ROLE_PERMS.ADMIN },
  { name: '개발자 | DEV',          color: 0x00bcd4, hoist: true,  perms: ROLE_PERMS.ADMIN },
  { name: '관리자 | ADMIN',        color: 0xf1c40f, hoist: true,  perms: ROLE_PERMS.ADMIN },

  // ══ 지휘부 ══
  { name: '국군통수권자 | CIC',    color: 0x641e16, hoist: true,  perms: ROLE_PERMS.HIGH_COMMAND },
  { name: '국무총리 | PM',        color: 0x922b21, hoist: true,  perms: ROLE_PERMS.HIGH_COMMAND },
  { name: '국방부 장관 | MoND',   color: 0xb03a2e, hoist: true,  perms: ROLE_PERMS.HIGH_COMMAND },
  { name: '국방부 차관 | VMND',   color: 0xcb4335, hoist: true,  perms: ROLE_PERMS.HIGH_COMMAND },
  { name: '참모총장 | CSA',       color: 0xe74c3c, hoist: true,  perms: ROLE_PERMS.HIGH_COMMAND },
  { name: '참모차장 | VCSA',      color: 0xf1948a, hoist: true,  perms: ROLE_PERMS.HIGH_COMMAND },

  // ══ 장성급 ══
  { name: '대장 | GEN',          color: 0xa04000, hoist: true,  perms: ROLE_PERMS.GENERAL },
  { name: '중장 | LTGEN',        color: 0xd35400, hoist: true,  perms: ROLE_PERMS.GENERAL },
  { name: '소장 | MGEN',         color: 0xe67e22, hoist: true,  perms: ROLE_PERMS.GENERAL },
  { name: '준장 | BGEN',         color: 0xf0b27a, hoist: true,  perms: ROLE_PERMS.GENERAL },

  // ══ 영관급 ══
  { name: '대령 | COL',          color: 0x6c3483, hoist: true,  perms: ROLE_PERMS.FIELD_OFFICER },
  { name: '중령 | LTC',          color: 0x8e44ad, hoist: true,  perms: ROLE_PERMS.FIELD_OFFICER },
  { name: '소령 | MAJ',          color: 0xaf7ac5, hoist: true,  perms: ROLE_PERMS.FIELD_OFFICER },

  // ══ 위관급 ══
  { name: '대위 | CPT',          color: 0x1a5276, hoist: true,  perms: ROLE_PERMS.COMPANY_OFFICER },
  { name: '중위 | 1LT',          color: 0x2e86c1, hoist: true,  perms: ROLE_PERMS.COMPANY_OFFICER },
  { name: '소위 | 2LT',          color: 0x3498db, hoist: true,  perms: ROLE_PERMS.COMPANY_OFFICER },
  { name: '준위 | MO',           color: 0x5dade2, hoist: true,  perms: ROLE_PERMS.COMPANY_OFFICER },

  // ══ 부사관 ══
  { name: '주임원사 | ASM',       color: 0x0e6655, hoist: true,  perms: ROLE_PERMS.NCO },
  { name: '원사 | SGTMAJ',       color: 0x148f77, hoist: true,  perms: ROLE_PERMS.NCO },
  { name: '상사 | MSGT',         color: 0x17a589, hoist: true,  perms: ROLE_PERMS.NCO },
  { name: '중사 | FSGT',         color: 0x1abc9c, hoist: true,  perms: ROLE_PERMS.NCO },
  { name: '하사 | SSGT',         color: 0x76d7c4, hoist: true,  perms: ROLE_PERMS.NCO },

  // ══ 병 (마지막 생성 → 맨 아래) ══
  { name: '병장 | SGT',          color: 0x28b463, hoist: true,  perms: ROLE_PERMS.ENLISTED },
  { name: '상등병 | CPL',        color: 0x52be80, hoist: true,  perms: ROLE_PERMS.ENLISTED },
  { name: '일등병 | PFC',        color: 0x7dcea0, hoist: true,  perms: ROLE_PERMS.ENLISTED },
  { name: '이등병 | Private',    color: 0xa9dfbf, hoist: true,  perms: ROLE_PERMS.ENLISTED },

  // ══ 병과 (식별용) ══
  { name: '국방부 | MND',          color: 0x26a69a, hoist: false, perms: ROLE_PERMS.UNIT },
  { name: '육군주임원사 | SMA',     color: 0x5c6bc0, hoist: false, perms: ROLE_PERMS.UNIT },
  { name: '본부 | HQ',             color: 0x78909c, hoist: false, perms: ROLE_PERMS.UNIT },
  { name: '통신병 | SIG',          color: 0xab47bc, hoist: false, perms: ROLE_PERMS.UNIT },
  { name: '포병 | ART',            color: 0xff7043, hoist: false, perms: ROLE_PERMS.UNIT },
  { name: '기갑부대 | ARM',        color: 0xa1887f, hoist: false, perms: ROLE_PERMS.UNIT },
  { name: '항공대 | ACC',          color: 0x42a5f5, hoist: false, perms: ROLE_PERMS.UNIT },
  { name: '의무병 | AMC',          color: 0xec407a, hoist: false, perms: ROLE_PERMS.UNIT },
  { name: '군사경찰 | MP',         color: 0xf39c12, hoist: false, perms: ROLE_PERMS.UNIT },
  { name: '특전사 | SWC',         color: 0x1abc9c, hoist: false, perms: ROLE_PERMS.UNIT },
];

client.login(TOKEN);
