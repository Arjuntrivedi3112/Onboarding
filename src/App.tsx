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

                  <Route element={<JourneyLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* The book: chapters 1-11. */}
                    <Route path="/learn/:sectionId" element={<SectionPage />} />
                    <Route path="/learn/:sectionId/:lessonSlug" element={<LessonPage />} />

                    {/* The appendix shares the lesson chrome but not the progress denominator. */}
                    <Route path="/appendix/:sectionId" element={<SectionPage />} />
                    <Route path="/appendix/:sectionId/:lessonSlug" element={<LessonPage />} />

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
