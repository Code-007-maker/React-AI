import React, { useState, useEffect, useCallback } from 'react';
import {
  subscribeToAuthState,
  signInWithGoogle,
  signOutUser,
  fetchUserJournalEntries,
  saveJournalEntry,
  deleteJournalEntry,
} from './firebase';
import type { UserProfile, JournalEntry, ReflectionCategory, ReflectionTone } from './types';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { SidebarHistory } from './components/SidebarHistory';
import { ReflectionStudio } from './components/ReflectionStudio';
import { SecuritySpecModal } from './components/SecuritySpecModal';
import { Loader2 } from 'lucide-react';

const createDefaultEntry = (userId: string): JournalEntry => ({
  userId,
  title: 'Evening Reflection & Clarity',
  category: 'daily_journal',
  mood: 'reflective',
  tone: 'empathetic',
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // 1. Subscribe to Firebase Auth State
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch User's Isolated Journal Entries when authenticated
  const loadEntries = useCallback(async (userId: string) => {
    try {
      setEntriesLoading(true);
      const userEntries = await fetchUserJournalEntries(userId);
      setEntries(userEntries);

      if (userEntries.length > 0) {
        setSelectedEntry(userEntries[0]);
      } else {
        setSelectedEntry(createDefaultEntry(userId));
      }
    } catch (err: any) {
      console.error('Failed to load user journal entries:', err);
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.uid) {
      loadEntries(currentUser.uid);
    } else {
      setEntries([]);
      setSelectedEntry(null);
    }
  }, [currentUser, loadEntries]);

  // 3. Create New Reflection Action
  const handleNewEntry = () => {
    if (!currentUser) return;
    const newEntry = createDefaultEntry(currentUser.uid);
    newEntry.title = `Reflection - ${new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })}`;
    setSelectedEntry(newEntry);
    setSaveStatus('idle');
    setSaveErrorMessage(null);
  };

  // 4. Update Current Entry in Memory
  const handleUpdateEntry = (updatedFields: Partial<JournalEntry>) => {
    setSelectedEntry((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...updatedFields,
        updatedAt: Date.now(),
      };
    });
    setSaveStatus('idle');
  };

  // 5. Save Current Entry to Cloud Firestore
  const handleSaveToCloud = async () => {
    if (!currentUser || !selectedEntry) return;

    try {
      setIsSaving(true);
      setSaveStatus('saving');
      setSaveErrorMessage(null);

      const entryId = await saveJournalEntry(selectedEntry);

      // Update in memory entry with assigned ID if new
      setSelectedEntry((prev) => (prev ? { ...prev, id: entryId } : null));

      // Refresh list
      const updatedEntries = await fetchUserJournalEntries(currentUser.uid);
      setEntries(updatedEntries);

      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus((current) => (current === 'saved' ? 'idle' : current));
      }, 3000);
    } catch (err: any) {
      console.error('Cloud save failed:', err);
      setSaveStatus('error');
      setSaveErrorMessage(err?.message || 'Failed to save to Firestore. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Delete Entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser) return;
    try {
      await deleteJournalEntry(currentUser.uid, entryId);
      const updatedEntries = entries.filter((e) => e.id !== entryId);
      setEntries(updatedEntries);

      if (selectedEntry?.id === entryId) {
        if (updatedEntries.length > 0) {
          setSelectedEntry(updatedEntries[0]);
        } else {
          setSelectedEntry(createDefaultEntry(currentUser.uid));
        }
      }
    } catch (err: any) {
      console.error('Failed to delete entry:', err);
      alert('Could not delete reflection entry.');
    }
  };

  // 7. Select Entry from Sidebar
  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setSaveStatus('idle');
    setSaveErrorMessage(null);
  };

  // 8. Authentication Actions
  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setEntries([]);
    setSelectedEntry(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <p className="text-xs text-slate-400">Initializing secure session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navigation Bar */}
      <Navbar
        user={currentUser}
        onSignOut={handleSignOut}
        onNewEntry={handleNewEntry}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        entryCount={entries.length}
      />

      {/* Main View Container */}
      {!currentUser ? (
        /* Landing Page / Sign-In View */
        <LandingView
          onSignIn={handleSignIn}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        />
      ) : (
        /* Authenticated Dashboard View */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* History Sidebar */}
          <SidebarHistory
            entries={entries}
            selectedEntryId={selectedEntry?.id || null}
            onSelectEntry={handleSelectEntry}
            onNewEntry={handleNewEntry}
            onDeleteEntry={handleDeleteEntry}
            isLoading={entriesLoading}
          />

          {/* Reflection Studio */}
          {selectedEntry ? (
            <ReflectionStudio
              currentEntry={selectedEntry}
              onUpdateEntry={handleUpdateEntry}
              onSaveToCloud={handleSaveToCloud}
              isSaving={isSaving}
              saveStatus={saveStatus}
              saveErrorMessage={saveErrorMessage}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              No active reflection. Click "New Reflection" to begin.
            </div>
          )}
        </div>
      )}

      {/* Security Specifications Modal */}
      <SecuritySpecModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
}
