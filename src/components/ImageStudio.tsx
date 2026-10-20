import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Upload,
  Download,
  Wand2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  X,
  Layers,
} from 'lucide-react';

interface ImageStudioProps {
  onClose: () => void;
}

export const ImageStudio: React.FC<ImageStudioProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const samplePrompts = [
    'A futuristic college student studying with a glowing holographic AI assistant in a cyberpunk room',
    'Isometric 3D illustration of a software developer workstation with mechanical keyboard and code monitors',
    'A cute friendly robot teaching data structures and algorithms on a digital blackboard',
    'Minimalist modern vector logo of a brain combined with circuitry and a graduation cap',
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageBase64: uploadedImage,
          aspectRatio: aspectRatio,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Image generation failed');
      }

      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
      } else {
        throw new Error(data.text || 'No image data returned from model.');
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      setErrorMessage(
        err.message ||
          'Model gemini-nano-banana-2.1 requires an active paid tier API key in AI Studio. Free tier covers text chat, search grounding, and live voice.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = `mypersonal_ai_${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-4 sm:p-8 text-slate-100 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Return to Chat"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Image Studio (Create & Edit)
              </h2>
              <p className="text-xs text-slate-400">
                Text prompts to create or edit visual assets using <strong>gemini-nano-banana-2.1</strong>.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Nano Banana 2.1
          </span>
        </div>

        {/* Notice on Paid vs Free Tier */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <Layers className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Model Capability:</strong> Supports text-to-image creation and image-to-image modifications. Note that image generation using <code>gemini-nano-banana-2.1</code> requires a paid project tier in AI Studio Settings.
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">Notice:</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Form Column */}
          <div className="space-y-4">
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Prompt Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  Image Prompt / Edit Instructions
                </label>
                <textarea
                  rows={4}
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    uploadedImage
                      ? 'e.g. Add a neon glowing circle behind the subject and change the lighting to warm sunset'
                      : 'e.g. A realistic futuristic software engineer desk with dual monitors displaying React code, coffee mug, and warm ambient LED lighting'
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Aspect Ratio Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Aspect Ratio
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        aspectRatio === ratio
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Image Upload for Editing */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Input Image for Editing (Optional)</span>
                  {uploadedImage && (
                    <button
                      type="button"
                      onClick={() => setUploadedImage(null)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  )}
                </label>

                {uploadedImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 max-h-48">
                    <img
                      src={uploadedImage}
                      alt="Source for editing"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl bg-slate-900/50 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-slate-500 mb-1" />
                    <span className="text-xs text-slate-400">Click to upload an image to edit</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating Image with Nano Banana 2.1...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{uploadedImage ? 'Edit Image' : 'Create Image'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Prompt Inspiration Chips */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Prompt Inspiration
              </span>
              <div className="space-y-1.5">
                {samplePrompts.map((sp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(sp)}
                    className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-800/80 transition-colors"
                  >
                    "{sp}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Preview Column */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900 border border-slate-800 min-h-[380px]">
            {isGenerating ? (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
                <p className="text-sm font-semibold text-white">Rendering Image...</p>
                <p className="text-xs text-slate-400">Applying nano-banana-2.1 diffusion models</p>
              </div>
            ) : generatedImageUrl ? (
              <div className="space-y-4 w-full">
                <div className="rounded-xl overflow-hidden border border-slate-700 shadow-xl max-h-[420px] flex items-center justify-center bg-black">
                  <img
                    src={generatedImageUrl}
                    alt="Generated output"
                    className="max-h-[420px] w-auto object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download Image (PNG)</span>
                </button>
              </div>
            ) : (
              <div className="text-center text-slate-500 space-y-2">
                <ImageIcon className="w-12 h-12 mx-auto opacity-40" />
                <p className="text-sm font-semibold text-slate-400">No Image Generated Yet</p>
                <p className="text-xs text-slate-500 max-w-xs">
                  Enter a prompt on the left and click "Create Image" to generate high-resolution visuals.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
