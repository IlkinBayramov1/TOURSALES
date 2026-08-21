class GeofenceService {
  // Haversine düsturu ilə iki koordinat arası məsafənin km ilə hesablanması
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Yer radiusu (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Geofence toplanış zonasına çatmanın yoxlanılması (Radius məsələn 200 metr)
  checkGeofenceArrival(guideLoc, meetingLoc, radiusMeters = 200) {
    const distanceKm = this.calculateDistanceKm(
      guideLoc.latitude,
      guideLoc.longitude,
      meetingLoc.latitude,
      meetingLoc.longitude
    );

    const distanceMeters = distanceKm * 1000;
    const isInside = distanceMeters <= radiusMeters;

    if (isInside) {
      console.log(`[Geofence Alert] Bələdçi toplanış zonasına çatdı! Məsafə: ${Math.round(distanceMeters)}m (Limit: ${radiusMeters}m)`);
    }

    return {
      isInside,
      distanceMeters: Math.round(distanceMeters),
      radiusMeters,
      status: isInside ? 'ARRIVED_AT_MEETING_POINT' : 'EN_ROUTE'
    };
  }
}

export const geofenceService = new GeofenceService();
export default geofenceService;
