import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { URL } from 'node:url';
import { GoogleAuth } from 'google-auth-library';

import { getPool, hashPassword, initializeDatabase, loadEnvFile, sanitizeUser } from './db.mjs';
import { createQuestionFromTemplate, generateQuestions, getLevels, isTemplateQuestionUsable, normalizeQuestionChoices } from './questions.mjs';

const APP_TIMEZONE = process.env.APP_TIMEZONE ?? 'Asia/Karachi';
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? '').toLowerCase();

function getServerConfig() {
  return {
    host: process.env.SERVER_HOST ?? process.env.HOST ?? '0.0.0.0',
    port: Number(process.env.PORT ?? 3001),
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  });
  response.end(JSON.stringify(payload));
}

async function sendStaticFile(response, filePath) {
  try {
    const file = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType =
      extension === '.png' ? 'image/png'
      : extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg'
      : extension === '.webp' ? 'image/webp'
      : extension === '.gif' ? 'image/gif'
      : 'application/octet-stream';

    response.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    });
    response.end(file);
  } catch {
    sendJson(response, 404, { error: 'File not found.' });
  }
}

function getPublicFilePathFromUrl(fileUrl) {
  if (!fileUrl?.startsWith('/uploads/')) {
    return null;
  }

  const relativePath = fileUrl.replace(/^\/+/, '');
  const publicRoot = path.resolve(process.cwd(), 'public');
  const filePath = path.resolve(publicRoot, relativePath);
  if (!filePath.startsWith(publicRoot)) {
    return null;
  }
  return filePath;
}

async function imagePathExists(imagePath) {
  const filePath = getPublicFilePathFromUrl(imagePath);
  if (!filePath) {
    return false;
  }

  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(raw);
}

async function getUserById(userId) {
  const pool = await getPool();
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
  return rows[0] ?? null;
}

async function normalizeUserStreak(userId) {
  const pool = await getPool();
  const user = await getUserById(userId);
  if (!user) {
    return user;
  }

  if (!user.last_lesson_on) {
    if (user.streak_days !== 0) {
      await pool.query(`UPDATE users SET streak_days = 0 WHERE id = ?`, [userId]);
      return getUserById(userId);
    }
    return user;
  }

  const lastLessonOn = new Date(user.last_lesson_on).toISOString().slice(0, 10);
  const today = getAppDateParts();
  const yesterday = addDays(today, -1);

  if (lastLessonOn !== today && lastLessonOn !== yesterday && user.streak_days !== 0) {
    await pool.query(`UPDATE users SET streak_days = 0 WHERE id = ?`, [userId]);
    return getUserById(userId);
  }

  return user;
}

async function syncAdminRole(user) {
  if (!user) {
    return user;
  }

  const pool = await getPool();
  const [rows] = await pool.query(`SELECT COUNT(*) AS adminCount FROM users WHERE role = 'admin'`);
  const adminCount = Number(rows[0]?.adminCount ?? 0);
  const shouldPromote =
    (ADMIN_EMAIL && user.email?.trim().toLowerCase() === ADMIN_EMAIL) ||
    (!ADMIN_EMAIL && adminCount === 0);

  if (!shouldPromote || user.role === 'admin') {
    return user;
  }

  await pool.query(`UPDATE users SET role = 'admin' WHERE id = ?`, [user.id]);
  return getUserById(user.id);
}

async function requireAdmin(adminUserId) {
  const adminUser = await getUserById(adminUserId);
  if (!adminUser || adminUser.role !== 'admin') {
    throw new Error('Admin access is required.');
  }
  return adminUser;
}

async function getLeaderboard() {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT id, display_name AS displayName, total_xp AS totalXp, streak_days AS streakDays, avatar_color AS avatarColor
     FROM users
     ORDER BY total_xp DESC, streak_days DESC, display_name ASC
     LIMIT 10`,
  );

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

async function listUsers() {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT id, display_name AS displayName, email, role, age_group AS ageGroup, total_xp AS totalXp, streak_days AS streakDays, hearts, daily_goal AS dailyGoal, avatar_color AS avatarColor
     FROM users
     ORDER BY created_at ASC`,
  );
  return rows;
}

async function listAssets() {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT id, title, object_name AS objectName, image_path AS imagePath, source_type AS sourceType,
            manual_tags AS manualTags, vision_labels AS visionLabels
     FROM media_assets
     ORDER BY created_at DESC`,
  );

  const mapped = rows.map((row) => ({
    ...row,
    manualTags: typeof row.manualTags === 'string' ? JSON.parse(row.manualTags) : row.manualTags ?? [],
    visionLabels: typeof row.visionLabels === 'string' ? JSON.parse(row.visionLabels) : row.visionLabels ?? [],
  }));

  const existingFlags = await Promise.all(mapped.map((asset) => imagePathExists(asset.imagePath)));
  return mapped.filter((_, index) => existingFlags[index]);
}

async function listQuestionTemplates({ reviewStatus } = {}) {
  const pool = await getPool();
  const conditions = [];
  const values = [];
  if (reviewStatus) {
    conditions.push('qt.review_status = ?');
    values.push(reviewStatus);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT qt.id, qt.asset_id AS assetId, qt.level_id AS levelId, qt.title, qt.difficulty, qt.source_type AS sourceType,
            qt.review_status AS reviewStatus, qt.prompt, qt.narration, qt.choices, qt.answer, qt.visual_type AS visualType,
            qt.template_payload AS templatePayload, qt.tags, ma.title AS assetTitle, ma.object_name AS assetObjectName, ma.image_path AS assetImagePath
     FROM question_templates qt
     LEFT JOIN media_assets ma ON ma.id = qt.asset_id
     ${whereClause}
     ORDER BY qt.updated_at DESC, qt.created_at DESC`,
    values,
  );

  const mapped = rows.map((row) => ({
    ...row,
    choices: typeof row.choices === 'string' ? JSON.parse(row.choices) : row.choices ?? [],
    templatePayload: typeof row.templatePayload === 'string' ? JSON.parse(row.templatePayload) : row.templatePayload ?? {},
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags ?? [],
  }));

  const existingFlags = await Promise.all(mapped.map((template) => imagePathExists(template.assetImagePath)));
  return mapped.map((template, index) => ({
    ...template,
    assetImagePath: existingFlags[index] ? template.assetImagePath : undefined,
  }));
}

async function createQuestionTemplate(input) {
  const pool = await getPool();
  const normalizedQuestion = normalizeQuestionChoices(input.choices, input.answer);
  const [result] = await pool.query(
    `INSERT INTO question_templates
     (asset_id, level_id, title, difficulty, source_type, review_status, prompt, narration, choices, answer, visual_type, template_payload, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.assetId ?? null,
      input.levelId,
      input.title,
      input.difficulty ?? 'easy',
      input.sourceType ?? 'manual',
      input.reviewStatus ?? 'approved',
      input.prompt,
      input.narration,
      JSON.stringify(normalizedQuestion.choices),
      String(normalizedQuestion.answer),
      input.visualType ?? 'choiceOnly',
      JSON.stringify(input.templatePayload ?? {}),
      JSON.stringify(input.tags ?? []),
    ],
  );

  const templates = await listQuestionTemplates();
  return templates.find((template) => template.id === result.insertId);
}

async function updateQuestionTemplate(id, input) {
  const pool = await getPool();
  const normalizedQuestion = normalizeQuestionChoices(input.choices, input.answer);
  await pool.query(
    `UPDATE question_templates
     SET asset_id = ?, level_id = ?, title = ?, difficulty = ?, prompt = ?, narration = ?, choices = ?, answer = ?, visual_type = ?, template_payload = ?, tags = ?, review_status = ?
     WHERE id = ?`,
    [
      input.assetId ?? null,
      input.levelId,
      input.title,
      input.difficulty ?? 'easy',
      input.prompt,
      input.narration,
      JSON.stringify(normalizedQuestion.choices),
      String(normalizedQuestion.answer),
      input.visualType ?? 'choiceOnly',
      JSON.stringify(input.templatePayload ?? {}),
      JSON.stringify(input.tags ?? []),
      input.reviewStatus ?? 'approved',
      id,
    ],
  );

  const templates = await listQuestionTemplates();
  return templates.find((template) => template.id === Number(id));
}

async function deleteQuestionTemplate(id) {
  const pool = await getPool();
  await pool.query(`DELETE FROM question_templates WHERE id = ?`, [id]);
}

async function updateQuestionReviewStatus(id, reviewStatus) {
  const pool = await getPool();
  await pool.query(`UPDATE question_templates SET review_status = ? WHERE id = ?`, [reviewStatus, id]);
  const templates = await listQuestionTemplates();
  return templates.find((template) => template.id === Number(id));
}

async function saveImageToPublic({ imageData, fileName }) {
  const matches = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid image upload format.');
  }

  const mimeType = matches[1];
  const base64Payload = matches[2];
  const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png';
  const safeName = (fileName ?? `asset-${Date.now()}`).replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  const finalName = `${safeName}-${Date.now()}.${extension}`;
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads', 'assets');

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, finalName), Buffer.from(base64Payload, 'base64'));

  return `/uploads/assets/${finalName}`;
}

async function deleteImageFromPublic(imagePath) {
  const filePath = getPublicFilePathFromUrl(imagePath);
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function detectVisionLabels(imageData) {
  const googleVisionServiceAccountJson = process.env.GOOGLE_VISION_SERVICE_ACCOUNT_JSON ?? '';
  const googleVisionApiKey = process.env.GOOGLE_VISION_API_KEY ?? '';
  const base64Payload = imageData.includes(',') ? imageData.split(',')[1] : imageData;
  const requestBody = JSON.stringify({
    requests: [
      {
        image: { content: base64Payload },
        features: [{ type: 'LABEL_DETECTION', maxResults: 8 }],
      },
    ],
  });

  if (googleVisionServiceAccountJson) {
    const credentials = JSON.parse(googleVisionServiceAccountJson);
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

    if (!accessToken) {
      throw new Error('Unable to obtain Google access token from service account.');
    }

    const response = await fetch('https://vision.googleapis.com/v1/images:annotate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: requestBody,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message ?? 'Google Vision request failed.');
    }

    return (payload.responses?.[0]?.labelAnnotations ?? []).map((item) => item.description).filter(Boolean);
  }

  if (!googleVisionApiKey) {
    throw new Error('Google Vision is not configured. Add GOOGLE_VISION_SERVICE_ACCOUNT_JSON or GOOGLE_VISION_API_KEY.');
  }

  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: requestBody,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Google Vision request failed.');
  }

  return (payload.responses?.[0]?.labelAnnotations ?? []).map((item) => item.description).filter(Boolean);
}

async function generateGeminiQuestions({ level, assets, count }) {
  const geminiApiKey = process.env.GEMINI_API_KEY ?? '';
  if (!geminiApiKey) {
    return null;
  }

  const safeAssets = assets.slice(0, 6).map((asset) => ({
    title: asset.title,
    objectName: asset.objectName,
    imagePath: asset.imagePath,
    manualTags: asset.manualTags,
    visionLabels: asset.visionLabels,
  }));

  const prompt = `
You are generating maths questions for autistic learners.
Requirements:
- Calm, predictable, low-distraction wording
- One instruction at a time
- Difficulty aligned to the level
- JSON only, no markdown
- Return exactly ${count} questions
- Use the provided assets when possible

Level:
${JSON.stringify(level)}

Assets:
${JSON.stringify(safeAssets)}

Return this JSON shape:
{
  "questions": [
    {
      "id": "string",
      "prompt": "string",
      "narration": "string",
      "choices": ["string or number"],
      "answer": "string or number",
      "visualType": "assetCount | assetMatch | assetCompare | sequence | oddOneOut | count",
      "visualItems": ["image path or emoji"],
      "visualGroups": [["image path or emoji"]],
      "sequence": [1,2,3],
      "assetTitle": "string",
      "assetObjectName": "string",
      "assetKind": "image"
    }
  ]
}
`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': geminiApiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Gemini question generation failed.');
  }

  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
  const parsed = JSON.parse(text);
  return parsed.questions ?? null;
}

async function generateGeminiTemplateSuggestions({ level, assets, count, difficulty = 'easy' }) {
  const geminiApiKey = process.env.GEMINI_API_KEY ?? '';
  if (!geminiApiKey) {
    return [];
  }

  const prompt = `
You are helping build educational questions for autistic learners.
Goals:
- calm language
- predictable structure
- one task at a time
- support emotions, routines, social understanding, or basic maths
- difficulty level: ${difficulty}

Level:
${JSON.stringify(level)}

Assets:
${JSON.stringify(assets.slice(0, 8))}

Return JSON only:
{
  "templates": [
    {
      "title": "short title",
      "prompt": "string",
      "narration": "string",
      "choices": ["choice 1", "choice 2", "choice 3"],
      "answer": "choice 1",
      "visualType": "choiceOnly | assetCount | assetMatch | assetCompare",
      "tags": ["emotion", "routine"],
      "assetObjectName": "apple or empty"
    }
  ]
}
`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Gemini suggestion generation failed.');
  }

  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
  const parsed = JSON.parse(text);
  return parsed.templates ?? [];
}

function getAppDateParts() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
  const base = new Date(`${dateString}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

const server = http.createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname;

  try {
    if (request.method === 'GET' && pathname.startsWith('/uploads/')) {
      const filePath = getPublicFilePathFromUrl(pathname);
      if (!filePath) {
        sendJson(response, 403, { error: 'Invalid file path.' });
        return;
      }
      await sendStaticFile(response, filePath);
      return;
    }

    if (request.method === 'GET' && pathname === '/api/health') {
      sendJson(response, 200, { ok: true, database: process.env.MYSQL_DATABASE ?? 'numberly' });
      return;
    }

    if (request.method === 'GET' && pathname === '/api/game/levels') {
      sendJson(response, 200, { levels: getLevels() });
      return;
    }

    if (request.method === 'GET' && pathname === '/api/game/questions') {
      const levelId = url.searchParams.get('levelId') ?? 'counting-1';
      const count = Number(url.searchParams.get('count') ?? 5);
      const assets = await listAssets();
      const level = getLevels().find((entry) => entry.id === levelId) ?? getLevels()[0];
      const approvedTemplates = (await listQuestionTemplates({ reviewStatus: 'approved' }))
        .filter((template) => template.levelId === levelId)
        .filter((template) => isTemplateQuestionUsable(template, level));

      const templateQuestions = approvedTemplates.slice(0, count).map(createQuestionFromTemplate);
      const fallbackQuestions = generateQuestions(levelId, Math.max(count - templateQuestions.length, 0), assets);
      sendJson(response, 200, { questions: [...templateQuestions, ...fallbackQuestions].slice(0, count) });
      return;
    }

    if (request.method === 'GET' && pathname === '/api/admin/assets') {
      const adminUserId = url.searchParams.get('adminUserId');
      await requireAdmin(adminUserId);
      sendJson(response, 200, { assets: await listAssets() });
      return;
    }

    if (request.method === 'GET' && pathname === '/api/admin/question-templates') {
      const adminUserId = url.searchParams.get('adminUserId');
      await requireAdmin(adminUserId);
      const reviewStatus = url.searchParams.get('reviewStatus') ?? undefined;
      sendJson(response, 200, { templates: await listQuestionTemplates({ reviewStatus }) });
      return;
    }

    if (request.method === 'POST' && pathname === '/api/admin/question-templates/generate') {
      const body = await readBody(request);
      await requireAdmin(body.adminUserId);
      const level = getLevels().find((entry) => entry.id === body.levelId) ?? getLevels()[0];
      const assets = await listAssets();
      const suggestions = await generateGeminiTemplateSuggestions({
        level,
        assets,
        count: Number(body.count ?? 4),
        difficulty: body.difficulty ?? level.difficultyBand ?? 'easy',
      });

      const created = [];
      for (const suggestion of suggestions) {
        const asset = assets.find((entry) => entry.objectName === suggestion.assetObjectName);
        const template = await createQuestionTemplate({
          assetId: asset?.id ?? null,
          levelId: level.id,
          title: suggestion.title ?? `${level.title} suggestion`,
          difficulty: body.difficulty ?? level.difficultyBand ?? 'easy',
          sourceType: 'ai',
          reviewStatus: 'pending',
          prompt: suggestion.prompt,
          narration: suggestion.narration ?? suggestion.prompt,
          choices: suggestion.choices ?? [],
          answer: suggestion.answer,
          visualType: suggestion.visualType ?? 'choiceOnly',
          templatePayload: asset ? { assetKind: 'image' } : {},
          tags: suggestion.tags ?? [],
        });
        if (template) {
          created.push(template);
        }
      }

      sendJson(response, 201, { templates: created });
      return;
    }

    if (request.method === 'POST' && pathname === '/api/admin/question-templates') {
      const body = await readBody(request);
      await requireAdmin(body.adminUserId);
      if (!body.levelId || !body.title || !body.prompt || !body.answer || !Array.isArray(body.choices) || body.choices.length < 2) {
        sendJson(response, 400, { error: 'levelId, title, prompt, answer, and at least two choices are required.' });
        return;
      }

      const template = await createQuestionTemplate({
        assetId: body.assetId ?? null,
        levelId: body.levelId,
        title: body.title,
        difficulty: body.difficulty ?? 'easy',
        sourceType: 'manual',
        reviewStatus: 'approved',
        prompt: body.prompt,
        narration: body.narration ?? body.prompt,
        choices: body.choices,
        answer: body.answer,
        visualType: body.visualType ?? 'choiceOnly',
        templatePayload: body.templatePayload ?? {},
        tags: body.tags ?? [],
      });

      sendJson(response, 201, { template });
      return;
    }

    if (request.method === 'PUT' && pathname.startsWith('/api/admin/question-templates/') && !pathname.endsWith('/review')) {
      const id = pathname.split('/').pop();
      const body = await readBody(request);
      await requireAdmin(body.adminUserId);
      if (!body.levelId || !body.title || !body.prompt || !body.answer || !Array.isArray(body.choices) || body.choices.length < 2) {
        sendJson(response, 400, { error: 'levelId, title, prompt, answer, and at least two choices are required.' });
        return;
      }

      const template = await updateQuestionTemplate(id, {
        assetId: body.assetId ?? null,
        levelId: body.levelId,
        title: body.title,
        difficulty: body.difficulty ?? 'easy',
        prompt: body.prompt,
        narration: body.narration ?? body.prompt,
        choices: body.choices,
        answer: body.answer,
        visualType: body.visualType ?? 'choiceOnly',
        templatePayload: body.templatePayload ?? {},
        tags: body.tags ?? [],
        reviewStatus: body.reviewStatus ?? 'approved',
      });

      sendJson(response, 200, { template });
      return;
    }

    if (request.method === 'DELETE' && pathname.startsWith('/api/admin/question-templates/')) {
      const id = pathname.split('/').pop();
      const body = await readBody(request);
      await requireAdmin(body.adminUserId);
      await deleteQuestionTemplate(id);
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === 'PUT' && pathname.startsWith('/api/admin/question-templates/') && pathname.endsWith('/review')) {
      const id = pathname.split('/')[4];
      const body = await readBody(request);
      await requireAdmin(body.adminUserId);
      if (!['approved', 'rejected', 'pending'].includes(body.reviewStatus)) {
        sendJson(response, 400, { error: 'reviewStatus must be approved, rejected, or pending.' });
        return;
      }
      const template = await updateQuestionReviewStatus(id, body.reviewStatus);
      sendJson(response, 200, { template });
      return;
    }

    if (request.method === 'POST' && pathname === '/api/admin/assets/vision-labels') {
      const body = await readBody(request);
      await requireAdmin(body.adminUserId);
      if (!body.imageData) {
        sendJson(response, 400, { error: 'imageData is required.' });
        return;
      }

      const labels = await detectVisionLabels(body.imageData);
      sendJson(response, 200, { labels });
      return;
    }

    if (request.method === 'POST' && pathname === '/api/admin/assets') {
      const body = await readBody(request);
      await requireAdmin(body.adminUserId);
      const { title, objectName, imageData, fileName, manualTags = [] } = body;

      if (!title || !objectName || !imageData) {
        sendJson(response, 400, { error: 'title, objectName, and an uploaded image are required.' });
        return;
      }

      const pool = await getPool();
      const imagePath = await saveImageToPublic({ imageData, fileName });
      let visionLabels = [];
      try {
        visionLabels = await detectVisionLabels(imageData);
      } catch {
        visionLabels = [];
      }

      const [result] = await pool.query(
        `INSERT INTO media_assets (title, object_name, image_path, source_type, manual_tags, vision_labels)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          title.trim(),
          objectName.trim().toLowerCase(),
          imagePath,
          'upload',
          JSON.stringify(manualTags),
          JSON.stringify(visionLabels),
        ],
      );

      const [rows] = await pool.query(
        `SELECT id, title, object_name AS objectName, image_path AS imagePath, source_type AS sourceType,
                manual_tags AS manualTags, vision_labels AS visionLabels
         FROM media_assets
         WHERE id = ?`,
        [result.insertId],
      );

      const asset = rows[0];
      sendJson(response, 201, {
        asset: {
          ...asset,
          manualTags: typeof asset.manualTags === 'string' ? JSON.parse(asset.manualTags) : asset.manualTags ?? [],
          visionLabels: typeof asset.visionLabels === 'string' ? JSON.parse(asset.visionLabels) : asset.visionLabels ?? [],
        },
      });
      return;
    }

    if (request.method === 'DELETE' && pathname.startsWith('/api/admin/assets/')) {
      const assetId = pathname.split('/').pop();
      const body = await readBody(request);
      await requireAdmin(body.adminUserId);
      const pool = await getPool();
      const [rows] = await pool.query(`SELECT image_path AS imagePath FROM media_assets WHERE id = ?`, [assetId]);
      const asset = rows[0];

      if (!asset) {
        sendJson(response, 404, { error: 'Asset not found.' });
        return;
      }

      await pool.query(`DELETE FROM media_assets WHERE id = ?`, [assetId]);
      await deleteImageFromPublic(asset.imagePath);
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === 'GET' && pathname === '/api/admin/users') {
      const adminUserId = url.searchParams.get('adminUserId');
      await requireAdmin(adminUserId);
      sendJson(response, 200, { users: await listUsers() });
      return;
    }

    if (request.method === 'PUT' && pathname.startsWith('/api/admin/users/')) {
      const userId = pathname.split('/').pop();
      const body = await readBody(request);
      await requireAdmin(body.adminUserId);
      const pool = await getPool();
      await pool.query(
        `UPDATE users
         SET hearts = ?, role = ?, daily_goal = ?
         WHERE id = ?`,
        [Number(body.hearts ?? 5), body.role ?? 'user', Number(body.dailyGoal ?? 5), userId],
      );
      sendJson(response, 200, { user: await sanitizeUser(await getUserById(userId)) });
      return;
    }

    if (request.method === 'POST' && pathname.startsWith('/api/admin/users/') && pathname.endsWith('/reset-password')) {
      const userId = pathname.split('/')[4];
      const body = await readBody(request);
      await requireAdmin(body.adminUserId);
      const pool = await getPool();
      await pool.query(`UPDATE users SET password_hash = ? WHERE id = ?`, [hashPassword(body.newPassword), userId]);
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === 'DELETE' && pathname.startsWith('/api/admin/users/')) {
      const userId = pathname.split('/').pop();
      const body = await readBody(request);
      await requireAdmin(body.adminUserId);
      const pool = await getPool();
      await pool.query(`DELETE FROM users WHERE id = ?`, [userId]);
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === 'POST' && pathname === '/api/auth/register') {
      const body = await readBody(request);
      const { displayName, email, password, ageGroup = '5-7' } = body;

      if (!displayName || !email || !password) {
        sendJson(response, 400, { error: 'Display name, email, and password are required.' });
        return;
      }

      const pool = await getPool();
      const passwordHash = hashPassword(password);
      const avatarPalette = ['#0ea5e9', '#14b8a6', '#f97316', '#8b5cf6'];
      const avatarColor = avatarPalette[Math.floor(Math.random() * avatarPalette.length)];
      const [adminRows] = await pool.query(`SELECT COUNT(*) AS adminCount FROM users WHERE role = 'admin'`);
      const adminCount = Number(adminRows[0]?.adminCount ?? 0);
      const role =
        (ADMIN_EMAIL && email.trim().toLowerCase() === ADMIN_EMAIL) ||
        (!ADMIN_EMAIL && adminCount === 0)
          ? 'admin'
          : 'user';

      const [result] = await pool.query(
        `INSERT INTO users (display_name, email, password_hash, role, age_group, avatar_color)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [displayName.trim(), email.trim().toLowerCase(), passwordHash, role, ageGroup, avatarColor],
      );

      await pool.query(
        `INSERT INTO user_settings (user_id) VALUES (?)`,
        [result.insertId],
      );

      const user = await getUserById(result.insertId);
      sendJson(response, 201, { user: await sanitizeUser(user) });
      return;
    }

    if (request.method === 'POST' && pathname === '/api/auth/login') {
      const body = await readBody(request);
      const { email, password } = body;

      if (!email || !password) {
        sendJson(response, 400, { error: 'Email and password are required.' });
        return;
      }

      const pool = await getPool();
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
      let user = rows[0];

      if (!user || user.password_hash !== hashPassword(password)) {
        sendJson(response, 401, { error: 'Invalid email or password.' });
        return;
      }

      user = await syncAdminRole(user);
      user = await normalizeUserStreak(user.id);

      sendJson(response, 200, { user: await sanitizeUser(user) });
      return;
    }

    if (request.method === 'GET' && pathname.startsWith('/api/profile/')) {
      const userId = pathname.split('/').pop();
      const user = await normalizeUserStreak(userId);
      if (!user) {
        sendJson(response, 404, { error: 'User not found.' });
        return;
      }

      sendJson(response, 200, { user: await sanitizeUser(user) });
      return;
    }

    if (request.method === 'PUT' && pathname.startsWith('/api/profile/')) {
      const userId = pathname.split('/').pop();
      const body = await readBody(request);
      const pool = await getPool();

      await pool.query(
        `UPDATE users
         SET display_name = ?, age_group = ?, daily_goal = ?, avatar_color = ?
         WHERE id = ?`,
        [
          body.displayName?.trim() ?? 'Math Explorer',
          body.ageGroup ?? '5-7',
          Number(body.dailyGoal ?? 5),
          body.avatarColor ?? '#0ea5e9',
          userId,
        ],
      );

      const user = await getUserById(userId);
      sendJson(response, 200, { user: await sanitizeUser(user) });
      return;
    }

    if (request.method === 'PUT' && pathname.startsWith('/api/settings/')) {
      const userId = pathname.split('/').pop();
      const body = await readBody(request);
      const pool = await getPool();

      await pool.query(
        `INSERT INTO user_settings (user_id, sound_enabled, high_contrast, routine_mode, preferred_voice)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         sound_enabled = VALUES(sound_enabled),
         high_contrast = VALUES(high_contrast),
         routine_mode = VALUES(routine_mode),
         preferred_voice = VALUES(preferred_voice)`,
        [
          userId,
          Boolean(body.soundEnabled),
          Boolean(body.highContrast),
          Boolean(body.routineMode),
          body.preferredVoice ?? 'gentle',
        ],
      );

      const user = await getUserById(userId);
      sendJson(response, 200, { user: await sanitizeUser(user) });
      return;
    }

    if (request.method === 'POST' && pathname === '/api/game/complete') {
      const body = await readBody(request);
      const { userId, levelId, correctAnswers, totalQuestions, heartsLeft } = body;

      if (!userId || !levelId) {
        sendJson(response, 400, { error: 'userId and levelId are required.' });
        return;
      }

      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const xpEarned = Math.max(10, correctAnswers * 12 + heartsLeft * 2);
      const starsEarned = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;
      const today = getAppDateParts();

      const pool = await getPool();
      const userBeforeUpdate = await getUserById(userId);
      const lastLessonOn = userBeforeUpdate?.last_lesson_on
        ? new Date(userBeforeUpdate.last_lesson_on).toISOString().slice(0, 10)
        : null;
      const nextExpectedDay = lastLessonOn ? addDays(lastLessonOn, 1) : null;

      let nextStreak = userBeforeUpdate?.streak_days ?? 0;
      if (!lastLessonOn) {
        nextStreak = 1;
      } else if (lastLessonOn === today) {
        nextStreak = userBeforeUpdate?.streak_days ?? 1;
      } else if (nextExpectedDay === today) {
        nextStreak = (userBeforeUpdate?.streak_days ?? 0) + 1;
      } else {
        nextStreak = 1;
      }

      await pool.query(
        `INSERT INTO game_sessions (user_id, level_id, correct_answers, total_questions, xp_earned, hearts_left)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, levelId, correctAnswers, totalQuestions, xpEarned, heartsLeft],
      );

      await pool.query(
        `INSERT INTO level_progress (user_id, level_id, best_score, stars_earned, times_completed, last_accuracy)
         VALUES (?, ?, ?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE
         best_score = GREATEST(best_score, VALUES(best_score)),
         stars_earned = GREATEST(stars_earned, VALUES(stars_earned)),
         times_completed = times_completed + 1,
         last_accuracy = VALUES(last_accuracy)`,
        [userId, levelId, xpEarned, starsEarned, accuracy],
      );

      await pool.query(
        `UPDATE users
         SET total_xp = total_xp + ?, hearts = ?, streak_days = ?, last_lesson_on = ?
         WHERE id = ?`,
        [xpEarned, heartsLeft, nextStreak, today, userId],
      );

      const user = await getUserById(userId);
      sendJson(response, 200, {
        user: await sanitizeUser(user),
        session: {
          xpEarned,
          starsEarned,
          accuracy: Number(accuracy.toFixed(2)),
        },
      });
      return;
    }

    if (request.method === 'GET' && pathname === '/api/leaderboard') {
      sendJson(response, 200, { leaderboard: await getLeaderboard() });
      return;
    }

    sendJson(response, 404, { error: 'Route not found.' });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      sendJson(response, 409, { error: 'An account with that email already exists.' });
      return;
    }

    sendJson(response, 500, {
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

loadEnvFile()
  .then(() => initializeDatabase())
  .then(() => {
    const { host, port } = getServerConfig();
    server.listen(port, host, () => {
      const publicHost = host === '0.0.0.0' ? 'localhost' : host;
      console.log(`Numberly API running on http://${publicHost}:${port} (bound to ${host}:${port})`);
    });
  })
  .catch((error) => {
    console.error('Failed to start Numberly API:', error.message);
    process.exit(1);
  });
