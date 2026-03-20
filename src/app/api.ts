import type { LeaderboardEntry, Level, MediaAsset, Question, QuestionTemplate, UserProfile, UserSettings } from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const raw = await response.text();
  let payload: any = {};

  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = { error: raw || 'Request failed' };
  }

  if (!response.ok) {
    const message = payload.details ? `${payload.error}: ${payload.details}` : payload.error ?? 'Request failed';
    throw new Error(message);
  }

  return payload as T;
}

export async function registerUser(input: {
  displayName: string;
  email: string;
  password: string;
  ageGroup: string;
}) {
  return request<{ user: UserProfile }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function loginUser(input: { email: string; password: string }) {
  return request<{ user: UserProfile }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchProfile(userId: number) {
  return request<{ user: UserProfile }>(`/api/profile/${userId}`);
}

export async function updateProfile(
  userId: number,
  input: Pick<UserProfile, 'displayName' | 'ageGroup' | 'dailyGoal' | 'avatarColor'>,
) {
  return request<{ user: UserProfile }>(`/api/profile/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function updateSettings(userId: number, input: UserSettings) {
  return request<{ user: UserProfile }>(`/api/settings/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function fetchLevels() {
  return request<{ levels: Level[] }>('/api/game/levels');
}

export async function fetchQuestions(levelId: string, count = 5) {
  return request<{ questions: Question[] }>(`/api/game/questions?levelId=${encodeURIComponent(levelId)}&count=${count}`);
}

export async function submitLesson(input: {
  userId: number;
  levelId: string;
  correctAnswers: number;
  totalQuestions: number;
  heartsLeft: number;
}) {
  return request<{
    user: UserProfile;
    session: { xpEarned: number; starsEarned: number; accuracy: number };
  }>('/api/game/complete', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchLeaderboard() {
  return request<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
}

export async function fetchAssets() {
  return request<{ assets: MediaAsset[] }>('/api/admin/assets');
}

export async function createAsset(input: {
  title: string;
  objectName: string;
  imageData?: string;
  fileName?: string;
  manualTags: string[];
}) {
  return request<{ asset: MediaAsset }>('/api/admin/assets', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function suggestVisionLabels(input: { imageData: string }) {
  return request<{ labels: string[] }>('/api/admin/assets/vision-labels', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchQuestionTemplates(reviewStatus?: 'approved' | 'pending' | 'rejected') {
  const search = reviewStatus ? `?reviewStatus=${reviewStatus}` : '';
  return request<{ templates: QuestionTemplate[] }>(`/api/admin/question-templates${search}`);
}

export async function createQuestionTemplate(input: {
  assetId?: number | null;
  levelId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  narration?: string;
  choices: Array<string | number>;
  answer: string | number;
  visualType?: string;
  templatePayload?: Record<string, unknown>;
  tags: string[];
}) {
  return request<{ template: QuestionTemplate }>('/api/admin/question-templates', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function generateQuestionTemplates(input: {
  levelId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
}) {
  return request<{ templates: QuestionTemplate[] }>('/api/admin/question-templates/generate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function reviewQuestionTemplate(id: number, reviewStatus: 'approved' | 'pending' | 'rejected') {
  return request<{ template: QuestionTemplate }>(`/api/admin/question-templates/${id}/review`, {
    method: 'PUT',
    body: JSON.stringify({ reviewStatus }),
  });
}
