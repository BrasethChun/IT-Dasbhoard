import { apiClient } from '../src/apiClient';

export const storageService = {
  async getSignedUrl(path: string): Promise<string> {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:')) return path; 
    // In our custom backend, the path is already the URL for public access (e.g. /uploads/...)
    return path;
  },

  async uploadFile(file: File, userId: string, folder: string, customName?: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    // In a full implementation, you could pass folder to the endpoint as well.
    // formData.append('folder', folder);

    const response = await apiClient.fetch('/upload', {
      method: 'POST',
      body: formData // Headers for Content-Type are handled automatically by browser
    });

    return response.path;
  },

  async deleteFile(path: string): Promise<void> {
    if (!path || path.startsWith('http')) return;
    
    try {
      await apiClient.fetch('/upload', {
        method: 'DELETE',
        body: JSON.stringify({ path })
      });
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  },

  async deleteFiles(paths: string[]): Promise<void> {
    if (!paths.length) return;
    const validPaths = paths.filter(p => p && !p.startsWith('http'));
    if (!validPaths.length) return;

    for (const path of validPaths) {
      await this.deleteFile(path);
    }
  }
};