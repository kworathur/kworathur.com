import React, { ReactElement } from 'react';

import SEO from '../SEO/SEO';

import Intro from '../Intro/Intro';
import Format from '../Format/Format';
import Projects from '../Resume/Projects/Projects';

const Homepage: React.FC = (): ReactElement => {
  return (
    <Format title={'Home'}>
      <SEO title="Home" />

      <div className="resume">
        <Intro />
        <Projects />
      </div>
    </Format>
  );
};

export default Homepage;
