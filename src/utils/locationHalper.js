export const getDistrictAndBlock = async (latitude, longitude) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'YourAppName', // Required by Nominatim
      },
    });

    const data = await response.json();

    const {address} = data;

    return {
      district: address.county || address.district || 'Unknown District',
      block: address.suburb || address.village || 'Unknown Block',
      cluster: address.hamlet || address.neighbourhood || 'Unknown Cluster',
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return {
      district: 'Unknown',
      block: 'Unknown',
      cluster: 'Unknown',
    };
  }
};
