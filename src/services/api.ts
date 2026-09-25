import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import type {
  ApiResponse,
  AuthResponse,
  UserProfile,
  Quiniela,
  QuinielaDetail,
  QuinielaMember,
  CreateQuinielaRequest,
  JoinQuinielaRequest,
  RegisterRequest,
  LoginRequest,
  League,
  Match,
  WeekSummary,
  SeasonSummary,
  EspnHealthStatus,
  SyncResult,
  PickItem,
  QuinielaPicksData,
  SubmitPickRequest,
  LockAndAutofillResult,
  QuinielaStandingsData,
  WeeklyAward,
  ScoreWeekResult,
  WhatsAppReport,
  PushSubscriptionRequest,
  UnsubscribePushRequest,
  VapidPublicKeyResponse,
  MigrationPreviewData,
  MigrationResultData,
  ClaimInfo,
  ClaimAccountRequest,
  MigratedMemberClaimLink,
  UnclaimedMemberItem,
  UnclaimedQuinielaMembersData,
  WeeklyBulletinData,
} from '../types';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth?.token || localStorage.getItem('picksports_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Quinielas', 'QuinielaDetail', 'Auth', 'Seasons', 'Weeks', 'Matches', 'EspnHealth', 'Leagues', 'Picks', 'Standings', 'Awards', 'Bulletin'],
  endpoints: (builder) => ({
    // ─── Leagues ─────────────────────────────────────────────────────────────
    getLeagues: builder.query<ApiResponse<League[]>, void>({
      query: () => '/leagues',
      providesTags: ['Leagues'],
    }),

    // ─── Auth ────────────────────────────────────────────────────────────────
    login: builder.mutation<ApiResponse<AuthResponse>, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),

    register: builder.mutation<ApiResponse<AuthResponse>, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Auth'],
    }),

    getMe: builder.query<ApiResponse<UserProfile>, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),

    getClaimInfo: builder.query<ApiResponse<ClaimInfo>, string>({
      query: (token) => `/auth/claim-info?token=${encodeURIComponent(token)}`,
    }),

    claimAccount: builder.mutation<ApiResponse<AuthResponse>, ClaimAccountRequest>({
      query: (body) => ({
        url: '/auth/claim',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'Quinielas', 'QuinielaDetail', 'Standings'],
    }),

    getUnclaimedMembers: builder.query<ApiResponse<UnclaimedQuinielaMembersData>, number | void>({
      query: (quinielaId) =>
        quinielaId ? `/auth/unclaimed-members?quinielaId=${quinielaId}` : '/auth/unclaimed-members',
      providesTags: ['QuinielaDetail', 'Auth'],
    }),

    linkCurrentUser: builder.mutation<ApiResponse<AuthResponse>, { token: string }>({
      query: (body) => ({
        url: '/auth/link-current-user',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth', 'Quinielas', 'QuinielaDetail', 'Standings'],
    }),

    uploadAvatar: builder.mutation<ApiResponse<UserProfile>, FormData>({
      query: (formData) => ({
        url: '/auth/avatar',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Auth', 'QuinielaDetail', 'Standings', 'Awards', 'Picks'],
    }),

    removeAvatar: builder.mutation<ApiResponse<UserProfile>, void>({
      query: () => ({
        url: '/auth/avatar',
        method: 'DELETE',
      }),
      invalidatesTags: ['Auth', 'QuinielaDetail', 'Standings', 'Awards', 'Picks'],
    }),

    // ─── Quinielas ───────────────────────────────────────────────────────────
    getQuinielas: builder.query<ApiResponse<Quiniela[]>, void>({
      query: () => '/quinielas',
      providesTags: ['Quinielas'],
    }),

    getQuinielaById: builder.query<ApiResponse<QuinielaDetail>, number>({
      query: (id) => `/quinielas/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'QuinielaDetail', id }],
    }),

    getClaimLinks: builder.query<ApiResponse<MigratedMemberClaimLink[]>, number>({
      query: (id) => `/quinielas/${id}/claim-links`,
      providesTags: (_result, _error, id) => [{ type: 'QuinielaDetail', id }],
    }),

    createQuiniela: builder.mutation<ApiResponse<Quiniela>, CreateQuinielaRequest>({
      query: (body) => ({
        url: '/quinielas',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Quinielas'],
    }),

    joinQuiniela: builder.mutation<ApiResponse<QuinielaMember>, JoinQuinielaRequest>({
      query: (body) => ({
        url: '/quinielas/join',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Quinielas'],
    }),

    updateMemberPayment: builder.mutation<
      ApiResponse<QuinielaMember>,
      { quinielaId: number; memberId: number; paidFee: boolean }
    >({
      query: ({ quinielaId, memberId, paidFee }) => ({
        url: `/quinielas/${quinielaId}/members/${memberId}/payment`,
        method: 'PATCH',
        body: { paidFee },
      }),
      invalidatesTags: (_result, _error, { quinielaId }) => [
        { type: 'QuinielaDetail', id: quinielaId },
      ],
    }),

    // ─── Seasons ─────────────────────────────────────────────────────────────
    getSeasons: builder.query<ApiResponse<SeasonSummary[]>, number | void>({
      query: (leagueId) => (leagueId ? `/seasons?leagueId=${leagueId}` : '/seasons'),
      providesTags: ['Seasons'],
    }),

    getWeeksBySeason: builder.query<ApiResponse<WeekSummary[]>, number>({
      query: (seasonId) => `/seasons/${seasonId}/weeks`,
      providesTags: (_result, _error, seasonId) => [{ type: 'Weeks', id: seasonId }],
    }),

    syncFullSeason: builder.mutation<ApiResponse<SyncResult>, number>({
      query: (seasonId) => ({
        url: `/seasons/${seasonId}/sync-full`,
        method: 'POST',
      }),
      invalidatesTags: ['Seasons', 'Weeks', 'Matches'],
    }),

    ensureApertura: builder.mutation<ApiResponse<SeasonSummary>, void>({
      query: () => ({
        url: '/seasons/ensure-apertura',
        method: 'POST',
      }),
      invalidatesTags: ['Seasons'],
    }),

    // ─── Weeks / Matches ─────────────────────────────────────────────────────
    getMatchesByWeek: builder.query<ApiResponse<Match[]>, number>({
      query: (weekId) => `/weeks/${weekId}/matches`,
      providesTags: (_result, _error, weekId) => [{ type: 'Matches', id: weekId }],
    }),

    syncWeekFromEspn: builder.mutation<ApiResponse<SyncResult>, number>({
      query: (weekId) => ({
        url: `/weeks/${weekId}/sync-espn`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, weekId) => [{ type: 'Matches', id: weekId }],
    }),

    importManualJson: builder.mutation<ApiResponse<SyncResult>, { weekId: number; rawJson: string }>({
      query: ({ weekId, rawJson }) => ({
        url: `/weeks/${weekId}/import-manual-json`,
        method: 'POST',
        body: { rawJson },
      }),
      invalidatesTags: (_result, _error, { weekId }) => [{ type: 'Matches', id: weekId }],
    }),

    // ─── Admin ───────────────────────────────────────────────────────────────
    getEspnHealth: builder.query<ApiResponse<EspnHealthStatus>, void>({
      query: () => '/admin/espn-health',
      providesTags: ['EspnHealth'],
    }),

    // ─── Picks ───────────────────────────────────────────────────────────────
    getPicks: builder.query<ApiResponse<QuinielaPicksData>, { quinielaId: number; weekId: number }>({
      query: ({ quinielaId, weekId }) => `/quinielas/${quinielaId}/picks?weekId=${weekId}`,
      providesTags: (_result, _error, { quinielaId, weekId }) => [
        { type: 'Picks', id: `${quinielaId}-${weekId}` },
      ],
    }),

    submitPick: builder.mutation<
      ApiResponse<PickItem>,
      { quinielaId: number; matchId: number; pickAbbr: string; weekId: number }
    >({
      query: ({ quinielaId, matchId, pickAbbr }) => ({
        url: `/quinielas/${quinielaId}/picks`,
        method: 'POST',
        body: { matchId, pickAbbr },
      }),
      async onQueryStarted({ quinielaId, matchId, pickAbbr, weekId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getPicks', { quinielaId, weekId }, (draft) => {
            if (draft?.data?.picks) {
              const existingIndex = draft.data.picks.findIndex(
                (p) => p.matchId === matchId && p.memberId === draft.data.currentUserMemberId
              );
              if (existingIndex >= 0) {
                draft.data.picks[existingIndex].pickAbbr = pickAbbr;
                draft.data.picks[existingIndex].isAutoFilled = false;
              } else {
                draft.data.picks.push({
                  id: 0,
                  quinielaId,
                  memberId: draft.data.currentUserMemberId,
                  matchId,
                  pickAbbr,
                  isAutoFilled: false,
                  isUpsetHit: false,
                  isHumillacion: false,
                  isSomnifero: false,
                  isEmpateFallido: false,
                  created: new Date().toISOString(),
                });
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_result, _error, { quinielaId, weekId }) => [
        { type: 'Picks', id: `${quinielaId}-${weekId}` },
      ],
    }),

    lockAndAutofill: builder.mutation<
      ApiResponse<LockAndAutofillResult>,
      { quinielaId: number; weekId: number }
    >({
      query: ({ quinielaId, weekId }) => ({
        url: `/quinielas/${quinielaId}/weeks/${weekId}/lock-and-autofill`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { quinielaId, weekId }) => [
        { type: 'Picks', id: `${quinielaId}-${weekId}` },
        { type: 'Weeks', id: quinielaId },
      ],
    }),

    // ─── Standings & Scoring ──────────────────────────────────────────────────
    getStandings: builder.query<
      ApiResponse<QuinielaStandingsData>,
      { quinielaId: number; weekId: number }
    >({
      query: ({ quinielaId, weekId }) => `/quinielas/${quinielaId}/standings?weekId=${weekId}`,
      providesTags: (_result, _error, { quinielaId, weekId }) => [
        { type: 'Standings', id: `${quinielaId}-${weekId}` },
      ],
    }),

    scoreWeek: builder.mutation<
      ApiResponse<ScoreWeekResult>,
      { quinielaId: number; weekId: number }
    >({
      query: ({ quinielaId, weekId }) => ({
        url: `/quinielas/${quinielaId}/weeks/${weekId}/score`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { quinielaId, weekId }) => [
        { type: 'Standings', id: `${quinielaId}-${weekId}` },
        { type: 'Awards', id: quinielaId },
        { type: 'Picks', id: `${quinielaId}-${weekId}` },
        { type: 'Weeks', id: quinielaId },
        { type: 'QuinielaDetail', id: quinielaId },
      ],
    }),

    getAwards: builder.query<
      ApiResponse<WeeklyAward[]>,
      { quinielaId: number; weekId?: number }
    >({
      query: ({ quinielaId, weekId }) =>
        weekId ? `/quinielas/${quinielaId}/awards?weekId=${weekId}` : `/quinielas/${quinielaId}/awards`,
      providesTags: (_result, _error, { quinielaId }) => [{ type: 'Awards', id: quinielaId }],
    }),

    // ─── SPEC-012 Boletín Semanal (El Periódico) ─────────────────────────────
    getBulletin: builder.query<
      ApiResponse<WeeklyBulletinData>,
      { quinielaId: number; weekId?: number }
    >({
      query: ({ quinielaId, weekId }) =>
        weekId
          ? `/quinielas/${quinielaId}/bulletin?weekId=${weekId}`
          : `/quinielas/${quinielaId}/bulletin`,
      providesTags: (_result, _error, { quinielaId, weekId }) => [
        { type: 'Bulletin', id: `${quinielaId}-${weekId ?? 'latest'}` },
        { type: 'Bulletin', id: quinielaId },
      ],
    }),

    updateBulletinAnnouncement: builder.mutation<
      ApiResponse<WeeklyBulletinData>,
      { quinielaId: number; weekId: number; announcement: string | null }
    >({
      query: ({ quinielaId, weekId, announcement }) => ({
        url: `/quinielas/${quinielaId}/bulletin/${weekId}/announcement`,
        method: 'PUT',
        body: { announcement },
      }),
      invalidatesTags: (_result, _error, { quinielaId }) => [
        { type: 'Bulletin', id: quinielaId },
      ],
    }),

    // ─── WhatsApp Reports ─────────────────────────────────────────────────────
    getWhatsAppReminder: builder.query<
      ApiResponse<WhatsAppReport>,
      { quinielaId: number; weekId: number }
    >({
      query: ({ quinielaId, weekId }) =>
        `/quinielas/${quinielaId}/reports/whatsapp/reminder?weekId=${weekId}`,
    }),

    getWhatsAppSummary: builder.query<
      ApiResponse<WhatsAppReport>,
      { quinielaId: number; weekId: number }
    >({
      query: ({ quinielaId, weekId }) =>
        `/quinielas/${quinielaId}/reports/whatsapp/summary?weekId=${weekId}`,
    }),

    getWhatsAppPrizePool: builder.query<ApiResponse<WhatsAppReport>, number>({
      query: (quinielaId) => `/quinielas/${quinielaId}/reports/whatsapp/prizepool`,
    }),

    getWhatsAppPlayerReport: builder.query<
      ApiResponse<WhatsAppReport>,
      { quinielaId: number; weekId: number; memberId: number }
    >({
      query: ({ quinielaId, weekId, memberId }) =>
        `/quinielas/${quinielaId}/reports/whatsapp/player?weekId=${weekId}&memberId=${memberId}`,
    }),

    // ─── Web Push Notifications ──────────────────────────────────────────────
    getVapidPublicKey: builder.query<ApiResponse<VapidPublicKeyResponse>, void>({
      query: () => '/notifications/public-key',
    }),

    subscribePush: builder.mutation<ApiResponse<boolean>, PushSubscriptionRequest>({
      query: (body) => ({
        url: '/notifications/subscribe',
        method: 'POST',
        body,
      }),
    }),

    unsubscribePush: builder.mutation<ApiResponse<boolean>, UnsubscribePushRequest>({
      query: (body) => ({
        url: '/notifications/unsubscribe',
        method: 'POST',
        body,
      }),
    }),

    sendTestNotification: builder.mutation<ApiResponse<boolean>, { quinielaId?: number } | void>({
      query: (arg) => ({
        url: arg && arg.quinielaId ? `/notifications/test?quinielaId=${arg.quinielaId}` : '/notifications/test',
        method: 'POST',
      }),
    }),

    triggerReminders: builder.mutation<{ isSuccess: boolean; message: string; sentCount: number }, void>({
      query: () => ({
        url: '/notifications/trigger-reminders',
        method: 'POST',
      }),
    }),

    // ─── SPEC-007 Admin Migration ───────────────────────────────────────────
    previewMigration: builder.mutation<ApiResponse<MigrationPreviewData>, FormData>({
      query: (formData) => ({
        url: '/admin/migration/preview',
        method: 'POST',
        body: formData,
      }),
    }),

    executeMigration: builder.mutation<ApiResponse<MigrationResultData>, FormData>({
      query: (formData) => ({
        url: '/admin/migration/execute',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Quinielas', 'QuinielaDetail', 'Seasons', 'Weeks', 'Matches', 'Picks', 'Standings', 'Awards'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useGetClaimInfoQuery,
  useClaimAccountMutation,
  useGetUnclaimedMembersQuery,
  useLazyGetUnclaimedMembersQuery,
  useLinkCurrentUserMutation,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
  useGetLeaguesQuery,
  useGetQuinielasQuery,
  useGetQuinielaByIdQuery,
  useGetClaimLinksQuery,
  useLazyGetClaimLinksQuery,
  useCreateQuinielaMutation,
  useJoinQuinielaMutation,
  useUpdateMemberPaymentMutation,
  // ESPN
  useGetSeasonsQuery,
  useGetWeeksBySeasonQuery,
  useSyncFullSeasonMutation,
  useEnsureAperturaMutation,
  useGetMatchesByWeekQuery,
  useSyncWeekFromEspnMutation,
  useImportManualJsonMutation,
  useGetEspnHealthQuery,
  // Picks
  useGetPicksQuery,
  useSubmitPickMutation,
  useLockAndAutofillMutation,
  // Standings & Scoring
  useGetStandingsQuery,
  useScoreWeekMutation,
  useGetAwardsQuery,
  // SPEC-012 Boletín Semanal
  useGetBulletinQuery,
  useUpdateBulletinAnnouncementMutation,
  // WhatsApp
  useGetWhatsAppReminderQuery,
  useGetWhatsAppSummaryQuery,
  useGetWhatsAppPrizePoolQuery,
  useGetWhatsAppPlayerReportQuery,
  useLazyGetWhatsAppReminderQuery,
  useLazyGetWhatsAppSummaryQuery,
  useLazyGetWhatsAppPrizePoolQuery,
  useLazyGetWhatsAppPlayerReportQuery,
  // Web Push Notifications
  useGetVapidPublicKeyQuery,
  useLazyGetVapidPublicKeyQuery,
  useSubscribePushMutation,
  useUnsubscribePushMutation,
  useSendTestNotificationMutation,
  useTriggerRemindersMutation,
  // SPEC-007 Migration
  usePreviewMigrationMutation,
  useExecuteMigrationMutation,
} = api;


