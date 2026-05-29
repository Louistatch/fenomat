const STUDENT_TOKEN = "academy_token";
const STUDENT_INFO = "academy_student";

export interface Student {
  id: number;
  full_name: string;
  email: string;
  avatar_url?: string | null;
}

export function getStudentToken(): string | null {
  return localStorage.getItem(STUDENT_TOKEN);
}

export function setStudentToken(token: string) {
  localStorage.setItem(STUDENT_TOKEN, token);
}

export function getStudent(): Student | null {
  const raw = localStorage.getItem(STUDENT_INFO);
  return raw ? JSON.parse(raw) : null;
}

export function setStudent(s: Student) {
  localStorage.setItem(STUDENT_INFO, JSON.stringify(s));
}

export function clearStudentSession() {
  localStorage.removeItem(STUDENT_TOKEN);
  localStorage.removeItem(STUDENT_INFO);
}

export function isStudentLoggedIn(): boolean {
  return !!getStudentToken();
}

export async function studentFetch(url: string, options: RequestInit = {}) {
  const token = getStudentToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    clearStudentSession();
    window.location.href = "/academy/login";
    throw new Error("Session expirée");
  }
  return res;
}
