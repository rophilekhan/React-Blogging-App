import React from 'react'
import { Typography } from '@mui/material'

const BlogPost = ({ blog }) => {
  return (
    <div className='p-2 border border-gray-200 rounded shadow-md'>
      {blog && blog.title && (
        <Typography variant='h5' fontWeight='bold'>{blog.title}</Typography>
      )}
      {blog && blog.article && (
        <Typography variant='body1'>{blog.article}</Typography>
      )}
    </div>
  )
}

export default BlogPost