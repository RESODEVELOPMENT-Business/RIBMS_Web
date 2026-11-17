'use client';

import React from 'react';
import BrandArticleEditor from '../../_components/BrandArticleEditor';

export default function EditBrandArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const parsedId = Number(resolvedParams.id);

  return <BrandArticleEditor mode="edit" articleId={parsedId} />;
}
