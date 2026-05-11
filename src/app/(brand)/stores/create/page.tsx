'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createStore, StoreData } from '@/services/stores';

export default function CreateStorePage() {
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const payload: StoreData = {
      Email: formData.get("Email") as string,
      Password: formData.get("Password") as string,
      FullName: formData.get("FullName") as string,
      UserName: formData.get("UserName") as string,
        // Basic Information
        Name: formData.get("Name") as string,
        ShortName: formData.get("ShortName") as string,
        Address: formData.get("Address") as string,
        Phone: formData.get("Phone") as string,
        Fax: formData.get("Fax") as string,
        
        // Location
        Lat: formData.get("Lat") as string,
        Lon: formData.get("Lon") as string,
        Province: formData.get("Province") as string,
        District: formData.get("District") as string,
        Ward: formData.get("Ward") as string,
        
        GroupId: formData.get("GroupId") ? Number(formData.get("GroupId")) : null,
        RoomRentMode: formData.get("RoomRentMode") ? Number(formData.get("RoomRentMode")) : null,
        Type: Number(formData.get("Type")) || 5,
        IsAvailable: formData.get("IsAvailable") === "on",
        Active: formData.get("Active") === "on",
        
        // Operating Hours
        OpenTime: formData.get("OpenTime") ? new Date(formData.get("OpenTime") as string).toISOString() : null,
        CloseTime: formData.get("CloseTime") ? new Date(formData.get("CloseTime") as string).toISOString() : null,
        
        // Features and Capabilities
        HasProducts: formData.get("HasProducts") === "on",
        HasNews: formData.get("HasNews") === "on",
        HasImageCollections: formData.get("HasImageCollections") === "on",
        HasMultipleLanguage: formData.get("HasMultipleLanguage") === "on",
        HasWebPages: formData.get("HasWebPages") === "on",
        HasCustomerFeedbacks: formData.get("HasCustomerFeedbacks") === "on",
        HasOrder: formData.get("HasOrder") === "on",
        HasBlogEditCollections: formData.get("HasBlogEditCollections") === "on",
        
        // Configuration
        DefaultAdminPassword: formData.get("DefaultAdminPassword") as string,
        LogoUrl: formData.get("LogoUrl") as string,
        StoreCode: formData.get("StoreCode") as string,
        PosId: formData.get("PosId") ? Number(formData.get("PosId")) : null,
        StoreConfig: formData.get("StoreConfig") as string,
        DefaultDashBoard: formData.get("DefaultDashBoard") as string,
        PaymentTypeApply: formData.get("PaymentTypeApply") ? Number(formData.get("PaymentTypeApply")) : null,
        ModeStore: formData.get("ModeStore") ? Number(formData.get("ModeStore")) : null,
        RunReport: formData.get("RunReport") === "on",
        AttendanceStoreFilter: formData.get("AttendanceStoreFilter") ? Number(formData.get("AttendanceStoreFilter")) : null,
        StoreFeatureFilter: formData.get("StoreFeatureFilter") as string,
    };
    try {
      await createStore(payload);
      toast.success('Store created successfully!');
      router.push('/stores');
    } catch (err: any) {
      toast.error(`Error creating store: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Create New Store</h1>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* StoreManager Account Details */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold dark:text-white mb-2">StoreManager Account Details</h2>
            <hr className="mb-4 dark:border-gray-700" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email (*)</label>
            <input type="email" name="Email" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="manager@store.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Password (*)</label>
            <input type="password" name="Password" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Leave empty for default password" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">User Name (*)</label>
            <input type="text" name="UserName" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="manager_username" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Full Name (*)</label>
            <input type="text" name="FullName" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Store Manager Name" />
          </div>

          {/* Store Details */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold dark:text-white mb-2">Store Details</h2>
            <hr className="mb-4 dark:border-gray-700" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Store Name (*)</label>
            <input required type="text" name="Name" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Short Name</label>
            <input type="text" name="ShortName" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Store Code</label>
            <input type="text" name="StoreCode" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Phone</label>
            <input type="text" name="Phone" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Fax</label>
            <input type="text" name="Fax" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          {/* <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Type</label>
            <select name="Type" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="1">Type 1</option>
              <option value="2">Type 2</option>
              <option value="3">Type 3</option>
            </select>
          </div> */}
          {/* <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Group ID</label>
            <input type="number" name="GroupId" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div> */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Room Rent Mode</label>
            <input type="number" name="RoomRentMode" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Address</label>
            <input type="text" name="Address" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          
          {/* Location Details */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold dark:text-white mb-2">Location Details</h2>
            <hr className="mb-4 dark:border-gray-700" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Latitude</label>
            <input type="text" name="Lat" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Longitude</label>
            <input type="text" name="Lon" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Province</label>
            <input type="text" name="Province" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">District</label>
            <input type="text" name="District" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Ward</label>
            <input type="text" name="Ward" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          
          {/* Operating Hours */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold dark:text-white mb-2">Operating Hours</h2>
            <hr className="mb-4 dark:border-gray-700" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Open Time</label>
            <input type="time" name="OpenTime" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Close Time</label>
            <input type="time" name="CloseTime" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          
          {/* Configuration */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold dark:text-white mb-2">Configuration</h2>
            <hr className="mb-4 dark:border-gray-700" />
          </div>

          {/* <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">POS ID</label>
            <input type="number" name="PosId" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div> */}
          {/* <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Payment Type Apply</label>
            <input type="number" name="PaymentTypeApply" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div> */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Mode Store</label>
            <input type="number" name="ModeStore" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          {/* <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Default Admin Password</label>
            <input type="password" name="DefaultAdminPassword" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div> */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Logo URL</label>
            <input type="url" name="LogoUrl" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          {/* <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Default Dashboard</label>
            <input type="text" name="DefaultDashBoard" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div> */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Attendance Store Filter</label>
            <input type="number" name="AttendanceStoreFilter" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          {/* <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Store Config (JSON)</label>
            <textarea name="StoreConfig" rows={3} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div> */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Store Feature Filter</label>
            <input type="text" name="StoreFeatureFilter" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          
          {/* Features & Capabilities */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold dark:text-white mb-2">Features & Capabilities</h2>
            <hr className="mb-4 dark:border-gray-700" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="IsAvailable" id="isAvailable" defaultChecked className="w-4 h-4 text-blue-600" />
            <label htmlFor="isAvailable" className="text-sm font-medium dark:text-gray-300">Is Available</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="Active" id="active" defaultChecked className="w-4 h-4 text-blue-600" />
            <label htmlFor="active" className="text-sm font-medium dark:text-gray-300">Active</label>
          </div>
          {/* <div className="flex items-center gap-2">
            <input type="checkbox" name="HasProducts" id="hasProducts" defaultChecked className="w-4 h-4 text-blue-600" />
            <label htmlFor="hasProducts" className="text-sm font-medium dark:text-gray-300">Has Products</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="HasNews" id="hasNews" defaultChecked className="w-4 h-4 text-blue-600" />
            <label htmlFor="hasNews" className="text-sm font-medium dark:text-gray-300">Has News</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="HasImageCollections" id="hasImageCollections" defaultChecked className="w-4 h-4 text-blue-600" />
            <label htmlFor="hasImageCollections" className="text-sm font-medium dark:text-gray-300">Has Image Collections</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="HasMultipleLanguage" id="hasMultipleLanguage" className="w-4 h-4 text-blue-600" />
            <label htmlFor="hasMultipleLanguage" className="text-sm font-medium dark:text-gray-300">Has Multiple Language</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="HasWebPages" id="hasWebPages" defaultChecked className="w-4 h-4 text-blue-600" />
            <label htmlFor="hasWebPages" className="text-sm font-medium dark:text-gray-300">Has Web Pages</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="HasCustomerFeedbacks" id="hasCustomerFeedbacks" defaultChecked className="w-4 h-4 text-blue-600" />
            <label htmlFor="hasCustomerFeedbacks" className="text-sm font-medium dark:text-gray-300">Has Customer Feedbacks</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="HasOrder" id="hasOrder" defaultChecked className="w-4 h-4 text-blue-600" />
            <label htmlFor="hasOrder" className="text-sm font-medium dark:text-gray-300">Has Order</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="HasBlogEditCollections" id="hasBlogEditCollections" className="w-4 h-4 text-blue-600" />
            <label htmlFor="hasBlogEditCollections" className="text-sm font-medium dark:text-gray-300">Has Blog Edit Collections</label>
          </div> */}
          <div className="flex items-center gap-2">
            <input type="checkbox" name="RunReport" id="runReport" defaultChecked className="w-4 h-4 text-blue-600" />
            <label htmlFor="runReport" className="text-sm font-medium dark:text-gray-300">Run Report</label>
          </div>
          
          <div className="md:col-span-2 mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Save Store</button>
          </div>
        </form>
      </div>
    </div>
  );
}
