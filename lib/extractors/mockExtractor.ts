/**
 * Mock Extractor for Development/Testing
 * Use this when you want to test the UI without waiting for real OCR
 */

import type { ExtractionResult } from "./realEstateExtractor";

/**
 * Generate mock extraction results instantly
 * Simulates what real OCR would extract
 */
export function mockExtractRealEstateEntities(filename: string): ExtractionResult {
  // Simulate different document types based on filename
  const isNOC = filename.toLowerCase().includes('noc');
  const isAllotment = filename.toLowerCase().includes('allotment');
  const isTitleDeed = filename.toLowerCase().includes('title') || filename.toLowerCase().includes('deed');
  
  // Generate realistic mock data
  const entities = [];
  
  // Party information
  entities.push({
    key: 'buyer_name',
    label: 'Buyer Name',
    value: 'Manroop Singh',
    confidence: 0.85,
    category: 'party' as const,
  });
  
  if (!isNOC) {
    entities.push({
      key: 'seller_name',
      label: 'Seller Name',
      value: 'Rajesh Kumar Sharma',
      confidence: 0.82,
      category: 'party' as const,
    });
  }
  
  entities.push({
    key: 'builder_name',
    label: 'Builder/Developer',
    value: 'The Learning Network Properties Ltd.',
    confidence: 0.78,
    category: 'party' as const,
  });
  
  // Property details
  entities.push({
    key: 'plot_number',
    label: 'Plot/Flat Number',
    value: 'A-101',
    confidence: 0.92,
    category: 'property' as const,
  });
  
  entities.push({
    key: 'property_address',
    label: 'Property Address',
    value: 'Sector 15, Phase 2, Chandigarh, India',
    confidence: 0.75,
    category: 'property' as const,
  });
  
  entities.push({
    key: 'area_sqft',
    label: 'Area (Sq.Ft.)',
    value: '1250',
    confidence: 0.88,
    category: 'property' as const,
  });
  
  entities.push({
    key: 'survey_number',
    label: 'Survey Number',
    value: '123/45',
    confidence: 0.70,
    category: 'property' as const,
  });
  
  // Financial details
  if (!isNOC) {
    entities.push({
      key: 'sale_price',
      label: 'Sale Price',
      value: '7500000',
      confidence: 0.80,
      category: 'financial' as const,
    });
    
    entities.push({
      key: 'stamp_duty',
      label: 'Stamp Duty',
      value: '450000',
      confidence: 0.72,
      category: 'financial' as const,
    });
  }
  
  // Dates
  entities.push({
    key: 'registration_date',
    label: 'Registration Date',
    value: '23/10/2024',
    confidence: 0.90,
    category: 'date' as const,
  });
  
  if (isTitleDeed) {
    entities.push({
      key: 'execution_date',
      label: 'Execution Date',
      value: '15/10/2024',
      confidence: 0.87,
      category: 'date' as const,
    });
  }
  
  // Legal details
  entities.push({
    key: 'document_number',
    label: 'Document Number',
    value: 'DOC/2024/17735',
    confidence: 0.95,
    category: 'legal' as const,
  });
  
  entities.push({
    key: 'registration_number',
    label: 'Registration Number',
    value: 'REG/CHD/2024/2496817',
    confidence: 0.93,
    category: 'legal' as const,
  });
  
  // Determine document type
  let documentType = null;
  if (isNOC) documentType = 'NOC';
  else if (isAllotment) documentType = 'Allotment Letter';
  else if (isTitleDeed) documentType = 'Title Deed';
  else documentType = 'Sale Agreement';
  
  // Calculate completeness (based on required fields for document type)
  const completeness = isNOC ? 75 : 85;
  
  // Calculate risk score (random but realistic)
  const riskScore = isNOC ? 25 : 15;
  
  // Generate flags
  const flags = [];
  if (completeness < 80) {
    flags.push('Some fields have low confidence');
  }
  if (isNOC) {
    flags.push('Document appears to be a copy/duplicate');
  }
  
  return {
    entities,
    rawText: `Mock extracted text from ${filename}...`,
    documentType,
    completeness,
    riskScore,
    flags,
  };
}

/**
 * Simulate OCR delay (for testing loading states)
 */
export async function mockRunOCR(url: string): Promise<string> {
  // Simulate processing delay (much faster than real OCR)
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds
  
  return `Mock OCR text extracted from: ${url}
  This is simulated text that would normally come from Tesseract.js
  
  Buyer: Manroop Singh
  Seller: Rajesh Kumar
  Plot No: A-101
  Registration Date: 23/10/2024
  Document No: DOC/2024/17735
  `;
}
