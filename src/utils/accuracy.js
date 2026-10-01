export function getHighAccuracyPosition(onSuccess, onError) {
  if (!navigator.geolocation) {
    if (typeof onError === 'function') onError(new Error("Geolocation is not supported by this browser."));
    return;
  }

  let bestPosition = null;
  let attempts = 0;
  const maxAttempts = 3;
  const targetAccuracy = 15;

  function fetchPosition() {
    attempts++;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentAcc = position.coords.accuracy;
        
        if (!bestPosition || currentAcc < bestPosition.coords.accuracy) {
          bestPosition = position;
        }

        if (currentAcc <= targetAccuracy || attempts >= maxAttempts) {
          onSuccess({
            latitude: bestPosition.coords.latitude,
            longitude: bestPosition.coords.longitude,
            accuracy: bestPosition.coords.accuracy
          });
        } else {
          setTimeout(fetchPosition, 1000);
        }
      },
      (error) => {
        if (attempts < maxAttempts) {
          setTimeout(fetchPosition, 1500);
        } else {
          if (bestPosition) {
            onSuccess({
              latitude: bestPosition.coords.latitude,
              longitude: bestPosition.coords.longitude,
              accuracy: bestPosition.coords.accuracy
            });
          } else {
            if (typeof onError === 'function') onError(error);
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  }

  fetchPosition();
}
