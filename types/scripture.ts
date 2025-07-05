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
  issues: ComplianceIssue[];
  suggestions: string[];
  score: number;
}

export interface ComplianceIssue {
  type: 'verse_count' | 'font_size' | 'contrast' | 'readability' | 'formatting';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
}

export interface ScriptureReference {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse?: number;
}

export interface Verse {
  number: number;
  text: string;
}

export interface ScripturePassage {
  reference: string;
  verses: Verse[];
  book: string;
  chapter: number;
}

export interface ExportOptions {
  format: 'rtf' | 'txt' | 'pro';
  includeReferences: boolean;
  fontSize: number;
  fontFamily: string;
  backgroundColor: string;
  textColor: string;
}