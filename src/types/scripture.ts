export interface ScriptureReference {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  reference: string;
}

export interface Slide {
  id: string;
  content: string;
  reference: string;
  fontSize: number;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  padding: number;
  lineHeight: number;
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
