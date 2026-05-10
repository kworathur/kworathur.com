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
}

const SEO = ({ description, lang, meta, title }: SEOProps): ReactElement => {
  const { site } = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
          description
        }
      }
    }
  `);

  const metaDescription: string = description || site.siteMetadata.description;

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
      ].concat(meta as ConcatArray<Meta>)}
    >
      <script
        defer
        src="https://cloud.umami.is/script.js"
        data-website-id="debd09d3-019b-4a83-98c8-78e3b844df35"
      ></script>
    </Helmet>
  );
};

SEO.defaultProps = {
  lang: `en`,
  meta: [],
  description: ``,
};

export default SEO;
