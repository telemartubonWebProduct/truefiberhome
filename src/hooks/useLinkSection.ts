import { useEffect } from 'react';

const useLinkSection = () => {
  useEffect(() => {
    // Wait for component mount, then read the hash from window.location
    const hash = window.location.hash; // e.g., "#snacks"
    if (hash) {
      // Remove the '#' and find the element with the matching id
      const id = hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);
};

export default useLinkSection;
