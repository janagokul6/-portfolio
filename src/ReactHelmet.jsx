import React from 'react'
import { Helmet } from 'react-helmet'

const ReactHelmet = () => {
  const metaData = {
    title: 'Gokul Jana - Full-Stack Developer',
    description: 'Portfolio of Gokul Jana, a passionate Full-Stack Developer with expertise in MERN stack.',
    keywords: 'Full-Stack Developer, MERN stack, Web Developer, JavaScript, React, Node.js, TypeScript',
    author: 'Gokul Jana',
    image: 'URL_TO_YOUR_PROFILE_IMAGE',
    siteUrl: 'https://janagokul.netlify.app',
  };

  return (
      <Helmet>
        <title>{metaData.title}</title>
        <meta name="description" content={metaData.description} />
        <meta name="keywords" content={metaData.keywords} />
        <meta name="author" content={metaData.author} />
        <meta property="og:title" content={metaData.title} />
        <meta property="og:description" content={metaData.description} />
        <meta property="og:image" content={metaData.image} />
        <meta property="og:url" content={metaData.siteUrl} />
        <meta name="twitter:title" content={metaData.title} />
        <meta name="twitter:description" content={metaData.description} />
        <meta name="twitter:image" content={metaData.image} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

  )
}

export default ReactHelmet