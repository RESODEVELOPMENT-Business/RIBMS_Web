'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createProductCategory, getProductCategories } from '@/services/productCategories';
import { useAuthStore } from '@/store/authStore';
import { ProductCategory } from '@/types/product';

export default function CreateCategoryPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const brandId = useAuthStore.getState().user?.brandId;

      const res = await getProductCategories(
        1,
        100,
        brandId || undefined
      );

      setCategories(res.data.items || res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const payload = {
      CateName: formData.get('CateName') as string,
      CateNameEng: formData.get('CateNameEng') as string,

      Type: Number(formData.get('Type')),

      IsDisplayed: formData.get('IsDisplayed') === 'on',
      IsDisplayedWebsite: formData.get('IsDisplayedWebsite') === 'on',
      IsExtra: formData.get('IsExtra') === 'on',

      DisplayOrder: Number(formData.get('DisplayOrder') || 0),

      AdjustmentNote: formData.get('AdjustmentNote') as string,

      StoreId: formData.get('StoreId')
        ? Number(formData.get('StoreId'))
        : null,

      SeoName: formData.get('SeoName') as string,
      SeoKeyword: formData.get('SeoKeyword') as string,
      SeoDescription: formData.get('SeoDescription') as string,

      ImageFontAwsomeCss: formData.get('ImageFontAwsomeCss') as string,

      ParentCateId: formData.get('ParentCateId')
        ? Number(formData.get('ParentCateId'))
        : null,

      Position: formData.get('Position')
        ? Number(formData.get('Position'))
        : null,

      Active: formData.get('Active') === 'on',

      BrandId: useAuthStore.getState().user?.brandId,

      PicUrl: formData.get('PicUrl') as string,
      BannerUrl: formData.get('BannerUrl') as string,

      Description: formData.get('Description') as string,
      DescriptionEng: formData.get('DescriptionEng') as string,

      BannerDescription: formData.get('BannerDescription') as string,
      BannerDescriptionEng: formData.get('BannerDescriptionEng') as string,

      Att1: formData.get('Att1') as string,
      Att2: formData.get('Att2') as string,
      Att3: formData.get('Att3') as string,
      Att4: formData.get('Att4') as string,
      Att5: formData.get('Att5') as string,
      Att6: formData.get('Att6') as string,
      Att7: formData.get('Att7') as string,
      Att8: formData.get('Att8') as string,
      Att9: formData.get('Att9') as string,
      Att10: formData.get('Att10') as string,

      Vat: formData.get('Vat')
        ? Number(formData.get('Vat'))
        : null,
    };

    try {
      await createProductCategory(payload);

      toast.success('Category created successfully!');

      router.push('/categories');
    } catch (err: any) {
      toast.error(`Error creating category: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          &larr; Back
        </button>

        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Create New Category
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <form onSubmit={handleCreate} className="space-y-8">

          {/* BASIC */}
          <div>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <Input
                label="Category Name"
                name="CateName"
                required
              />

              <Input
                label="English Name"
                name="CateNameEng"
              />

              <Select
                label="Parent Category"
                name="ParentCateId"
                options={categories.map((item) => ({
                  label: item.categoryName,
                  value: item.id
                }))}
              />

              <Input
                label="Type"
                name="Type"
                type="number"
                defaultValue="1"
              />

              <Input
                label="Display Order"
                name="DisplayOrder"
                type="number"
                defaultValue="0"
              />

              <Input
                label="Position"
                name="Position"
                type="number"
              />

              <Input
                label="Store ID"
                name="StoreId"
                type="number"
              />

              <Input
                label="VAT (%)"
                name="Vat"
                type="number"
                step="0.01"
              />

              <Input
                label="FontAwesome CSS"
                name="ImageFontAwsomeCss"
              />

            </div>
          </div>

          {/* SEO */}
          <div>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              SEO Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <Input
                label="SEO Name"
                name="SeoName"
              />

              <Input
                label="SEO Keyword"
                name="SeoKeyword"
              />

              <Input
                label="SEO Description"
                name="SeoDescription"
              />

            </div>
          </div>

          {/* MEDIA */}
          <div>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              Media
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Input
                label="Picture URL"
                name="PicUrl"
              />

              <Input
                label="Banner URL"
                name="BannerUrl"
              />

            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              Description
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Textarea
                label="Description"
                name="Description"
              />

              <Textarea
                label="Description English"
                name="DescriptionEng"
              />

              <Textarea
                label="Banner Description"
                name="BannerDescription"
              />

              <Textarea
                label="Banner Description English"
                name="BannerDescriptionEng"
              />

              <Textarea
                label="Adjustment Note"
                name="AdjustmentNote"
              />

            </div>
          </div>

          {/* ATTRIBUTES */}
          <div>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              Attributes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

              {Array.from({ length: 10 }).map((_, index) => (
                <Input
                  key={index}
                  label={`Att ${index + 1}`}
                  name={`Att${index + 1}`}
                />
              ))}

            </div>
          </div>

          {/* FLAGS */}
          <div>
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              Settings
            </h2>

            <div className="flex flex-wrap gap-6">

              <Checkbox
                label="Active"
                name="Active"
                defaultChecked
              />

              <Checkbox
                label="Display"
                name="IsDisplayed"
                defaultChecked
              />

              <Checkbox
                label="Display Website"
                name="IsDisplayedWebsite"
                defaultChecked
              />

              <Checkbox
                label="Extra Category"
                name="IsExtra"
              />

            </div>
          </div>

          {/* ACTION */}
          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2 border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Category'}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

function Input(props: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 dark:text-gray-300">
        {props.label}
      </label>

      <input
        {...props}
        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
    </div>
  );
}

function Textarea(props: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 dark:text-gray-300">
        {props.label}
      </label>

      <textarea
        {...props}
        rows={4}
        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
    </div>
  );
}

function Checkbox(props: any) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        {...props}
        className="w-4 h-4"
      />

      <label className="text-sm dark:text-gray-300">
        {props.label}
      </label>
    </div>
  );
}

function Select({
  label,
  name,
  options
}: {
  label: string;
  name: string;
  options: any[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 dark:text-gray-300">
        {label}
      </label>

      <select
        name={name}
        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      >
        <option value="">Select</option>

        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}