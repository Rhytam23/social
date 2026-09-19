/** Storage key shared by the theme hook and the pre-paint script below. */
export const THEME_STORAGE_KEY = 'private_chat_theme';

/** Inline script run before first paint so the saved theme never flashes. Server-safe (no React). */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='system')t='dark';document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}`;
