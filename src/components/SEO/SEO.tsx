import React, { ReactElement } from 'react';
import Helmet from 'react-helmet';
import { useStaticQuery, graphql } from 'gatsby';

type Meta =
  | { name: string; content: string; property?: undefined }
  | { property: string; content: string; name?: undefined };
interface SEOProps {
  description?: string;
  lang?: string;
  meta: Meta[];
  title: string;
  image?: string;
}

const SEO = ({ description, lang, meta, title, image }: SEOProps): ReactElement => {
  const { site } = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
          description
          siteUrl
        }
      }
    }
  `);

  const metaDescription: string = description || site.siteMetadata.description;
  const absoluteImage = image
    ? `${site.siteMetadata.siteUrl}${image}`
    : undefined;

  const imageMeta: Meta[] = absoluteImage
    ? [
        { property: `og:image`, content: absoluteImage },
        { name: `twitter:card`, content: `summary_large_image` },
        { name: `twitter:image`, content: absoluteImage },
      ]
    : [];

  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      titleTemplate={`%s | ${site.siteMetadata.title}`}
      meta={[
        {
          name: `description`,
          content: metaDescription,
        },
        {
          property: `og:title`,
          content: title,
        },
        {
          property: `og:description`,
          content: metaDescription,
        },
        {
          property: `og:type`,
          content: `website`,
        },
        ...imageMeta,
      ].concat(meta as ConcatArray<Meta>)}
    />
  );
};

SEO.defaultProps = {
  lang: `en`,
  meta: [],
  description: ``,
};

export default SEO;
