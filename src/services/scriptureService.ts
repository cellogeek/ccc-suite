import { supabaseService } from './supabaseService';

export interface Slide {
  id: string;
  title: string;
  content: string;
  fontSize: number;
  verseCount: number;
}

export interface ComplianceReport {
  isCompliant: boolean;
  rules: {
    minimumVersesPerSlide: boolean;
    fontSizeRange: boolean;
    noThreePlusOneSplits: boolean;
    orphanPrevention: boolean;
  };
  totalSlides: number;
  totalVerses: number;
}

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
        // Clean up the text - remove extra whitespace and normalize
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
      // Handle formats like "Mark 2:1-12", "John 3:16", "1 Corinthians 13:1-13"
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
      // ESV API returns text with verse numbers like "[1] In the beginning..."
      const verses: string[] = [];
      
      // Split by verse numbers in brackets
      const parts = text.split(/\[(\d+)\]/);
      
      for (let i = 1; i < parts.length; i += 2) {
        const verseNumber = parseInt(parts[i]);
        const verseText = parts[i + 1]?.trim();
        
        if (verseText) {
          verses.push(`${verseNumber} ${verseText}`);
        }
      }
      
      return verses.length > 0 ? verses : [text]; // Fallback to full text if parsing fails
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
      
      // Try to get real ESV text if user has API key
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
      
      // Fallback to placeholder text if no ESV text available
      if (verses.length === 0) {
        verses = this.generatePlaceholderText(reference);
      }

      // Apply CCC rules to create slides
      const slides = this.createCCCCompliantSlides(verses, reference, fontSize, maxVersesPerSlide);
      
      // Generate compliance report
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
      
      // Check if we should create a slide
      const shouldCreateSlide = 
        currentSlideVerses.length >= maxVersesPerSlide || // Max verses reached
        i === verses.length - 1 || // Last verse
        (currentSlideVerses.length >= 2 && this.wouldCreateOrphan(i, verses.length)); // Prevent orphans
      
      if (shouldCreateSlide) {
        // Ensure minimum 2 verses per slide (except for single verse passages)
        if (currentSlideVerses.length >= 2 || verses.length === 1) {
          slides.push(this.createSlide(currentSlideVerses, reference, fontSize, slides.length + 1));
          currentSlideVerses = [];
        }
      }
    }
    
    // Handle any remaining verses
    if (currentSlideVerses.length > 0) {
      if (currentSlideVerses.length === 1 && slides.length > 0) {
        // Redistribute to avoid orphan - add to previous slide
        const lastSlide = slides[slides.length - 1];
        lastSlide.content += '\n\n' + currentSlideVerses[0];
        lastSlide.verseCount += 1;
      } else {
        slides.push(this.createSlide(currentSlideVerses, reference, fontSize, slides.length + 1));
      }
    }
    
    return slides;
  }

  // Check if creating a slide now would leave an orphan
  private wouldCreateOrphan(currentIndex: number, totalVerses: number): boolean {
    const remainingVerses = totalVerses - currentIndex - 1;
    return remainingVerses === 1; // Would leave exactly 1 verse
  }

  // Create individual slide
  private createSlide(verses: string[], reference: string, fontSize: number, slideNumber: number): Slide {
    const content = verses.join('\n\n');
    const title = `${reference} (${slideNumber})`;
    
    return {
      id: `slide-${slideNumber}`,
      title,
      content,
      fontSize,
      verseCount: verses.length
    };
  }

  // Generate compliance report
  private generateComplianceReport(slides: Slide[], totalVerses: number): ComplianceReport {
    const rules = {
      minimumVersesPerSlide: slides.every(slide => slide.verseCount >= 2 || slides.length === 1),
      fontSizeRange: slides.every(slide => slide.fontSize >= 39 && slide.fontSize <= 49),
      noThreePlusOneSplits: !this.hasThreePlusOneSplits(slides),
      orphanPrevention: !this.hasOrphans(slides)
    };
    
    const isCompliant = Object.values(rules).every(rule => rule);
    
    return {
      isCompliant,
      rules,
      totalSlides: slides.length,
      totalVerses
    };
  }

  // Check for 3+1 splits
  private hasThreePlusOneSplits(slides: Slide[]): boolean {
    for (let i = 0; i < slides.length - 1; i++) {
      if (slides[i].verseCount === 3 && slides[i + 1].verseCount === 1) {
        return true;
      }
    }
    return false;
  }

  // Check for orphan verses
  private hasOrphans(slides: Slide[]): boolean {
    return slides.some(slide => slide.verseCount === 1) && slides.length > 1;
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
    
    slides.forEach((slide, index) => {
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
      txtContent += `${slide.content}\n\n`;
    });
    
    return new Blob([txtContent], { type: 'text/plain' });
  }

  // Export to ProPresenter format
  private exportToPRO(slides: Slide[], reference: string): Blob {
    const proData = {
      presentation: {
        title: reference,
        slides: slides.map((slide, index) => ({
          id: slide.id,
          title: slide.title,
          content: slide.content,
          fontSize: slide.fontSize
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
