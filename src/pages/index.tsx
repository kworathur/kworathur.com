import React, { ReactElement } from 'react';
import Homepage from '../components/Homepage/Homepage';

export const Head = () => (
  <script
    defer
    src="https://cloud.umami.is/script.js"
    data-website-id="debd09d3-019b-4a83-98c8-78e3b844df35"
  ></script>
);

const Index: React.FC = (): ReactElement => {
  return <Homepage />;
};

export default Index;
