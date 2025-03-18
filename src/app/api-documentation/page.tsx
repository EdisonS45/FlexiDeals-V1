"use client"

import { RedocStandalone } from 'redoc';

export default function APIDocumentationPage() {
  return (
    <RedocStandalone
      specUrl="/swagger.json"
      options={{
        theme: { colors: { primary: { main: '#2563eb' } } },
        hideDownloadButton: true,
        expandResponses: "200,400",
      }}
    />
  );
}

