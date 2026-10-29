import { Note } from '../types';
import { storageService } from './storageService';
import { apiClient } from '../src/apiClient';

const NOTE_LIMIT = 5;

export const noteService = {
  // Fetch all notes for the authenticated user
  getAll: async (): Promise<Note[]> => {
    return apiClient.fetch('/notes');
  },

  // Get the total count of notes for the current user
  getCount: async (): Promise<number> => {
    const data = await apiClient.fetch('/notes/count');
    return data.count || 0;
  },

  // Get a single note by ID
  getById: async (id: string): Promise<Note | undefined> => {
    try {
       return await apiClient.fetch(`/notes/${id}`);
    } catch {
       return undefined;
    }
  },

  getPublicById: async (id: string): Promise<Note | undefined> => {
    try {
       const res = await fetch(`/api/public/notes/${id}`);
       if (!res.ok) throw new Error('Not found');
       return await res.json();
    } catch {
       return undefined;
    }
  },

  // Search notes by title or content
  search: async (query: string): Promise<Note[]> => {
    await delay(300); // Small delay for UX
    const notes = await apiClient.fetch('/notes');
    const lowerQuery = query.toLowerCase();
    return notes.filter((n: Note) => 
      (n.title && n.title.toLowerCase().includes(lowerQuery)) || 
      (n.content && n.content.toLowerCase().includes(lowerQuery))
    );
  },

  // Create a new note
  create: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>, bypassLimit?: boolean): Promise<Note> => {
    // SaaS Limit Check
    if (!bypassLimit) {
      const currentCount = await noteService.getCount();
      if (currentCount >= NOTE_LIMIT) {
        throw new Error('FREE_LIMIT_REACHED');
      }
    }

    return apiClient.fetch('/notes', {
       method: 'POST',
       body: JSON.stringify(note)
    });
  },

  // Update an existing note
  update: async (id: string, updates: Partial<Note>): Promise<Note> => {
    return apiClient.fetch(`/notes/${id}`, {
       method: 'PUT',
       body: JSON.stringify(updates)
    });
  },

  // Delete a note and its associated files
  delete: async (id: string): Promise<void> => {
    // 1. Get note to find files to delete (best effort, do not block note deletion)
    try {
      const note = await noteService.getById(id);
      if (note) {
        const pathsToDelete: string[] = [];
        
        // Add thumbnail if it's a storage path
        if (note.thumbnailUrl && !note.thumbnailUrl.startsWith('http')) {
          pathsToDelete.push(note.thumbnailUrl);
        }

        // Add attachment paths
        if (note.attachments && note.attachments.length > 0) {
          note.attachments.forEach(att => pathsToDelete.push(att.path));
        }

        // Delete files from storage
        if (pathsToDelete.length > 0) {
          await storageService.deleteFiles(pathsToDelete).catch(() => {});
        }
      }
    } catch (err) {
      console.warn("Could not inspect attachments before note deletion:", err);
    }

    // 2. Delete from DB
    await apiClient.fetch(`/notes/${id}`, { method: 'DELETE' });
  }
};

// Internal delay helper for responsiveness sim
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));