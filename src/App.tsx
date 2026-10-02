import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
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
import { SupabaseMigrationModal } from './components/admin/SupabaseMigrationModal';
import { ClientDetailModal } from './components/clients/ClientDetailModal';
import { ClientFormModal } from './components/clients/ClientFormModal';
import { ProjectDetailModal } from './components/projects/ProjectDetailModal';
import { ProjectFormModal } from './components/projects/ProjectFormModal';
import { ContentDetailModal } from './components/content/ContentDetailModal';
import { ContentFormModal } from './components/content/ContentFormModal';
import { ClientReviewModal } from './components/content/ClientReviewModal';
import { VersionUploadModal } from './components/content/VersionUploadModal';
import { TaskFormModal } from './components/tasks/TaskFormModal';

const MainApp: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [searchOpen, setSearchOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [createClientOpen, setCreateClientOpen] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [createContentOpen, setCreateContentOpen] = useState(false);
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
      case 'editor':
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
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
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
                onOpenCreateModal={() => setCreateContentOpen(true)}
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
              <AdminSettings onOpenSupabaseModal={() => setSupabaseModalOpen(true)} />
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

      <SupabaseMigrationModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
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
        onClose={() => setCreateContentOpen(false)}
      />

      <ClientReviewModal
        contentId={clientReviewContentId}
        isOpen={!!clientReviewContentId}
        onClose={() => setClientReviewContentId(null)}
      />

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
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}
