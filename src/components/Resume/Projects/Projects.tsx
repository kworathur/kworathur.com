import React, { ReactElement } from 'react';

import * as styles from './Projects.module.scss';

import resume from '../../../data/resume.json';
import cv from '../../../data/cv.json';
import { graphql, useStaticQuery } from 'gatsby';
import { GatsbyImage, getImage, ImageDataLike } from 'gatsby-plugin-image';

const Projects = (): ReactElement => {
  const projectIds = resume.projects;
  const projects = cv.projects.filter((project) => {
    return projectIds.includes(project.id);
  });
  const data = useStaticQuery(graphql`
    query {
      allFile(
        filter: { absolutePath: { regex: "/screens/" } }
        sort: { absolutePath: ASC }
      ) {
        nodes {
          childImageSharp {
            gatsbyImageData(layout: FULL_WIDTH, placeholder: BLURRED)
          }
          absolutePath
        }
      }
    }
  `);

  return (
    <>
      <h2 className="section-title">
        My Work | <span className="detail">work experiences and projects</span>
      </h2>

      <div className="section">
        {projects.map((project, i) => {
          return (
            <div key={i}>
              <h3 className={styles['projectHeading']}>{project.name}</h3>
              <p>{project.summary}</p>
              <div className={styles['projectMediaCarousel']}>
                <ul className={styles['carousel']}>
                  {data.allFile.nodes
                    .filter((n: ImageDataLike & { absolutePath: string }) =>
                      n.absolutePath.includes(project.id)
                    )
                    .map(
                      (
                        n: ImageDataLike & { absolutePath: string },
                        i: number
                      ) => {
                        const image = getImage(n);
                        const thumb = image?.images?.fallback?.src;

                        return (
                          <li
                            key={i}
                            className={styles['carouselSlide']}
                            data-label={`Slide ${i + 1}`}
                            style={
                              {
                                '--thumbnail': `url(${thumb})`,
                              } as React.CSSProperties
                            }
                          >
                            <GatsbyImage alt="" image={image!} />
                          </li>
                        );
                      }
                    )}
                </ul>
              </div>

              <ul>
                {project.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>
              <div className="techstack">
                {project.technologies.map((tech, i) => (
                  <div className="tech" key={i}>
                    {tech}
                  </div>
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
