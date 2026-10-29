import { Note } from '../types';

// TODO: Replace with Supabase/Firebase client
const MOCK_DELAY = 600;

// Mutable in-memory store - Initialized empty to simulate fresh database
export let mockNotes: Note[] = [];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const noteService = {
  // Simulate fetching from Firestore 'notes' collection
  getAll: async (): Promise<Note[]> => {
    await delay(MOCK_DELAY);
    return [...mockNotes];
  },

  // Simulate fetching a single document by ID
  getById: async (id: string): Promise<Note | undefined> => {
    await delay(MOCK_DELAY);
    return mockNotes.find(n => n.id === id);
  },

  // Simulate searching notes
  search: async (query: string): Promise<Note[]> => {
    await delay(300); // Lighter delay for search responsiveness
    const lowerQuery = query.toLowerCase();
    return mockNotes.filter(n => 
      n.title.toLowerCase().includes(lowerQuery) || 
      n.content.toLowerCase().includes(lowerQuery)
    );
  },

  // Simulate creating a new document in Firestore
  create: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    await delay(MOCK_DELAY);
    const newNote: Note = {
      ...note,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockNotes.unshift(newNote); // Add to beginning (like sorting by desc date)
    console.log('[BACKEND] Created note:', newNote);
    return newNote;
  },

  // Simulate updating a document
  update: async (id: string, updates: Partial<Note>): Promise<Note> => {
    await delay(MOCK_DELAY);
    const index = mockNotes.findIndex(n => n.id === id);
    if (index === -1) {
      throw new Error('Note not found');
    }
    
    const updatedNote = {
      ...mockNotes[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    mockNotes[index] = updatedNote;
    console.log('[BACKEND] Updated note:', id, updates);
    return updatedNote;
  },

  // Simulate deleting a document
  delete: async (id: string): Promise<void> => {
    await delay(MOCK_DELAY);
    mockNotes = mockNotes.filter(n => n.id !== id);
    console.log('[BACKEND] Deleted note:', id);
  }
};