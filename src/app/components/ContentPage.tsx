import React, { useEffect, useMemo, useState } from 'react';
import { Check, ImagePlus, Sparkles, X } from 'lucide-react';

import {
  createAsset,
  createQuestionTemplate,
  deleteAsset,
  deleteQuestionTemplate,
  fetchAssets,
  fetchLevels,
  fetchQuestionTemplates,
  generateQuestionTemplates,
  reviewQuestionTemplate,
  suggestVisionLabels,
  updateQuestionTemplate,
} from '../api';
import type { Level, MediaAsset, QuestionTemplate, UserProfile } from '../types';

const difficultyOptions = ['easy', 'medium', 'hard'] as const;

export const ContentPage = ({ user }: { user: UserProfile }) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [approvedTemplates, setApprovedTemplates] = useState<QuestionTemplate[]>([]);
  const [pendingTemplates, setPendingTemplates] = useState<QuestionTemplate[]>([]);
  const [title, setTitle] = useState('');
  const [objectName, setObjectName] = useState('');
  const [manualTags, setManualTags] = useState('');
  const [imageData, setImageData] = useState('');
  const [fileName, setFileName] = useState('');
  const [visionLabels, setVisionLabels] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [visionMessage, setVisionMessage] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('emotion-match-1');
  const [selectedAssetId, setSelectedAssetId] = useState<number | ''>('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templatePrompt, setTemplatePrompt] = useState('');
  const [templateNarration, setTemplateNarration] = useState('');
  const [templateChoices, setTemplateChoices] = useState('');
  const [templateAnswer, setTemplateAnswer] = useState('');
  const [templateTags, setTemplateTags] = useState('');
  const [difficulty, setDifficulty] = useState<(typeof difficultyOptions)[number]>('easy');
  const [templateMessage, setTemplateMessage] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

  const refreshContent = async () => {
    const [assetResponse, levelResponse, approvedResponse, pendingResponse] = await Promise.all([
      fetchAssets(user.id),
      fetchLevels(),
      fetchQuestionTemplates(user.id, 'approved'),
      fetchQuestionTemplates(user.id, 'pending'),
    ]);
    setAssets(assetResponse.assets);
    setLevels(levelResponse.levels);
    setApprovedTemplates(approvedResponse.templates);
    setPendingTemplates(pendingResponse.templates);
  };

  useEffect(() => {
    refreshContent().catch(() => undefined);
  }, [user.id]);

  const selectedLevel = useMemo(() => levels.find((level) => level.id === selectedLevelId) ?? levels[0], [levels, selectedLevelId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setImageData(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  };

  const handleVisionSuggest = async () => {
    if (!imageData) {
      setVisionMessage('Upload an image first to get Google Vision suggestions.');
      return;
    }
    try {
      const response = await suggestVisionLabels({ adminUserId: user.id, imageData });
      setVisionLabels(response.labels);
      if (!objectName && response.labels[0]) setObjectName(response.labels[0].toLowerCase());
      setVisionMessage(response.labels.length ? 'Vision labels loaded.' : 'No labels returned.');
    } catch (error) {
      setVisionMessage(error instanceof Error ? error.message : 'Vision request failed.');
    }
  };

  const handleAssetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await createAsset({
        adminUserId: user.id,
        title,
        objectName,
        imageData,
        fileName,
        manualTags: manualTags.split(',').map((entry) => entry.trim()).filter(Boolean),
      });
      setAssets((current) => [response.asset, ...current]);
      setTitle('');
      setObjectName('');
      setManualTags('');
      setImageData('');
      setFileName('');
      setVisionLabels([]);
      setVisionMessage('');
      setMessage('Asset saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save asset.');
    }
  };

  const handleTemplateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        adminUserId: user.id,
        assetId: selectedAssetId === '' ? null : Number(selectedAssetId),
        levelId: selectedLevelId,
        title: templateTitle,
        difficulty,
        prompt: templatePrompt,
        narration: templateNarration || templatePrompt,
        choices: templateChoices.split(',').map((entry) => entry.trim()).filter(Boolean),
        answer: templateAnswer,
        visualType: selectedAssetId === '' ? 'choiceOnly' : 'assetMatch',
        templatePayload: selectedAssetId === '' ? {} : { assetKind: 'image' },
        tags: templateTags.split(',').map((entry) => entry.trim()).filter(Boolean),
      };
      const response = editingTemplateId
        ? await updateQuestionTemplate(editingTemplateId, { ...payload, reviewStatus: 'approved' })
        : await createQuestionTemplate(payload);

      setApprovedTemplates((current) =>
        editingTemplateId
          ? current.map((template) => (template.id === response.template.id ? response.template : template))
          : [response.template, ...current],
      );
      setTemplateTitle('');
      setTemplatePrompt('');
      setTemplateNarration('');
      setTemplateChoices('');
      setTemplateAnswer('');
      setTemplateTags('');
      setSelectedAssetId('');
      setEditingTemplateId(null);
      setTemplateMessage(editingTemplateId ? 'Template updated.' : 'Manual template saved and approved.');
    } catch (error) {
      setTemplateMessage(error instanceof Error ? error.message : 'Unable to save template.');
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!selectedLevel) return;
    try {
      const response = await generateQuestionTemplates({ adminUserId: user.id, levelId: selectedLevel.id, difficulty, count: 4 });
      setPendingTemplates((current) => [...response.templates, ...current]);
      setTemplateMessage('AI suggestions generated. Review them below before they go live.');
    } catch (error) {
      setTemplateMessage(error instanceof Error ? error.message : 'Unable to generate suggestions.');
    }
  };

  const handleReview = async (id: number, reviewStatus: 'approved' | 'rejected') => {
    const response = await reviewQuestionTemplate(id, user.id, reviewStatus);
    setPendingTemplates((current) => current.filter((template) => template.id !== id));
    if (reviewStatus === 'approved' && response.template) {
      setApprovedTemplates((current) => [response.template, ...current]);
    }
  };

  const startEditTemplate = (template: QuestionTemplate) => {
    setEditingTemplateId(template.id);
    setSelectedLevelId(template.levelId);
    setDifficulty(template.difficulty);
    setSelectedAssetId(template.assetId ?? '');
    setTemplateTitle(template.title);
    setTemplatePrompt(template.prompt);
    setTemplateNarration(template.narration);
    setTemplateChoices(template.choices.map((choice) => String(choice)).join(', '));
    setTemplateAnswer(String(template.answer));
    setTemplateTags(template.tags.join(', '));
    setTemplateMessage(`Editing "${template.title}".`);
  };

  const clearTemplateForm = () => {
    setEditingTemplateId(null);
    setSelectedAssetId('');
    setTemplateTitle('');
    setTemplatePrompt('');
    setTemplateNarration('');
    setTemplateChoices('');
    setTemplateAnswer('');
    setTemplateTags('');
    setTemplateMessage('');
  };

  if (user.role !== 'admin') {
    return <div className="flex-1 p-10 text-center font-bold text-slate-500">Admin access required.</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-32 pt-28 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border-2 border-slate-100 bg-white p-8 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-500">Content studio</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Build calm, autism-focused lessons</h1>
          <p className="mt-3 max-w-3xl font-semibold text-slate-500">Approved templates are the real curriculum. The learner app uses approved templates for each level first, then fills any remaining slots with safe built-in fallback questions.</p>
        </section>

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={handleAssetSubmit} className="rounded-[2rem] border-2 border-slate-100 bg-white p-8 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black text-slate-900">1. Add image asset</h2>
            <div className="mt-6 space-y-4">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Asset title" className="w-full rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none" />
              <input value={objectName} onChange={(event) => setObjectName(event.target.value)} placeholder="Object name, for example happy face" className="w-full rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none" />
              <input value={manualTags} onChange={(event) => setManualTags(event.target.value)} placeholder="Manual tags, comma separated" className="w-full rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none" />
              <label className="flex cursor-pointer items-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-5 font-bold text-slate-600">
                <ImagePlus size={20} />
                <span>{fileName || 'Upload image file'}</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleVisionSuggest} className="inline-flex items-center gap-2 rounded-3xl bg-amber-400 px-5 py-3 font-black text-white"><Sparkles size={18} />Suggest labels with Vision</button>
                <button type="submit" className="rounded-3xl bg-slate-900 px-5 py-3 font-black text-white">Save asset</button>
              </div>
              {visionMessage && <p className="font-bold text-sky-600">{visionMessage}</p>}
              {visionLabels.length > 0 && <p className="font-semibold text-slate-600">Suggested labels: {visionLabels.join(', ')}</p>}
              {message && <p className="font-bold text-emerald-600">{message}</p>}
            </div>
          </form>

          <form onSubmit={handleTemplateSubmit} className="rounded-[2rem] border-2 border-slate-100 bg-white p-8 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black text-slate-900">2. Author question template</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <select value={selectedLevelId} onChange={(event) => setSelectedLevelId(event.target.value)} className="rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none">{levels.map((level) => <option key={level.id} value={level.id}>{level.unit} - {level.title}</option>)}</select>
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)} className="rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none">{difficultyOptions.map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select>
              <select value={selectedAssetId} onChange={(event) => setSelectedAssetId(event.target.value === '' ? '' : Number(event.target.value))} className="rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none md:col-span-2">
                <option value="">No asset, text-only question</option>
                {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.title} ({asset.objectName})</option>)}
              </select>
              <input value={templateTitle} onChange={(event) => setTemplateTitle(event.target.value)} placeholder="Template title" className="rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none md:col-span-2" />
              <textarea value={templatePrompt} onChange={(event) => setTemplatePrompt(event.target.value)} placeholder="Prompt shown to learner" className="min-h-24 rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none md:col-span-2" />
              <textarea value={templateNarration} onChange={(event) => setTemplateNarration(event.target.value)} placeholder="Optional voice narration text" className="min-h-24 rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none md:col-span-2" />
              <input value={templateChoices} onChange={(event) => setTemplateChoices(event.target.value)} placeholder="Choices, comma separated" className="rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none md:col-span-2" />
              <input value={templateAnswer} onChange={(event) => setTemplateAnswer(event.target.value)} placeholder="Correct answer" className="rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none" />
              <input value={templateTags} onChange={(event) => setTemplateTags(event.target.value)} placeholder="Tags, comma separated" className="rounded-3xl border-2 border-slate-100 bg-slate-50 px-4 py-4 font-bold text-slate-700 outline-none" />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="submit" className="rounded-3xl bg-slate-900 px-5 py-3 font-black text-white">{editingTemplateId ? 'Update template' : 'Save manual template'}</button>
              <button type="button" onClick={handleGenerateSuggestions} className="inline-flex items-center gap-2 rounded-3xl bg-emerald-500 px-5 py-3 font-black text-white"><Sparkles size={18} />Generate AI suggestions</button>
              {editingTemplateId && <button type="button" onClick={clearTemplateForm} className="rounded-3xl bg-slate-200 px-5 py-3 font-black text-slate-700">Cancel edit</button>}
            </div>
            {templateMessage && <p className="mt-4 font-bold text-emerald-600">{templateMessage}</p>}
          </form>
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <section className="rounded-[2rem] border-2 border-slate-100 bg-white p-8 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black text-slate-900">Uploaded assets</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset) => (
                <div key={asset.id} className="overflow-hidden rounded-[1.5rem] border-2 border-slate-100 bg-slate-50">
                  <div className="aspect-[4/3] bg-white">
                    <img src={asset.imagePath} alt={asset.objectName} className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="text-lg font-black text-slate-900">{asset.title}</h3>
                    <p className="font-semibold text-slate-600">{asset.objectName}</p>
                    <p className="text-sm font-semibold text-slate-500">
                      Tags: {[...asset.manualTags, ...asset.visionLabels].slice(0, 5).join(', ') || 'None yet'}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteAsset(user.id, asset.id);
                        setAssets((current) => current.filter((entry) => entry.id !== asset.id));
                        setApprovedTemplates((current) => current.filter((template) => template.assetId !== asset.id));
                        setPendingTemplates((current) => current.filter((template) => template.assetId !== asset.id));
                        setMessage(`Deleted asset "${asset.title}".`);
                      }}
                      className="rounded-3xl bg-red-500 px-4 py-2 font-black text-white"
                    >
                      Delete image
                    </button>
                  </div>
                </div>
              ))}
              {assets.length === 0 && <p className="font-semibold text-slate-500">No assets uploaded yet.</p>}
            </div>
          </section>

          <section className="rounded-[2rem] border-2 border-slate-100 bg-white p-8 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black text-slate-900">3. Review AI suggestions</h2>
            <div className="mt-6 space-y-4">
              {pendingTemplates.map((template) => (
                <div key={template.id} className="rounded-[1.5rem] border-2 border-slate-100 p-4">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-500">{template.levelId} / {template.difficulty}</p>
                  <h3 className="mt-2 text-xl font-black text-slate-900">{template.title}</h3>
                  <p className="mt-2 font-semibold text-slate-600">{template.prompt}</p>
                  <div className="mt-4 flex gap-3">
                    <button type="button" onClick={() => handleReview(template.id, 'approved')} className="inline-flex items-center gap-2 rounded-3xl bg-emerald-500 px-4 py-3 font-black text-white"><Check size={16} />Approve</button>
                    <button type="button" onClick={() => handleReview(template.id, 'rejected')} className="inline-flex items-center gap-2 rounded-3xl bg-red-500 px-4 py-3 font-black text-white"><X size={16} />Reject</button>
                  </div>
                </div>
              ))}
              {pendingTemplates.length === 0 && <p className="font-semibold text-slate-500">No pending AI suggestions right now.</p>}
            </div>
          </section>

          <section className="rounded-[2rem] border-2 border-slate-100 bg-white p-8 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-black text-slate-900">Approved templates</h2>
            <div className="mt-6 space-y-4">
              {approvedTemplates.map((template) => (
                <div key={template.id} className="rounded-[1.5rem] border-2 border-slate-100 p-4">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-500">{template.levelId} / {template.difficulty}</p>
                  <h3 className="mt-2 text-xl font-black text-slate-900">{template.title}</h3>
                  <p className="mt-2 font-semibold text-slate-600">{template.prompt}</p>
                  <div className="mt-4 flex gap-3">
                    <button type="button" onClick={() => startEditTemplate(template)} className="rounded-3xl bg-sky-500 px-4 py-3 font-black text-white">Edit</button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteQuestionTemplate(user.id, template.id);
                        setApprovedTemplates((current) => current.filter((entry) => entry.id !== template.id));
                        setTemplateMessage(`Deleted template "${template.title}".`);
                      }}
                      className="rounded-3xl bg-red-500 px-4 py-3 font-black text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {approvedTemplates.length === 0 && <p className="font-semibold text-slate-500">No approved templates yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
