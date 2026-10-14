import { lazy, Suspense } from "react";
import { MotionConfig } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AccountGate } from "@/components/auth/AccountGate";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JourneyLayout } from "@/components/journey/JourneyLayout";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import Dashboard from "./pages/Dashboard";
import LessonPage from "./pages/LessonPage";
import NotFound from "./pages/NotFound";
import SectionPage from "./pages/SectionPage";

// Reference tools are split out of the initial bundle — they are visited far
// less often than the journey itself.
const MapPage = lazy(() => import("./pages/reference/MapPage"));
const GlossaryPage = lazy(() => import("./pages/reference/GlossaryPage"));
const LibraryPage = lazy(() => import("./pages/reference/LibraryPage"));
const NotesPage = lazy(() => import("./pages/reference/NotesPage"));
const SearchPage = lazy(() => import("./pages/reference/SearchPage"));
const HelpPage = lazy(() => import("./pages/reference/HelpPage"));
const BookmarksPage = lazy(() => import("./pages/reference/BookmarksPage"));

// Sign-in and first-run screens.
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const SetPassword = lazy(() => import("./pages/auth/SetPassword"));
const RecoveryCode = lazy(() => import("./pages/auth/RecoveryCode"));
const Welcome = lazy(() => import("./pages/onboarding/Welcome"));

// The Simulation Lab.
const LabPage = lazy(() => import("./pages/lab/LabPage"));
const SimulationPage = lazy(() => import("./pages/lab/SimulationPage"));

// The learner's own account.
const ProfilePage = lazy(() => import("./pages/account/ProfilePage"));
const CertificatePage = lazy(() => import("./pages/account/CertificatePage"));

// The admin console.
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/OverviewPage"));
const AdminPeople = lazy(() => import("./pages/admin/PeoplePage"));
const AdminPerson = lazy(() => import("./pages/admin/PersonPage"));
const AdminAddPeople = lazy(() => import("./pages/admin/AddPeoplePage"));
const AdminCohorts = lazy(() => import("./pages/admin/CohortsPage"));
const AdminContent = lazy(() => import("./pages/admin/ContentPage"));
const AdminQuestions = lazy(() => import("./pages/admin/QuestionsPage"));
const AdminPasswordHelp = lazy(() => import("./pages/admin/PasswordHelpPage"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AnnouncementsPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/*
        Honors the OS reduced-motion setting across every framer-motion element
        in the app without touching them individually.
      */}
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={null}>
              <Routes>
                {/* Every route sits behind the account gate (src/lib/auth/gate.ts). */}
                <Route element={<AccountGate />}>
                  <Route path="/auth/sign-in" element={<SignIn />} />
                  <Route path="/auth/sign-up" element={<SignUp />} />
                  <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                  <Route path="/auth/set-password" element={<SetPassword />} />
                  <Route path="/auth/recovery-code" element={<RecoveryCode />} />
                  <Route path="/welcome" element={<Welcome />} />

                  {/* Admins only — the account gate redirects everyone else. */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminOverview />} />
                    <Route path="people" element={<AdminPeople />} />
                    <Route path="people/:userId" element={<AdminPerson />} />
                    <Route path="add" element={<AdminAddPeople />} />
                    <Route path="cohorts" element={<AdminCohorts />} />
                    <Route path="content" element={<AdminContent />} />
                    <Route path="questions" element={<AdminQuestions />} />
                    <Route path="password-help" element={<AdminPasswordHelp />} />
                    <Route path="announcements" element={<AdminAnnouncements />} />
                  </Route>

                  <Route element={<JourneyLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* The book: chapters 1-11. */}
                    <Route path="/learn/:sectionId" element={<SectionPage />} />
                    <Route path="/learn/:sectionId/:lessonSlug" element={<LessonPage />} />

                    {/* The appendix shares the lesson chrome but not the progress denominator. */}
                    <Route path="/appendix/:sectionId" element={<SectionPage />} />
                    <Route path="/appendix/:sectionId/:lessonSlug" element={<LessonPage />} />

                    {/* Hands-on simulators, one per section. */}
                    <Route path="/lab" element={<LabPage />} />
                    <Route path="/lab/:simId" element={<SimulationPage />} />

                    {/* Account. */}
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/certificate" element={<CertificatePage />} />

                    {/* Reference tools. */}
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/glossary" element={<GlossaryPage />} />
                    <Route path="/library" element={<LibraryPage />} />
                    <Route path="/notes" element={<NotesPage />} />
                    <Route path="/notes/:sessionId" element={<NotesPage />} />
                    <Route path="/bookmarks" element={<BookmarksPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/help" element={<HelpPage />} />

                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </MotionConfig>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
