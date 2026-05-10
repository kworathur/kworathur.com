import type { GatsbyConfig } from 'gatsby';

const config: GatsbyConfig = {
  siteMetadata: {
    title: 'kworathur.com',
    author: {
      name: 'Keshav Worathur',
      summary: `an aspiring software engineer completing his master's at the Georgia Institute of Technology in Atlanta, GA.`,
    },
    description: "Keshav Worathur's developer portfolio.",
    siteUrl: 'https://kworathur.com',
    social: {
      linkedin: 'kworathur',
    },
  },
  trailingSlash: `never`,
  plugins: [
    `gatsby-plugin-sass`,
    `gatsby-plugin-image`,
    {
      resolve: 'gatsby-plugin-react-svg',
      options: {
        rule: {
          include: `${__dirname}/content/assets`,
        },
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/assets`,
        name: `assets`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 590,
              linkImagesToOriginal: true,
              showCaptions: ['title', 'alt'],
              quality: 50,
              wrapperStyle: `margin: 0 auto; text-align: center; font-style: italic;`,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          `gatsby-remark-prismjs`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Keshav Worathur's Blog`,
        short_name: `Keshav's Blog`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#202020`,
        display: `minimal-ui`,
        icon: `content/assets/kw-favicon.svg`,
      },
    },
    `gatsby-plugin-react-helmet`,
    'gatsby-plugin-dark-mode',
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `src/utils/typography`,
      },
    },
    // Enable PWA and offline functionality
    `gatsby-plugin-offline`,
    'gatsby-plugin-webpack-bundle-analyser-v2',
  ],
};

export default config;
