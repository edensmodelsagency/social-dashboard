'use client';

import { useState } from 'react';
import styles from './dashboard.module.css';

type Platform = 'instagram' | 'tiktok';
type Status = 'idle' | 'running' | 'done' | 'error';

interface Profile {
  username: string;
  status: Status;
  color: string;
  data?: any[];
  error?: string;
}

const COLORS = ['#E1306C', '#378ADD', '#1D9E75', '#BA7517', '#7F77DD', '#D85A30', '#0F6E56', '#993556'];

function fmt(n: any): string {
  if (n == null || n === '') return '—';
  const num = parseInt(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

function initials(u: string) {
  return u.substring(0, 2).toUpperCase();
}

function cleanUsername(input: string): string {
  return input
    .trim()
    .replace(/https?:\/\/(www\.)?(instagram\.com|tiktok\.com)\/@?/, '')
    .replace(/[\/\s@]/g, '');
}

export default function Dashboard() {
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [profiles, setProfiles] = useState<Record<Platform, Profile[]>>({
    instagram: [],
    tiktok: [],
  });
  const [inputVal, setInputVal] = useState('');
  const [inputError, setInputError] = useState('');
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

  const currentProfiles = profiles[platform];

  function addProfile() {
    setInputError('');
    const username = cleanUsername(inputVal);
    if (!username) { setInputError('Βάλε ένα έγκυρο username.'); return; }
    if (currentProfiles.find(p => p.username === username)) { setInputError('Υπάρχει ήδη στη λίστα.'); return; }
    if (currentProfiles.length >= 20) { setInputError('Μέγιστο 20 profiles ανά platform.'); return; }
    const newProfile: Profile = {
      username,
      status: 'idle',
      color: COLORS[currentProfiles.length % COLORS.length],
    };
    setProfiles(prev => ({ ...prev, [platform]: [...prev[platform], newProfile] }));
    setInputVal('');
  }

  function removeProfile(username: string) {
    setProfiles(prev => ({
      ...prev,
      [platform]: prev[platform].filter(p => p.username !== username),
    }));
    if (activeProfile?.username === username) setActiveProfile(null);
  }

  async function analyzeProfile(username: string) {
    setProfiles(prev => ({
      ...prev,
      [platform]: prev[platform].map(p =>
        p.username === username ? { ...p, status: 'running', error: undefined } : p
      ),
    }));
    setActiveProfile(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, platform }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Άγνωστο σφάλμα');

      const updatedProfile: Profile = {
        username,
        status: 'done',
        color: currentProfiles.find(p => p.username === username)?.color || COLORS[0],
        data: json.items,
      };
      setProfiles(prev => ({
        ...prev,
        [platform]: prev[platform].map(p => p.username === username ? updatedProfile : p),
      }));
      setActiveProfile(updatedProfile);
    } catch (e: any) {
      setProfiles(prev => ({
        ...prev,
        [platform]: prev[platform].map(p =>
          p.username === username ? { ...p, status: 'error', error: e.message } : p
        ),
      }));
    }
  }

  function renderMetrics(profile: Profile) {
    const items = profile.data || [];
    if (platform === 'instagram') {
      const profileItem = items.find((i: any) => i.followersCount != null) || items[0] || {};
      const posts = items.filter((i: any) => i.likesCount != null).slice(0, 10);
      const followers = profileItem.followersCount || 0;
      const avgLikes = posts.length ? Math.round(posts.reduce((s: number, p: any) => s + (p.likesCount || 0), 0) / posts.length) : 0;
      const avgComments = posts.length ? Math.round(posts.reduce((s: number, p: any) => s + (p.commentsCount || 0), 0) / posts.length) : 0;
      const engRate = followers > 0 && posts.length ? ((avgLikes + avgComments) / followers * 100).toFixed(2) + '%' : '—';

      return {
        metrics: [
          { label: 'Followers', value: fmt(followers) },
          { label: 'Following', value: fmt(profileItem.followingCount || 0) },
          { label: 'Posts', value: fmt(profileItem.postsCount || posts.length) },
          { label: 'Avg Likes', value: fmt(avgLikes) },
          { label: 'Avg Comments', value: fmt(avgComments) },
          { label: 'Eng. Rate', value: engRate },
        ],
        posts: posts.map((p: any) => ({
          type: p.type === 'video' ? 'Reel' : p.type === 'sidecar' ? 'Carousel' : 'Photo',
          likes: p.likesCount || 0,
          comments: p.commentsCount || 0,
          eng: followers > 0 ? (((p.likesCount || 0) + (p.commentsCount || 0)) / followers * 100).toFixed(2) : '—',
        })),
      };
    } else {
      const posts = items.filter((i: any) => i.diggCount != null || i.playCount != null).slice(0, 10);
      const authorMeta = items[0]?.authorMeta || {};
      const followers = authorMeta.fans || authorMeta.followers || 0;
      const avgViews = posts.length ? Math.round(posts.reduce((s: number, p: any) => s + (p.playCount || 0), 0) / posts.length) : 0;
      const avgLikes = posts.length ? Math.round(posts.reduce((s: number, p: any) => s + (p.diggCount || 0), 0) / posts.length) : 0;
      const avgComments = posts.length ? Math.round(posts.reduce((s: number, p: any) => s + (p.commentCount || 0), 0) / posts.length) : 0;
      const avgShares = posts.length ? Math.round(posts.reduce((s: number, p: any) => s + (p.shareCount || 0), 0) / posts.length) : 0;
      const engRate = followers > 0 && posts.length ? ((avgLikes + avgComments) / followers * 100).toFixed(2) + '%' : '—';

      return {
        metrics: [
          { label: 'Followers', value: fmt(followers) },
          { label: 'Avg Views', value: fmt(avgViews) },
          { label: 'Avg Likes', value: fmt(avgLikes) },
          { label: 'Avg Comments', value: fmt(avgComments) },
          { label: 'Avg Shares', value: fmt(avgShares) },
          { label: 'Eng. Rate', value: engRate },
        ],
        posts: posts.map((p: any) => ({
          views: p.playCount || 0,
          likes: p.diggCount || 0,
          comments: p.commentCount || 0,
          shares: p.shareCount || 0,
        })),
      };
    }
  }

  const analytics = activeProfile?.status === 'done' ? renderMetrics(activeProfile) : null;
  const maxLikes = analytics ? Math.max(...analytics.posts.map((p: any) => p.likes || p.views || 0), 1) : 1;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Social Analytics</h1>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${platform === 'instagram' ? styles.tabActive : ''}`}
            onClick={() => { setPlatform('instagram'); setActiveProfile(null); }}
          >
            <span className={styles.igDot} /> Instagram
          </button>
          <button
            className={`${styles.tab} ${platform === 'tiktok' ? styles.tabActive : ''}`}
            onClick={() => { setPlatform('tiktok'); setActiveProfile(null); }}
          >
            <span className={styles.ttDot} /> TikTok
          </button>
        </div>
      </div>

      {/* Add profile */}
      <div className={styles.addRow}>
        <input
          className={styles.input}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addProfile()}
          placeholder={`Username π.χ. ${platform === 'instagram' ? 'ritaki_l' : 'username'}`}
        />
        <button className={styles.btnPrimary} onClick={addProfile}>+ Προσθήκη</button>
      </div>
      {inputError && <div className={styles.errBox}>{inputError}</div>}

      {/* Profiles list */}
      <div className={styles.sectionLabel}>
        Profiles ({currentProfiles.length}/20)
      </div>

      <div className={styles.profilesList}>
        {currentProfiles.length === 0 && (
          <div className={styles.empty}>Δεν έχεις προσθέσει profiles ακόμα.</div>
        )}
        {currentProfiles.map(p => (
          <div key={p.username} className={styles.profileItem}>
            <div className={styles.avatar} style={{ background: p.color + '22', color: p.color }}>
              {initials(p.username)}
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>@{p.username}</div>
              <div className={styles.profileUrl}>
                {platform === 'instagram' ? 'instagram.com/' : 'tiktok.com/@'}{p.username}
              </div>
              {p.status === 'error' && p.error && (
                <div className={styles.profileErr}>{p.error}</div>
              )}
            </div>
            <span className={`${styles.badge} ${styles['badge_' + p.status]}`}>
              {p.status === 'running' && <span className={styles.spinner} />}
              {p.status === 'idle' && 'Αναμονή'}
              {p.status === 'running' && 'Φορτώνει...'}
              {p.status === 'done' && 'Έτοιμο'}
              {p.status === 'error' && 'Σφάλμα'}
            </span>
            {p.status === 'done' && (
              <button className={styles.btnSm} onClick={() => setActiveProfile(p)}>Προβολή</button>
            )}
            <button
              className={`${styles.btnSm} ${styles.btnAnalyze}`}
              onClick={() => analyzeProfile(p.username)}
              disabled={p.status === 'running'}
            >
              {p.status === 'running' ? '...' : 'Ανάλυση'}
            </button>
            <button className={styles.btnSm} onClick={() => removeProfile(p.username)} style={{ color: '#888' }}>✕</button>
          </div>
        ))}
      </div>

      {/* Analytics panel */}
      {analytics && activeProfile && (
        <div className={styles.analyticsPanel}>
          <div className={styles.sectionLabel}>
            Analytics — @{activeProfile.username}
          </div>
          <div className={styles.metricsGrid}>
            {analytics.metrics.map((m: any) => (
              <div key={m.label} className={styles.metricCard}>
                <div className={styles.metricLabel}>{m.label}</div>
                <div className={styles.metricValue}>{m.value}</div>
              </div>
            ))}
          </div>
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>Τελευταίες δημοσιεύσεις</div>
            <div className={styles.chartSub}>{analytics.posts.length} πιο πρόσφατα posts</div>
            <table className={styles.table}>
              <thead>
                <tr>
                  {platform === 'instagram' ? (
                    <><th>Τύπος</th><th>Likes</th><th>Comments</th><th>Engagement</th></>
                  ) : (
                    <><th>Views</th><th>Likes</th><th>Comments</th><th>Shares</th></>
                  )}
                </tr>
              </thead>
              <tbody>
                {analytics.posts.map((p: any, i: number) => {
                  const mainVal = p.likes || p.views || 0;
                  const barW = Math.round(mainVal / maxLikes * 100);
                  return (
                    <tr key={i}>
                      {platform === 'instagram' ? (
                        <>
                          <td>
                            <span className={`${styles.postType} ${styles['type_' + (p.type || 'Photo').toLowerCase().replace(' ', '_')]}`}>
                              {p.type}
                            </span>
                          </td>
                          <td>{fmt(p.likes)}</td>
                          <td>{fmt(p.comments)}</td>
                          <td>
                            <div className={styles.barWrap}>
                              <div className={styles.barBg}>
                                <div className={styles.barFill} style={{ width: barW + '%', background: '#E1306C' }} />
                              </div>
                              <span className={styles.barLabel}>{p.eng}%</span>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <div className={styles.barWrap}>
                              <div className={styles.barBg}>
                                <div className={styles.barFill} style={{ width: barW + '%', background: '#555' }} />
                              </div>
                              <span className={styles.barLabel}>{fmt(p.views)}</span>
                            </div>
                          </td>
                          <td>{fmt(p.likes)}</td>
                          <td>{fmt(p.comments)}</td>
                          <td>{fmt(p.shares)}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!activeProfile && currentProfiles.length > 0 && (
        <div className={styles.empty} style={{ marginTop: '1.5rem' }}>
          Πάτα &quot;Ανάλυση&quot; σε ένα profile για να δεις τα δεδομένα.
        </div>
      )}

      {currentProfiles.length === 0 && (
        <div className={styles.empty} style={{ marginTop: '1.5rem' }}>
          Πρόσθεσε profiles και πάτα Ανάλυση.
        </div>
      )}
    </div>
  );
}
