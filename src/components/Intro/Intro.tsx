import React, { ReactElement } from 'react';
import { rhythm } from '../../utils/typography';
import * as styles from './Intro.module.scss';

const Intro = (): ReactElement => {
  return (
    <div
      style={{
        marginLeft: `auto`,
        marginRight: `auto`,
        maxWidth: rhythm(37.5),
        display: 'flex',
      }}
    >
      <div className={styles['intro']}>
        <div className={styles['tagline']}>
          <h1 className="section-title">Keshav</h1>{' '}
          <div className={styles['divider']}></div>{' '}
          <span>software engineer</span>
        </div>
        <p>Welcome to my website! I'm a software engineer that's:</p>
        <ul>
          <li>
            Built <strong>pre-processing pipelines</strong> in Python to ingest
            3,000+ protein structures, trained{' '}
            <strong>deep learning models</strong> to see and understand 3D data
            like a chemist, and deployed models to{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://gene2lead.com/"
            >
              Gene2Lead, Ltd.'s
            </a>{' '}
            industry leading drug discovery platform.
          </li>
          <li>
            Currently: Optimizing the <strong>cloud infrastructure</strong> and{' '}
            <strong>batch workflows</strong> powering{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.matmerize.com/"
            >
              Matmerize's
            </a>{' '}
            flagship AI platform!
          </li>
        </ul>
        <p>
          My experience spans applied ML and systems, which I've been exploring
          further while pursuing my MS at Georgia Tech. I'm a proud alum of the
          University of Toronto (CS '25)!
        </p>
        <p>Hobbies: swimming, public speaking, rock music</p>
      </div>
    </div>
  );
};

export default Intro;
