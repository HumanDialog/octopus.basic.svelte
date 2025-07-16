import { writable } from 'svelte/store';

export const cookies_saved_at = writable( localStorage.cookies_saved_at || '' )
cookies_saved_at.subscribe( (value) => { localStorage.cookies_saved_at = value; });

export const cookies_valid_until = writable( localStorage.cookies_valid_until || '' )
cookies_valid_until.subscribe( (value) => { localStorage.cookies_valid_until = value; });

export const cookies_allow_essential = writable( localStorage.cookies_allow_essential || 'true' )
cookies_allow_essential.subscribe( (value) => { localStorage.cookies_allow_essential = value; });

export const cookies_allow_preferences = writable( localStorage.cookies_allow_preferences || '' )
cookies_allow_preferences.subscribe( (value) => { localStorage.cookies_allow_preferences = value; });

export const cookies_allow_analytics = writable( localStorage.cookies_allow_analytics || '' )
cookies_allow_analytics.subscribe( (value) => { localStorage.cookies_allow_analytics = value; });

export const cookies_allow_marketing = writable( localStorage.cookies_allow_marketing || '' )
cookies_allow_marketing.subscribe( (value) => { localStorage.cookies_allow_marketing = value; });