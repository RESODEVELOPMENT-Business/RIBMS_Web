import { apiClient } from './apiClient';

export interface InvoiceRequestPayload {
  buyerName?: string;
  buyerTaxCode?: string;
  buyerEmail?: string;
  buyerAddress?: string;
  buyerPhoneNumber?: string;
}

export const getInvoiceRequestLink = async (orderCode: string) => {
  return await apiClient(`/passio-orders/${orderCode}/invoice-request-link`);
};

export const requestInvoice = async (orderCode: string, payload: InvoiceRequestPayload) => {
  return await apiClient(`/passio-orders/${orderCode}/request-invoice`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
