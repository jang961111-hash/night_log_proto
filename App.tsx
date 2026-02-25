import { StatusBar } from "expo-status-bar";
import {
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_700Bold,
  useFonts,
} from "@expo-google-fonts/noto-sans-kr";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { createPasswordRecord, verifyPassword } from "./src/lib/auth";
import { buildWeeklyReport, computeStreak, pickNextScheduleItem } from "./src/lib/insights";
import {
  loadAccounts,
  loadCurrentUser,
  loadDiaryHistory,
  loadScheduleDraft,
  saveAccounts,
  saveCurrentUser,
  saveDiaryHistory,
  saveScheduleDraft,
  upsertHistoryItem,
} from "./src/lib/storage";
import { CalendarInsightsScreen } from "./src/screens/CalendarInsightsScreen";
import { BottomTabBar } from "./src/components/BottomTabBar";
import { HomeScreen } from "./src/screens/HomeScreen";
import { InterestScreen } from "./src/screens/InterestScreen";
import { IntroSplashScreen } from "./src/screens/IntroSplashScreen";
import { JournalScreen } from "./src/screens/JournalScreen";
import { LandingScreen } from "./src/screens/LandingScreen";
import { LegalScreen } from "./src/screens/LegalScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { ResultScreen } from "./src/screens/ResultScreen";
import { ScheduleScreen } from "./src/screens/ScheduleScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { SignupScreen } from "./src/screens/SignupScreen";
import { colors, typography } from "./src/theme/tokens";
import type {
  AppRoute,
  DiaryHistoryRecord,
  HomeCalendarPreview,
  LegalDocType,
  ResultBundle,
  ScheduleDraftItem,
  SignupForm,
  UserAccount,
} from "./src/types/app";

type MainTabRoute = "home" | "journal" | "calendar" | "settings";

const emptyHomePreview: HomeCalendarPreview = {
  weekEntryCount: 0,
  consistencyScore: 0,
  dominantEmotion: null,
  nextScheduleTitle: null,
  nextScheduleTime: null,
};

function latestResultFromHistory(
  history: DiaryHistoryRecord[],
  userId: string,
): ResultBundle | null {
  const latest = history
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return latest?.resultSnapshot ?? null;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
  });

  const [booting, setBooting] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [postIntroRoute, setPostIntroRoute] = useState<AppRoute>("landing");
  const [busy, setBusy] = useState(false);
  const [route, setRoute] = useState<AppRoute>("landing");
  const [calendarBackRoute, setCalendarBackRoute] = useState<AppRoute>("home");
  const [interestReturnRoute, setInterestReturnRoute] = useState<AppRoute>("home");
  const [legalDoc, setLegalDoc] = useState<LegalDocType>("terms");
  const [legalBackRoute, setLegalBackRoute] = useState<AppRoute>("signup");
  const [journalAutoStartToken, setJournalAutoStartToken] = useState(0);

  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [history, setHistory] = useState<DiaryHistoryRecord[]>([]);
  const [latestResult, setLatestResult] = useState<ResultBundle | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraftItem[]>([]);
  const scheduleSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const [savedAccounts, savedHistory, currentUserId] = await Promise.all([
        loadAccounts(),
        loadDiaryHistory(),
        loadCurrentUser(),
      ]);

      if (!mounted) {
        return;
      }

      setAccounts(savedAccounts);
      setHistory(savedHistory);

      if (currentUserId) {
        const account = savedAccounts.find((item) => item.userId === currentUserId) ?? null;
        if (account) {
          setCurrentUser(account);
          const draft = await loadScheduleDraft(account.userId);
          if (mounted) {
            setScheduleDraft(draft);
            setLatestResult(latestResultFromHistory(savedHistory, account.userId));
            setPostIntroRoute(account.interests.length > 0 ? "home" : "interests");
            setInterestReturnRoute("home");
          }
        } else {
          setPostIntroRoute("landing");
        }
      } else {
        setPostIntroRoute("landing");
      }

      if (mounted) {
        setBooting(false);
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (scheduleSaveTimerRef.current) {
        clearTimeout(scheduleSaveTimerRef.current);
      }
    };
  }, []);

  const login = async (userId: string, password: string): Promise<string | null> => {
    if (!userId || !password) {
      return "ID와 비밀번호를 입력해주세요.";
    }

    setBusy(true);
    try {
      const account = accounts.find((item) => item.userId === userId);
      if (!account || !(await verifyPassword(account, password))) {
        return "ID 또는 비밀번호가 올바르지 않습니다.";
      }

      setCurrentUser(account);
      await saveCurrentUser(account.userId);

      const draft = await loadScheduleDraft(account.userId);
      setScheduleDraft(draft);
      setLatestResult(latestResultFromHistory(history, account.userId));
      setInterestReturnRoute("home");
      setRoute(account.interests.length > 0 ? "home" : "interests");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const signup = async (form: SignupForm): Promise<string | null> => {
    if (accounts.some((item) => item.userId === form.userId)) {
      return "이미 사용 중인 ID입니다.";
    }

    setBusy(true);
    try {
      const now = new Date().toISOString();
      const passwordRecord = await createPasswordRecord(form.password);
      const newAccount: UserAccount = {
        userId: form.userId,
        ...passwordRecord,
        name: form.name,
        birthDate: form.birthDate,
        gender: form.gender,
        job: form.job,
        interests: [],
        createdAt: now,
        updatedAt: now,
      };

      const nextAccounts = [newAccount, ...accounts];
      setAccounts(nextAccounts);
      setCurrentUser(newAccount);
      setScheduleDraft([]);

      await Promise.all([saveAccounts(nextAccounts), saveCurrentUser(newAccount.userId)]);

      setInterestReturnRoute("home");
      setRoute("interests");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const saveInterests = async (interests: string[]) => {
    if (!currentUser) {
      return;
    }

    setBusy(true);
    try {
      const nextUser: UserAccount = {
        ...currentUser,
        interests,
        updatedAt: new Date().toISOString(),
      };
      const nextAccounts = accounts.map((item) =>
        item.userId === nextUser.userId ? nextUser : item,
      );

      setCurrentUser(nextUser);
      setAccounts(nextAccounts);
      await saveAccounts(nextAccounts);
      setRoute(interestReturnRoute === "settings" ? "settings" : "home");
    } finally {
      setBusy(false);
    }
  };

  const saveResultBundle = async (bundle: ResultBundle, userIdArg?: string) => {
    const userId = userIdArg ?? currentUser?.userId;
    if (!userId) {
      return;
    }

    const item: DiaryHistoryRecord = {
      id: bundle.result.sessionId,
      userId,
      createdAt: bundle.endedAt,
      mode: bundle.result.mode,
      preview: bundle.result.finalDiary3Lines[0],
      emotionTags: bundle.emotionTags,
      firstAction: bundle.result.recommendations.firstAction,
      resultSnapshot: bundle,
    };

    const nextHistory = await upsertHistoryItem(item);
    setHistory(nextHistory);
  };

  const handleComplete = async (bundle: ResultBundle) => {
    setLatestResult(bundle);
    setScheduleDraft(bundle.scheduleItems);

    if (currentUser) {
      await Promise.all([
        saveScheduleDraft(currentUser.userId, bundle.scheduleItems),
        saveResultBundle(bundle, currentUser.userId),
      ]);
    }

    setRoute("result");
  };

  const onChangeScheduleItems = async (items: ScheduleDraftItem[]) => {
    setScheduleDraft(items);

    let nextBundle: ResultBundle | null = null;
    if (latestResult) {
      nextBundle = {
        ...latestResult,
        scheduleItems: items,
      };
      setLatestResult(nextBundle);
    }

    if (scheduleSaveTimerRef.current) {
      clearTimeout(scheduleSaveTimerRef.current);
    }

    const userId = currentUser?.userId;
    scheduleSaveTimerRef.current = setTimeout(() => {
      void (async () => {
        if (!userId) {
          return;
        }

        await saveScheduleDraft(userId, items);

        if (nextBundle) {
          await saveResultBundle(nextBundle, userId);
        }
      })();
    }, 350);
  };

  const openCalendar = (from: AppRoute) => {
    setCalendarBackRoute(from);
    setRoute("calendar");
  };

  const showBottomTabs =
    Boolean(currentUser) &&
    (route === "home" ||
      route === "journal" ||
      route === "result" ||
      route === "calendar" ||
      route === "settings");

  const activeTab: MainTabRoute =
    route === "calendar"
      ? "calendar"
      : route === "settings"
        ? "settings"
        : route === "journal"
          ? "journal"
          : "home";

  const onTabPress = (tab: MainTabRoute) => {
    if (tab === "home") {
      setRoute("home");
      return;
    }

    if (tab === "journal") {
      setRoute("journal");
      return;
    }

    if (tab === "calendar") {
      if (route === "calendar") {
        return;
      }
      openCalendar(route);
      return;
    }

    setRoute("settings");
  };

  const tabBadges = useMemo(
    () => ({
      home: latestResult ? 1 : 0,
    }),
    [latestResult],
  );

  const openLegal = (doc: LegalDocType, backRoute: AppRoute) => {
    setLegalDoc(doc);
    setLegalBackRoute(backRoute);
    setRoute("legal");
  };

  const saveProfile = async (patch: { name: string; job: string }): Promise<string | null> => {
    if (!currentUser) {
      return "로그인이 필요합니다.";
    }

    const nextName = patch.name.trim();
    const nextJob = patch.job.trim();
    if (!nextName || !nextJob) {
      return "이름과 직업을 입력해주세요.";
    }

    setBusy(true);
    try {
      const nextUser: UserAccount = {
        ...currentUser,
        name: nextName,
        job: nextJob,
        updatedAt: new Date().toISOString(),
      };

      const nextAccounts = accounts.map((item) =>
        item.userId === nextUser.userId ? nextUser : item,
      );

      setCurrentUser(nextUser);
      setAccounts(nextAccounts);
      await saveAccounts(nextAccounts);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const resetCurrentUserData = async (): Promise<void> => {
    if (!currentUser) {
      return;
    }

    setBusy(true);
    try {
      if (scheduleSaveTimerRef.current) {
        clearTimeout(scheduleSaveTimerRef.current);
      }
      const filteredHistory = history.filter((item) => item.userId !== currentUser.userId);
      setHistory(filteredHistory);
      setLatestResult(null);
      setScheduleDraft([]);

      await Promise.all([
        saveDiaryHistory(filteredHistory),
        saveScheduleDraft(currentUser.userId, []),
      ]);
    } finally {
      setBusy(false);
    }
  };

  const deleteCurrentAccount = async (): Promise<void> => {
    if (!currentUser) {
      return;
    }

    setBusy(true);
    try {
      if (scheduleSaveTimerRef.current) {
        clearTimeout(scheduleSaveTimerRef.current);
      }
      const userId = currentUser.userId;
      const nextAccounts = accounts.filter((item) => item.userId !== userId);
      const nextHistory = history.filter((item) => item.userId !== userId);

      setAccounts(nextAccounts);
      setHistory(nextHistory);
      setCurrentUser(null);
      setLatestResult(null);
      setScheduleDraft([]);

      await Promise.all([
        saveAccounts(nextAccounts),
        saveDiaryHistory(nextHistory),
        saveScheduleDraft(userId, []),
        saveCurrentUser(null),
      ]);

      setRoute("landing");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    try {
      if (scheduleSaveTimerRef.current) {
        clearTimeout(scheduleSaveTimerRef.current);
      }
      await saveCurrentUser(null);
      setCurrentUser(null);
      setLatestResult(null);
      setScheduleDraft([]);
      setRoute("landing");
    } finally {
      setBusy(false);
    }
  };

  const streak = useMemo(() => {
    if (!currentUser) {
      return 0;
    }
    return computeStreak(history, currentUser.userId);
  }, [currentUser, history]);

  const userHistoryCount = useMemo(() => {
    if (!currentUser) {
      return 0;
    }
    return history.filter((item) => item.userId === currentUser.userId).length;
  }, [currentUser, history]);

  const homeCalendarPreview = useMemo<HomeCalendarPreview>(() => {
    if (!currentUser) {
      return emptyHomePreview;
    }

    const report = buildWeeklyReport(history, currentUser.userId);
    const nextSchedule = pickNextScheduleItem(scheduleDraft);

    return {
      weekEntryCount: report.totalEntries,
      consistencyScore: report.consistencyScore,
      dominantEmotion: report.dominantEmotion,
      nextScheduleTitle: nextSchedule?.title ?? null,
      nextScheduleTime: nextSchedule?.time ?? null,
    };
  }, [currentUser, history, scheduleDraft]);

  useEffect(() => {
    if (
      !currentUser &&
      route !== "landing" &&
      route !== "login" &&
      route !== "signup" &&
      route !== "legal"
    ) {
      setRoute("landing");
    }
  }, [currentUser, route]);

  if (!fontsLoaded || booting) {
    return (
      <SafeAreaView style={styles.bootRoot}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primaryDeep} />
        <Text style={styles.bootText}>NightLog를 준비하고 있습니다...</Text>
      </SafeAreaView>
    );
  }

  if (showIntro) {
    return (
      <View style={styles.appRoot}>
        <StatusBar style="dark" />
        <IntroSplashScreen
          onDone={() => {
            setShowIntro(false);
            setRoute(postIntroRoute);
          }}
        />
      </View>
    );
  }

  let screen: ReactNode = null;

  if (route === "landing") {
    screen = (
      <LandingScreen
        onStartSignup={() => setRoute("signup")}
        onGoLogin={() => setRoute("login")}
      />
    );
  }

  if (route === "login") {
    screen = (
      <LoginScreen
        loading={busy}
        onLogin={login}
        onGoSignup={() => setRoute("signup")}
        onBackToLanding={() => setRoute("landing")}
      />
    );
  }

  if (route === "signup") {
    screen = (
      <SignupScreen
        loading={busy}
        onSubmit={signup}
        onBack={() => setRoute("login")}
        onOpenTerms={() => openLegal("terms", "signup")}
        onOpenPrivacy={() => openLegal("privacy", "signup")}
      />
    );
  }

  if (route === "interests" && currentUser) {
    screen = (
      <InterestScreen
        initialSelected={currentUser.interests}
        onSkip={() => {
          void saveInterests([]);
        }}
        onConfirm={(selected) => {
          void saveInterests(selected);
        }}
      />
    );
  }

  if (route === "home" && currentUser) {
    screen = (
      <HomeScreen
        userName={currentUser.name}
        streak={streak}
        historyCount={userHistoryCount}
        hasLatestResult={Boolean(latestResult)}
        onStartChat={() => {
          setJournalAutoStartToken((prev) => prev + 1);
          setRoute("journal");
        }}
        onOpenCalendar={() => openCalendar("home")}
        onOpenLatestResult={() => {
          if (latestResult) {
            setRoute("result");
          }
        }}
        calendarPreview={homeCalendarPreview}
      />
    );
  }

  if (route === "settings" && currentUser) {
    screen = (
      <SettingsScreen
        account={currentUser}
        loading={busy}
        historyCount={userHistoryCount}
        scheduleCount={scheduleDraft.length}
        hasLatestResult={Boolean(latestResult)}
        onBack={() => setRoute("home")}
        onSaveProfile={saveProfile}
        onOpenInterests={() => {
          setInterestReturnRoute("settings");
          setRoute("interests");
        }}
        onOpenTerms={() => openLegal("terms", "settings")}
        onOpenPrivacy={() => openLegal("privacy", "settings")}
        onResetUserData={resetCurrentUserData}
        onDeleteAccount={deleteCurrentAccount}
        onLogout={() => {
          void logout();
        }}
      />
    );
  }

  if (route === "journal" && currentUser) {
    screen = (
      <JournalScreen
        userName={currentUser.name}
        streak={streak}
        autoStartToken={journalAutoStartToken}
        onComplete={(bundle) => {
          void handleComplete(bundle);
        }}
        onGoHome={() => setRoute("home")}
        onOpenCalendar={() => openCalendar("journal")}
        onLogout={() => {
          void logout();
        }}
      />
    );
  }

  if (route === "result") {
    screen = (
      <ResultScreen
        bundle={latestResult}
        onChangeScheduleItems={(items) => {
          void onChangeScheduleItems(items);
        }}
        onGoMain={() => setRoute("home")}
        onGoSchedule={() => setRoute("schedule")}
        onOpenCalendar={() => openCalendar("result")}
      />
    );
  }

  if (route === "schedule") {
    screen = (
      <ScheduleScreen
        items={scheduleDraft}
        onChangeItems={(items) => {
          void onChangeScheduleItems(items);
        }}
        onGoHome={() => setRoute("home")}
      />
    );
  }

  if (route === "calendar" && currentUser) {
    screen = (
      <CalendarInsightsScreen
        userId={currentUser.userId}
        history={history}
        onBack={() => setRoute(calendarBackRoute)}
      />
    );
  }

  if (route === "legal") {
    screen = <LegalScreen docType={legalDoc} onBack={() => setRoute(legalBackRoute)} />;
  }

  return (
    <View style={styles.appRoot}>
      <StatusBar style="dark" />
      <View style={styles.screenArea}>{screen}</View>
      {showBottomTabs ? (
        <BottomTabBar active={activeTab} onPress={onTabPress} badges={tabBadges} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screenArea: {
    flex: 1,
  },
  bootRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    gap: 14,
  },
  bootText: {
    color: colors.mutedText,
    fontFamily: typography.family.medium,
    fontSize: typography.body,
  },
});
