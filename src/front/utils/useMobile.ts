import { useEffect, useState } from "react";
import mobile from 'is-mobile';

const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(mobile());
  }, []);

  return isMobile;
};

export { useMobile };
