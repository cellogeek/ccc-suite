export interface ScriptureReference {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  reference: string;
}

export interface Slide {
  id: number;
  title: string;
  content: string;
  verses: string[];
  fontSize: number;
  verseCount: number;
}

export interface ComplianceReport {
  isCompliant: boolean;
  rules: {
    minimumVersesPerSlide: boolean;
    noThreePlusOneSplits: boolean;
    fontSizeInRange: boolean;
    orphanPrevention: boolean;
    intelligentSizing: boolean;
  };
  details: {
    totalSlides: number;
    averageFontSize: number;
    verseDistribution: number[];
  };
}

export interface ExportOptions {
  format: 'rtf' | 'txt' | 'pro';
  filename?: string;
}

export interface ScriptureServiceResult {
  slides: Slide[];
  complianceReport: ComplianceReport;
  reference: ScriptureReference;
}