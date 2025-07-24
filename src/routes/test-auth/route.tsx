import React from 'react';
import { DefaultPageLayout } from '@/ui/layouts/DefaultPageLayout';
import ConnectionTest from '../../components/ConnectionTest';

export default function TestAuthPage() {
  return (
    <DefaultPageLayout>
      <div className="space-y-8">
        <ConnectionTest />
      </div>
    </DefaultPageLayout>
  );
}