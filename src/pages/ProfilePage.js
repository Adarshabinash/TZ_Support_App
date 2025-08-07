import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  PermissionsAndroid,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {recognize, downloadModel} from '@react-native-ml-kit/text-recognition';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';

const OdiaOCR = () => {
  const [imageUri, setImageUri] = useState(null);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Pre-download Odia language model
  useEffect(() => {
    const loadModel = async () => {
      try {
        await downloadModel({language: 'or'}); // 'or' = Odia
        ToastAndroid.show('Odia OCR model loaded!', ToastAndroid.SHORT);
      } catch (err) {
        ToastAndroid.show('Failed to load Odia model', ToastAndroid.LONG);
        console.error('Model error:', err);
      }
    };
    loadModel();
  }, []);

  // Request Android permissions
  const requestPermissions = async () => {
    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      return Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED,
      );
    } catch (err) {
      console.error('Permission error:', err);
      ToastAndroid.show('Permission denied!', ToastAndroid.LONG);
      return false;
    }
  };

  // Improve image quality for OCR
  const preprocessImage = async uri => {
    try {
      const resizedImage = await ImageResizer.createResizedImage(
        uri,
        1200, // width
        1600, // height
        'JPEG',
        85, // quality
        0, // rotation
        null, // outputPath (cache)
        false, // no base64
      );
      return resizedImage.uri;
    } catch (err) {
      console.warn('Image processing failed, using original:', err);
      return uri;
    }
  };

  // Handle image selection
  const handleImage = async source => {
    if (!(await requestPermissions())) return;

    setIsProcessing(true);
    setText('');

    try {
      const picker = source === 'camera' ? launchCamera : launchImageLibrary;
      const result = await picker({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      });

      if (result.didCancel || !result.assets?.[0]?.uri) {
        setIsProcessing(false);
        return;
      }

      const uri = result.assets[0].uri;
      setImageUri(uri);

      // Preprocess and run OCR
      const processedUri = await preprocessImage(uri);
      await runOCR(processedUri);
    } catch (err) {
      console.error('Image error:', err);
      ToastAndroid.show('Failed to process image', ToastAndroid.LONG);
      setIsProcessing(false);
    }
  };

  // Run OCR on the image
  const runOCR = async uri => {
    try {
      let filePath = uri;
      if (uri.startsWith('content://')) {
        filePath = `${RNFS.CachesDirectoryPath}/${Date.now()}.jpg`;
        await RNFS.copyFile(uri, filePath);
      }

      const result = await recognize({
        imagePath: filePath,
        language: 'or', // Odia language code
      });

      // Clean Odia text
      const odiaText = result.text
        .replace(/[^\u0B00-\u0B7F\s]/g, '') // Remove non-Odia chars
        .replace(/\s+/g, ' ') // Collapse spaces
        .trim();

      setText(odiaText || 'No Odia text detected');
    } catch (err) {
      console.error('OCR Error:', err);
      ToastAndroid.show('OCR failed!', ToastAndroid.LONG);
      setText('Failed to recognize text');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>📖 Odia OCR (Android)</Text>

      <TouchableOpacity
        style={[styles.button, isProcessing && styles.disabledButton]}
        onPress={() => handleImage('gallery')}
        disabled={isProcessing}>
        <Text style={styles.buttonText}>
          {isProcessing ? 'Processing...' : 'Select Image'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isProcessing && styles.disabledButton]}
        onPress={() => handleImage('camera')}
        disabled={isProcessing}>
        <Text style={styles.buttonText}>
          {isProcessing ? 'Processing...' : 'Take Photo'}
        </Text>
      </TouchableOpacity>

      {isProcessing && <ActivityIndicator size="large" color="#3498db" />}

      {imageUri && <Image source={{uri: imageUri}} style={styles.image} />}

      {text ? (
        <View style={styles.textContainer}>
          <Text style={styles.textLabel}>Extracted Odia Text:</Text>
          <Text style={styles.textContent} selectable>
            {text}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'contain',
    marginVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
  },
  textLabel: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default OdiaOCR;
