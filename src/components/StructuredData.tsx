import { Helmet } from "react-helmet-async";

interface OrganizationSchemaProps {
  name: string;
  url: string;
  logo: string;
  description: string;
}

export const OrganizationSchema = ({ name, url, logo, description }: OrganizationSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    description,
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@cheapatlantaflights.com",
      contactType: "Customer Service",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

interface WebSiteSchemaProps {
  name: string;
  url: string;
}

export const WebSiteSchema = ({ name, url }: WebSiteSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/destinations?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

interface FAQSchemaProps {
  faqs: Array<{ question: string; answer: string }>;
}

export const FAQSchema = ({ faqs }: FAQSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

interface ArticleSchemaProps {
  title: string;
  description: string;
  author: string;
  publishedDate: string;
  modifiedDate: string;
  imageUrl: string;
  url: string;
}

export const ArticleSchema = ({
  title,
  description,
  author,
  publishedDate,
  modifiedDate,
  imageUrl,
  url,
}: ArticleSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "Cheap Singapore Flights",
      logo: {
        "@type": "ImageObject",
        url: `${window.location.origin}/logo.png`,
      },
    },
    datePublished: publishedDate,
    dateModified: modifiedDate,
    image: imageUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
