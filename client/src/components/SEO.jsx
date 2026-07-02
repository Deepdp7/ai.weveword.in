import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title = "WaveWord AI — Free AI Platform for Chat, Images, Code & Productivity",
  description = "WaveWord AI helps you chat with AI, generate images, write content, code faster, and boost productivity using multiple AI models in one place.",
  keywords = "AI, ChatGPT alternative, image generator, PDF tools, AI coding, productivity suite, WaveWord AI",
  canonical = "/",
  image = "https://ai.waveword.in/logo.png",
  type = "website"
}) => {
  const siteUrl = "https://ai.waveword.in";
  // Ensure canonical starts with /
  const canonicalPath = canonical.startsWith('/') ? canonical : `/${canonical}`;
  const canonicalUrl = `${siteUrl}${canonicalPath}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": type === 'article' ? "Article" : "WebSite",
    "name": title,
    "description": description,
    "url": canonicalUrl,
    "image": image,
    "publisher": {
      "@type": "Organization",
      "name": "WaveWord AI",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`
      }
    }
  };

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="WaveWord AI" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content="@WaveWordAI" />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};

export default SEO;
