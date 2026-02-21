// ============================================================
// Firebase Configuration untuk Komentar Real-time
// ============================================================
// CARA SETUP:
// 1. Buka https://console.firebase.google.com
// 2. Klik "Add project" → isi nama → klik Continue sampai selesai
// 3. Di dashboard, klik ikon "</>" (Web) untuk daftarkan app
// 4. Isi nama app → klik "Register app" → copy firebaseConfig
// 5. Di sidebar kiri, klik "Build" → "Realtime Database"
// 6. Klik "Create Database" → pilih lokasi → pilih "Start in test mode" → Enable
// 7. Copy URL database (bentuk: https://nama-project-default-rtdb.firebaseio.com)
// 8. Ganti nilai di bawah dengan config kamu
// ============================================================

const FIREBASE_DB_URL = 'https://kanaverse-b7d4e-default-rtdb.firebaseio.com';
// Contoh: 'https://nama-project-default-rtdb.firebaseio.com'

// ── Cek apakah Firebase sudah dikonfigurasi ────────────────────────────────
export const isFirebaseConfigured = () =>
  FIREBASE_DB_URL && !FIREBASE_DB_URL.includes('GANTI_DENGAN');

// ── Encode key aman untuk Firebase path ───────────────────────────────────
const encodeKey = (str) =>
  encodeURIComponent(str)
    .replace(/\./g, '%2E')
    .replace(/~/g, '%7E')
    .replace(/%/g, '_');

// ── GET komentar dari Firebase ─────────────────────────────────────────────
export const fetchCommentsFromFirebase = async (episodeKey) => {
  if (!isFirebaseConfigured()) return null;
  try {
    const key = encodeKey(episodeKey);
    const res = await fetch(`${FIREBASE_DB_URL}/comments/${key}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data) return [];
    return Object.values(data)
      .map(c => ({ ...c, createdAt: new Date(c.createdAt) }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (e) {
    console.warn('Firebase fetch error:', e);
    return null;
  }
};

// ── POST komentar baru ke Firebase ────────────────────────────────────────
export const saveCommentToFirebase = async (episodeKey, comment) => {
  if (!isFirebaseConfigured()) return false;
  try {
    const key = encodeKey(episodeKey);
    const commentData = {
      ...comment,
      createdAt: comment.createdAt instanceof Date
        ? comment.createdAt.toISOString()
        : comment.createdAt,
    };
    const res = await fetch(
      `${FIREBASE_DB_URL}/comments/${key}/${comment.id}.json`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData),
      }
    );
    return res.ok;
  } catch (e) {
    console.warn('Firebase save error:', e);
    return false;
  }
};

// ── UPDATE likes di Firebase ───────────────────────────────────────────────
export const updateLikeInFirebase = async (episodeKey, commentId, updatedComment) => {
  if (!isFirebaseConfigured()) return false;
  try {
    const key = encodeKey(episodeKey);
    const res = await fetch(
      `${FIREBASE_DB_URL}/comments/${key}/${commentId}.json`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          likes: updatedComment.likes,
          likedBy: updatedComment.likedBy,
        }),
      }
    );
    return res.ok;
  } catch (e) {
    console.warn('Firebase like error:', e);
    return false;
  }
};

// ── Polling real-time setiap N detik ──────────────────────────────────────
export const pollComments = (episodeKey, callback, intervalMs = 8000) => {
  if (!isFirebaseConfigured()) return null;
  const poll = async () => {
    const comments = await fetchCommentsFromFirebase(episodeKey);
    if (comments !== null) callback(comments);
  };
  poll();
  const id = setInterval(poll, intervalMs);
  return () => clearInterval(id);
};
  
