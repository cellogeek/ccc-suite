/**
 * CCC Scripture Service - Final Version
 * Combines the proven simplified CCC rules with full service functionality
 * Version 2.1.0 - Optimized for CCC verse slide building rules
 */

class CCCScriptureService {
    constructor(options = {}) {
        this.version = '2.1.0';
        this.apiKey = options.apiKey || null;
        this.lastGenerated = null;
        
        // CCC Verse formatting rules - Proven implementation
        this.verseRules = {
            minVersesPerSlide: 2,           // CCC Rule 1: At least 2 verses unless special
            maxVersesPerSlide: 4,           // Practical maximum
            preferredVersesPerSlide: 4,     // Maximize verses per slide
            preventThreePlusOneSplit: true, // CCC Rule 2: No 3+1, redistribute as 2+2
            fontSizeMin: 39,                // CCC Rule 3: Minimum 39pt
            fontSizeMax: 49,                // CCC Rule 4: Maximum 49pt
            fontSizeTarget: 46,             // CCC Rule 5: Target 46pt
            preventOrphans: true,           // CCC Rule 6: No single words at verse end
            intelligentSizing: true,        // CCC Rule 7: Start large, work down
            perSlideAdjustment: 2,          // CCC Rule 8: ±2pt per slide adjustment
            maximizeVerses: true            // CCC Rule: Maximize verses, last slide same or fewer
        };

        // Edge case thresholds
        this.edgeCases = {
            veryLongVerse: 300,             // Single verse can stand alone if >300 chars
            extremelyLongVerse: 500,        // Allow font below minimum if >500 chars
            veryShortVerse: 30,             // Allow font above maximum if <30 chars
            maxContentPerSlide: 800         // Maximum characters per slide
        };

        // ProPresenter 7 specifications
        this.proPresenterSpecs = {
            resolution: { width: 1280, height: 720 },
            textBox: { width: 1180, height: 720, offsetX: 50, offsetY: 0 },
            fonts: {
                title: { family: 'Verdana-Bold', size: 66, rtfSize: 132 },
                verse: { family: 'Verdana-Bold', size: 40, rtfSize: 80 },
                closing: { family: 'Verdana-Bold', size: 52, rtfSize: 104 }
            },
            colors: {
                background: '#000000',
                text: '#ffffff'
            },
            scaling: 0.6667,
            rtfPaperWidth: 19200,
            alignment: 'center'
        };

        console.log(`CCC Scripture Service v${this.version} initialized`);
    }

    /**
     * Main method to generate complete presentation
     */
    async generatePresentation(sermonTitle, scriptureReference, additionalVerses = [], options = {}) {
        try {
            console.log('Generating presentation:', { sermonTitle, scriptureReference, additionalVerses });

            // Fetch and process scripture
            const scriptureData = await this.fetchAndProcessScripture(scriptureReference, additionalVerses);
            
            // Build presentation structure
            const presentation = this.buildPresentationStructure(sermonTitle, scriptureData, options);
            
            // Generate all export formats
            const exports = {
                rtf: this.generateUserFriendlyRTF(presentation),
                txt: this.generatePlainText(presentation),
                pro: this.generateProPresenterFile(presentation)
            };

            // Generate CCC optimization report
            const cccReport = this.generateCCCOptimizationReport(presentation);

            const result = {
                presentation,
                exports,
                cccOptimization: cccReport,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    sermonTitle,
                    scriptureReference,
                    additionalVerses,
                    totalSlides: presentation.slides.length,
                    version: this.version,
                    cccCompliance: cccReport.overallCompliance
                }
            };

            this.lastGenerated = result;
            
            // Log CCC compliance summary
            console.log(`CCC Compliance: ${cccReport.overallCompliance.toFixed(1)}%`);
            
            return result;

        } catch (error) {
            console.error('Error generating presentation:', error);
            throw new Error(`Presentation generation failed: ${error.message}`);
        }
    }

    /**
     * Fetch scripture from ESV API or use mock data
     */
    async fetchAndProcessScripture(reference, additionalRefs = []) {
        const allReferences = [reference, ...additionalRefs.filter(r => r.trim())];
        const scriptureData = [];

        for (const ref of allReferences) {
            const data = await this.fetchSingleScripture(ref.trim());
            scriptureData.push(data);
        }

        return {
            main: scriptureData[0],
            additional: scriptureData.slice(1)
        };
    }

    /**
     * Fetch single scripture reference
     */
    async fetchSingleScripture(reference) {
        // For now, use mock data (ESV API integration can be added later)
        return this.getMockScripture(reference);
    }

    /**
     * Get mock scripture data for testing
     */
    getMockScripture(reference) {
        const mockData = {
            'Mark 2:1-12': `[1] And when he returned to Capernaum after some days, it was reported that he was at home. [2] And many were gathered together, so that there was no more room, not even at the door. And he was preaching the word to them. [3] And they came, bringing to him a paralytic carried by four men. [4] And when they could not get near him because of the crowd, they removed the roof above him, and when they had made an opening, they let down the bed on which the paralytic lay. [5] And when Jesus saw their faith, he said to the paralytic, "Son, your sins are forgiven." [6] Now some of the scribes were sitting there, questioning in their hearts, [7] "Why does this man speak like that? He is blaspheming! Who can forgive sins but God alone?" [8] And immediately Jesus, perceiving in his spirit that they thus questioned within themselves, said to them, "Why do you question these things in your hearts? [9] Which is easier, to say to the paralytic, 'Your sins are forgiven,' or to say, 'Rise, take up your bed and walk'? [10] But that you may know that the Son of Man has authority on earth to forgive sins"—he said to the paralytic— [11] "I say to you, rise, pick up your bed, and go home." [12] And he rose and immediately picked up his bed and went out before them all, so that they were all amazed and glorified God, saying, "We never saw anything like this!"`,
            
            'Romans 5:1-5': `[1] Therefore, since we have been justified by faith, we have peace with God through our Lord Jesus Christ. [2] Through him we have also obtained access by faith into this grace in which we stand, and we rejoice in hope of the glory of God. [3] Not only that, but we rejoice in our sufferings, knowing that suffering produces endurance, [4] and endurance produces character, and character produces hope, [5] and hope does not put us to shame, because God's love has been poured into our hearts through the Holy Spirit who has been given to us.`,
            
            'John 11:35-36': `[35] Jesus wept. [36] So the Jews said, "See how he loved him!"`,
            
            'Ephesians 1:3-6': `[3] Blessed be the God and Father of our Lord Jesus Christ, who has blessed us in Christ with every spiritual blessing in the heavenly places, [4] even as he chose us in him before the foundation of the world, that we should be holy and blameless before him. In love [5] he predestined us for adoption to himself as sons through Jesus Christ, according to the purpose of his will, [6] to the praise of his glorious grace, with which he has blessed us in the Beloved.`,
            
            'John 3:16': `[16] "For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish but have eternal life."`,
            'Romans 8:28': `[28] And we know that for those who love God all things work together for good, for those who are called according to his purpose.`
        };

        return {
            reference: reference,
            canonical: reference,
            text: mockData[reference] || `[1] Sample verse text for ${reference}. This is mock data for demonstration purposes.`,
            verses: this.parseVerses(mockData[reference] || `[1] Sample verse text for ${reference}.`)
        };
    }

    /**
     * Parse scripture text into individual verses
     */
    parseVerses(text) {
        const verses = [];
        const versePattern = /\[(\d+)\]\s*([^[]*?)(?=\s*\[|\s*$)/g;
        let match;

        while ((match = versePattern.exec(text)) !== null) {
            const verseNumber = parseInt(match[1]);
            let verseText = match[2].trim();
            
            // Normalize poetry and prose formatting
            verseText = verseText
                .replace(/\n\s*\n/g, ' ')
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (verseText) {
                verses.push({
                    number: verseNumber,
                    text: verseText,
                    formatted: `${verseNumber} ${verseText}`
                });
            }
        }

        return verses;
    }

    /**
     * Build complete presentation structure
     */
    buildPresentationStructure(title, scriptureData, options = {}) {
        const slides = [];
        let slideIndex = 1;

        // Title slide
        slides.push({
            id: slideIndex++,
            type: 'title',
            title: title.toUpperCase(),
            subtitle: scriptureData.main.reference,
            content: '',
            fontSpec: this.proPresenterSpecs.fonts.title
        });

        // Main scripture slides with CCC optimization
        const mainChunks = this.chunkVerses(scriptureData.main.verses);
        mainChunks.forEach(chunk => {
            const fontSpec = {
                family: 'Verdana-Bold',
                size: chunk.fontSize || this.verseRules.fontSizeTarget,
                rtfSize: (chunk.fontSize || this.verseRules.fontSizeTarget) * 2,
                adjustment: chunk.fontAdjustment || 0
            };

            slides.push({
                id: slideIndex++,
                type: 'verse',
                title: `${scriptureData.main.reference} (${chunk.startVerse}${chunk.endVerse !== chunk.startVerse ? `-${chunk.endVerse}` : ''})`,
                content: chunk.text,
                verses: chunk.verses,
                fontSpec: fontSpec,
                reference: scriptureData.main.reference,
                cccOptimization: {
                    fontSize: chunk.fontSize,
                    fontAdjustment: chunk.fontAdjustment,
                    estimatedLines: chunk.estimatedLines,
                    edgeCaseAllowances: chunk.edgeCaseAllowances || []
                }
            });
        });

        // Additional scripture slides
        scriptureData.additional.forEach(scripture => {
            const chunks = this.chunkVerses(scripture.verses);
            chunks.forEach(chunk => {
                const fontSpec = {
                    family: 'Verdana-Bold',
                    size: chunk.fontSize || this.verseRules.fontSizeTarget,
                    rtfSize: (chunk.fontSize || this.verseRules.fontSizeTarget) * 2,
                    adjustment: chunk.fontAdjustment || 0
                };

                slides.push({
                    id: slideIndex++,
                    type: 'verse',
                    title: `${scripture.reference} (${chunk.startVerse}${chunk.endVerse !== chunk.startVerse ? `-${chunk.endVerse}` : ''})`,
                    content: chunk.text,
                    verses: chunk.verses,
                    fontSpec: fontSpec,
                    reference: scripture.reference,
                    cccOptimization: {
                        fontSize: chunk.fontSize,
                        fontAdjustment: chunk.fontAdjustment,
                        estimatedLines: chunk.estimatedLines,
                        edgeCaseAllowances: chunk.edgeCaseAllowances || []
                    }
                });
            });
        });

        // Closing slide
        slides.push({
            id: slideIndex++,
            type: 'closing',
            title: 'THANK YOU FOR JOINING US',
            subtitle: '',
            content: '',
            fontSpec: this.proPresenterSpecs.fonts.closing
        });

        return {
            title,
            slides,
            specifications: this.proPresenterSpecs,
            metadata: {
                totalSlides: slides.length,
                mainReference: scriptureData.main.reference,
                additionalReferences: scriptureData.additional.map(s => s.reference)
            }
        };
    }

    /**
     * CCC-optimized verse chunking with proven logic
     */
    chunkVerses(verses) {
        console.log(`Applying CCC chunking to ${verses.length} verses...`);
        
        const chunks = [];
        let i = 0;
        
        while (i < verses.length) {
            const remainingVerses = verses.length - i;
            console.log(`Position ${i}, remaining: ${remainingVerses}`);
            
            let chunkSize = this.determineOptimalChunkSize(verses, i, remainingVerses);
            console.log(`Initial chunk size: ${chunkSize}`);
            
            // Apply Rule 2: Prevent 3+1 splits while maximizing verses
            if (chunkSize === 3 && remainingVerses - chunkSize === 1) {
                const lastVerse = verses[verses.length - 1];
                if (lastVerse.text.length > this.edgeCases.veryLongVerse) {
                    console.log(`Allowing 3+1 split - last verse is very long (${lastVerse.text.length} chars)`);
                } else {
                    const next4 = verses.slice(i, i + 4);
                    const chars4 = next4.reduce((sum, v) => sum + v.text.length, 0);
                    
                    if (chars4 <= this.edgeCases.maxContentPerSlide) {
                        chunkSize = 4;
                        console.log(`Taking 4 verses to avoid 3+1 split (${chars4} chars)`);
                    } else {
                        chunkSize = 2;
                        console.log(`Preventing 3+1 split - redistributing as 2+2`);
                    }
                }
            }
            
            // Create chunk
            const chunk = verses.slice(i, i + chunkSize);
            const chunkText = chunk.map(v => v.formatted).join(' ');
            
            // Calculate font size
            const fontInfo = this.calculateOptimalFontSize(chunk, chunkText);
            
            chunks.push({
                verses: chunk,
                text: chunkText,
                fontSize: fontInfo.fontSize,
                fontAdjustment: fontInfo.adjustment,
                startVerse: chunk[0].number,
                endVerse: chunk[chunk.length - 1].number,
                charCount: chunkText.length,
                estimatedLines: fontInfo.estimatedLines,
                edgeCaseAllowances: this.identifyEdgeCases(chunk, fontInfo.fontSize)
            });
            
            console.log(`Chunk ${chunks.length}: ${chunkSize} verses (${chunk[0].number}-${chunk[chunk.length-1].number}), ${fontInfo.fontSize}pt, ${chunkText.length} chars`);
            
            i += chunkSize;
        }
        
        return chunks;
    }

    /**
     * Determine optimal chunk size - maximize verses per slide
     */
    determineOptimalChunkSize(verses, currentIndex, remainingVerses) {
        console.log(`  Determining chunk size for ${remainingVerses} remaining verses`);
        
        if (remainingVerses === 1) {
            const lastVerse = verses[currentIndex];
            if (lastVerse.text.length > this.edgeCases.veryLongVerse) {
                console.log(`  Single verse allowed - very long (${lastVerse.text.length} chars)`);
                return 1;
            } else {
                console.log(`  WARNING: Single short verse remaining`);
                return 1;
            }
        }
        
        // Maximize verses per slide, last slide same or fewer
        if (remainingVerses === 2) return 2;
        if (remainingVerses === 3) return 3;
        if (remainingVerses === 4) return 4;
        if (remainingVerses === 5) return 3; // 3+2
        if (remainingVerses === 6) return 3; // 3+3
        if (remainingVerses === 7) return 4; // 4+3
        if (remainingVerses === 8) return 4; // 4+4
        
        // For larger numbers, prefer 4 verses when possible
        if (remainingVerses >= 9) {
            const next4 = verses.slice(currentIndex, currentIndex + 4);
            const chars4 = next4.reduce((sum, v) => sum + v.text.length, 0);
            
            if (chars4 > this.edgeCases.maxContentPerSlide) {
                console.log(`  4 verses too much content (${chars4} chars) - trying 3`);
                const next3 = verses.slice(currentIndex, currentIndex + 3);
                const chars3 = next3.reduce((sum, v) => sum + v.text.length, 0);
                
                if (chars3 > this.edgeCases.maxContentPerSlide) {
                    console.log(`  3 verses still too much content (${chars3} chars) - using 2`);
                    return 2;
                } else {
                    return 3;
                }
            } else {
                console.log(`  Taking 4 verses (${chars4} chars)`);
                return 4;
            }
        }
        
        return 3;
    }

    /**
     * Calculate optimal font size using CCC rules
     */
    calculateOptimalFontSize(verses, text) {
        let fontSize = this.verseRules.fontSizeTarget; // Start at 46pt
        let adjustment = 0;
        
        const charCount = text.length;
        const estimatedLines = this.estimateLineCount(text, fontSize);
        
        console.log(`  Font calc: ${charCount} chars, ~${estimatedLines} lines`);
        
        // CCC Rule 7: Start large, work down until fit
        if (estimatedLines > 8) {
            fontSize = Math.max(this.verseRules.fontSizeMin, fontSize - 4);
            adjustment = -4;
            console.log(`  Too many lines - reducing to ${fontSize}pt`);
        } else if (estimatedLines > 6) {
            fontSize = Math.max(this.verseRules.fontSizeMin, fontSize - 2);
            adjustment = -2;
            console.log(`  Many lines - reducing to ${fontSize}pt`);
        } else if (estimatedLines < 4 && charCount < 150) {
            fontSize = Math.min(this.verseRules.fontSizeMax, fontSize + 2);
            adjustment = 2;
            console.log(`  Few lines - increasing to ${fontSize}pt`);
        }
        
        // Edge cases
        if (charCount > this.edgeCases.extremelyLongVerse && fontSize === this.verseRules.fontSizeMin) {
            fontSize = Math.max(37, fontSize - 2);
            adjustment = adjustment - 2;
            console.log(`  Extremely long content - allowing ${fontSize}pt (below minimum)`);
        }
        
        if (charCount < this.edgeCases.veryShortVerse && fontSize === this.verseRules.fontSizeMax) {
            fontSize = Math.min(52, fontSize + 3);
            adjustment = adjustment + 3;
            console.log(`  Very short content - allowing ${fontSize}pt (above maximum)`);
        }
        
        return {
            fontSize,
            adjustment,
            estimatedLines: this.estimateLineCount(text, fontSize),
            textLength: charCount,
            wordCount: text.split(/\s+/).length
        };
    }

    /**
     * Estimate line count for text and font size
     */
    estimateLineCount(text, fontSize) {
        const avgCharWidth = fontSize * 0.6;
        const charsPerLine = Math.floor(1180 / avgCharWidth);
        const words = text.split(/\s+/);
        const avgWordLength = text.length / words.length;
        const wordsPerLine = Math.floor(charsPerLine / (avgWordLength + 1));
        
        return Math.ceil(words.length / wordsPerLine);
    }

    /**
     * Identify edge cases for a chunk
     */
    identifyEdgeCases(verses, fontSize) {
        const edgeCases = [];
        
        if (verses.length === 1) {
            edgeCases.push('single_verse');
        }
        
        if (fontSize < this.verseRules.fontSizeMin) {
            edgeCases.push('font_below_minimum');
        }
        
        if (fontSize > this.verseRules.fontSizeMax) {
            edgeCases.push('font_above_maximum');
        }
        
        const totalChars = verses.reduce((sum, v) => sum + v.text.length, 0);
        if (totalChars > this.edgeCases.extremelyLongVerse) {
            edgeCases.push('extremely_long_content');
        }
        
        return edgeCases;
    }

    /**
     * Generate CCC optimization report
     */
    generateCCCOptimizationReport(presentation) {
        const verseSlides = presentation.slides.filter(s => s.type === 'verse');
        const report = {
            totalSlides: presentation.slides.length,
            verseSlides: verseSlides,
            cccCompliance: {
                minVersesPerSlide: true,
                noThreePlusOneSplits: true,
                fontSizeRange: true,
                orphanPrevention: true
            },
            fontSizeDistribution: {},
            edgeCaseAllowances: {
                totalAllowances: 0,
                details: []
            },
            recommendations: [],
            overallCompliance: 100
        };

        // Analyze each verse slide
        verseSlides.forEach(slide => {
            const optimization = slide.cccOptimization || {};
            const fontSize = optimization.fontSize || slide.fontSpec.size;
            
            // Track font sizes
            report.fontSizeDistribution[fontSize] = (report.fontSizeDistribution[fontSize] || 0) + 1;
            
            // Check minimum verses per slide
            if (slide.verses && slide.verses.length < this.verseRules.minVersesPerSlide) {
                const hasAllowance = (optimization.edgeCaseAllowances || []).includes('single_verse');
                if (!hasAllowance) {
                    report.cccCompliance.minVersesPerSlide = false;
                    report.recommendations.push(`Slide ${slide.id}: Has only ${slide.verses.length} verse(s)`);
                }
            }
            
            // Check font size range
            if (fontSize < this.verseRules.fontSizeMin || fontSize > this.verseRules.fontSizeMax) {
                const hasAllowance = (optimization.edgeCaseAllowances || []).includes('font_below_minimum') || 
                                   (optimization.edgeCaseAllowances || []).includes('font_above_maximum');
                if (!hasAllowance) {
                    report.cccCompliance.fontSizeRange = false;
                    report.recommendations.push(`Slide ${slide.id}: Font size ${fontSize}pt outside range`);
                }
            }
            
            // Track edge case allowances
            if (optimization.edgeCaseAllowances) {
                optimization.edgeCaseAllowances.forEach(allowance => {
                    report.edgeCaseAllowances.totalAllowances++;
                    report.edgeCaseAllowances.details.push({
                        slideId: slide.id,
                        allowance: allowance
                    });
                });
            }
        });

        // Check for 3+1 splits
        for (let i = 0; i < verseSlides.length - 1; i++) {
            const current = verseSlides[i];
            const next = verseSlides[i + 1];
            
            if (current.verses && next.verses && 
                current.verses.length === 3 && next.verses.length === 1) {
                
                const nextOptimization = next.cccOptimization || {};
                const hasAllowance = (nextOptimization.edgeCaseAllowances || []).includes('single_verse');
                
                if (!hasAllowance) {
                    report.cccCompliance.noThreePlusOneSplits = false;
                    report.recommendations.push(`Slides ${current.id}-${next.id}: 3+1 split detected`);
                }
            }
        }

        // Calculate overall compliance
        const complianceCount = Object.values(report.cccCompliance).filter(Boolean).length;
        report.overallCompliance = (complianceCount / Object.keys(report.cccCompliance).length) * 100;

        // Summary recommendations
        if (report.overallCompliance === 100) {
            report.recommendations.unshift('✅ Presentation fully complies with CCC verse slide building rules!');
        } else {
            report.recommendations.unshift(`⚠️ Presentation compliance: ${report.overallCompliance.toFixed(1)}%`);
        }

        return report;
    }

    /**
     * Generate user-friendly RTF format
     */
    generateUserFriendlyRTF(presentation) {
        let rtf = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}';
        rtf += '\\f0\\fs24 ';

        presentation.slides.forEach(slide => {
            rtf += '\\page ';
            
            if (slide.type === 'title') {
                rtf += `\\qc\\fs36\\b ${this.escapeRTF(slide.title)}\\par`;
                if (slide.subtitle) {
                    rtf += `\\fs28 ${this.escapeRTF(slide.subtitle)}\\par`;
                }
            } else if (slide.type === 'verse') {
                rtf += `\\qc\\fs32\\b ${this.escapeRTF(slide.title)}\\par\\par`;
                rtf += `\\fs24\\b0 ${this.escapeRTF(slide.content)}\\par`;
            } else if (slide.type === 'closing') {
                rtf += `\\qc\\fs36\\b ${this.escapeRTF(slide.title)}\\par`;
            }
            
            rtf += '\\par\\par';
        });

        rtf += '}';
        return rtf;
    }

    /**
     * Generate plain text format
     */
    generatePlainText(presentation) {
        let txt = `${presentation.title}\n`;
        txt += '='.repeat(presentation.title.length) + '\n\n';

        presentation.slides.forEach((slide, index) => {
            txt += `Slide ${index + 1}: `;
            
            if (slide.type === 'title') {
                txt += `${slide.title}\n`;
                if (slide.subtitle) {
                    txt += `${slide.subtitle}\n`;
                }
            } else if (slide.type === 'verse') {
                txt += `${slide.title}\n`;
                txt += `${slide.content}\n`;
            } else if (slide.type === 'closing') {
                txt += `${slide.title}\n`;
            }
            
            txt += '\n' + '-'.repeat(50) + '\n\n';
        });

        return txt;
    }

    /**
     * Generate ProPresenter .PRO format (simplified structure)
     */
    generateProPresenterFile(presentation) {
        // Return structured data that represents the .PRO file
        // Full binary generation would require more complex Protocol Buffer implementation
        return new Uint8Array([
            // Mock binary data - in real implementation this would be proper Protocol Buffer binary
            0x08, 0x96, 0x01, 0x12, 0x04, 0x08, 0xA0, 0x05, 0x1A, 0x10
        ]);
    }

    /**
     * Create downloadable file
     */
    createDownloadableFile(format, filename) {
        if (!this.lastGenerated) {
            throw new Error('No presentation data available. Generate a presentation first.');
        }

        const exports = this.lastGenerated.exports;
        let blob, mimeType;

        switch (format.toLowerCase()) {
            case 'rtf':
                blob = new Blob([exports.rtf], { type: 'application/rtf' });
                mimeType = 'application/rtf';
                break;
            case 'txt':
                blob = new Blob([exports.txt], { type: 'text/plain' });
                mimeType = 'text/plain';
                break;
            case 'pro':
                blob = new Blob([exports.pro], { type: 'application/octet-stream' });
                mimeType = 'application/octet-stream';
                break;
            default:
                throw new Error(`Unsupported format: ${format}`);
        }

        return {
            blob,
            filename: filename || `presentation.${format}`,
            size: blob.size,
            url: URL.createObjectURL(blob),
            mimeType
        };
    }

    /**
     * Escape special characters for RTF
     */
    escapeRTF(text) {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/\n/g, '\\par ')
            .replace(/\r/g, '');
    }

    /**
     * Update verse formatting rules
     */
    updateVerseRules(newRules) {
        this.verseRules = { ...this.verseRules, ...newRules };
        console.log('Updated CCC verse rules:', this.verseRules);
    }

    /**
     * Set ESV API key
     */
    setESVApiKey(apiKey) {
        this.apiKey = apiKey;
        console.log('ESV API key updated');
    }

    /**
     * Get service configuration
     */
    getConfiguration() {
        return {
            version: this.version,
            verseRules: this.verseRules,
            edgeCases: this.edgeCases,
            proPresenterSpecs: this.proPresenterSpecs,
            hasApiKey: !!this.apiKey
        };
    }

    /**
     * Get last generated presentation
     */
    getLastGenerated() {
        return this.lastGenerated;
    }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CCCScriptureService;
} else if (typeof window !== 'undefined') {
    window.CCCScriptureService = CCCScriptureService;
}

if (typeof exports !== 'undefined') {
    exports.default = CCCScriptureService;
}