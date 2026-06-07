import { DiaryEntry } from '../types';

/**
 * Zero-dependency IndexedDB wrapper for storing FileSystemDirectoryHandle (Local Backup folders)
 */
const DB_NAME = 'cogwheel_local_backup_db';
const STORE_NAME = 'handles_store';

export const getStoredDirectoryHandle = (): Promise<FileSystemDirectoryHandle | null> => {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get('backup_dir');
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
};

export const setStoredDirectoryHandle = (handle: FileSystemDirectoryHandle): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put(handle, 'backup_dir');
          tx.oncomplete = () => resolve();
        } catch (e) {
          resolve();
        }
      };
      request.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });
};

export const clearStoredDirectoryHandle = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.delete('backup_dir');
          tx.oncomplete = () => resolve();
        } catch (e) {
          resolve();
        }
      };
      request.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });
};

/**
 * Verify permission for directory handle, asking the user if required.
 * Relies on File System Access API.
 */
export const verifyPermission = async (fileHandle: FileSystemDirectoryHandle, readWrite: boolean): Promise<boolean> => {
  try {
    const handleAny = fileHandle as any;
    const options: any = {};
    if (readWrite) {
      options.mode = 'readwrite';
    }
    if (typeof handleAny.queryPermission === 'function') {
      if ((await handleAny.queryPermission(options)) === 'granted') {
        return true;
      }
      if (typeof handleAny.requestPermission === 'function') {
        if ((await handleAny.requestPermission(options)) === 'granted') {
          return true;
        }
      }
    }
    return false;
  } catch (err) {
    console.error("[BACKUP SYSTEM] FileSystem handle request permission error:", err);
    return false;
  }
};

/**
 * Method 2: Automatically save/download a diary entry to the local computer as a TXT file.
 * If a custom folder handle has been designated, this writes directly into that folder.
 * Otherwise, it triggers the standard browser download.
 * Clean written content is saved as pure natural language as requested.
 */
export const downloadDiaryEntryAsTxt = async (
  entry: DiaryEntry,
  customFolderHandle?: FileSystemDirectoryHandle | null
): Promise<{ success: boolean; method: 'custom_folder' | 'browser_download'; path?: string; error?: string }> => {
  try {
    const dateObj = new Date(entry.createdAt);
    const dateStr = dateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '-').replace(/\./g, '');
    
    // Convert time to HHMMSS string for the file title
    const timeFull = dateObj.toTimeString().split(' ')[0]; // e.g. "14:23:45"
    const timeStr = timeFull.replace(/:/g, ''); 
    const filename = `톱니바퀴_일지_${dateStr}_${timeStr}.txt`;

    // Pure natural language written by user as requested: "일지 기록내용 그대로 자연어 그대로 담겨져야하고"
    const txtContent = entry.content;

    // Direct folder save attempt if handle is provided
    if (customFolderHandle) {
      try {
        const hasPermission = await verifyPermission(customFolderHandle, true);
        if (hasPermission) {
          const fileHandle = await customFolderHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(txtContent);
          await writable.close();
          console.log(`[CUSTOM LOCAL FOLDER SAVE] Successfully saved ${filename} to folder: ${customFolderHandle.name}`);
          return { success: true, method: 'custom_folder', path: `${customFolderHandle.name}/${filename}` };
        }
      } catch (err: any) {
        console.warn("[CUSTOM LOCAL FOLDER ERROR] Direct write failed, using fallback browser download:", err);
      }
    }

    // Rollback to seamless classic browser trigger download
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log(`[CLASSIC DOWNLOAD FALLBACK] Triggered standard browser download for ${filename}`);
    return { success: true, method: 'browser_download' };
  } catch (err: any) {
    console.error("[LOCAL BACKUP SYSTEM ERROR] Failed writing local copy:", err);
    return { success: false, method: 'browser_download', error: err?.message || String(err) };
  }
};

/**
 * Method 1: Upload a diary entry to the user's Microsoft OneDrive in real-time.
 */
export const uploadDiaryToOneDrive = async (
  entry: DiaryEntry,
  accessToken: string,
  folderName: string = "Cogwheel_Diary_Backup"
): Promise<{ success: boolean; error?: string; status?: number }> => {
  try {
    const dateObj = new Date(entry.createdAt);
    const dateStr = dateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '-').replace(/\./g, '');
    
    const timeFull = dateObj.toTimeString().split(' ')[0];
    const timeStr = timeFull.replace(/:/g, '');
    const filename = `톱니바퀴_일지_${dateStr}_${timeStr}.txt`;

    // OneDrive copy also contains pure beautiful content
    const txtContent = entry.content;

    // Standard MS Graph Endpoint for uploading binary/text contents directly
    // PUT /me/drive/root:/{folder-path}/{filename}:/content
    const cleanFolder = folderName.trim().replace(/^\/+|\/+$/g, ''); // strip leading/trailing slashes
    const folderPath = cleanFolder ? `${encodeURIComponent(cleanFolder)}/` : '';
    const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${folderPath}${encodeURIComponent(filename)}:/content`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain; charset=utf-8'
      },
      body: txtContent
    });

    if (response.ok) {
      console.log(`[ONEDRIVE BACKUP] Successfully uploaded entry ${entry.id} to OneDrive!`);
      return { success: true };
    } else {
      const errText = await response.text();
      console.error("[ONEDRIVE BACKUP] Upload returned failure status:", response.status, errText);
      return { success: false, status: response.status, error: errText };
    }
  } catch (err: any) {
    console.error("[ONEDRIVE BACKUP] HTTP Request failed:", err);
    return { success: false, error: err?.message || String(err) };
  }
};
