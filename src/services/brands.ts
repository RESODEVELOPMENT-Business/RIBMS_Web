import { apiClient } from './apiClient';
export type Brand = {
  Id: string;
  BrandName: string;
  CompanyName?: string | null;
  ContactPerson?: string | null;
  PhoneNumber?: string | null;
  Fax?: string | null;
  Website?: string | null;
  Vatcode?: string | null;
  Vattemplate?: number | null;
  Address?: string | null;
  Description?: string | null;
  ApiSmskey?: string | null;
  SecurityApiSmskey?: string | null;
  Smstype?: number | null;
  BrandNameSms?: string | null;
  JsonConfigUrl?: string | null;
  BrandFeatureFilter?: string | null;
  WiskyId?: number | null;
  DefaultDashBoard?: string | null;
  RsaprivateKey?: string | null;
  RsapublicKey?: string | null;
  Pgppassword?: string | null;
  PgpprivateKey?: string | null;
  PgppulblicKey?: string | null;
  DesKey?: string | null;
  DesVector?: string | null;
  AccessToken?: string | null;
  TaxCode?: string | null;
  Active: boolean;
};

export type CreateBrandPayload = {
  Email: string;
  Password: string;
  UserName?: string | null;
  FullName?: string | null;
  BrandName: string;
  CompanyName?: string | null;
  ContactPerson?: string | null;
  PhoneNumber?: string | null;
  Fax?: string | null;
  Website?: string | null;
  Vatcode?: string | null;
  Vattemplate?: number | null;
  Address?: string | null;
  Description?: string | null;
  ApiSmskey?: string | null;
  SecurityApiSmskey?: string | null;
  Smstype?: number | null;
  BrandNameSms?: string | null;
  JsonConfigUrl?: string | null;
  BrandFeatureFilter?: string | null;
  WiskyId?: number | null;
  DefaultDashBoard?: string | null;
  RsaprivateKey?: string | null;
  RsapublicKey?: string | null;
  Pgppassword?: string | null;
  PgpprivateKey?: string | null;
  PgppulblicKey?: string | null;
  DesKey?: string | null;
  DesVector?: string | null;
  AccessToken?: string | null;
  TaxCode?: string | null;
  Active: boolean;
};
export const getBrands = async (page = 1, size = 50) => {
  return await apiClient(`/brands?page=${page}&size=${size}`);
};

export const createBrand = async (data: CreateBrandPayload) => {
  return await apiClient('/brands', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteBrand = async (id: number) => {
  return await apiClient('/brands/' + id, {
    method: 'DELETE',
  });
};
