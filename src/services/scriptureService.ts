import { ScriptureReference, ScriptureServiceResult, ExportOptions } from '../types/scripture';

// This will be dynamically imported to avoid SSR issues
let CCCScriptureService: any = null;

const initializeService = async () => {
  if (typeof window !== 'undefined' && !CCCScriptureService) {
    // Dynamically import the service
    const serviceModule = await import('../lib/ccc-scripture-service-final.js');
    CCCScriptureService = serviceModule.default || serviceModule;
  }
};

export class ScriptureService {
  private static instance: ScriptureService;
  
  public static getInstance(): ScriptureService {
    if (!ScriptureService.instance) {
      ScriptureService.instance = new ScriptureService();
    }
    return ScriptureService.instance;
  }

  async generateSlides(reference: string): Promise<ScriptureServiceResult> {
    await initializeService();
    
    if (!CCCScriptureService) {
      throw new Error('Scripture service not initialized');
    }

    try {
      // Parse the reference
      const parsedRef = this.parseReference(reference);
      
      // Mock ESV API data for now - in production this would call the actual API
      const mockVerseData = await this.getMockVerseData(parsedRef);
      
      // Create CCC service instance
      const cccService = new CCCScriptureService();
      
      // Generate slides using CCC service
      const result = await cccService.generatePresentation(mockVerseData.verses, {
        reference: reference,
        title: `${parsedRef.book} ${parsedRef.chapter}:${parsedRef.startVerse}-${parsedRef.endVerse}`
      });

      return {
        slides: result.slides.map((slide: any, index: number) => ({
          id: index + 1,
          title: slide.title || `${reference} (${index + 1})`,
          content: slide.content,
          verses: slide.verses || [],
          fontSize: slide.fontSize || 46,
          verseCount: slide.verseCount || slide.verses?.length || 0
        })),
        complianceReport: {
          isCompliant: result.complianceReport?.isCompliant || true,
          rules: {
            minimumVersesPerSlide: result.complianceReport?.rules?.minimumVersesPerSlide || true,
            noThreePlusOneSplits: result.complianceReport?.rules?.noThreePlusOneSplits || true,
            fontSizeInRange: result.complianceReport?.rules?.fontSizeInRange || true,
            orphanPrevention: result.complianceReport?.rules?.orphanPrevention || true,
            intelligentSizing: result.complianceReport?.rules?.intelligentSizing || true,
          },
          details: {
            totalSlides: result.slides.length,
            averageFontSize: result.complianceReport?.averageFontSize || 46,
            verseDistribution: result.complianceReport?.verseDistribution || []
          }
        },
        reference: parsedRef
      };
    } catch (error) {
      console.error('Error generating slides:', error);
      throw error;
    }
  }

  async exportSlides(slides: any[], options: ExportOptions, reference: string): Promise<Blob> {
    try {
      let content: string;
      let mimeType: string;
      
      switch (options.format) {
        case 'rtf':
          content = this.generateRTF(slides, reference);
          mimeType = 'application/rtf';
          break;
        case 'txt':
          content = this.generateTXT(slides, reference);
          mimeType = 'text/plain';
          break;
        case 'pro':
          // PRO format would require the full CCC service
          throw new Error('PRO export requires full CCC Scripture Service integration');
        default:
          content = this.generateTXT(slides, reference);
          mimeType = 'text/plain';
      }

      return new Blob([content], { type: mimeType });
    } catch (error) {
      console.error('Error exporting slides:', error);
      throw error;
    }
  }

  /**
   * Generate user-friendly RTF format (from penguin service)
   * Optimized for Apple Pages compatibility
   */
  private generateRTF(slides: any[], reference: string): string {
    let rtf = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}';
    rtf += '\\f0\\fs24 '; // 12pt font

    slides.forEach((slide, index) => {
      if (index > 0) rtf += '\\page '; // New page for each slide except first
      
      // Title slide or verse slide
      rtf += `\\qc\\fs32\\b ${this.escapeRTF(slide.title)}\\par\\par`;
      
      if (slide.content) {
        rtf += `\\fs24\\b0 ${this.escapeRTF(slide.content)}\\par`;
      }
      
      rtf += '\\par\\par';
    });

    rtf += '}';
    return rtf;
  }

  /**
   * Generate plain text format (from penguin service)
   */
  private generateTXT(slides: any[], reference: string): string {
    let txt = `${reference}\n`;
    txt += '='.repeat(reference.length) + '\n\n';

    slides.forEach((slide, index) => {
      txt += `Slide ${index + 1}: `;
      txt += `${slide.title}\n`;
      
      if (slide.content) {
        txt += `${slide.content}\n`;
      }
      
      txt += '\n' + '-'.repeat(50) + '\n\n';
    });

    return txt;
  }

  /**
   * Escape special characters for RTF (from penguin service)
   */
  private escapeRTF(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\n/g, '\\par ')
      .replace(/\r/g, '');
  }

  private parseReference(reference: string): ScriptureReference {
    // Simple reference parser - can be enhanced
    const match = reference.match(/^(\w+)\s+(\d+):(\d+)(?:-(\d+))?$/);
    
    if (!match) {
      throw new Error('Invalid scripture reference format');
    }

    const [, book, chapter, startVerse, endVerse] = match;
    
    return {
      book,
      chapter: parseInt(chapter),
      startVerse: parseInt(startVerse),
      endVerse: endVerse ? parseInt(endVerse) : parseInt(startVerse),
      reference
    };
  }

  private async getMockVerseData(ref: ScriptureReference): Promise<any> {
    // Mock data for Mark 2:1-12 - in production this would call ESV API
    if (ref.book === 'Mark' && ref.chapter === 2) {
      return {
        reference: ref.reference,
        verses: [
          { number: 1, text: "And when he returned to Capernaum after some days, it was reported that he was at home." },
          { number: 2, text: "And many were gathered together, so that there was no more room, not even at the door. And he was preaching the word to them." },
          { number: 3, text: "And they came, bringing to him a paralytic carried by four men." },
          { number: 4, text: "And when they could not get near him because of the crowd, they removed the roof above him, and when they had made an opening, they let down the bed on which the paralytic lay." },
          { number: 5, text: "And when Jesus saw their faith, he said to the paralytic, \"Son, your sins are forgiven.\"" },
          { number: 6, text: "Now some of the scribes were sitting there, questioning in their hearts," },
          { number: 7, text: "\"Why does this man speak like that? He is blaspheming! Who can forgive sins but God alone?\"" },
          { number: 8, text: "And immediately Jesus, perceiving in his spirit that they thus questioned within themselves, said to them, \"Why do you question these things in your hearts?" },
          { number: 9, text: "Which is easier, to say to the paralytic, 'Your sins are forgiven,' or to say, 'Rise, take up your bed and walk'?" },
          { number: 10, text: "But that you may know that the Son of Man has authority on earth to forgive sins\"—he said to the paralytic—" },
          { number: 11, text: "\"I say to you, rise, pick up your bed, and go home.\"" },
          { number: 12, text: "And he rose and immediately picked up his bed and went out before them all, so that they were all amazed and glorified God, saying, \"We never saw anything like this!\"" }
        ].filter(v => v.number >= ref.startVerse && v.number <= ref.endVerse)
      };
    }

    // Default mock data for other references
    return {
      reference: ref.reference,
      verses: [
        { number: ref.startVerse, text: `Sample verse ${ref.startVerse} from ${ref.book} ${ref.chapter}` },
        { number: ref.startVerse + 1, text: `Sample verse ${ref.startVerse + 1} from ${ref.book} ${ref.chapter}` }
      ]
    };
  }

  // localStorage persistence methods
  saveToStorage(key: string, data: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ccc-suite-${key}`, JSON.stringify(data));
    }
  }

  loadFromStorage(key: string): any {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(`ccc-suite-${key}`);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  clearStorage(key?: string): void {
    if (typeof window !== 'undefined') {
      if (key) {
        localStorage.removeItem(`ccc-suite-${key}`);
      } else {
        // Clear all CCC Suite data
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('ccc-suite-')) {
            localStorage.removeItem(k);
          }
        });
      }
    }
  }
}

export const scriptureService = ScriptureService.getInstance();