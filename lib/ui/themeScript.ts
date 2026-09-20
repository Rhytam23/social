/** Storage key shared by the theme hook and the pre-paint script below. */
export const THEME_STORAGE_KEY = 'private_chat_theme';

/**
 * Inline script run before first paint so the saved theme never flashes. Server-safe (no React).
 * It also marks the page when a sign-in cookie is present (data-session), so the public landing page
 * is not flashed at someone who is about to see the app. It is only a hint: the server still decides access.
 */
export const THEME_INIT_SCRIPT = `try{if(/(?:^|;\\s*)sb-[a-z0-9-]+-auth-token(?:\\.\\d+)?=/.test(document.cookie))document.documentElement.setAttribute('data-session','1')}catch(e){}try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark')t='system';document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','system')}`;
