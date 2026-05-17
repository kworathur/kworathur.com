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
        <h1 className="section-title">
          Keshav Worathur |{' '}
          <span className={styles['position']}>software engineer</span>
        </h1>
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
            flagship AI tools for polymer informatics!
          </li>
        </ul>
        <p>
          Commercial ML research and product development is where I do my best
          work and push myself to be better. I'm a proud alum of the University
          of Toronto (CS '25) and a current student at Georgia Tech (graduating
          in december)!
        </p>
      </div>
    </div>
  );
};

export default Intro;
