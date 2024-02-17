import { useEffect, useRef } from 'react';

const CloudinaryUploadWidget = () => {
  const cloudinaryRef = useRef();
  const widgetRef = useRef();

  useEffect(() => {
    cloudinaryRef.current = window.cloudinary;
    widgetRef.current = cloudinaryRef.current.createUploadWidget({
      cloudName: 'dqqel2q07',
      uploadPreset: 'dkp3udd5',
    }, 
    (error, res) => {
      console.log(res);
    });
  }, []);

  return (
    <button onClick={() => widgetRef.current.open()}>
      Upload
    </button>
  );
}

export default CloudinaryUploadWidget;
