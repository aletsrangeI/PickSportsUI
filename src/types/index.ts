export interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  message: string;
  errors?: any;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface Quiniela {
  id: number;
  name: string;
  description?: string;
  leagueId: number;
  leagueCode: string;
  leagueName: string;
  sportName: string;
  inviteCode: string;
  entryFee: number;
  firstPlacePct: number;
  secondPlacePct: number;
  thirdPlacePct: number;
  isActive: boolean;
  ownerId: number;
  ownerName: string;
  userRole?: 'OWNER' | 'ADMIN' | 'MEMBER';
  membersCount: number;
  created: string;
}

export interface QuinielaMember {
  id: number;
  quinielaId: number;
  userId: number;
  alias: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  paidFee: boolean;
  totalHits: number;
  totalUpsets: number;
  totalHumillaciones: number;
  currentStreak: number;
  bestStreak: number;
  joinedAt: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface QuinielaDetail extends Quiniela {
  members: QuinielaMember[];
}

export interface CreateQuinielaRequest {
  name: string;
  description?: string;
  leagueId: number;
  entryFee: number;
  firstPlacePct: number;
  secondPlacePct: number;
  thirdPlacePct: number;
}

export interface JoinQuinielaRequest {
  inviteCode: string;
  alias: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface League {
  id: number;
  sportId?: number;
  sportName: string;
  code: string;
  name: string;
  country?: string;
  logoUrl?: string;
  active?: boolean;
}

export interface Team {
  id: number;
  espnTeamId: string;
  name: string;
  abbreviation: string;
  displayName: string;
  logoUrl?: string;
  primaryColor?: string;
}

export interface Match {
  id: number;
  weekId: number;
  espnGameId: string;
  dateUtc: string;
  homeTeam: Team;
  awayTeam: Team;
  /** 'pre' | 'in' | 'post' | 'postponed' */
  statusState: 'pre' | 'in' | 'post' | 'postponed';
  statusDesc?: string;
  homeScore: number;
  awayScore: number;
  winnerAbbr?: string;
  /** Nueva fecha tentativa cuando el partido fue pospuesto */
  postponedToDate?: string;
  venue?: string;
  city?: string;
  lastSyncUtc: string;
}

export interface WeekSummary {
  id: number;
  weekNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  matchesCount: number;
  postponedCount: number;
}

export interface SeasonSummary {
  id: number;
  leagueId: number;
  name: string;
  year: number;
  isCurrent: boolean;
  isFinished?: boolean;
  status?: 'ACTIVE' | 'UPCOMING' | 'FINISHED';
  startDate?: string;
  endDate?: string;
  weeksCount: number;
}

export interface EspnHealthStatus {
  status: 'GREEN' | 'YELLOW' | 'RED';
  isSuccess: boolean;
  latencyMs: number;
  endpointTested: string;
  checkedAt: string;
  errorMessage?: string;
}

export interface SyncResult {
  isSuccess: boolean;
  weeksSynced: number;
  matchesUpserted: number;
  teamsUpserted: number;
  /** 'L1_CALENDAR' | 'L2_SCOREBOARD' | 'L3_CONFIG' | 'MANUAL' | 'ERROR' */
  fallbackLevel: string;
  errorMessage?: string;
}

export interface PickItem {
  id: number;
  quinielaId: number;
  memberId: number;
  memberAlias?: string;
  matchId: number;
  pickAbbr: string;
  isAutoFilled: boolean;
  isHit?: boolean | null;
  isUpsetHit: boolean;
  isHumillacion: boolean;
  isSomnifero: boolean;
  isEmpateFallido: boolean;
  created: string;
  lastModified?: string | null;
}

export interface QuinielaMemberPickInfo {
  memberId: number;
  alias: string;
  displayName?: string;
  role: string;
  totalHits: number;
  currentStreak: number;
}

export interface QuinielaPicksData {
  quinielaId: number;
  weekId: number;
  weekNumber: number;
  weekName: string;
  status: 'DRAFT' | 'PUBLISHED' | 'LOCKED' | 'SCORED';
  firstGameUtc?: string | null;
  lockedAt?: string | null;
  isLocked: boolean;
  isRevealed: boolean;
  allowsDraw: boolean;
  currentUserMemberId: number;
  matches: Match[];
  members: QuinielaMemberPickInfo[];
  picks: PickItem[];
}

export interface SubmitPickRequest {
  matchId: number;
  pickAbbr: string;
}

export interface LockAndAutofillResult {
  quinielaId: number;
  weekId: number;
  weekStatus: string;
  autofilledPicksCount: number;
  membersAffectedCount: number;
  message: string;
}

export interface MemberStanding {
  rank: number;
  memberId: number;
  userId: number;
  alias: string;
  displayName?: string;
  avatarUrl?: string;
  hits: number;
  totalPicks: number;
  accuracyPct: number;
  upsetHits: number;
  humillaciones: number;
  somniferos: number;
  empatesFallidos: number;
  currentStreak: number;
  bestStreak: number;
}

export interface QuinielaStandingsData {
  quinielaId: number;
  weekId: number;
  weekNumber: number;
  weekName: string;
  weekStatus: string;
  finishedMatchesCount: number;
  totalMatchesCount: number;
  weeklyStandings: MemberStanding[];
  generalStandings: MemberStanding[];
}

export interface WeeklyAward {
  id: number;
  quinielaId: number;
  weekId: number;
  memberId: number;
  memberAlias: string;
  displayName?: string;
  avatarUrl?: string;
  awardType: 'MVP' | 'REY_SORPRESAS' | 'HUMILLADO' | 'SOMNIFERO' | 'EMPATE_FALLIDO' | 'PARTIDO_DIFICIL';
  awardValue1: string;
  awardValue2?: string;
  notes?: string;
}

export interface ScoreWeekResult {
  quinielaId: number;
  weekId: number;
  scoredMatchesCount: number;
  picksEvaluatedCount: number;
  awardsGeneratedCount: number;
  message: string;
}

export interface WhatsAppReport {
  reportType: 'REMINDER' | 'SUMMARY' | 'PRIZE_POOL' | 'PLAYER';
  title: string;
  content: string;
}

export interface PushSubscriptionRequest {
  endpoint: string;
  p256dhKey?: string;
  authKey?: string;
  deviceDescription?: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
}

export interface UnsubscribePushRequest {
  endpoint: string;
}

export interface VapidPublicKeyResponse {
  publicKey: string;
}

export interface MigrationPlayerPreview {
  alias: string;
  expectedHits: number;
  totalPicks: number;
  percentage: number;
  isExistingUser: boolean;
  existingUserId?: number;
  existingDisplayName?: string;
}

export interface MigrationWeekSummary {
  weekNumber: number;
  status: string;
  matchesCount: number;
  picksCount: number;
}

export interface MigrationMatchSample {
  gameId: string;
  weekNumber: number;
  homeTeam: string;
  awayTeam: string;
  statusState: string;
  homeScore?: number;
  awayScore?: number;
  winnerAbbr?: string;
}

export interface MigrationPreviewData {
  seasonYear: number;
  seasonType: number;
  leagueCode: string;
  suggestedQuinielaName: string;
  totalParticipants: number;
  totalMatches: number;
  totalWeeks: number;
  totalPicks: number;
  currentWeekNumber: number;
  participants: MigrationPlayerPreview[];
  weeksSummary: MigrationWeekSummary[];
  sampleMatches: MigrationMatchSample[];
}

export interface MigrationPlayerVerification {
  alias: string;
  expectedHits: number;
  calculatedHits: number;
  isMatch: boolean;
}

export interface MigrationResultData {
  quinielaId: number;
  quinielaName: string;
  inviteCode: string;
  totalMembersMigrated: number;
  totalMatchesMigrated: number;
  totalPicksMigrated: number;
  currentWeekNumber: number;
  validationPassed: boolean;
  message: string;
  playerVerification: MigrationPlayerVerification[];
  createdUsernames: string[];
}


