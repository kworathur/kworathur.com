import React, { ReactElement } from 'react';
import { Link } from 'gatsby';
import Toggle from '../Toggle/Toggle';
import * as styles from './Links.module.scss';
import { ThemeToggler } from 'gatsby-plugin-dark-mode';

export enum Locations {
  HOMEPAGE,
  POSTS,
}

export const Destinations = [
  {
    name: 'resume',
    path: 'https://uploads.kworathur.com/keshav_worathur_resume.pdf',
    external: true,
  },
  {
    name: 'blog',
    path: '/blog',
  },
];

interface InnerLinksProps {
  location: Locations;
}

type ToggleThemeFn = {
  (checked: string): void;
};

export interface ThemeTogglerProps {
  theme: unknown;
  toggleTheme: ToggleThemeFn;
}

const InnerLinks = (props: InnerLinksProps): ReactElement => {
  const { location } = props;

  return (
    <ThemeToggler>
      {({ theme, toggleTheme }: ThemeTogglerProps) => (
        <div className={styles[`homepageLinks`]}>
          <Link className={styles.headerLink} to={'/'}>
            <h1 className={styles.logo}>kW</h1>
          </Link>
          <div className={styles.linksAndLights}>
            {Destinations.map((d, index) => {
              return d.external ? (
                <a
                  key={index}
                  className={styles[`homepageLink`]}
                  href={d.path}
                  target="_blank"
                  rel="noreferrer"
                >
                  {d.name}
                </a>
              ) : (
                <Link
                  key={index}
                  className={styles[`homepageLink`]}
                  to={d.path}
                >
                  {d.name}
                </Link>
              );
            })}
            <Toggle
              location={location}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          </div>
        </div>
      )}
    </ThemeToggler>
  );
};

interface LinksProps {
  location: Locations;
}

const Links = (props: LinksProps): ReactElement => {
  const { location } = props;
  switch (location) {
    case Locations.HOMEPAGE:
      return (
        <div className={styles.homepageWrapper}>
          <InnerLinks location={location} />
        </div>
      );
    case Locations.POSTS:
      return (
        <div className={styles.homepageWrapper}>
          <InnerLinks location={location} />
        </div>
      );
    default:
      throw new Error(`Invalid location given in Links.tsx`);
  }
};

export default Links;
