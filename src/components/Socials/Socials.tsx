import React, { ReactElement } from 'react';

import * as styles from './Socials.module.scss';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedinIn, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

const Socials = (): ReactElement => {
  return (
    <div className={styles.wrapper}>
      <a
        href="https://linkedin.com/in/keshav-w"
        target="_blank"
        rel="noreferrer"
        aria-label="Link to Keshav's linkedin"
      >
        <FontAwesomeIcon icon={faLinkedinIn} />
      </a>
      <a
        href="https://github.com/kworathur"
        target="_blank"
        rel="noreferrer"
        aria-label="Link to Keshav's github"
      >
        <FontAwesomeIcon icon={faGithub} />
      </a>
      <a
        href="mailto:kworathur3@gatech.edu"
        target="_blank"
        rel="noreferrer"
        aria-label="Email Keshav"
      >
        <FontAwesomeIcon icon={faEnvelope} />
      </a>
    </div>
  );
};

export default Socials;
