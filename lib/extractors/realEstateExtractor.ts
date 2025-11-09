/**
 * Real Estate Document Entity Extractor
 * Extracts key information from property documents like Title Deeds, NOCs, Allotments, etc.
 */

export interface ExtractedEntity {
  key: string;
  label: string;
  value: string | null;
  confidence: number;
  category: 'party' | 'property' | 'financial' | 'date' | 'legal';
}

export interface ExtractionResult {
  entities: ExtractedEntity[];
  rawText: string;
  documentType: string | null;
  completeness: number; // 0-100
  riskScore: number; // 0-100
  flags: string[];
}

/**
 * Detect document type from text
 */
export function detectDocumentType(text: string): string | null {
  const lower = text.toLowerCase();
  
  if (lower.includes('title deed') || lower.includes('sale deed')) return 'Title Deed';
  if (lower.includes('no objection') || lower.includes('noc')) return 'NOC';
  if (lower.includes('allotment')) return 'Allotment Letter';
  if (lower.includes('agreement') && lower.includes('sale')) return 'Sale Agreement';
  if (lower.includes('power of attorney') || lower.includes('poa')) return 'Power of Attorney';
  if (lower.includes('encumbrance')) return 'Encumbrance Certificate';
  if (lower.includes('tax receipt') || lower.includes('property tax')) return 'Tax Receipt';
  if (lower.includes('building plan') || lower.includes('sanction')) return 'Building Plan';
  
  return null;
}

/**
 * Extract party information (buyer, seller, witnesses, etc.)
 */
function extractParties(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  
  // Buyer/Purchaser
  const buyerPatterns = [
    /(?:buyer|purchaser|vendee)(?:'?s?\s+name)?[:\s]+([A-Z][A-Za-z\s]{2,40})/gi,
    /sold\s+to[:\s]+([A-Z][A-Za-z\s]{2,40})/gi,
    /in\s+favour\s+of[:\s]+([A-Z][A-Za-z\s]{2,40})/gi,
  ];
  
  for (const pattern of buyerPatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      entities.push({
        key: 'buyer_name',
        label: 'Buyer Name',
        value: match[1].trim(),
        confidence: 0.75,
        category: 'party',
      });
      break;
    }
  }
  
  // Seller/Vendor
  const sellerPatterns = [
    /(?:seller|vendor)(?:'?s?\s+name)?[:\s]+([A-Z][A-Za-z\s]{2,40})/gi,
    /sold\s+by[:\s]+([A-Z][A-Za-z\s]{2,40})/gi,
  ];
  
  for (const pattern of sellerPatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      entities.push({
        key: 'seller_name',
        label: 'Seller Name',
        value: match[1].trim(),
        confidence: 0.75,
        category: 'party',
      });
      break;
    }
  }
  
  // Developer/Builder
  const builderMatch = /(?:builder|developer|promoter)[:\s]+([A-Z][A-Za-z\s&]{2,50})/gi.exec(text);
  if (builderMatch) {
    entities.push({
      key: 'builder_name',
      label: 'Builder/Developer',
      value: builderMatch[1].trim(),
      confidence: 0.7,
      category: 'party',
    });
  }
  
  return entities;
}

/**
 * Extract property details
 */
function extractPropertyDetails(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  
  // Plot/Flat/Unit Number
  const plotPatterns = [
    /(?:plot|flat|unit|apartment)(?:\s+no\.?|\s+number)?[:\s#]*([A-Z0-9\-\/]+)/gi,
    /property\s+no\.?[:\s]*([A-Z0-9\-\/]+)/gi,
  ];
  
  for (const pattern of plotPatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      entities.push({
        key: 'plot_number',
        label: 'Plot/Flat Number',
        value: match[1].trim(),
        confidence: 0.8,
        category: 'property',
      });
      break;
    }
  }
  
  // Address
  const addressMatch = /address[:\s]+([^\n]{10,150})/gi.exec(text);
  if (addressMatch) {
    entities.push({
      key: 'property_address',
      label: 'Property Address',
      value: addressMatch[1].trim(),
      confidence: 0.65,
      category: 'property',
    });
  }
  
  // Area/Square Feet
  const areaPatterns = [
    /(?:area|size)[:\s]*(\d+[\d,]*\.?\d*)\s*(?:sq\.?\s*ft|square\s+feet|sqft)/gi,
    /(\d+[\d,]*\.?\d*)\s*(?:sq\.?\s*ft|square\s+feet|sqft)/gi,
  ];
  
  for (const pattern of areaPatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      entities.push({
        key: 'area_sqft',
        label: 'Area (Sq.Ft.)',
        value: match[1].replace(/,/g, ''),
        confidence: 0.7,
        category: 'property',
      });
      break;
    }
  }
  
  // Survey Number
  const surveyMatch = /survey\s+no\.?[:\s]*([0-9\-\/]+)/gi.exec(text);
  if (surveyMatch) {
    entities.push({
      key: 'survey_number',
      label: 'Survey Number',
      value: surveyMatch[1].trim(),
      confidence: 0.75,
      category: 'property',
    });
  }
  
  return entities;
}

/**
 * Extract financial details
 */
function extractFinancialDetails(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  
  // Sale Price/Consideration
  const pricePatterns = [
    /(?:sale\s+price|consideration|amount)[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)/gi,
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d+)?)\s*(?:only|lakhs?|crores?)/gi,
  ];
  
  for (const pattern of pricePatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      entities.push({
        key: 'sale_price',
        label: 'Sale Price',
        value: match[1].replace(/,/g, ''),
        confidence: 0.7,
        category: 'financial',
      });
      break;
    }
  }
  
  // Stamp Duty
  const stampMatch = /stamp\s+duty[:\s]*(?:rs\.?|₹)?\s*([\d,]+(?:\.\d+)?)/gi.exec(text);
  if (stampMatch) {
    entities.push({
      key: 'stamp_duty',
      label: 'Stamp Duty',
      value: stampMatch[1].replace(/,/g, ''),
      confidence: 0.65,
      category: 'financial',
    });
  }
  
  return entities;
}

/**
 * Extract dates
 */
function extractDates(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  
  // Registration Date
  const regDatePatterns = [
    /(?:registration|registered)\s+(?:date|on)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
    /dated[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
  ];
  
  for (const pattern of regDatePatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      entities.push({
        key: 'registration_date',
        label: 'Registration Date',
        value: match[1],
        confidence: 0.75,
        category: 'date',
      });
      break;
    }
  }
  
  // Execution Date
  const execMatch = /(?:execution|executed)\s+(?:date|on)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi.exec(text);
  if (execMatch) {
    entities.push({
      key: 'execution_date',
      label: 'Execution Date',
      value: execMatch[1],
      confidence: 0.7,
      category: 'date',
    });
  }
  
  return entities;
}

/**
 * Extract legal details
 */
function extractLegalDetails(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  
  // Document Number
  const docNumMatch = /(?:document|deed|instrument)\s+no\.?[:\s]*([A-Z0-9\-\/]+)/gi.exec(text);
  if (docNumMatch) {
    entities.push({
      key: 'document_number',
      label: 'Document Number',
      value: docNumMatch[1].trim(),
      confidence: 0.8,
      category: 'legal',
    });
  }
  
  // Registration Number
  const regNumMatch = /registration\s+no\.?[:\s]*([A-Z0-9\-\/]+)/gi.exec(text);
  if (regNumMatch) {
    entities.push({
      key: 'registration_number',
      label: 'Registration Number',
      value: regNumMatch[1].trim(),
      confidence: 0.8,
      category: 'legal',
    });
  }
  
  return entities;
}

/**
 * Calculate completeness score
 */
function calculateCompleteness(entities: ExtractedEntity[], docType: string | null): number {
  const requiredFieldsByType: Record<string, string[]> = {
    'Title Deed': ['buyer_name', 'seller_name', 'plot_number', 'registration_date', 'sale_price'],
    'NOC': ['builder_name', 'plot_number', 'property_address'],
    'Allotment Letter': ['buyer_name', 'plot_number', 'area_sqft'],
    'Sale Agreement': ['buyer_name', 'seller_name', 'plot_number', 'sale_price'],
  };
  
  const requiredFields = docType ? (requiredFieldsByType[docType] || []) : [];
  if (requiredFields.length === 0) return 50; // Default for unknown doc types
  
  const foundFields = entities.filter(e => e.value && requiredFields.includes(e.key));
  return Math.round((foundFields.length / requiredFields.length) * 100);
}

/**
 * Identify risk flags
 */
function identifyRiskFlags(entities: ExtractedEntity[], text: string): string[] {
  const flags: string[] = [];
  
  // Check for low confidence fields
  const lowConfidence = entities.filter(e => e.value && e.confidence < 0.6);
  if (lowConfidence.length > 0) {
    flags.push(`Low confidence in ${lowConfidence.length} field(s)`);
  }
  
  // Check for missing critical fields
  const criticalFields = ['buyer_name', 'seller_name', 'plot_number'];
  const missingCritical = criticalFields.filter(
    field => !entities.find(e => e.key === field && e.value)
  );
  if (missingCritical.length > 0) {
    flags.push(`Missing critical: ${missingCritical.join(', ')}`);
  }
  
  // Check for suspicious patterns
  if (text.toLowerCase().includes('cancel') || text.toLowerCase().includes('void')) {
    flags.push('Document may be cancelled/void');
  }
  
  if (text.toLowerCase().includes('duplicate') || text.toLowerCase().includes('copy')) {
    flags.push('Appears to be a copy/duplicate');
  }
  
  return flags;
}

/**
 * Calculate risk score
 */
function calculateRiskScore(flags: string[], completeness: number): number {
  let riskScore = 0;
  
  // Base risk from incompleteness
  riskScore += (100 - completeness) * 0.5;
  
  // Add risk from flags
  riskScore += flags.length * 15;
  
  return Math.min(Math.round(riskScore), 100);
}

/**
 * Main extraction function
 */
export function extractRealEstateEntities(text: string): ExtractionResult {
  const documentType = detectDocumentType(text);
  
  const entities: ExtractedEntity[] = [
    ...extractParties(text),
    ...extractPropertyDetails(text),
    ...extractFinancialDetails(text),
    ...extractDates(text),
    ...extractLegalDetails(text),
  ];
  
  // Remove duplicates (keep highest confidence)
  const uniqueEntities = entities.reduce((acc, entity) => {
    const existing = acc.find(e => e.key === entity.key);
    if (!existing || entity.confidence > existing.confidence) {
      return [...acc.filter(e => e.key !== entity.key), entity];
    }
    return acc;
  }, [] as ExtractedEntity[]);
  
  const completeness = calculateCompleteness(uniqueEntities, documentType);
  const flags = identifyRiskFlags(uniqueEntities, text);
  const riskScore = calculateRiskScore(flags, completeness);
  
  return {
    entities: uniqueEntities.sort((a, b) => a.category.localeCompare(b.category)),
    rawText: text,
    documentType,
    completeness,
    riskScore,
    flags,
  };
}
