export const getDistrictAndBlock = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          'User-Agent': 'YourAppName/1.0 (your-email@example.com)',
        },
      },
    );

    const data = await response.json();
    console.log('✅ Final data to submit2:', data);
    if (!data.address) {
      console.warn('No address found in reverse geocode response');
      return {district: '', block: '', cluster: ''};
    }

    const address = data.address || {};
    return {
      district:
        address.county || address.state_district || address.district || '',
      block: address.suburb || address.village || address.town || '',
      cluster: address.neighbourhood || address.hamlet || '',
    };
  } catch (err) {
    console.error('Error reverse geocoding:', err);
    return {district: '', block: '', cluster: ''};
  }
};
