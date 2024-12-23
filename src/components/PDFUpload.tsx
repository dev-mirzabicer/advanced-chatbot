// src/components/PDFUpload.tsx
import React, { useContext } from 'react';
import { Box, Button } from '@mui/material';
import { DispatchContext } from '../context/StateContext';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const PDFUpload = () => {
  const dispatch = useContext(DispatchContext);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/parse-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { text } = response.data;

      // Add context document
      dispatch({
        type: 'ADD_CONTEXT_DOC',
        payload: text,
      });

      // Optionally, notify the user
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: uuidv4(),
          role: 'moderator',
          content: 'A PDF has been uploaded and parsed successfully.',
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error('Error uploading/parsing PDF:', error);
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: uuidv4(),
          role: 'moderator',
          content: 'There was an error uploading or parsing your PDF.',
          timestamp: Date.now(),
        },
      });
    }
  };

  return (
    <Box mt={2}>
      <input
        accept="application/pdf"
        style={{ display: 'none' }}
        id="contained-button-file"
        type="file"
        onChange={handleFileChange}
      />
      <label htmlFor="contained-button-file">
        <Button variant="outlined" component="span">
          Upload PDF
        </Button>
      </label>
    </Box>
  );
};

export default PDFUpload;
