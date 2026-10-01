
// Basic utility to play alert sound
export const playAlertSound = () => {
  const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
  audio.play().catch(e => console.error('Error playing sound', e));
};
