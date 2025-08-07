import axios from 'axios';

export const UploadFileToCloud = async ({file, fileName}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(
      `https://thinkzone.co/cloud-storage/uploadFile/${fileName}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return {
      success: response?.status === 200,
      url: response?.data?.url,
    };
  } catch (error) {
    if (error.response && error.response.status === 413) {
      console.error(`The file is too large ---> ${error}`);
    } else {
      console.error('Error uploading file:', error);
    }
    return {success: false, url: null};
  }
};

export const deleteFileFromDB = item => {
  axios
    .delete(
      `https://thinkzone.co/cloud-storage/deleteFile/${
        item.split('/')[item.split('/').length - 1]
      }`,
    )
    .then(res => {
      console.log('delet response--->', res.status, res);
      if (res.status === 200) {
        // console.log("This has been called perhaps...");
      }
    })
    .catch(err => {
      console.error('The following error happened------------>', err);
    });
};
