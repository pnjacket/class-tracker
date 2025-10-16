export function setCookie(name: string, value: string): void {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/`;
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent(name) + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}
