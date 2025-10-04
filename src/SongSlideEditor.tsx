import React, { useState, useRef } from 'react';
import { Upload, Download, Music, FileText, Globe, ChevronDown, ChevronUp } from 'lucide-react';

// Types
interface Metadata {
  name: string;
  number: string;
  title: string;
  artist: string;
  author: string;
  composer: string;
  publisher: string;
  copyright: string;
  CCLI: string;
  year: string;
  key: string;
  bpm: string;
  notes: string;
}

interface Chord {
  id: string;
  pos: number;
  key: string;
}

interface SlideLine {
  text: string;
  chords: Chord[];
}

interface Slide {
  group: string;
  lines: SlideLine[];
}

interface Translations {
  appTitle: string;
  appSubtitle: string;
  metadata: string;
  songContent: string;
  uploadFile: string;
  pastePrompt: string;
  selectApply: string;
  preview: string;
  showChords: string;
  exportChordPro: string;
  exportShow: string;
  noPreview: string;
  placeholders: {
    [key: string]: string;
  };
  sections: {
    verse: string;
    chorus: string;
    bridge: string;
    preChorus: string;
    intro: string;
    outro: string;
    tag: string;
    interlude: string;
  };
  selectTextAlert: string;
}

type Language = 'en' | 'fr';

// Translation files
const translations: Record<Language, Translations> = {
  en: {
    appTitle: "Song Slide Editor",
    appSubtitle: "Create and export songs for FreeShow",
    metadata: "Song Metadata",
    songContent: "Song Content",
    uploadFile: "Upload ChordPro File",
    pastePrompt: "Or paste/type your song (use [C] [G] [Am] for chords):",
    selectApply: "Select text and apply section tags:",
    preview: "Preview",
    showChords: "Show chords",
    exportChordPro: ".chordpro",
    exportShow: ".show",
    noPreview: "Upload or paste a song to see preview",
    placeholders: {
      name: "Name",
      number: "Number",
      title: "Title",
      artist: "Artist",
      author: "Author",
      composer: "Composer",
      publisher: "Publisher",
      copyright: "Copyright",
      CCLI: "CCLI",
      year: "Year",
      key: "Key",
      bpm: "BPM",
      notes: "Notes (presentation notes)"
    },
    sections: {
      verse: "Verse",
      chorus: "Chorus",
      bridge: "Bridge",
      preChorus: "Pre-Chorus",
      intro: "Intro",
      outro: "Outro",
      tag: "Tag",
      interlude: "Interlude"
    },
    selectTextAlert: "Please select some text first"
  },
  fr: {
    appTitle: "Éditeur de Diapositives de Chansons",
    appSubtitle: "Créez et exportez des chansons pour FreeShow",
    metadata: "Métadonnées de la chanson",
    songContent: "Contenu de la chanson",
    uploadFile: "Télécharger un fichier ChordPro",
    pastePrompt: "Ou collez/tapez votre chanson (utilisez [C] [G] [Am] pour les accords):",
    selectApply: "Sélectionnez du texte et appliquez des balises de section:",
    preview: "Aperçu",
    showChords: "Afficher les accords",
    exportChordPro: ".chordpro",
    exportShow: ".show",
    noPreview: "Téléchargez ou collez une chanson pour voir l'aperçu",
    placeholders: {
      name: "Nom",
      number: "Numéro",
      title: "Titre",
      artist: "Artiste",
      author: "Auteur",
      composer: "Compositeur",
      publisher: "Éditeur",
      copyright: "Droits d'auteur",
      CCLI: "CCLI",
      year: "Année",
      key: "Tonalité",
      bpm: "BPM",
      notes: "Notes (notes de présentation)"
    },
    sections: {
      verse: "Couplet",
      chorus: "Refrain",
      bridge: "Pont",
      preChorus: "Pré-refrain",
      intro: "Intro",
      outro: "Outro",
      tag: "Tag",
      interlude: "Interlude"
    },
    selectTextAlert: "Veuillez d'abord sélectionner du texte"
  }
};

const FreeShowEditor: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = sessionStorage.getItem('freeshow_language');
    return (saved === 'fr' ? 'fr' : 'en') as Language;
  });

  const t = translations[language];

  const [metadata, setMetadata] = useState<Metadata>(() => {
    const saved = sessionStorage.getItem('freeshow_metadata');
    return saved ? JSON.parse(saved) : {
      name: '',
      number: '',
      title: '',
      artist: '',
      author: '',
      composer: '',
      publisher: '',
      copyright: '',
      CCLI: '',
      year: '',
      key: '',
      bpm: '',
      notes: ''
    };
  });
  
  const [songText, setSongText] = useState<string>(() => {
    return sessionStorage.getItem('freeshow_songtext') || '';
  });
  
  const [slides, setSlides] = useState<Slide[]>([]);
  const [showChords, setShowChords] = useState<boolean>(true);
  const [metadataExpanded, setMetadataExpanded] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sectionColors: Record<string, string> = {
    'Verse': '#5825f5',
    'Chorus': '#f5258a',
    'Bridge': '#25f58a',
    'Pre-Chorus': '#f58a25',
    'Intro': '#258af5',
    'Outro': '#8a25f5',
    'Tag': '#f5d825',
    'Interlude': '#25f5d8'
  };

  React.useEffect(() => {
    sessionStorage.setItem('freeshow_language', language);
  }, [language]);

  React.useEffect(() => {
    sessionStorage.setItem('freeshow_metadata', JSON.stringify(metadata));
  }, [metadata]);

  React.useEffect(() => {
    sessionStorage.setItem('freeshow_songtext', songText);
  }, [songText]);

  React.useEffect(() => {
    if (songText) {
      const parsed = parseChordPro(songText);
      setSlides(parsed);
    }
  }, []);

  const parseChordPro = (text: string): Slide[] => {
    const lines = text.split('\n');
    const parsedSlides: Slide[] = [];
    let currentSection: string | null = null;
    let currentLines: SlideLine[] = [];
    const sectionCounter: Record<string, number> = { 
      'Verse': 0, 'Chorus': 0, 'Bridge': 0, 'Pre-Chorus': 0, 
      'Intro': 0, 'Outro': 0, 'Tag': 0, 'Interlude': 0 
    };

    const finishSection = () => {
      if (currentSection && currentLines.length > 0) {
        parsedSlides.push({
          group: currentSection,
          lines: currentLines.filter(l => l.text.trim() || l.chords.length > 0)
        });
        currentLines = [];
      }
    };

    lines.forEach((line: string) => {
      const metaMatch = line.match(/\{(title|t|artist|composer|author|copyright|ccli|key|year|tempo|bpm|comment|c):\s*([^}]+)\}/i);
      if (metaMatch) {
        const key = metaMatch[1].toLowerCase();
        const value = metaMatch[2].trim();
        if (key === 't') {
          setMetadata(prev => ({ ...prev, title: value, name: value }));
        } else if (key === 'title') {
          setMetadata(prev => ({ ...prev, title: value, name: value }));
        } else if (key === 'tempo' || key === 'bpm') {
          setMetadata(prev => ({ ...prev, bpm: value }));
        } else if (key === 'comment' || key === 'c') {
          setMetadata(prev => ({ ...prev, notes: value }));
        } else {
          setMetadata(prev => ({ ...prev, [key]: value }));
        }
        return;
      }

      const startMatch = line.match(/\{(?:start_of_)?(verse|chorus|bridge|pre-?chorus|intro|outro|tag|interlude|v|c|b)(?::\s*(\d+))?\}/i);
      if (startMatch) {
        finishSection();
        let sectionType = startMatch[1].toLowerCase();
        
        if (sectionType === 'v') sectionType = 'verse';
        if (sectionType === 'c') sectionType = 'chorus';
        if (sectionType === 'b') sectionType = 'bridge';
        if (sectionType === 'prechorus' || sectionType === 'pre-chorus') sectionType = 'Pre-Chorus';
        
        sectionType = sectionType.charAt(0).toUpperCase() + sectionType.slice(1);
        
        const sectionNum = startMatch[2] || ++sectionCounter[sectionType];
        currentSection = sectionType === 'Chorus' || sectionType === 'Bridge' || sectionType === 'Pre-Chorus' || sectionType === 'Intro' || sectionType === 'Outro' || sectionType === 'Tag' || sectionType === 'Interlude' 
          ? sectionType 
          : `${sectionType} ${sectionNum}`;
        return;
      }

      const endMatch = line.match(/\{(?:end_of_)?(verse|chorus|bridge|pre-?chorus|intro|outro|tag|interlude|eov|eoc|eob)\}/i);
      if (endMatch) {
        finishSection();
        currentSection = null;
        return;
      }

      if (line.trim() && !line.startsWith('#') && !line.match(/^\{[^}]+\}$/)) {
        if (!currentSection) {
          currentSection = `Verse ${++sectionCounter['Verse']}`;
        }
        
        const chords: Chord[] = [];
        let cleanText = '';
        
        const chordRegex = /\[([^\]]+)\]/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        
        while ((match = chordRegex.exec(line)) !== null) {
          cleanText += line.substring(lastIndex, match.index);
          
          chords.push({
            id: Math.random().toString(36).substr(2, 5),
            pos: cleanText.length,
            key: match[1]
          });
          
          lastIndex = match.index + match[0].length;
        }
        
        cleanText += line.substring(lastIndex);
        
        currentLines.push({
          text: cleanText,
          chords: chords
        });
      }

      if (!line.trim() && currentLines.length > 0) {
        finishSection();
        currentSection = null;
      }
    });

    finishSection();
    return parsedSlides;
  };

  const handleTextChange = (text: string) => {
    setSongText(text);
    const parsed = parseChordPro(text);
    setSlides(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setSongText(text);
        handleTextChange(text);
      };
      reader.readAsText(file);
    }
  };

  const wrapSelection = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = songText.substring(start, end);

    if (!selectedText) {
      alert(t.selectTextAlert);
      return;
    }

    const before = songText.substring(0, start);
    const after = songText.substring(end);
    
    const wrapped = `{start_of_${tag}}\n${selectedText}\n{end_of_${tag}}`;
    const newText = before + wrapped + after;
    
    setSongText(newText);
    handleTextChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + wrapped.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const generateShowFile = () => {
    const timestamp = Date.now();
    const layoutId = 'layout_' + Math.random().toString(36).substr(2, 9);
    
    const slidesObj: Record<string, any> = {};
    const layoutSlides: Array<{ id: string }> = [];

    slides.forEach((slide) => {
      const slideId = 'slide_' + Math.random().toString(36).substr(2, 9);
      const sectionType = slide.group.split(' ')[0];
      const color = sectionColors[sectionType] || '#5825f5';

      slidesObj[slideId] = {
        group: slide.group,
        color: color,
        settings: {
          resolution: { width: 1920, height: 1080 }
        },
        notes: '',
        items: [
          {
            type: 'text',
            lines: slide.lines.map((line: SlideLine) => ({
              align: 'text-align:center;',
              text: [
                {
                  value: line.text,
                  style: 'font-size:100px;'
                }
              ],
              chords: line.chords
            })),
            style: 'top:120px;left:50px;height:840px;width:1820px;',
            align: 'align-items:center;',
            auto: false,
            chords: {
              enabled: false
            }
          }
        ],
        globalGroup: sectionType.toLowerCase()
      };

      layoutSlides.push({ id: slideId });
    });

    const showFile = {
      name: metadata.name || metadata.title || 'Untitled',
      category: null,
      settings: {
        activeLayout: layoutId,
        template: null
      },
      timestamps: {
        created: timestamp,
        modified: timestamp,
        used: null
      },
      meta: {
        number: metadata.number,
        title: metadata.title,
        artist: metadata.artist,
        author: metadata.author,
        composer: metadata.composer,
        publisher: metadata.publisher,
        copyright: metadata.copyright,
        CCLI: metadata.CCLI,
        year: metadata.year,
        key: metadata.key
      },
      slides: slidesObj,
      layouts: {
        [layoutId]: {
          name: 'Default',
          notes: metadata.notes || '',
          slides: layoutSlides
        }
      },
      media: {}
    };

    return showFile;
  };

  const downloadShowFile = () => {
    const showFile = generateShowFile();
    const blob = new Blob([JSON.stringify(showFile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.name || metadata.title || 'song'}.show`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadChordProFile = () => {
    let chordProContent = '';
    
    if (metadata.title) chordProContent += `{title: ${metadata.title}}\n`;
    if (metadata.artist) chordProContent += `{artist: ${metadata.artist}}\n`;
    if (metadata.author) chordProContent += `{author: ${metadata.author}}\n`;
    if (metadata.composer) chordProContent += `{composer: ${metadata.composer}}\n`;
    if (metadata.copyright) chordProContent += `{copyright: ${metadata.copyright}}\n`;
    if (metadata.CCLI) chordProContent += `{ccli: ${metadata.CCLI}}\n`;
    if (metadata.year) chordProContent += `{year: ${metadata.year}}\n`;
    if (metadata.key) chordProContent += `{key: ${metadata.key}}\n`;
    if (metadata.bpm) chordProContent += `{tempo: ${metadata.bpm}}\n`;
    if (metadata.notes) chordProContent += `{comment: ${metadata.notes}}\n`;
    
    if (chordProContent) chordProContent += '\n';
    
    chordProContent += songText;
    
    const blob = new Blob([chordProContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.title || metadata.name || 'song'}.chordpro`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-4">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Music className="w-10 h-10" />
              {t.appTitle}
            </h1>
            <button
              onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
              className="ml-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
              title={language === 'en' ? 'Switch to French' : 'Passer à l\'anglais'}
            >
              <Globe className="w-4 h-4" />
              {language === 'en' ? 'FR' : 'EN'}
            </button>
          </div>
          <p className="text-purple-200">{t.appSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20">
              <button
                onClick={() => setMetadataExpanded(!metadataExpanded)}
                className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t.metadata}
                </h2>
                {metadataExpanded ? (
                  <ChevronUp className="w-5 h-5 text-white" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white" />
                )}
              </button>
              
              {metadataExpanded && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(metadata) as Array<keyof Metadata>).filter(key => key !== 'notes').map(key => (
                      <input
                        key={key}
                        type="text"
                        placeholder={t.placeholders[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                        value={metadata[key]}
                        onChange={(e) => setMetadata({...metadata, [key]: e.target.value})}
                        className="bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
                      />
                    ))}
                  </div>
                  <div className="mt-3">
                    <textarea
                      placeholder={t.placeholders.notes}
                      value={metadata.notes}
                      onChange={(e) => setMetadata({...metadata, notes: e.target.value})}
                      className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 h-20 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">{t.songContent}</h2>
              
              <div className="mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".chordpro,.chopro,.cho,.crd,.pro,.txt"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  {t.uploadFile}
                </button>
              </div>

              <div className="text-white/70 text-sm mb-2">{t.pastePrompt}</div>
              <textarea
                ref={textareaRef}
                value={songText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Paste ChordPro format or type lyrics..."
                className="w-full h-64 bg-white/5 border border-white/20 rounded-lg p-4 text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-400 font-mono text-sm"
              />
              
              <div className="mt-3">
                <div className="text-white/70 text-sm mb-2">{t.selectApply}</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: t.sections.verse, tag: 'verse', color: 'bg-purple-600 hover:bg-purple-700' },
                    { label: t.sections.chorus, tag: 'chorus', color: 'bg-pink-600 hover:bg-pink-700' },
                    { label: t.sections.bridge, tag: 'bridge', color: 'bg-green-600 hover:bg-green-700' },
                    { label: t.sections.preChorus, tag: 'prechorus', color: 'bg-orange-600 hover:bg-orange-700' },
                    { label: t.sections.intro, tag: 'intro', color: 'bg-blue-600 hover:bg-blue-700' },
                    { label: t.sections.outro, tag: 'outro', color: 'bg-indigo-600 hover:bg-indigo-700' },
                    { label: t.sections.tag, tag: 'tag', color: 'bg-yellow-600 hover:bg-yellow-700' },
                    { label: t.sections.interlude, tag: 'interlude', color: 'bg-teal-600 hover:bg-teal-700' }
                  ].map(section => (
                    <button
                      key={section.tag}
                      onClick={() => wrapSelection(section.tag)}
                      className={`${section.color} text-white text-sm py-2 px-3 rounded transition-colors`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">{t.preview}</h2>
                <div className="flex gap-3 items-center">
                  <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showChords}
                      onChange={(e) => setShowChords(e.target.checked)}
                      className="w-4 h-4 rounded accent-purple-600"
                    />
                    {t.showChords}
                  </label>
                  <button
                    onClick={downloadChordProFile}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    {t.exportChordPro}
                  </button>
                  <button
                    onClick={downloadShowFile}
                    disabled={slides.length === 0}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    {t.exportShow}
                  </button>
                </div>
              </div>

              {slides.length === 0 ? (
                <div className="text-center py-12 text-purple-300/50">
                  <Music className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>{t.noPreview}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
                  {slides.map((slide, index) => {
                    const sectionType = slide.group.split(' ')[0];
                    const color = sectionColors[sectionType] || '#5825f5';
                    
                    return (
                      <div
                        key={index}
                        className="rounded-lg overflow-hidden border-2 transition-transform hover:scale-[1.02]"
                        style={{ borderColor: color }}
                      >
                        <div 
                          className="px-4 py-2 font-semibold text-white text-sm"
                          style={{ backgroundColor: color }}
                        >
                          {slide.group}
                        </div>
                        <div className="bg-black/40 p-4">
                          <div className="aspect-video bg-gradient-to-br from-gray-900 to-black rounded flex items-center justify-center p-6">
                            <div className="text-white space-y-3">
                              {slide.lines.map((line, lineIndex) => (
                                <div key={lineIndex} className="flex flex-col">
                                  {showChords && line.chords.length > 0 && (
                                    <div className="text-sm text-blue-400 font-mono whitespace-pre">
                                      {(() => {
                                        let chordLine = '';
                                        let lastPos = 0;
                                        line.chords.forEach((chord: Chord) => {
                                          chordLine += ' '.repeat(Math.max(0, chord.pos - lastPos));
                                          chordLine += chord.key;
                                          lastPos = chord.pos + chord.key.length;
                                        });
                                        return chordLine;
                                      })()}
                                    </div>
                                  )}
                                  <div className="text-lg font-mono whitespace-pre">
                                    {line.text}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeShowEditor;