import React from 'react'
import { AdvancedImage } from '@cloudinary/react';
import { Cloudinary } from "@cloudinary/url-gen";

const Image = ({ id }) => {
  const cld = new Cloudinary({
    cloud: {
      cloudName: 'dqqel2q07'
    }
  });

  const img = cld.image({ id });

  return (
    <div>
      <AdvancedImage cldImg={img}/>
    </div>
  );
};

export default Image;
