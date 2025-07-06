import { supabaseService } from './supabaseService';
import { Slide, ComplianceReport } from '../types/scripture';

export interface ScriptureServiceOptions {
  fontSize?: number;
  maxVersesPerSlide?: number;
  userId?: string; // Add userId to fetch ESV API key
}

class ScriptureService {
  private static instance: ScriptureService;

  public static getInstance(): ScriptureService {
    if (!ScriptureService.instance) {
      ScriptureService.instance = new ScriptureService();
    }
    return ScriptureService.instance;
  }

  // Fetch real scripture text from ESV API
  async fetchEsvText(reference: string, apiKey: string): Promise<string | null> {
    try {
      const encodedRef = encodeURIComponent(reference);
      const response = await fetch(
        `https://api.esv.org/v3/passage/text/?q=${encodedRef}&include-headings=false&include-footnotes=false&include-verse-numbers=true&include-short-copyright=false&include-passage-references=false`,
        {
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error('ESV API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (data.passages && data.passages.length > 0) {
        return data.passages[0].trim();
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching ESV text:', error);
      return null;
    }
  }

  // Parse scripture reference to extract book, chapter, and verses
  parseScriptureReference(reference: string): { book: string; chapter: number; startVerse: number; endVerse: number } | null {
    try {
      const match = reference.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
      if (!match) return null;
      
      const book = match[1].trim();
      const chapter = parseInt(match[2]);
      const startVerse = parseInt(match[3]);
      const endVerse = match[4] ? parseInt(match[4]) : startVerse;
      
      return { book, chapter, startVerse, endVerse };
    } catch (error) {
      console.error('Error parsing scripture reference:', error);
      return null;
    }
  }

  // Split ESV text into individual verses
  splitIntoVerses(text: string, startVerse: number): string[] {
    try {
      const verses: string[] = [];
      const parts = text.split(/\[(\d+)\]/);
      
      for (let i = 1; i < parts.length; i += 2) {
        const verseText = parts[i + 1]?.trim();
        if (verseText) {
          verses.push(`${parts[i]} ${verseText}`);
        }
      }
      return verses.length > 0 ? verses : [text];
    } catch (error) {
      console.error('Error splitting verses:', error);
      return [text];
    }
  }

  // Generate placeholder text (fallback when no ESV API key)
  generatePlaceholderText(reference: string): string[] {
    const parsed = this.parseScriptureReference(reference);
    if (!parsed) return [`Placeholder text for ${reference}`];
    
    const verses: string[] = [];
    for (let v = parsed.startVerse; v <= parsed.endVerse; v++) {
      verses.push(`${v} This is placeholder text for ${parsed.book} ${parsed.chapter}:${v}. The actual scripture text will appear when you add your ESV API key in Settings.`);
    }
    
    return verses;
  }

  // Main method to generate slides
  async generateSlides(reference: string, options: ScriptureServiceOptions = {}): Promise<{ slides: Slide[]; complianceReport: ComplianceReport }> {
    const {
      fontSize = 46,
      maxVersesPerSlide = 4,
      userId
    } = options;

    try {
      let verses: string[] = [];
      
      if (userId) {
        const esvApiKey = await supabaseService.getEsvApiKey(userId);
        if (esvApiKey) {
          const esvText = await this.fetchEsvText(reference, esvApiKey);
          if (esvText) {
            const parsed = this.parseScriptureReference(reference);
            if (parsed) {
              verses = this.splitIntoVerses(esvText, parsed.startVerse);
            }
          }
        }
      }
      
      if (verses.length === 0) {
        verses = this.generatePlaceholderText(reference);
      }

      const slides = this.createCCCCompliantSlides(verses, reference, fontSize, maxVersesPerSlide);
      const complianceReport = this.generateComplianceReport(slides, verses.length);
      
      return { slides, complianceReport };
      
    } catch (error) {
      console.error('Error generating slides:', error);
      throw new Error('Failed to generate slides. Please check your scripture reference.');
    }
  }

  // Create CCC compliant slides from verses
  private createCCCCompliantSlides(verses: string[], reference: string, fontSize: number, maxVersesPerSlide: number): Slide[] {
    const slides: Slide[] = [];
    let currentSlideVerses: string[] = [];
    
    for (let i = 0; i < verses.length; i++) {
      currentSlideVerses.push(verses[i]);
      
      const shouldCreateSlide = 
        currentSlideVerses.length >= maxVersesPerSlide ||
        i === verses.length - 1 ||
        (currentSlideVerses.length >= 2 && this.wouldCreateOrphan(i, verses.length));
      
      if (shouldCreateSlide) {
        if (currentSlideVerses.length >= 2 || verses.length === 1) {
          slides.push(this.createSlide(currentSlideVerses, reference, fontSize, slides.length + 1));
          currentSlideVerses = [];
        }
      }
    }
    
    if (currentSlideVerses.length > 0) {
      if (currentSlideVerses.length === 1 && slides.length > 0) {
        const lastSlide = slides[slides.length - 1];
        // *** FIX: Changed back to 'content' which is the correct property name ***
        lastSlide.content += '\n\n' + currentSlideVerses[0];
      } else {
        slides.push(this.createSlide(currentSlideVerses, reference, fontSize, slides.length + 1));
      }
    }
    
    return slides;
  }

  // Check if creating a slide now would leave an orphan
  private wouldCreateOrphan(currentIndex: number, totalVerses: number): boolean {
    const remainingVerses = totalVerses - currentIndex - 1;
    return remainingVerses === 1;
  }

 // Create individual slide
  private createSlide(verses: string[], reference: string, fontSize: number, slideNumber: number): Slide {
    const content = verses.join('\n\n');

    // Logic to create the 'verses' string (e.g., "16-18" or "16")
    const verseNumbers = verses.map(v => v.match(/^\d+/)?.[0]).filter(Boolean) as string[];
    let versesString = '';
    if (verseNumbers.length > 1) {
        versesString = `${verseNumbers[0]}-${verseNumbers[verseNumbers.length - 1]}`;
    } else if (verseNumbers.length === 1) {
        versesString = verseNumbers[0];
    }
    
  return {
  id: `slide-${slideNumber}`,
  content: content,
  reference: `${reference} (${slideNumber})`,
  fontSize,
  backgroundColor: '#000000',
  textColor: '#ffffff',
  fontFamily: 'Georgia, serif',
  textAlign: 'center',
  verticalAlign: 'middle',
  padding: 40,
  lineHeight: 1.4
};
}

  // Generate compliance report
  private generateComplianceReport(slides: Slide[], totalVerses: number): ComplianceReport {
    const issues: any[] = [];
    
    slides.forEach((slide, index) => {
      if (slide.fontSize < 39 || slide.fontSize > 49) {
        issues.push({
          type: 'font_size',
          message: `Slide ${index + 1} font size (${slide.fontSize}) is outside recommended range`,
        });
      }
    });
    
    slides.forEach((slide, index) => {
      // *** FIX: Changed to use 'content' property ***
      const verseCount = (slide.content.match(/\n\n/g) || []).length + 1;
      if (verseCount > 4) {
        issues.push({
          type: 'verse_count',
          message: `Slide ${index + 1} has too many verses (${verseCount})`,
        });
      }
    });
    
    const isCompliant = issues.length === 0;
    const score = Math.max(0, 100 - (issues.length * 10));
    
    return { isCompliant, issues, suggestions: [], score };
  }

  // Export slides to various formats
  async exportSlides(slides: Slide[], options: { format: 'rtf' | 'txt' | 'pro' }, reference: string): Promise<Blob> {
    const { format } = options;
    
    switch (format) {
      case 'rtf':
        return this.exportToRTF(slides, reference);
      case 'txt':
        return this.exportToTXT(slides, reference);
      case 'pro':
        return this.exportToPRO(slides, reference);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Export to RTF format
  private exportToRTF(slides: Slide[], reference: string): Blob {
    let rtfContent = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}';
    rtfContent += `\\f0\\fs48 ${reference}\\par\\par`;
    
    slides.forEach((slide) => {
      // *** FIX: Changed to use 'content' property ***
      rtfContent += `\\page\\f0\\fs${slide.fontSize * 2} ${slide.content.replace(/\n/g, '\\par ')}\\par`;
    });
    
    rtfContent += '}';
    return new Blob([rtfContent], { type: 'application/rtf' });
  }

  // Export to TXT format
  private exportToTXT(slides: Slide[], reference: string): Blob {
    let txtContent = `${reference}\n\n`;
    
    slides.forEach((slide, index) => {
      txtContent += `--- Slide ${index + 1} ---\n`;
      // *** FIX: Changed to use 'content' property ***
      txtContent += `${slide.content}\n\n`;
    });
    
    return new Blob([txtContent], { type: 'text/plain' });
  }

  // Export to ProPresenter format
  private exportToPRO(slides: Slide[], reference: string): Blob {
    const proData = {
      presentation: {
        title: reference,
        // *** FIX: This object now correctly matches the Slide type ***
        slides: slides.map((slide) => ({
          id: slide.id,
          reference: slide.reference,
          content: slide.content,
          fontSize: slide.fontSize,
          backgroundColor: slide.backgroundColor,
          textColor: slide.textColor,
          fontFamily: slide.fontFamily,
          textAlign: slide.textAlign,
          verticalAlign: slide.verticalAlign,
          padding: slide.padding,
          lineHeight: slide.lineHeight
        }))
      }
    };
    
    return new Blob([JSON.stringify(proData, null, 2)], { type: 'application/json' });
  }

  // Save to localStorage
  saveToStorage(key: string, data: any): void {
    try {
      localStorage.setItem(`ccc-suite-${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // Load from localStorage
  loadFromStorage(key: string): any {
    try {
      const data = localStorage.getItem(`ccc-suite-${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }
}

export const scriptureService = ScriptureService.getInstance();
