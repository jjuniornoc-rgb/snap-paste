export interface ClipItem {
  id: string;
  dataUrl: string;
  thumbnail: string;
  title: string;
  createdAt: number;
  width: number;
  height: number;
  tags: string[];
  sizeKb: number;
}

const DB_NAME = 'ctrl_vi_db';
const DB_VERSION = 1;
const STORE_NAME = 'clips';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB não suportado'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generate smaller thumbnail for fast loading in gallery
export async function createThumbnail(dataUrl: string, maxDim = 320): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;

      if (w > h && w > maxDim) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else if (h > maxDim) {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }

      canvas.width = Math.max(1, w);
      canvas.height = Math.max(1, h);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/webp', 0.8));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function saveClip(
  dataUrl: string,
  title?: string,
  tags: string[] = ['Geral'],
  width = 0,
  height = 0
): Promise<ClipItem> {
  const id = 'clip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const createdAt = Date.now();
  const thumbnail = await createThumbnail(dataUrl);
  const approxSize = Math.round((dataUrl.length * 3) / 4 / 1024);

  const newClip: ClipItem = {
    id,
    dataUrl,
    thumbnail,
    title: title || `Captura ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    createdAt,
    width,
    height,
    tags,
    sizeKb: approxSize,
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(newClip);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falha no IndexedDB, usando fallback de localStorage:', err);
    try {
      const local = JSON.parse(localStorage.getItem('ctrl_vi_clips') || '[]');
      local.unshift(newClip);
      // Keep max 15 in localStorage to avoid quota limits
      localStorage.setItem('ctrl_vi_clips', JSON.stringify(local.slice(0, 15)));
    } catch (e) {
      console.error('Falha também no localStorage:', e);
    }
  }

  return newClip;
}

export async function getClips(): Promise<ClipItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      const req = index.openCursor(null, 'prev');
      const results: ClipItem[] = [];

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Recuperando do localStorage por fallback:', err);
    try {
      return JSON.parse(localStorage.getItem('ctrl_vi_clips') || '[]');
    } catch {
      return [];
    }
  }
}

export async function deleteClip(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erro ao deletar do IndexedDB, limpando localStorage:', err);
  }

  try {
    const local = JSON.parse(localStorage.getItem('ctrl_vi_clips') || '[]');
    const filtered = local.filter((c: ClipItem) => c.id !== id);
    localStorage.setItem('ctrl_vi_clips', JSON.stringify(filtered));
  } catch {}
}

export async function clearAllClips(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
  localStorage.removeItem('ctrl_vi_clips');
}
