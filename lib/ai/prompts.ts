/**
 * AI Prompts for Document Analysis
 */

export const PROMPTS = {
  summarize: (documentType: string, extractedText: string) => `
You are a real estate document analyst. Analyze the following document and provide a concise summary.

Document Type: ${documentType || 'Unknown'}
Extracted Text:
${extractedText}

Provide a summary in the following JSON format:
{
  "summary": "Brief 2-3 sentence summary of the document",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "documentPurpose": "The primary purpose of this document"
}
`,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analyzeLegalIssues: (documentType: string, entities: any[], extractedText: string) => `
You are a legal expert specializing in real estate transactions. Analyze this document for potential legal issues, risks, or missing information.

Document Type: ${documentType || 'Unknown'}
Extracted Entities: ${JSON.stringify(entities, null, 2)}
Full Text: ${extractedText}

Identify:
1. Missing critical information
2. Potential legal issues or red flags
3. Compliance concerns
4. Risk factors

Respond in JSON format:
{
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "category": "missing_info" | "legal_issue" | "compliance" | "risk",
      "title": "Brief title",
      "description": "Detailed description",
      "recommendation": "What should be done"
    }
  ],
  "overallRisk": "low" | "medium" | "high",
  "recommendation": "Overall recommendation"
}
`,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateFields: (entities: any[], documentType: string) => `
You are a data validation expert. Review the extracted entities from this ${documentType || 'real estate'} document and identify any issues.

Extracted Entities:
${JSON.stringify(entities, null, 2)}

Check for:
1. Missing required fields for this document type
2. Inconsistent or suspicious values
3. Format issues (dates, amounts, etc.)
4. Logical inconsistencies

Respond in JSON format:
{
  "validationIssues": [
    {
      "field": "field_name",
      "issue": "description of the issue",
      "severity": "error" | "warning" | "info",
      "suggestion": "how to fix it"
    }
  ],
  "completenessScore": 0-100,
  "qualityScore": 0-100
}
`,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compareDocuments: (doc1: any, doc2: any) => `
You are comparing two real estate documents. Identify key differences, inconsistencies, and potential issues.

Document 1 Type: ${doc1.documentType || 'Unknown'}
Document 1 Entities: ${JSON.stringify(doc1.entities, null, 2)}

Document 2 Type: ${doc2.documentType || 'Unknown'}
Document 2 Entities: ${JSON.stringify(doc2.entities, null, 2)}

Analyze:
1. Critical differences (buyer, seller, property details, amounts)
2. Inconsistencies that may indicate errors
3. Expected vs unexpected differences
4. Potential red flags

Respond in JSON format:
{
  "criticalDifferences": [
    {
      "field": "field_name",
      "doc1Value": "value",
      "doc2Value": "value",
      "severity": "high" | "medium" | "low",
      "explanation": "why this matters"
    }
  ],
  "consistencyScore": 0-100,
  "redFlags": ["flag 1", "flag 2"],
  "recommendation": "overall assessment"
}
`,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractInsights: (documentType: string, entities: any[], rawText: string) => {
    // Check if this appears to be mock/test data
    const hasMockData = rawText.includes('Mock extracted text') || 
                       rawText.includes('Manroop Singh') && rawText.includes('Rajesh Kumar') ||
                       // eslint-disable-next-line @typescript-eslint/no-explicit-any
                       entities.some((e: any) => e.value === 'Manroop Singh' || e.value === 'Rajesh Kumar Sharma');
    
    const mockWarning = hasMockData ? '\n\n⚠️ WARNING: This appears to be test/mock data. Please ensure real OCR extraction is enabled for production use.' : '';
    
    return `
You are an expert real estate analyst. Extract actionable insights from this document.

Document Type: ${documentType || 'Unknown'}
Extracted Data: ${JSON.stringify(entities, null, 2)}
Full Text: ${rawText.substring(0, 2000)}${rawText.length > 2000 ? '...' : ''}${mockWarning}

Provide insights including:
1. Financial analysis (if applicable)
2. Timeline and deadlines
3. Key stakeholders and their roles
4. Important clauses or conditions
5. Action items or next steps

${hasMockData ? 'Note: If you detect placeholder or test data (like "Manroop Singh", "Rajesh Kumar Sharma", or generic test values), mention this in your analysis.' : ''}

Respond in JSON format:
{
  "insights": [
    {
      "title": "Insight title",
      "description": "Detailed description",
      "priority": "high" | "medium" | "low"
    }
  ],
  "nextSteps": ["step 1", "step 2"]
}
`;
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildPrompt(type: keyof typeof PROMPTS, ...args: any[]): string {
  const promptFn = PROMPTS[type];
  if (typeof promptFn === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (promptFn as (...args: any[]) => string)(...args);
    return typeof result === 'string' ? result : '';
  }
  return '';
}

