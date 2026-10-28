import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';

// Dashboards
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { ProjectManagerDashboard } from './components/dashboard/ProjectManagerDashboard';
import { EditorDashboard } from './components/dashboard/EditorDashboard';
import { ClientDashboard } from './components/dashboard/ClientDashboard';
import { CopyEditorDashboard } from './components/dashboard/CopyEditorDashboard';
import { ViewerDashboard } from './components/dashboard/ViewerDashboard';
import { QCDashboard } from './components/dashboard/QCDashboard';
import { VideographerDashboard } from './components/dashboard/VideographerDashboard';

// Sections
import { ClientList } from './components/clients/ClientList';
import { ProjectList } from './components/projects/ProjectList';
import { ContentPipeline } from './components/content/ContentPipeline';
import { TaskList } from './components/tasks/TaskList';
import { CalendarView } from './components/calendar/CalendarView';
import { FileManager } from './components/files/FileManager';
import { ActivityTimeline } from './components/activity/ActivityTimeline';
import { AdminSettings } from './components/admin/AdminSettings';

// Modals
import { LoginView } from './components/auth/LoginView';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { DatabaseConfigModal } from './components/admin/DatabaseConfigModal';
import { ClientDetailModal } from './components/clients/ClientDetailModal';
import { ClientFormModal } from './components/clients/ClientFormModal';
import { ProjectDetailModal } from './components/projects/ProjectDetailModal';
import { ProjectFormModal } from './components/projects/ProjectFormModal';
import { ContentDetailModal } from './components/content/ContentDetailModal';
import { ContentFormModal } from './components/content/ContentFormModal';
import { ClientReviewModal } from './components/content/ClientReviewModal';
import { VersionUploadModal } from './components/content/VersionUploadModal';
import { TaskFormModal } from './components/tasks/TaskFormModal';
import { ContentStatus } from './types/database';

const MainApp: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { dbError, clearDbError } = useData();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [searchOpen, setSearchOpen] = useState(false);
  const [dbModalOpen, setDbModalOpen] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [createClientOpen, setCreateClientOpen] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [createContentOpen, setCreateContentOpen] = useState(false);
  const [createContentDefaultStatus, setCreateContentDefaultStatus] = useState<ContentStatus>('idea');
  const [clientReviewContentId, setClientReviewContentId] = useState<string | null>(null);
  const [versionUploadContentId, setVersionUploadContentId] = useState<string | null>(null);

  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createTaskDefaultProjectId, setCreateTaskDefaultProjectId] = useState<string | undefined>(undefined);

  // Keyboard shortcut for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!currentUser) {
    return <LoginView />;
  }

  const renderDashboard = () => {
    switch (role) {
      case 'super_admin':
        return (
          <AdminDashboard
            onNavigateTab={setCurrentTab}
            onSelectProject={setSelectedProjectId}
            onSelectContent={setSelectedContentId}
          />
        );
      case 'project_manager':
        return (
          <ProjectManagerDashboard
            onNavigateTab={setCurrentTab}
            onSelectProject={setSelectedProjectId}
            onSelectContent={setSelectedContentId}
          />
        );
      case 'qc':
        return (
          <QCDashboard
            onNavigateTab={setCurrentTab}
            onSelectContent={setSelectedContentId}
          />
        );
      case 'videographer':
        return (
          <VideographerDashboard
            onNavigateTab={setCurrentTab}
            onSelectContent={setSelectedContentId}
            onSelectTask={(id) => setCurrentTab('tasks')}
          />
        );
      case 'editor':
      case 'graphic_designer':
      case 'audio_engineer':
      case 'colorist':
        return (
          <EditorDashboard
            onNavigateTab={setCurrentTab}
            onSelectContent={setSelectedContentId}
            onSelectTask={(id) => setCurrentTab('tasks')}
          />
        );
      case 'client':
        return (
          <ClientDashboard
            onNavigateTab={setCurrentTab}
            onSelectProject={setSelectedProjectId}
            onSelectContent={setSelectedContentId}
            onOpenReviewModal={setClientReviewContentId}
          />
        );
      case 'copy_editor':
      case 'strategist':
      case 'social_media_manager':
        return (
          <CopyEditorDashboard
            onNavigateTab={setCurrentTab}
            onSelectContent={setSelectedContentId}
          />
        );
      case 'viewer':
      default:
        return (
          <ViewerDashboard
            onNavigateTab={setCurrentTab}
            onSelectProject={setSelectedProjectId}
            onSelectContent={setSelectedContentId}
          />
        );
    }
  };

  return (
    <div className="flex h-screen h-[100dvh] w-full flex-col bg-neutral-950 text-neutral-100 antialiased overflow-hidden">
      {/* Top Bar Header */}
      <Header
        onOpenSearch={() => setSearchOpen(true)}
        onOpenDbModal={() => setDbModalOpen(true)}
        onSelectContent={(id) => setSelectedContentId(id)}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar (Desktop Static + Mobile Drawer) */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Viewport Content Canvas */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 pb-32 md:pb-8 bg-neutral-950 overscroll-y-contain">
          <div className="mx-auto max-w-7xl">
            {dbError && role === 'super_admin' && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 sm:p-4 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="font-semibold text-amber-300 shrink-0">⚠️ Database Notice:</span>
                  <span>{dbError}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setDbModalOpen(true)}
                    className="rounded-lg bg-amber-400 px-3 py-1 font-semibold text-neutral-950 hover:bg-amber-300 transition-colors"
                  >
                    Open RLS Fix / SQL
                  </button>
                  <button
                    onClick={clearDbError}
                    className="text-neutral-400 hover:text-neutral-200 px-1 font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            {currentTab === 'dashboard' && renderDashboard()}
            {currentTab === 'clients' && (
              <ClientList
                onSelectClient={setSelectedClientId}
                onOpenCreateClientModal={() => setCreateClientOpen(true)}
              />
            )}
            {currentTab === 'projects' && (
              <ProjectList
                onSelectProject={setSelectedProjectId}
                onOpenCreateModal={() => setCreateProjectOpen(true)}
              />
            )}
            {currentTab === 'content' && (
              <ContentPipeline
                onSelectContent={setSelectedContentId}
                onOpenCreateModal={(initialStatus?: ContentStatus) => {
                  setCreateContentDefaultStatus(initialStatus || 'idea');
                  setCreateContentOpen(true);
                }}
                onOpenReviewModal={setClientReviewContentId}
                onOpenVersionModal={setVersionUploadContentId}
              />
            )}
            {currentTab === 'tasks' && (
              <TaskList
                onOpenCreateTaskModal={() => {
                  setCreateTaskDefaultProjectId(undefined);
                  setCreateTaskOpen(true);
                }}
                onSelectContent={setSelectedContentId}
                onSelectProject={setSelectedProjectId}
                onOpenVersionModal={setVersionUploadContentId}
              />
            )}
            {currentTab === 'calendar' && (
              <CalendarView
                onSelectProject={setSelectedProjectId}
                onSelectContent={setSelectedContentId}
              />
            )}
            {currentTab === 'files' && <FileManager />}
            {currentTab === 'activity' && (
              <ActivityTimeline
                onSelectProject={setSelectedProjectId}
                onSelectContent={setSelectedContentId}
              />
            )}
            {currentTab === 'settings' && (
              <AdminSettings onOpenDbModal={() => setDbModalOpen(true)} />
            )}
          </div>
        </main>
      </div>

      {/* Persistent Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenMenu={() => setMobileMenuOpen(true)}
      />

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectClient={setSelectedClientId}
        onSelectProject={setSelectedProjectId}
        onSelectContent={setSelectedContentId}
      />

      <DatabaseConfigModal
        isOpen={dbModalOpen}
        onClose={() => setDbModalOpen(false)}
      />

      <ClientDetailModal
        clientId={selectedClientId}
        isOpen={!!selectedClientId}
        onClose={() => setSelectedClientId(null)}
        onSelectProject={setSelectedProjectId}
        onSelectContent={setSelectedContentId}
      />

      <ClientFormModal
        isOpen={createClientOpen}
        onClose={() => setCreateClientOpen(false)}
      />

      <ProjectDetailModal
        projectId={selectedProjectId}
        isOpen={!!selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
        onSelectContent={setSelectedContentId}
        onOpenCreateTaskModal={(projId) => {
          setCreateTaskDefaultProjectId(projId);
          setCreateTaskOpen(true);
        }}
      />

      <ProjectFormModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
      />

      <ContentDetailModal
        contentId={selectedContentId}
        isOpen={!!selectedContentId}
        onClose={() => setSelectedContentId(null)}
        onOpenVersionModal={setVersionUploadContentId}
        onOpenReviewModal={setClientReviewContentId}
      />

      <ContentFormModal
        isOpen={createContentOpen}
        defaultStatus={createContentDefaultStatus}
        onClose={() => setCreateContentOpen(false)}
      />

      {role === 'client' && (
        <ClientReviewModal
          contentId={clientReviewContentId}
          isOpen={!!clientReviewContentId}
          onClose={() => setClientReviewContentId(null)}
        />
      )}

      <VersionUploadModal
        contentId={versionUploadContentId}
        isOpen={!!versionUploadContentId}
        onClose={() => setVersionUploadContentId(null)}
      />

      <TaskFormModal
        isOpen={createTaskOpen}
        defaultProjectId={createTaskDefaultProjectId}
        onClose={() => setCreateTaskOpen(false)}
      />

      {/* Database Feedback Toast */}
      {dbError && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-xl border border-amber-500/40 bg-neutral-900/95 p-4 shadow-2xl backdrop-blur-md text-xs text-neutral-200 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="font-semibold text-amber-400">
              Database Status Notice
            </div>
            <button
              onClick={clearDbError}
              className="text-neutral-400 hover:text-neutral-200 font-bold px-1"
            >
              ✕
            </button>
          </div>
          <p className="text-neutral-300 leading-relaxed">{dbError}</p>
          {role === 'super_admin' && (
            <button
              onClick={() => {
                clearDbError();
                setDbModalOpen(true);
              }}
              className="text-[11px] font-semibold text-amber-400 hover:underline block pt-1"
            >
              View Complete PostgreSQL Schema &gt;
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <MainApp />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
