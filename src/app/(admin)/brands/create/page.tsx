'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createBrand, type CreateBrandPayload } from '@/services/brands';

export default function CreateBrandPage() {
  const router = useRouter();
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const brand: CreateBrandPayload = {
      Email: formData.get('Email') as string,
      Password: formData.get('Password') as string,
      UserName: (formData.get('UserName') as string) || null,
      FullName: (formData.get('FullName') as string) || null,
      BrandName: formData.get('BrandName') as string,
      CompanyName: (formData.get('CompanyName') as string) || null,
      ContactPerson: (formData.get('ContactPerson') as string) || null,
      PhoneNumber: (formData.get('PhoneNumber') as string) || null,
      Fax: (formData.get('Fax') as string) || null,
      Website: (formData.get('Website') as string) || null,
      Vatcode: (formData.get('Vatcode') as string) || null,
      Vattemplate: formData.get('Vattemplate') ? Number(formData.get('Vattemplate')) : null,
      Address: (formData.get('Address') as string) || null,
      Description: (formData.get('Description') as string) || null,
      ApiSmskey: (formData.get('ApiSmskey') as string) || null,
      SecurityApiSmskey: (formData.get('SecurityApiSmskey') as string) || null,
      Smstype: formData.get('Smstype') ? Number(formData.get('Smstype')) : null,
      BrandNameSms: (formData.get('BrandNameSms') as string) || null,
      JsonConfigUrl: (formData.get('JsonConfigUrl') as string) || null,
      BrandFeatureFilter: (formData.get('BrandFeatureFilter') as string) || null,
      WiskyId: formData.get('WiskyId') ? Number(formData.get('WiskyId')) : null,
      DefaultDashBoard: (formData.get('DefaultDashBoard') as string) || null,
      RsaprivateKey: (formData.get('RsaprivateKey') as string) || null,
      RsapublicKey: (formData.get('RsapublicKey') as string) || null,
      Pgppassword: (formData.get('Pgppassword') as string) || null,
      PgpprivateKey: (formData.get('PgpprivateKey') as string) || null,
      PgppulblicKey: (formData.get('PgppulblicKey') as string) || null,
      DesKey: (formData.get('DesKey') as string) || null,
      DesVector: (formData.get('DesVector') as string) || null,
      AccessToken: (formData.get('AccessToken') as string) || null,
      TaxCode: (formData.get('TaxCode') as string) || null,
      Active: formData.get('Active') === 'on',
    };

    try {
     const result = await createBrand(brand);
      toast.success(result.message);
      router.push('/brands');
    } catch (err: any) {
      console.error("Error creating brand:", err);
      toast.error(`Error creating brand: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Create New Brand</h1>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold dark:text-white mb-2">Account Details</h2>
            <hr className="mb-4 dark:border-gray-700" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email (*)</label>
            <input required type="email" name="Email" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Password (*)</label>
            <input required type="password" name="Password" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">User Name</label>
            <input type="text" name="UserName" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Full Name</label>
            <input type="text" name="FullName" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>

          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold dark:text-white mb-2">Brand Details</h2>
            <hr className="mb-4 dark:border-gray-700" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Brand Name (*)</label>
            <input required type="text" name="BrandName" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Company Name</label>
            <input type="text" name="CompanyName" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Contact Person</label>
            <input type="text" name="ContactPerson" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Phone Number</label>
            <input type="text" name="PhoneNumber" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Fax</label>
            <input type="text" name="Fax" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Website</label>
            <input type="text" name="Website" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">VAT Code</label>
            <input type="text" name="Vatcode" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">VAT Template (ID)</label>
            <input type="number" name="Vattemplate" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Address</label>
            <input type="text" name="Address" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label>
            <textarea name="Description" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
          </div>
          
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold dark:text-white mb-2">Integration & Settings</h2>
            <hr className="mb-4 dark:border-gray-700" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">API SMS Key</label>
            <input type="text" name="ApiSmskey" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Security API SMS Key</label>
            <input type="text" name="SecurityApiSmskey" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">SMS Type</label>
            <input type="number" name="Smstype" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Brand Name SMS</label>
            <input type="text" name="BrandNameSms" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">JSON Config URL</label>
            <input type="text" name="JsonConfigUrl" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Brand Feature Filter</label>
            <input type="text" name="BrandFeatureFilter" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Wisky ID</label>
            <input type="number" name="WiskyId" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Default Dashboard</label>
            <input type="text" name="DefaultDashBoard" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold dark:text-white mb-2">Security Keys</h2>
            <hr className="mb-4 dark:border-gray-700" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">RSA Private Key</label>
            <input type="text" name="RsaprivateKey" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">RSA Public Key</label>
            <input type="text" name="RsapublicKey" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">PGP Password</label>
            <input type="text" name="Pgppassword" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">PGP Private Key</label>
            <input type="text" name="PgpprivateKey" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">PGP Public Key</label>
            <input type="text" name="PgppulblicKey" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">DES Key</label>
            <input type="text" name="DesKey" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">DES Vector</label>
            <input type="text" name="DesVector" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Access Token</label>
            <input type="text" name="AccessToken" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tax Code</label>
            <input type="text" name="TaxCode" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>

          <div className="md:col-span-2 flex items-center gap-2 mt-4">
            <input type="checkbox" name="Active" id="active" defaultChecked className="w-4 h-4 text-blue-600" />
            <label htmlFor="active" className="text-sm font-medium dark:text-gray-300">Active</label>
          </div>
          
          <div className="md:col-span-2 mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Save Brand</button>
          </div>
        </form>
      </div>
    </div>
  );
}
