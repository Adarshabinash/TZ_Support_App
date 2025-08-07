import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  PermissionsAndroid,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  LogBox,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
// TextRecognition has been removed as it's not suitable for shape detection
import DocumentScanner from 'react-native-document-scanner-plugin';
import AzureImage from './AzureImage'; // Assuming this handles the upload to get a URL

LogBox.ignoreLogs(['ViewPropTypes will be removed']);

const {width, height} = Dimensions.get('window');

const AndroidDocumentScanner = () => {
  const [imageUri, setImageUri] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({width: 0, height: 0});
  const [markedColumns, setMarkedColumns] = useState([]);
  console.log('markedColumns', markedColumns);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      setHasCameraPermission(granted);
      return granted;
    } catch (err) {
      console.log('Permission check error:', err);
      return false;
    }
  };

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs camera access to scan documents',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        },
      );
      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      setHasCameraPermission(isGranted);
      return isGranted;
    } catch (err) {
      console.log('Permission request error:', err);
      return false;
    }
  };

  /**
   * !!! THIS IS THE MOST IMPORTANT FUNCTION TO UPDATE !!!
   * This function needs to call a real cloud AI service (like Azure AI Vision)
   * to detect the custom handwritten shapes (stars, triangles) in the image.
   * The current implementation is a MOCK and only simulates a response.
   *
   * @param {string} imageUrlToAnalyze The public URL of the image to analyze.
   * @param {number} imageWidth The width of the scanned image.
   * @returns {Promise<object>} A promise that resolves with the analysis result.
   */
  const analyzeImageForMarks = async (imageUrlToAnalyze, imageWidth) => {
    console.log('Analyzing image for shapes...');
    setIsAnalyzing(true);

    // --- REPLACE THIS MOCK IMPLEMENTATION WITH YOUR AZURE AI VISION API CALL ---
    // You will likely need a Custom Vision model trained to recognize your specific marks.
    // Example API call structure:
    /*
    const AZURE_ENDPOINT = "YOUR_AZURE_CUSTOM_VISION_ENDPOINT";
    const AZURE_API_KEY = "YOUR_AZURE_CUSTOM_VISION_API_KEY";

    const response = await fetch(AZURE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prediction-Key': AZURE_API_KEY,
      },
      body: JSON.stringify({ url: imageUrlToAnalyze }),
    });
    const analysisResult = await response.json();
    // The response structure will depend on your Custom Vision model.
    // It usually contains a `predictions` array.
    return analysisResult;
    */

    // This is a simulated response. It pretends it found a "triangle" in the first
    // column and an "asterisk" (star) in the third column.
    return new Promise(resolve => {
      setTimeout(() => {
        const mockApiResponse = {
          // Azure Custom Vision uses a 'predictions' array
          predictions: [
            {
              tagName: 'triangle', // The name of the tag in your Custom Vision project
              boundingBox: {left: 0.01, top: 0.2, width: 0.02, height: 0.05}, // Bounding box is normalized (0-1)
            },
            {
              tagName: 'asterisk',
              boundingBox: {left: 0.07, top: 0.4, width: 0.02, height: 0.05}, // 0.07 is in the 3rd column (3/30 = 0.1, so 0.07 is within it)
            },
          ],
        };
        console.log('Mock analysis complete.');
        resolve(mockApiResponse);
      }, 2000);
    });
    // --- END OF REPLACEMENT SECTION ---
  };

  /**
   * Processes the result from the vision API to identify which columns are marked.
   */
  const processAnalysisResult = (analysisResult, imageWidth) => {
    const columnsFound = new Set();
    const pieceWidth = imageWidth / 30;

    // Note: The response structure from Azure Custom Vision is different.
    // It provides a `predictions` array.
    if (analysisResult && analysisResult.predictions) {
      analysisResult.predictions.forEach(pred => {
        const label = (pred.tagName || '').toLowerCase();
        const boundingBox = pred.boundingBox; // Normalized coordinates

        if (
          (label.includes('triangle') || label.includes('asterisk')) &&
          boundingBox
        ) {
          // Convert normalized coordinates to pixel coordinates
          const objectCenterX =
            (boundingBox.left + boundingBox.width / 2) * imageWidth;
          const columnIndex = Math.floor(objectCenterX / pieceWidth);

          if (columnIndex >= 0 && columnIndex < 30) {
            columnsFound.add(columnIndex);
          }
        }
      });
    }
    const sortedColumns = Array.from(columnsFound).sort((a, b) => a - b);
    console.log('Found marks in columns:', sortedColumns);
    return sortedColumns;
  };

  const scanDocument = async () => {
    try {
      if (!hasCameraPermission) {
        const permissionGranted = await requestCameraPermission();
        if (!permissionGranted) {
          Alert.alert('Permission Required', 'Camera permission is needed.');
          return;
        }
      }

      setIsScanning(true);
      const {scannedImages} = await DocumentScanner.scanDocument({
        responseType: 'uri',
        letUserAdjustCrop: true,
        maxNumDocuments: 1,
      });

      if (scannedImages && scannedImages.length > 0) {
        const uri = scannedImages[0];
        handleRecapture();
        setImageUri(uri);

        const uploadResult = await AzureImage(uri);
        console.log('uploadResult', uploadResult);

        if (uploadResult.success && uploadResult.remoteUrl) {
          setImageUrl(uploadResult.remoteUrl);
          const dimensions = await getImageDimensions(uri);
          setImageDimensions(dimensions);

          const pieces = splitImageIntoPieces(
            uri,
            dimensions.width,
            dimensions.height,
          );
          const analysisResult = await analyzeImageForMarks(
            uploadResult.remoteUrl,
            dimensions.width,
          );
          const markedColumnIndexes = processAnalysisResult(
            analysisResult,
            dimensions.width,
          );

          if (markedColumnIndexes.length > 0) {
            const markedPieces = markedColumnIndexes.map(
              index => pieces[index],
            );
            setMarkedColumns(markedPieces);
          }
        } else {
          Alert.alert('Upload Failed', 'Could not get a URL for analysis.');
        }
      } else {
        console.log('User cancelled document scan');
      }
    } catch (error) {
      console.error('Document scan error:', error);
      Alert.alert('Scanner Error', error.message || 'Failed to scan.');
    } finally {
      setIsScanning(false);
      setIsAnalyzing(false);
    }
  };

  const getImageDimensions = uri => {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({width, height}),
        error => reject(error),
      );
    });
  };

  const splitImageIntoPieces = (uri, imgWidth, imgHeight) => {
    const pieceWidth = imgWidth / 30;
    const pieces = [];
    for (let i = 0; i < 30; i++) {
      pieces.push({
        id: `strip-${i}`,
        index: i,
        uri,
        originalWidth: imgWidth,
        originalHeight: imgHeight,
        width: pieceWidth,
        height: imgHeight,
        crop: {x: i * pieceWidth, y: 0, width: pieceWidth, height: imgHeight},
      });
    }
    return pieces;
  };

  const handleRecapture = () => {
    setImageUri(null);
    setImageUrl(null);
    setMarkedColumns([]);
  };

  // This component now ONLY renders the image of the marked column.
  const MarkedColumnCard = ({item}) => (
    <View style={styles.markedColumnCard}>
      <Text style={styles.markedColumnHeader}>Column-{item.index + 1}</Text>
      <View style={styles.markedColumnBody}>
        <View style={styles.pieceContainer}>
          <View
            style={[
              styles.pieceImageWrapper,
              {
                width: item.width / 4, // Scaled for display in the list
                height: item.height / 4,
              },
            ]}>
            <Image
              source={{uri: item.uri}}
              style={[
                styles.pieceImage,
                {
                  width: item.originalWidth / 4,
                  height: item.originalHeight / 4,
                  left: -(item.crop.x / 4),
                },
              ]}
              resizeMode="cover"
            />
          </View>
        </View>
      </View>
    </View>
  );

  const isLoading = isScanning || isAnalyzing;

  return (
    <LinearGradient colors={['#e0f7fa', '#ffffff']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Shape Analyzer</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.scanButton,
              isLoading && styles.scanButtonDisabled,
            ]}
            onPress={scanDocument}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {imageUri ? 'Scan New Document' : '📷 Scan Document'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {isAnalyzing && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>Analyzing for Shapes...</Text>
            <ActivityIndicator size="large" color="#00BCD4" />
          </View>
        )}

        {imageUri && !isAnalyzing && (
          <>
            <View style={styles.resultContainer}>
              <Text style={styles.sectionTitle}>Detected Marked Columns</Text>
              {markedColumns.length > 0 ? (
                <FlatList
                  data={markedColumns}
                  keyExtractor={item => item.id}
                  renderItem={MarkedColumnCard}
                />
              ) : (
                <Text style={styles.infoText}>
                  No columns with the specified shapes were found.
                </Text>
              )}
            </View>

            <View style={styles.resultContainer}>
              <Text style={styles.sectionTitle}>Full Document Preview:</Text>
              <Image
                source={{uri: imageUri}}
                style={[
                  styles.scannedImage,
                  {aspectRatio: imageDimensions.width / imageDimensions.height},
                ]}
                resizeMode="contain"
              />
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginVertical: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  scanButton: {
    backgroundColor: '#00BCD4',
  },
  scanButtonDisabled: {
    backgroundColor: '#B2EBF2',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  resultContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  scannedImage: {
    width: '100%',
    maxHeight: 300,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#34495E',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    paddingVertical: 10,
  },
  markedColumnCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  markedColumnHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    paddingBottom: 5,
  },
  markedColumnBody: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  pieceContainer: {
    alignItems: 'center',
  },
  pieceImageWrapper: {
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pieceImage: {
    position: 'absolute',
  },
});

export default AndroidDocumentScanner;
