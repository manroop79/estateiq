/**
 * N8N Integration Client
 * 
 * This module handles triggering N8N workflows from the DocCop application.
 * Each workflow has a dedicated webhook URL configured in environment variables.
 */

interface N8NWebhookPayload {
  [key: string]: unknown;
}

/**
 * Trigger an N8N webhook
 * @param webhookUrl - The full N8N webhook URL
 * @param payload - The data to send to N8N
 * @param authHeader - Optional authentication header value
 */
async function triggerN8NWebhook(
  webhookUrl: string | undefined,
  payload: N8NWebhookPayload,
  authHeader?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!webhookUrl) {
    console.warn('N8N webhook URL not configured, skipping notification');
    return { ok: false, error: 'Webhook URL not configured' };
  }

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authentication if configured
    if (authHeader) {
      headers['x-webhook-secret'] = authHeader;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`N8N webhook failed: ${response.status} - ${errorText}`);
      return { ok: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    console.log('N8N webhook triggered successfully:', webhookUrl.substring(0, 50) + '...');
    return { ok: true };
  } catch (error) {
    console.error('N8N webhook error:', error);
    return { ok: false, error: (error as Error).message };
  }
}

/**
 * Notify N8N when a document is uploaded
 */
export async function notifyDocumentUploaded(data: {
  documentId: string;
  filename: string;
  clientId?: string | null;
  uploadedBy?: string;
  timestamp: string;
}) {
  const webhookUrl = process.env.N8N_DOCUMENT_UPLOADED_WEBHOOK;
  const authHeader = process.env.N8N_WEBHOOK_SECRET;

  return triggerN8NWebhook(
    webhookUrl,
    {
      documentId: data.documentId, // Fixed typo from original workflow
      filename: data.filename,
      clientId: data.clientId || null,
      uploadedBy: data.uploadedBy || 'system',
      timestamp: data.timestamp,
    },
    authHeader
  );
}

/**
 * Notify N8N when a document processing is complete
 */
export async function notifyDocumentProcessed(data: {
  documentId: string;
  filename: string;
  status: 'processed' | 'failed';
  entities?: unknown[];
  processingTime?: number;
  error?: string;
}) {
  const webhookUrl = process.env.N8N_DOCUMENT_PROCESSED_WEBHOOK;
  const authHeader = process.env.N8N_WEBHOOK_SECRET;

  return triggerN8NWebhook(
    webhookUrl,
    {
      documentId: data.documentId,
      filename: data.filename,
      status: data.status,
      entities: data.entities || [],
      processingTime: data.processingTime || 0,
      error: data.error || null,
    },
    authHeader
  );
}

/**
 * Notify N8N when a client's document is updated
 */
export async function notifyClientDocumentUpdate(data: {
  clientId: string;
  clientName: string;
  clientEmail: string;
  documentId: string;
  filename: string;
  status: string;
}) {
  const webhookUrl = process.env.N8N_CLIENT_UPDATE_WEBHOOK;
  const authHeader = process.env.N8N_WEBHOOK_SECRET;

  return triggerN8NWebhook(
    webhookUrl,
    {
      clientId: data.clientId,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      documentId: data.documentId,
      filename: data.filename,
      status: data.status,
    },
    authHeader
  );
}

/**
 * Notify N8N when a compliance check fails
 */
export async function notifyComplianceFailed(data: {
  documentId: string;
  filename: string;
  caseId: string;
  failedChecks: string;
  severity: 'low' | 'medium' | 'high';
}) {
  const webhookUrl = process.env.N8N_COMPLIANCE_FAILED_WEBHOOK;
  const authHeader = process.env.N8N_WEBHOOK_SECRET;

  return triggerN8NWebhook(
    webhookUrl,
    {
      documentId: data.documentId,
      filename: data.filename,
      caseId: data.caseId,
      failedChecks: data.failedChecks,
      severity: data.severity,
    },
    authHeader
  );
}

