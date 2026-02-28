import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    name?: string;
    type?: string;
    image?: string;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    name = "Transmit.AI",
    type = "website",
    image = "https://www.transmittal.co.uk/og-image.png"
}) => {
    const siteTitle = title ? `${title} | ${name}` : name;
    const metaDescription = description || "Automate construction document extraction with AI. Convert PDFs to Excel, extract metadata, and manage revisions effortlessly.";

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{siteTitle}</title>
            <meta name='description' content={metaDescription} />

            {/* Open Graph tags */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={image} />

            {/* Twitter tags */}
            <meta name="twitter:creator" content={name} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={metaDescription} />

            {/* Viewport for mobile optimization - ensuring it's present/correct */}
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Helmet>
    );
};

export default SEO;
