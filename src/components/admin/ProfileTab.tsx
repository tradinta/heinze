"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import { 
  User, Upload, Shield, RefreshCw, Save, Image as ImageIcon,
  Plus, Trash2, ArrowUp, ArrowDown, FileText, Heading, Quote,
  Mail, Phone, Twitter, Github, Linkedin, Youtube
} from "lucide-react";

interface ProfileTabProps {
  onProfileUpdated?: () => void;
}

interface BioBlock {
  id: string;
  type: "paragraph" | "h2" | "quote" | "image";
  value: string;
  attribution?: string;
}

export default function ProfileTab({ onProfileUpdated }: ProfileTabProps) {
  const toast = useToast();
  
  // Basic info states
  const [name, setName] = useState("Robert Heinze");
  const [bio, setBio] = useState("Researcher exploring the intersection of technology, philosophy, and human connection.");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  // Contact & Social links states
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [youtube, setYoutube] = useState("");

  // Long biography blocks state
  const [blocks, setBlocks] = useState<BioBlock[]>([
    { id: "b1", type: "paragraph", value: "Write your extended biography here..." }
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/config");
        const data = await res.json();
        if (data.configs) {
          if (data.configs.author_name) setName(data.configs.author_name);
          if (data.configs.author_bio) setBio(data.configs.author_bio);
          if (data.configs.author_image) setAvatarUrl(data.configs.author_image);
          
          // Load contact info
          if (data.configs.author_email) setEmail(data.configs.author_email);
          if (data.configs.author_phone) setPhone(data.configs.author_phone);
          if (data.configs.author_twitter) setTwitter(data.configs.author_twitter);
          if (data.configs.author_github) setGithub(data.configs.author_github);
          if (data.configs.author_linkedin) setLinkedin(data.configs.author_linkedin);
          if (data.configs.author_youtube) setYoutube(data.configs.author_youtube);
          
          // Load bio blocks if present
          if (data.configs.author_long_bio_blocks) {
            try {
              setBlocks(JSON.parse(data.configs.author_long_bio_blocks));
            } catch (e) {
              if (data.configs.author_long_bio_html) {
                setBlocks([{ id: "b1", type: "paragraph", value: data.configs.author_long_bio_html }]);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load author profile config:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    setUploadingAvatar(true);
    toast.info("Uploading portrait to Cloudflare R2...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Upload request failed.");
      const data = await res.json();

      if (data.fileUrl) {
        setAvatarUrl(data.fileUrl);
        toast.success("Profile photo uploaded. Click Save to publish changes.");
      } else {
        toast.error("Upload failed: No file URL returned.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBlockImageUpload = async (blockId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    setUploadingBlockId(blockId);
    toast.info("Uploading image block to R2...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed.");
      const data = await res.json();

      if (data.fileUrl) {
        updateBlock(blockId, data.fileUrl);
        toast.success("Image uploaded successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload block image.");
    } finally {
      setUploadingBlockId(null);
    }
  };

  // Blocks management
  const addBlock = (type: BioBlock["type"]) => {
    const newBlock: BioBlock = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      value: "",
      attribution: type === "image" ? "" : undefined
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, value: string, attribution?: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, value, ...(attribution !== undefined ? { attribution } : {}) } : b));
  };

  const removeBlock = (id: string) => {
    if (blocks.length === 1) {
      toast.warning("Biography must have at least one text block.");
      return;
    }
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === blocks.length - 1) return;

    const target = direction === "up" ? index - 1 : index + 1;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setBlocks(updated);
  };

  // Compile biography blocks into plain HTML
  const compileBlocksToHtml = () => {
    return blocks.map(b => {
      if (b.type === "h2") return `<h2 class="text-lg font-bold text-primary mt-6 mb-2">${b.value}</h2>`;
      if (b.type === "quote") return `<blockquote class="border-l-2 border-primary pl-4 italic my-4 text-zinc-500 font-serif">"${b.value}"</blockquote>`;
      if (b.type === "image") {
        return `
          <figure class="my-6 select-none">
            <img src="${b.value || 'https://pub-d33c13728d81440088421e0298b11617.r2.dev/mock-book-1.pdf'}" alt="${b.attribution || 'Author Image'}" class="w-full max-h-96 object-cover border border-border" />
            ${b.attribution ? `<figcaption class="text-center font-mono text-[9px] text-zinc-500 mt-2">Illustration: ${b.attribution}</figcaption>` : ""}
          </figure>
        `.trim();
      }
      return `<p class="text-[13px] leading-relaxed mb-4 font-sans text-zinc-800 dark:text-zinc-300">${b.value}</p>`;
    }).join("\n");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Author Name is required.");
      return;
    }

    setSaving(true);
    const htmlContent = compileBlocksToHtml();

    try {
      const payloads = [
        { key: "author_name", value: name.trim() },
        { key: "author_bio", value: bio.trim() },
        { key: "author_image", value: avatarUrl },
        { key: "author_email", value: email.trim() },
        { key: "author_phone", value: phone.trim() },
        { key: "author_twitter", value: twitter.trim() },
        { key: "author_github", value: github.trim() },
        { key: "author_linkedin", value: linkedin.trim() },
        { key: "author_youtube", value: youtube.trim() },
        { key: "author_long_bio_blocks", value: JSON.stringify(blocks) },
        { key: "author_long_bio_html", value: htmlContent }
      ];

      for (const payload of payloads) {
        await fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      toast.success("Robert Heinze's public profile saved successfully.");
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (err) {
      toast.error("Failed to update author settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 font-mono text-xs py-8">
        <div className="h-4 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-1/3" />
        <div className="border border-border p-6 space-y-6 bg-card-bg/20">
          <div className="h-10 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full" />
          <div className="h-20 bg-zinc-800/10 dark:bg-zinc-200/5 animate-pulse w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-mono text-xs py-2 select-none">
      <div className="border-b border-border pb-2">
        <h2 className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-primary" />
          Manage Public Author Profile (Robert Heinze)
        </h2>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* Core Profile Card */}
        <div className="border border-border bg-card-bg/40 p-6 space-y-6">
          <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-border/40 pb-2">Identity Details</h3>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border/20">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border border-border bg-background shrink-0 flex items-center justify-center">
              <img 
                src={avatarUrl || "/robert_heinze.png"} 
                alt="Portrait avatar preview" 
                className="w-full h-full object-cover"
              />
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </div>
            
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Author Profile Photo</span>
              <label className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 bg-background hover:bg-background/80 hover:text-foreground text-zinc-400 cursor-pointer transition-colors text-[9px] uppercase tracking-wider font-bold">
                <Upload className="h-3 w-3" />
                Upload Photo
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                  className="hidden" 
                  disabled={uploadingAvatar || saving}
                />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider block">Author Name</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Robert Heinze"
                className="w-full border border-border bg-background/50 px-3 py-2 text-[11px] font-mono text-foreground outline-hidden focus:border-primary placeholder-zinc-600"
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider block">Short Signature Bio (Appears below essays)</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief footer statement..."
                rows={3}
                className="w-full border border-border bg-background/50 px-3 py-2 text-[11px] font-mono text-foreground outline-hidden focus:border-primary placeholder-zinc-600 resize-none leading-relaxed"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Contact Info & Social Links Card */}
        <div className="border border-border bg-card-bg/40 p-6 space-y-4">
          <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider border-b border-border/40 pb-2">Contact & Social Channels</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. robert@heinze-insights.net"
                className="w-full border border-border bg-background/50 px-3 py-2 text-[11px] font-mono text-foreground outline-hidden focus:border-primary placeholder-zinc-600"
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone Number
              </label>
              <input 
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 019-2834"
                className="w-full border border-border bg-background/50 px-3 py-2 text-[11px] font-mono text-foreground outline-hidden focus:border-primary placeholder-zinc-600"
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1.5">
                <Twitter className="h-3.5 w-3.5" /> Twitter / X Link
              </label>
              <input 
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="e.g. https://x.com/robertheinze"
                className="w-full border border-border bg-background/50 px-3 py-2 text-[11px] font-mono text-foreground outline-hidden focus:border-primary placeholder-zinc-600"
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1.5">
                <Github className="h-3.5 w-3.5" /> GitHub Link
              </label>
              <input 
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="e.g. https://github.com/heinze"
                className="w-full border border-border bg-background/50 px-3 py-2 text-[11px] font-mono text-foreground outline-hidden focus:border-primary placeholder-zinc-600"
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1.5">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn Link
              </label>
              <input 
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="e.g. https://linkedin.com/in/robertheinze"
                className="w-full border border-border bg-background/50 px-3 py-2 text-[11px] font-mono text-foreground outline-hidden focus:border-primary placeholder-zinc-600"
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1.5">
                <Youtube className="h-3.5 w-3.5" /> YouTube Link
              </label>
              <input 
                type="text"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="e.g. https://youtube.com/@heinzeinsights"
                className="w-full border border-border bg-background/50 px-3 py-2 text-[11px] font-mono text-foreground outline-hidden focus:border-primary placeholder-zinc-600"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Long Biography Editor Card */}
        <div className="border border-border bg-card-bg/40 p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-border/40 pb-2">
            <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider">Extended Biography Builder</h3>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => addBlock("paragraph")}
                className="flex items-center gap-1 border border-border bg-background hover:bg-surface-container px-2 py-1 text-[9px] uppercase tracking-wider text-zinc-400 hover:text-foreground transition-colors"
              >
                <FileText className="h-3 w-3" /> +Paragraph
              </button>
              <button
                type="button"
                onClick={() => addBlock("h2")}
                className="flex items-center gap-1 border border-border bg-background hover:bg-surface-container px-2 py-1 text-[9px] uppercase tracking-wider text-zinc-400 hover:text-foreground transition-colors"
              >
                <Heading className="h-3 w-3" /> +Heading
              </button>
              <button
                type="button"
                onClick={() => addBlock("quote")}
                className="flex items-center gap-1 border border-border bg-background hover:bg-surface-container px-2 py-1 text-[9px] uppercase tracking-wider text-zinc-400 hover:text-foreground transition-colors"
              >
                <Quote className="h-3 w-3" /> +Quote
              </button>
              <button
                type="button"
                onClick={() => addBlock("image")}
                className="flex items-center gap-1 border border-border bg-background hover:bg-surface-container px-2 py-1 text-[9px] uppercase tracking-wider text-zinc-400 hover:text-foreground transition-colors"
              >
                <ImageIcon className="h-3 w-3" /> +Image
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {blocks.map((block, idx) => (
              <div key={block.id} className="border border-border/60 bg-background/30 p-4 space-y-3 relative group">
                
                {/* Block header tools */}
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span className="text-[9px] text-primary uppercase tracking-wider font-bold">
                    Block {idx + 1}: {block.type}
                  </span>
                  
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => moveBlock(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 border border-border text-zinc-500 hover:text-foreground hover:bg-surface-container disabled:opacity-30 bg-background transition-colors"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(idx, "down")}
                      disabled={idx === blocks.length - 1}
                      className="p-1 border border-border text-zinc-500 hover:text-foreground hover:bg-surface-container disabled:opacity-30 bg-background transition-colors"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="p-1 border border-border text-zinc-500 hover:text-red-400 hover:border-red-400/35 bg-background transition-colors ml-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Block Inputs */}
                {block.type === "image" ? (
                  <div className="space-y-3">
                    <div className="border border-dashed border-border bg-card-bg/20 p-4 flex flex-col items-center justify-center text-center space-y-2">
                      {block.value ? (
                        <div className="relative group/img max-w-xs w-full border border-border overflow-hidden bg-background">
                          <img src={block.value} alt="Bio illustration" className="w-full h-auto object-cover max-h-48 mx-auto" />
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity text-[10px] font-bold uppercase tracking-wider">
                            <Upload className="h-4 w-4 mr-1.5 animate-pulse" /> Replace Photo
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingBlockId !== null}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleBlockImageUpload(block.id, file);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-6 border border-dashed border-zinc-700/60 hover:border-primary hover:bg-surface-container/30 w-full cursor-pointer transition-all">
                          {uploadingBlockId === block.id ? (
                            <>
                              <RefreshCw className="h-6 w-6 animate-spin text-primary mb-2" />
                              <span className="text-[10px] font-bold text-primary uppercase">Uploading image to Cloudflare R2...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-6 w-6 text-zinc-500 mb-2 group-hover:text-primary animate-bounce" />
                              <span className="text-[10px] font-bold text-zinc-400 uppercase">Upload biography image to Cloudflare R2</span>
                              <span className="text-[8px] text-zinc-500 mt-1 font-mono">PNG, JPG or WEBP formats accepted</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingBlockId !== null}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleBlockImageUpload(block.id, file);
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    
                    <input
                      type="text"
                      value={block.attribution || ""}
                      onChange={(e) => updateBlock(block.id, block.value, e.target.value)}
                      placeholder="Attribution / Alt text (e.g. Photograph by Jane Doe)"
                      className="w-full border border-border bg-background/50 px-2.5 py-1.5 text-[10px] outline-hidden focus:border-primary"
                    />
                  </div>
                ) : (
                  <textarea
                    value={block.value}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    placeholder={
                      block.type === "h2" ? "Enter section heading..." :
                      block.type === "quote" ? "Enter blockquote content..." :
                      "Write paragraph content..."
                    }
                    rows={block.type === "h2" ? 1 : block.type === "quote" ? 2 : 4}
                    className="w-full border border-border bg-background/50 px-3 py-2 text-[11px] font-mono text-foreground outline-hidden focus:border-primary placeholder-zinc-600 leading-relaxed font-sans"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Global Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || uploadingAvatar || uploadingBlockId !== null}
            className="flex items-center gap-1.5 bg-primary text-white text-[10px] uppercase tracking-wider px-5 py-2.5 hover:bg-primary/95 transition-colors font-bold disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Saving Identity Changes...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save Complete Identity
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
