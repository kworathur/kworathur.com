import React, { ReactElement, ReactNode } from 'react';
import { graphql, Link } from 'gatsby';
import { GatsbyImage, getImage } from 'gatsby-plugin-image';

import Format from '../components/Format/Format';
import SEO from '../components/SEO/SEO';

import * as styles from './PostTemplate.module.scss';

interface PostTemplateProps {
  children?: ReactNode;
  data: {
    site: {
      siteMetadata: {
        title: string;
      };
    };
    markdownRemark: {
      html: string;
      excerpt: string;
      frontmatter: {
        title: string;
        description: string;
        date: string;
        featuredImage?: {
          publicURL: string;
          childImageSharp?: {
            gatsbyImageData: import('gatsby-plugin-image').IGatsbyImageData;
          };
        };
      };
    };
  };
  pageContext: {
    type: string;
    previous: {
      fields: {
        slug: string;
      };
      frontmatter: {
        title: string;
        type: string;
      };
    };
    next: {
      fields: {
        slug: string;
      };
      frontmatter: {
        title: string;
        type: string;
      };
    };
  };
  location: string;
}

const PostTemplate = ({
  data,
  pageContext,
}: PostTemplateProps): ReactElement => {
  // Get post data, site title
  const {
    markdownRemark: post,
    site: {
      siteMetadata: { title },
    },
  } = data;

  // Get previous page, next page from context
  const { previous, next } = pageContext;

  const featuredImage = post.frontmatter.featuredImage?.childImageSharp
    ? getImage(post.frontmatter.featuredImage.childImageSharp.gatsbyImageData)
    : undefined;

  return (
    <Format title={title}>
      <SEO
        title={post.frontmatter.title}
        description={post.frontmatter.description || post.excerpt}
        image={post.frontmatter.featuredImage?.publicURL}
      />
      <article className={styles.post}>
        <header>
          <h1 className={styles.title}>{post.frontmatter.title}</h1>
          <p>{post.frontmatter.date}</p>
          {featuredImage && (
            <GatsbyImage
              image={featuredImage}
              alt={post.frontmatter.title}
              className={styles.featuredImage}
            />
          )}
        </header>
        <section
          dangerouslySetInnerHTML={{
            __html: post.html.replace(/<a /g, '<a target="_blank" '),
          }}
        />
        <hr />
        <footer>Thanks for reading!</footer>
      </article>
      {/* Render navigation to next and previous post (if a next or previous post exists!) */}
      {(next || previous) && (
        <nav>
          <ul
            style={{
              display: `flex`,
              flexWrap: `wrap`,
              justifyContent: `space-between`,
              listStyle: `none`,
              padding: 0,
            }}
          >
            {previous && (
              <li>
                <Link
                  to={`/${previous.frontmatter.type}${previous.fields.slug}`}
                  rel="prev"
                >
                  ← {previous.frontmatter.title}
                </Link>
              </li>
            )}
            {next && (
              <li>
                <Link
                  to={`/${next.frontmatter.type}${next.fields.slug}`}
                  rel="next"
                >
                  {next.frontmatter.title} →
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </Format>
  );
};

export default PostTemplate;

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        description
        featuredImage {
          publicURL
          childImageSharp {
            gatsbyImageData(width: 900, layout: CONSTRAINED)
          }
        }
      }
    }
  }
`;
