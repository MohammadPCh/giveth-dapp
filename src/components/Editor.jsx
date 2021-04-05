import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import { toast } from 'react-toastify';
import { resizeFile } from '../lib/helpers';
import IPFSService from '../services/IPFSService';
import config from '../configuration';

import VideoPopup from './VideoPopup';
import Loader from './Loader';

function Editor(props) {
  const [uploading, setUploading] = useState(false);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);

  const reactQuillRef = useRef();
  const imageUploader = useRef();
  const imageContainer = useRef();

  function imageHandler() {
    imageUploader.current.click();
  }

  function insertToEditor(file, range) {
    const image = document.createElement('img');
    image.src = file.url;
    imageContainer.current.appendChild(image);

    image.onload = () => {
      const quill = reactQuillRef.current.getEditor();
      quill.deleteText(range.index, 1);
      // const range = quill.getSelection();
      quill.insertEmbed(range.index, 'image', file.url);
      quill.setSelection(range.index + 1);

      setUploading(false);
      quill.enable();
    };

    image.onerror = () => {
      const quill = reactQuillRef.current.getEditor();
      quill.deleteText(range.index, 1);
      setUploading(false);
      quill.enable();
    };
  }

  function saveToServer(image, range) {
    setUploading(true);
    IPFSService.upload(image)
      .then(hash => insertToEditor({ url: config.ipfsGateway + hash.slice(6) }, range))
      .catch(() => {
        toast.error('Cannot connect to IPFS server. Please try again');
        const quill = reactQuillRef.current.getEditor();
        quill.deleteText(range.index, 1);
        setUploading(false);
        quill.enable();
      });
  }

  const showVideoModal = () => {
    setIsVideoModalVisible(true);
  };

  const handleVideoModalCancel = () => {
    setIsVideoModalVisible(false);
  };

  const videoHandler = () => {
    showVideoModal();
  };

  useEffect(() => {
    const toolbar = reactQuillRef.current.getEditor().getModule('toolbar');
    toolbar.addHandler('image', imageHandler);
    toolbar.addHandler('video', videoHandler);
  }, []);

  async function handleImageUpload() {
    const file = imageUploader.current.files[0];
    if (!file) return;

    const reader = new FileReader();

    // file type is only image.
    if (/^image\//.test(file.type)) {
      const compressFile = await resizeFile(file);
      reader.onload = e => {
        const quill = reactQuillRef.current.getEditor();
        const range = quill.getSelection();

        quill.insertEmbed(range.index, 'image', e.target.result);
        quill.setSelection(range.index + 1);
        quill.disable();

        saveToServer(e.target.result, range);
        imageUploader.current.value = '';
      };
      reader.readAsDataURL(compressFile);
    } else {
      console.warn('You could only upload images.');
    }
  }

  const { placeholder, onChange, value } = props;

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image', 'video'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'blockquote',
    'list',
    'bullet',
    'link',
    'image',
    'video',
    'template',
  ];

  return (
    <div>
      <div style={{ display: 'none' }} ref={imageContainer} />
      <input
        style={{ display: 'none' }}
        type="file"
        onChange={handleImageUpload}
        ref={imageUploader}
      />
      <div className="quill-wrapper">
        {uploading && (
          <div className="loading-overlay">
            <Loader />
          </div>
        )}
        <ReactQuill
          height="200px"
          ref={reactQuillRef}
          modules={modules}
          formats={formats}
          value={value}
          name="description"
          placeholder={placeholder}
          onChange={onChange}
          id="quill-ant"
          theme="snow"
        />
      </div>
      <VideoPopup
        visible={isVideoModalVisible}
        handleClose={handleVideoModalCancel}
        reactQuillRef={reactQuillRef}
      />
    </div>
  );
}

Editor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

Editor.defaultProps = {
  value: '',
  placeholder: '',
};

export default Editor;