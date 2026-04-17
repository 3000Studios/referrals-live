const b64 = {
  encode(value: string) {
    return window.btoa(unescape(encodeURIComponent(value)));
  },
  decode(value: string) {
    try {
      return decodeURIComponent(escape(window.atob(value)));
    } catch {
      return "";
    }
  },
};

export function obfuscateParams(input: Record<string, string>) {
  const out: Record<string, string> = {};
  Object.entries(input).forEach(([k, v]) => {
    out[k] = b64.encode(v);
  });
  return out;
}

export function revealParams(input: Record<string, string>) {
  const out: Record<string, string> = {};
  Object.entries(input).forEach(([k, v]) => {
    out[k] = b64.decode(v);
  });
  return out;
}

