import React, { ReactElement } from 'react';

import * as styles from './Projects.module.scss';

import resume from '../../../data/resume.json';
import cv from '../../../data/cv.json';
import { graphql, useStaticQuery } from 'gatsby';
import {
  GatsbyImage,
  getImage,
  IGatsbyImageData,
  ImageDataLike,
} from 'gatsby-plugin-image';

const Projects = (): ReactElement => {
  const projectIds = resume.projects;
  const projects = cv.projects.filter((project) => {
    return projectIds.includes(project.id);
  });
  const data = useStaticQuery(graphql`
    query {
      allFile(filter: { absolutePath: { regex: "/screens/" } }) {
        nodes {
          childImageSharp {
            gatsbyImageData(layout: FULL_WIDTH, placeholder: BLURRED)
          }
          absolutePath
        }
      }
    }
  `);
  console.log('Screen data ', data);

  return (
    <>
      <h2 className="section-title">Selected Work</h2>

      <div className="section">
        {projects.map((project, i) => {
          return (
            <div key={i}>
              <h3 className={styles['projectHeading']}>{project.name}</h3>
              <p>{project.summary}</p>
              <div>
                {data.allFile.nodes
                  .filter((n: ImageDataLike & { absolutePath: string }) => {
                    console.log(project.id);
                    console.log(n.absolutePath);
                    console.log(n.absolutePath.includes(project.id));
                    return n.absolutePath.includes(project.id);
                  })
                  .map((n: ImageDataLike, i: number) => (
                    //@ts-ignore
                    <GatsbyImage key={i} alt="alt" image={getImage(n)} />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Projects;
